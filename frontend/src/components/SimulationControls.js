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
      
      <div className="param-group tooltip-wrapper">
        <label>
          Interaction Distance:
          <input
            type="range"
            name="interaction_distance"
            min="1"
            max="3"
            value={networkParams.interaction_distance || 1}
            onChange={onParamChange}
            disabled={loading || simulationId}
          />
          <span className="value-display">{networkParams.interaction_distance || 1}</span>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Interaction Distance</div>
          <div className="tooltip-content">
            <p>Determines how far infection can spread across network connections:</p>
            <ul>
              <li><strong>1</strong> - Only direct connections (neighbors)</li>
              <li><strong>2</strong> - Neighbors and neighbors of neighbors</li>
              <li><strong>3</strong> - Up to 3 connections away</li>
            </ul>
            <p>Higher values create faster disease spread patterns.</p>
          </div>
        </div>
      </div>
      
      <div className="param-group tooltip-wrapper">
        <label>
          Social Distance Factor:
          <input
            type="range"
            name="social_distance_factor"
            min="0.5"
            max="2"
            step="0.1"
            value={networkParams.social_distance_factor || 1}
            onChange={onParamChange}
            disabled={loading || simulationId}
          />
          <span className="value-display">{networkParams.social_distance_factor || 1}</span>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Social Distance Factor</div>
          <div className="tooltip-content">
            <p>Determines how social distance affects infection probability:</p>
            <ul>
              <li><strong>Low values (0.5-0.7)</strong> - Close-knit community with frequent interactions</li>
              <li><strong>Medium values (0.8-1.2)</strong> - Typical social distancing</li>
              <li><strong>High values (1.3-2.0)</strong> - Enforced social distancing measures</li>
            </ul>
            <p>Higher values reduce infection probability between distant connections.</p>
          </div>
        </div>
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