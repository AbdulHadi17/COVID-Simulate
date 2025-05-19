import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Import the module
import HCNetworkGraph from 'highcharts/modules/networkgraph';

function NetworkChart({ networkData, networkParams }) {
  const [focusedNode, setFocusedNode] = useState(null);
  const [zoomDistance, setZoomDistance] = useState(2); // Default zoom shows neighbors of neighbors
  const [viewMode, setViewMode] = useState('sample'); // 'full', 'sample', 'zoom'
  const [zoomLevel, setZoomLevel] = useState(1); // Visual zoom level
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (typeof Highcharts === 'object') {
      if (typeof HCNetworkGraph === 'function') {
        HCNetworkGraph(Highcharts);
      } else if (HCNetworkGraph.default && typeof HCNetworkGraph.default === 'function') {
        HCNetworkGraph.default(Highcharts);
      }
    }
  }, []);

  // Create adjacency list for fast neighbor lookup
  const adjacencyList = useMemo(() => {
    const list = {};
    if (networkData.edges) {
      for (const edge of networkData.edges) {
        if (!list[edge.source]) list[edge.source] = new Set();
        if (!list[edge.target]) list[edge.target] = new Set();
        
        list[edge.source].add(edge.target);
        list[edge.target].add(edge.source);
      }
    }
    return list;
  }, [networkData.edges]);

  // Get nodes within zoom distance of the focused node
  const getNodesInZoomDistance = useCallback((startNodeId, distance) => {
    if (!startNodeId || !adjacencyList[startNodeId]) return new Set();
    
    const visited = new Set([startNodeId]);
    let currentLevel = new Set([startNodeId]);
    
    for (let d = 1; d <= distance; d++) {
      const nextLevel = new Set();
      for (const nodeId of currentLevel) {
        if (adjacencyList[nodeId]) {
          for (const neighbor of adjacencyList[nodeId]) {
            if (!visited.has(neighbor)) {
              nextLevel.add(neighbor);
              visited.add(neighbor);
            }
          }
        }
      }
      currentLevel = nextLevel;
    }
    
    return visited;
  }, [adjacencyList]);

  // Use physical distance for node filtering when zooming
  const getNodesWithinVisualDistance = useCallback((centerNodeId, maxDistance) => {
    if (!networkData.nodes || !centerNodeId) return new Set();
    
    const centerNode = networkData.nodes.find(n => n.id === centerNodeId);
    if (!centerNode || !centerNode.x || !centerNode.y) return new Set();
    
    // Calculate distances from center node
    const nodesWithDistance = networkData.nodes.map(node => {
      if (!node.x || !node.y) return { id: node.id, distance: Infinity };
      
      // Calculate Euclidean distance
      const dx = node.x - centerNode.x;
      const dy = node.y - centerNode.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      return { id: node.id, distance: distance };
    });
    
    // Filter nodes within max distance
    const nodesInRange = nodesWithDistance
      .filter(n => n.distance <= maxDistance * 100)  // Scale by some factor
      .map(n => n.id);
    
    return new Set(nodesInRange);
  }, [networkData.nodes]);

  // Display data based on view mode
  const displayData = useMemo(() => {
    if (!networkData.nodes || !networkData.edges) {
      return { nodes: [], edges: [] };
    }
    
    switch (viewMode) {
      case 'full':
        return networkData;
        
      case 'zoom':
        if (!focusedNode) return { nodes: [], edges: [] };
        
        const nodesInZoom = getNodesWithinVisualDistance(focusedNode, zoomLevel);
        const zoomedNodes = networkData.nodes.filter(node => nodesInZoom.has(node.id));
        const zoomedEdges = networkData.edges.filter(
          edge => nodesInZoom.has(edge.source) && nodesInZoom.has(edge.target)
        );
        
        return { nodes: zoomedNodes, edges: zoomedEdges };
        
      case 'sample':
      default:
        if (networkData.nodes.length <= 300) {
          return networkData;
        }
        
        const sampledNodes = networkData.nodes
          .sort(() => 0.5 - Math.random())
          .slice(0, 300);
        
        const sampledNodeIds = new Set(sampledNodes.map(node => node.id));
        
        const sampledEdges = networkData.edges.filter(
          edge => sampledNodeIds.has(edge.source) && sampledNodeIds.has(edge.target)
        );
        
        return { nodes: sampledNodes, edges: sampledEdges };
    }
  }, [networkData, viewMode, focusedNode, zoomDistance, zoomLevel, getNodesInZoomDistance, getNodesWithinVisualDistance]);

  // Handle node click for zooming
  const handleNodeClick = useCallback((event) => {
    const nodeId = parseInt(event.point.id);
    setFocusedNode(nodeId);
    setViewMode('zoom');
  }, []);
  
  // Add a helper function to visualize infection range:
  const showInfectionRange = useCallback((nodeId) => {
    if (!nodeId || !adjacencyList[nodeId]) return;
    
    // Set view to zoom mode
    setFocusedNode(nodeId);
    setViewMode('zoom');
    
    // Set zoom distance to interaction distance (from API or default to 1)
    // You might need to store this in state when fetching simulation data
    setZoomDistance(networkParams?.interaction_distance || 1);
  }, [adjacencyList, setFocusedNode, setViewMode, setZoomDistance, networkParams]);

  const getNodeColor = (state) => {
    switch (state) {
      case 0:
        return 'blue';
      case 1:
        return 'red';
      case 2:
        return 'green';
      default:
        return 'black';
    }
  };

  const getNodeSize = (connections, viewMode) => {
    return viewMode === 'full' ? 2 : 4;
  };

  // Update the chart options to include social distance visualization
  const options = {
    chart: {
      type: 'networkgraph',
      height: '100%'
    },
    title: {
      text: null
    },
    plotOptions: {
      networkgraph: {
        draggable: true,
        layoutAlgorithm: {
          enableSimulation: true,
          initialPositions: 'random', // Start from random positions
          initialPositionRadius: 200, // Wider starting area
          integration: 'euler', // Change to euler integration for better spread
          gravitationalConstant: 0.25, // Reduced gravitational pull
          linkLength: function(link) {
            // Get the social distance from the link data
            const weight = link.options.weight || 1;
            // Scale social distance to reasonable visual length
            return 50 + (weight * 20); // Increased base length
          },
          // Add stronger repulsive force between nodes
          repulsiveForce: function(d, k) {
            return k * k / Math.max(0.1, d); // Stronger repulsion at short distances
          },
          friction: 0.75, // Reduced friction to allow more movement
          maxSpeed: 10, // Allow faster node movement
          maxIterations: 800 // More iterations for better layout
        }
      }
    },
    // Add custom link styling based on social distance
    series: [{
      dataLabels: {
        enabled: false
      },
      // Map nodes with their state colors
      nodes: displayData.nodes?.map(node => ({
        id: node.id?.toString(),
        state: node.state,
        color: node.state === 0 ? 'blue' : 
               node.state === 1 ? 'red' : 
               node.state === 2 ? 'green' : 'black',
        socialDistance: node.socialDistance || 1
      })) || [],
      // Add social distance information to links
      link: {
        width: function(link) {
          // Calculate link width inversely proportional to social distance
          // Closer contacts (lower social distance) get thicker lines
          const weight = link.fromNode.options.socialDistance || 
                        link.toNode.options.socialDistance || 1;
          return Math.max(1, 3 - weight/2);
        },
        color: function(link) {
          // Color links based on social distance
          const weight = link.fromNode.options.socialDistance || 
                        link.toNode.options.socialDistance || 1;
          // Close contacts (low distance) are darker
          return Highcharts.color('#999999')
                  .setOpacity(Math.max(0.2, 0.8 - weight/4))
                  .get();
        }
      },
      // Format data with social distance
      data: displayData.edges?.map(edge => {
        return {
          from: edge.source?.toString(),
          to: edge.target?.toString(),
          weight: edge.weight || 1 // Include weight from backend
        };
      }) || []
    }],
    tooltip: {
      enabled: true,
      formatter: function() {
        // Enhanced tooltip with social distance info
        const node = this.point;
        if (node.socialDistance) {
          return `<b>Node ID:</b> ${node.id}<br>
                  <b>State:</b> ${getStateName(node.state)}<br>
                  <b>Social Distance:</b> ${node.socialDistance.toFixed(2)}`;
        }
        return `<b>Node ID:</b> ${node.id}<br>
                <b>State:</b> ${getStateName(node.state)}`;
      }
    }
  };

  // Helper function to get state name
  function getStateName(state) {
    switch(state) {
      case 0: return 'Susceptible';
      case 1: return 'Infected';
      case 2: return 'Recovered';
      case 3: return 'Deceased';
      default: return 'Unknown';
    }
  }

  // Replace the useEffect that updates colors with this improved version:
  useEffect(() => {
    if (chartRef.current && chartRef.current.series && chartRef.current.series[0]) {
      // Important: Disable animation during updates to prevent race conditions
      const originalAnimation = chartRef.current.options.plotOptions?.networkgraph?.animation;
      chartRef.current.update({
        plotOptions: {
          networkgraph: {
            animation: false
          }
        }
      }, false);
      
      // Update nodes one by one with proper data
      chartRef.current.series[0].nodes.forEach(node => {
        if (!node || typeof node.update !== 'function') return;
        
        const nodeData = networkData.nodes?.find(n => n.id.toString() === node.id);
        if (nodeData) {
          // Update node with complete state data to avoid undefined properties
          node.update({
            color: nodeData.state === 0 ? 'blue' : 
                   nodeData.state === 1 ? 'red' : 
                   nodeData.state === 2 ? 'green' : 'black',
            state: nodeData.state,
            connections: nodeData.connections || 0,
            // Include these properties to avoid undefined errors
            selected: node.selected || false,
            visible: true
          }, false);
        }
      });
      
      // Restore animation setting
      chartRef.current.update({
        plotOptions: {
          networkgraph: {
            animation: originalAnimation
          }
        }
      }, false);
      
      // Redraw with a slight delay to ensure all updates are processed
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.redraw();
        }
      }, 10);
    }
  }, [networkData]);

  return (
    <div className="chart">
      <div className="chart-controls">
        <div className="view-buttons">
          <button 
            onClick={() => setViewMode('sample')}
            className={viewMode === 'sample' ? 'active' : ''}
            disabled={viewMode === 'sample'}
          >
            Sample View
          </button>
          <button 
            onClick={() => setViewMode('full')}
            className={viewMode === 'full' ? 'active' : ''}
            disabled={viewMode === 'full'}
          >
            Full Network
          </button>
          {focusedNode && (
            <button 
              onClick={() => setViewMode('zoom')}
              className={viewMode === 'zoom' ? 'active' : ''}
              disabled={viewMode === 'zoom'}
            >
              Zoom View
            </button>
          )}
        </div>
        
        {viewMode === 'zoom' && (
          <div className="zoom-controls">
            <label>
              Zoom Distance:
              <input
                type="range"
                min="1"
                max="5"
                value={zoomDistance}
                onChange={(e) => setZoomDistance(parseInt(e.target.value))}
              />
              {zoomDistance}
            </label>
            <button onClick={() => setFocusedNode(null)}>Clear Focus</button>
          </div>
        )}
        
        <div className="info-text">
          {viewMode === 'sample' && networkData.nodes?.length > 300 && (
            <span>Showing {displayData.nodes.length} of {networkData.nodes.length} nodes</span>
          )}
          {viewMode === 'full' && (
            <span>Showing all {networkData.nodes?.length} nodes (may be slow)</span>
          )}
          {viewMode === 'zoom' && (
            <span>Showing {displayData.nodes.length} nodes within distance {zoomDistance} of node {focusedNode}</span>
          )}
        </div>

        {/* Add a button to show infection ranges */}
        {viewMode === 'sample' && (
          <button 
            onClick={() => {
              const infectedNodes = networkData.nodes.filter(node => node.state === 1);
              if (infectedNodes.length > 0) {
                // Show range of first infected node
                showInfectionRange(infectedNodes[0].id);
              }
            }}
            disabled={!networkData.nodes?.some(node => node.state === 1)}
          >
            Show Infection Range
          </button>
        )}
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
      
      {/* Add a legend component under the chart */}
      <div className="social-distance-legend">
        <h4>Social Distance Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="line thick"></div>
            <span>Close Contact (Low Distance)</span>
          </div>
          <div className="legend-item">
            <div className="line medium"></div>
            <span>Regular Contact</span>
          </div>
          <div className="legend-item">
            <div className="line thin"></div>
            <span>Distant Contact (High Distance)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkChart;