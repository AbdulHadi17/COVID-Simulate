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
    
    // Create a Set of valid node IDs for faster lookups
    const validNodeIds = new Set(networkData.nodes.map(node => 
      node.id !== undefined ? node.id.toString() : null
    ).filter(Boolean));
    
    let nodesToDisplay, edgesToDisplay;
    
    switch (viewMode) {
      case 'full':
        nodesToDisplay = networkData.nodes;
        
        // Filter out edges with invalid node references
        edgesToDisplay = networkData.edges.filter(edge => 
          edge && edge.source && edge.target &&
          validNodeIds.has(edge.source.toString()) && 
          validNodeIds.has(edge.target.toString())
        );
        
        return { nodes: nodesToDisplay, edges: edgesToDisplay };
        
      case 'zoom':
        if (!focusedNode) return { nodes: [], edges: [] };
        
        const nodesInZoom = getNodesWithinVisualDistance(focusedNode, zoomLevel);
        const zoomedNodes = networkData.nodes.filter(node => nodesInZoom.has(node.id));
        const zoomedEdges = networkData.edges.filter(
          edge => nodesInZoom.has(edge.source) && 
                 nodesInZoom.has(edge.target) &&
                 validNodeIds.has(edge.source.toString()) && 
                 validNodeIds.has(edge.target.toString())
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
          edge => sampledNodeIds.has(edge.source) && 
                 sampledNodeIds.has(edge.target) &&
                 validNodeIds.has(edge.source.toString()) && 
                 validNodeIds.has(edge.target.toString())
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
    setZoomDistance(1); // Fixed value of 1 for visualization purposes
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
      height: '100%',
      // Add margins to ensure the visualization stays within bounds
      margin: [50, 50, 50, 50],
      events: {
        load: function() {
          try {
            // Safety checks for series and nodes
            const chart = this;
            
            if (!chart || !chart.series) {
              console.warn('Chart or series is undefined');
              return;
            }
            
            if (chart.series.length === 0) {
              console.warn('No series available in chart');
              return;
            }
            
            if (!chart.series[0]) {
              console.warn('First series is undefined');
              return;
            }
            
            setTimeout(function() {
              try {
                // Double-check after timeout 
                if (!chart || !chart.series || !chart.series[0]) {
                  console.warn('Chart series not available after delay');
                  return;
                }
                
                if (!chart.series[0].nodes) {
                  console.warn('Nodes collection is undefined');
                  return;
                }
                
                // Check if nodes are clustered
                let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, count = 0;
                
                chart.series[0].nodes.forEach(function(node) {
                  if (!node) return; // Skip undefined nodes
                  
                  if (typeof node.plotX === 'number' && typeof node.plotY === 'number') {
                    sumX += node.plotX;
                    sumY += node.plotY;
                    sumX2 += node.plotX * node.plotX;
                    sumY2 += node.plotY * node.plotY;
                    count++;
                  }
                });
                
                if (count > 0) {
                  const avgX = sumX / count;
                  const avgY = sumY / count;
                  const stdX = Math.sqrt(sumX2/count - avgX*avgX);
                  const stdY = Math.sqrt(sumY2/count - avgY*avgY);
                  
                  // If standard deviation is low, nodes are clustered
                  if (stdX < 50 || stdY < 50) {
                    const width = chart.plotWidth || 600;
                    const height = chart.plotHeight || 400;
                    
                    chart.series[0].nodes.forEach(function(node, i) {
                      if (!node) return; // Skip undefined nodes
                      
                      const total = chart.series[0].nodes.length || 1;
                      const phi = (1 + Math.sqrt(5)) / 2;
                      const theta = 2 * Math.PI * i / phi;
                      const maxRadius = Math.min(width, height) * 0.4;
                      const radius = maxRadius * Math.sqrt(i / total);
                      
                      node.plotX = (width/2) + radius * Math.cos(theta);
                      node.plotY = (height/2) + radius * Math.sin(theta);
                    });
                    
                    chart.redraw();
                  }
                }
              } catch (error) {
                console.error('Error in node distribution:', error);
              }
            }, 800);
          } catch (error) {
            console.error('Error in chart load event:', error);
          }
        }
      }
    },
    title: {
      text: null
    },
    plotOptions: {
      networkgraph: {
        draggable: true,
        layoutAlgorithm: {
          enableSimulation: true,
          initialPositions: 'circle', // Start with circle instead of random
          initialPositionRadius: Math.min(600, Math.max(300, window.innerWidth * 0.25)), // Responsive radius
          
          // Use verlet for better distribution
          integration: 'verlet',
          
          // Lower gravitational constant reduces clustering
          gravitationalConstant: 0.1,
          
          // Adjust link length for better spacing
          linkLength: 100,
          
          // Stronger repulsive force pushes nodes apart
          repulsiveForce: function(d, k) {
            return k / Math.max(100, d * 80);
          },
          
          // More balanced friction lets nodes move to proper positions
          friction: 0.85,
          
          // More reasonable max speed prevents "flying" nodes
          maxSpeed: 10,
          
          // Increase iterations for better layout
          maxIterations: 2000,
          
          // No approximation for accurate positioning
          approximation: 'none',
          
          // Add a cooling factor to make layout more stable
          cooling: 0.85
        }
      }
    },
    // Add custom link styling based on social distance
    series: [{
      dataLabels: {
        enabled: false
      },
      // Safer node mapping
      nodes: Array.isArray(displayData.nodes) 
        ? displayData.nodes.map((node, index) => {
            if (!node) return { id: `node-${index}` }; // Use index for consistency
            
            return {
              id: node.id !== undefined ? node.id.toString() : `node-${index}`,
              nodeState: node.state !== undefined ? node.state : 0, // Changed from state to nodeState
              color: node.state === 0 ? 'blue' : 
                     node.state === 1 ? 'red' : 
                     node.state === 2 ? 'green' : 
                     node.state === 3 ? 'gray' : 'blue',
              marker: {
                radius: 5
              }
            };
          }) 
        : [],
      // Safer data mapping
      data: Array.isArray(displayData.edges)
        ? displayData.edges.map(edge => {
            if (!edge) return {};
            return {
              from: edge.source ? edge.source.toString() : '',
              to: edge.target ? edge.target.toString() : '',
              weight: edge.weight || 1
            };
          }) 
        : []
    }],
    tooltip: {
      enabled: true,
      formatter: function() {
        // Enhanced tooltip with state info
        const node = this.point;
        return `<b>Node ID:</b> ${node.id}<br>
                <b>State:</b> ${getStateName(node.nodeState)}`;
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
            nodeState: nodeData.state, // Changed from state to nodeState
            connections: nodeData.connections || 0,
            // Include these properties to avoid undefined errors
            selected: nodeData.selected || false,
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

        {/* Add a button to redistribute nodes */}
        <button 
          onClick={() => {
            if (chartRef.current && chartRef.current.series && chartRef.current.series[0] && chartRef.current.series[0].nodes) {
              const chart = chartRef.current;
              const width = chart.plotWidth || 600;
              const height = chart.plotHeight || 400;
              
              try {
                chart.series[0].nodes.forEach(function(node, i) {
                  if (!node) return;
                  
                  const total = chart.series[0].nodes.length || 1;
                  const theta = i * 2.39996; // Golden angle
                  const radius = Math.min(width, height) * 0.35 * Math.sqrt(i / total);
                  
                  node.plotX = (width/2) + radius * Math.cos(theta);
                  node.plotY = (height/2) + radius * Math.sin(theta);
                });
                
                chart.redraw();
              } catch (err) {
                console.error('Error spreading nodes:', err);
              }
            } else {
              console.warn('Chart reference not available');
            }
          }}
        >
          Spread Nodes
        </button>
      </div>
      <HighchartsReact 
        highcharts={Highcharts} 
        options={options}
        callback={chart => {
          // Save reference for later use
          if (chartRef.current !== chart) {
            chartRef.current = chart;
          }
        }}
      />
      
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