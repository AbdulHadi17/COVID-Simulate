import React, { useState, useEffect } from 'react';
import NetworkChart from './components/NetworkChart';
import StatisticsChart from './components/StatisticsChart';
import SimulationControls from './components/SimulationControls';
import StateDisplay from './components/StateDisplay';
import { SimulationService } from './services/api';
import './index.css';

function App() {
  const [simulationId, setSimulationId] = useState(null);
  const [simulationState, setSimulationState] = useState(null);
  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] });
  const [statisticsData, setStatisticsData] = useState({ days: [], susceptible: [], infected: [], recovered: [], deceased: [] });
  const [loading, setLoading] = useState(false);
  
  const [networkParams, setNetworkParams] = useState({
    network_model: 'barabasi_albert',
    network_size: 500,
    network_connections: 5,
    infection_probability: 0.3,
    recovery_days: [7, 14],
    initial_infected_percent: 0.01,
    mortality_rate: 0.02,
    immunity_period: 60
  });

  // Handle parameter changes
  const handleParamChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue;
    
    // Parse the value based on input type
    if (type === 'number' || type === 'range') {
      if (name === 'network_size') {
        // Parse to integer and clamp between 1-1000
        parsedValue = parseInt(value);
        parsedValue = Math.max(100, Math.min(1000, parsedValue));
      } 
      else if (name === 'infection_probability') {
        // Parse to float and clamp between 0.1-0.9
        parsedValue = parseFloat(value);
        parsedValue = Math.max(0.1, Math.min(0.9, parsedValue));
      }
      else if (name === 'social_distance_factor') {
        // Parse to float and clamp between 0.5-2.0
        parsedValue = parseFloat(value);
        parsedValue = Math.max(0.5, Math.min(2.0, parsedValue));
      }
      else if (name === 'mortality_rate') {
        // Parse to float and clamp between 0-1
        parsedValue = parseFloat(value);
        parsedValue = Math.max(0, Math.min(1, parsedValue));
      }
      else if (name === 'immunity_period') {
        // Parse to integer and ensure minimum of 1
        parsedValue = parseInt(value);
        parsedValue = Math.max(1, parsedValue);
      }
      else if (name === 'initial_infected_percent') {
        // Parse to float and clamp between 0.01-5
        parsedValue = parseFloat(value);
        parsedValue = Math.max(0.01, Math.min(5, parsedValue));
      }
      else {
        // For other numeric values
        parsedValue = type === 'number' ? parseFloat(value) : value;
      }
    } else {
      // For non-numeric inputs
      parsedValue = value;
    }
    
    setNetworkParams(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Create a new simulation
  const createSimulation = async () => {
    try {
      setLoading(true);
      
      // Make the API call to create the simulation
      const response = await SimulationService.createSimulation(networkParams);
      
      // Debug logs to verify the response
      console.log("Create simulation response:", response);
      console.log("Simulation ID:", response.data.simulation_id);
      
      // Store the simulation ID
      const newSimId = response.data.simulation_id;
      setSimulationId(newSimId);
      
      // Get initial state
      const stateResponse = await SimulationService.getSimulationState(newSimId);
      setSimulationState(stateResponse.data);
      
      // Get network data
      const networkResponse = await SimulationService.getNetworkData(newSimId);
      setNetworkData(networkResponse.data);
      
      // Get statistics
      const statsResponse = await SimulationService.getStatistics(newSimId);
      setStatisticsData(statsResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error creating simulation:", error);
      setLoading(false);
    }
  };

  // Advance the simulation
  const advanceSimulation = async (days = 1) => {
    try {
      setLoading(true);
      await SimulationService.advanceSimulation(simulationId, days);
      
      // Fetch updated simulation state
      const stateResponse = await SimulationService.getSimulationState(simulationId);
      setSimulationState(stateResponse.data);
      
      // Fetch updated network data - THIS IS THE KEY PART
      const networkResponse = await SimulationService.getNetworkData(simulationId);
      setNetworkData(networkResponse.data);
      
      // Fetch updated statistics
      const statsResponse = await SimulationService.getStatistics(simulationId);
      setStatisticsData(statsResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error advancing simulation:", error);
      setLoading(false);
    }
  };

  // Update all simulation data
  const updateSimulationData = async (id) => {
    try {
      const [stateData, networkData, statsData] = await Promise.all([
        SimulationService.getSimulationState(id),
        SimulationService.getNetworkData(id),
        SimulationService.getStatistics(id)
      ]);
      
      setSimulationState(stateData);
      setNetworkData(networkData);
      setStatisticsData(statsData);
    } catch (error) {
      console.error('Error updating simulation data:', error);
    }
  };

  // Reset simulation
  const resetSimulation = () => {
    setSimulationId(null);
    setSimulationState(null);
    setNetworkData({ nodes: [], edges: [] });
    setStatisticsData({ days: [], susceptible: [], infected: [], recovered: [], deceased: [] });
  };

  // Make sure App.js returns its UI
  return (
    <div className="container">
      <header>
        <h1>COVID-19 Network Simulation</h1>
      </header>

      <SimulationControls 
        simulationId={simulationId}
        loading={loading}
        networkParams={networkParams}
        onParamChange={handleParamChange}
        onCreateSimulation={createSimulation}
        onAdvanceSimulation={advanceSimulation}
        onReset={resetSimulation}
      />

      <StateDisplay simulationState={simulationState} />
      
      {simulationId ? (
        <div className="visualization-container">
          {/* Network visualization card */}
          <div className="visualization-card">
            <h3 className="visualization-title">Disease Spread Network</h3>
            <div className="network-container">
              <NetworkChart networkData={networkData} networkParams={networkParams} />
            </div>
          </div>
          
          {/* Chart card - completely separate from network card */}
          <div className="visualization-card">
            <h3 className="visualization-title">Disease Progression</h3>
            <div className="chart-container">
              <StatisticsChart statisticsData={statisticsData} />
            </div>
          </div>
        </div>
      ) : (
        // Your welcome content
        <div className="welcome-content">
          <h2>Welcome to COVID-19 Network Simulator</h2>
          <p>This application allows you to simulate how COVID-19 spreads through a network of people.</p>
          <p>Use the controls above to configure your simulation parameters and click "Create Simulation" to start.</p>
          
          <div className="features">
            <h3>Features:</h3>
            <ul>
              <li>Realistic network modeling with multiple topology options</li>
              <li>Visual representation of disease spread</li>
              <li>Statistical tracking of susceptible, infected, recovered, and deceased</li>
              <li>Day-by-day simulation control</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;