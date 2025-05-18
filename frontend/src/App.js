import React, { useState } from 'react';
import './App.css';
import NetworkChart from './components/NetworkChart';
import StatisticsChart from './components/StatisticsChart';
import SimulationControls from './components/SimulationControls';
import StateDisplay from './components/StateDisplay';
import { SimulationService } from './services/api';

function App() {
  const [simulationId, setSimulationId] = useState(null);
  const [simulationState, setSimulationState] = useState(null);
  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] });
  const [statisticsData, setStatisticsData] = useState({ days: [], susceptible: [], infected: [], recovered: [], deceased: [] });
  const [loading, setLoading] = useState(false);
  
  const [networkParams, setNetworkParams] = useState({
    network_model: 'barabasi_albert',
    network_size: 1000,
    network_connections: 5,
    infection_probability: 0.3,
    initial_infected_percent: 0.01,
    mortality_rate: 0.02,
    immunity_period: 60
  });

  // Handle parameter changes
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setNetworkParams(prev => ({
      ...prev,
      [name]: name === 'network_size' || name === 'network_connections' ? 
        parseInt(value) : 
        name === 'infection_probability' || name === 'initial_infected_percent' || name === 'mortality_rate' ? 
        parseFloat(value) : 
        value
    }));
  };

  // Create a new simulation
  const createSimulation = async () => {
    setLoading(true);
    try {
      const result = await SimulationService.createSimulation(networkParams);
      setSimulationId(result.simulation_id);
      await updateSimulationData(result.simulation_id);
    } catch (error) {
      console.error('Error creating simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advance the simulation
  const advanceSimulation = async (days) => {
    if (!simulationId) return;
    
    setLoading(true);
    try {
      await SimulationService.advanceSimulation(simulationId, days);
      await updateSimulationData(simulationId);
    } catch (error) {
      console.error('Error advancing simulation:', error);
    } finally {
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

      <div className="visualization">
        <NetworkChart networkData={networkData} />
        <StatisticsChart statisticsData={statisticsData} />
      </div>
    </div>
  );
}

export default App;