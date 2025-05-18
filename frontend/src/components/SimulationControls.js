import React from 'react';

function SimulationControls({ 
  simulationId,
  loading,
  networkParams,
  onParamChange,
  onCreateSimulation,
  onAdvanceSimulation,
  onReset
}) {
  return (
    <div className="controls">
      <h2>Simulation Parameters</h2>
      
      <div className="param-group">
        <label>
          Network Model:
          <select 
            name="network_model" 
            value={networkParams.network_model}
            onChange={onParamChange}
            disabled={loading || simulationId}
          >
            <option value="barabasi_albert">Barabási-Albert (Scale-Free)</option>
            <option value="watts_strogatz">Watts-Strogatz (Small World)</option>
            <option value="erdos_renyi">Erdős-Rényi (Random)</option>
          </select>
        </label>
      </div>
      
      <div className="param-group">
        <label>
          Network Size:
          <input 
            type="range" 
            name="network_size"
            min="100" 
            max="5000" 
            value={networkParams.network_size}
            onChange={onParamChange}
            disabled={loading || simulationId}
          />
          <span>{networkParams.network_size} nodes</span>
        </label>
      </div>
      
      <div className="param-group">
        <label>
          Infection Probability:
          <input 
            type="range" 
            name="infection_probability"
            min="0.1" 
            max="0.9" 
            step="0.1"
            value={networkParams.infection_probability}
            onChange={onParamChange}
            disabled={loading || simulationId}
          />
          <span>{networkParams.infection_probability}</span>
        </label>
      </div>
      
      <div className="button-group">
        {!simulationId ? (
          <button onClick={onCreateSimulation} disabled={loading}>
            Create Simulation
          </button>
        ) : (
          <>
            <button onClick={() => onAdvanceSimulation(1)} disabled={loading}>
              Advance 1 Day
            </button>
            <button onClick={() => onAdvanceSimulation(7)} disabled={loading}>
              Advance 7 Days
            </button>
            <button onClick={onReset} disabled={loading}>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SimulationControls;