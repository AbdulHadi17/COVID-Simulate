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
      
      {/* Network Size control with numeric input - range 1 to 1000 */}
      <div className="param-group">
        <label>
          Network Size:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="network_size"
              min="1" 
              max="1000"
              value={networkParams.network_size}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <input 
              type="range" 
              name="network_size"
              min="1" 
              max="1000" 
              value={networkParams.network_size}
              onChange={onParamChange}
              disabled={loading || simulationId}
            />
            <span>{networkParams.network_size} nodes</span>
          </div>
        </label>
      </div>
      
      {/* Infection Probability control with numeric input - range 0.1 to 0.9 */}
      <div className="param-group">
        <label>
          Infection Probability:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="infection_probability"
              min="0.1" 
              max="0.9"
              step="0.1"
              value={networkParams.infection_probability}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
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
          </div>
        </label>
      </div>
      
      {/* Social Distance Factor control with numeric input - range 0.5 to 2.0 */}
      <div className="param-group tooltip-wrapper">
        <label>
          Social Distance Factor:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="social_distance_factor"
              min="0.5"
              max="2.0"
              step="0.1"
              value={networkParams.social_distance_factor || 1}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <input
              type="range"
              name="social_distance_factor"
              min="0.5"
              max="2.0"
              step="0.1"
              value={networkParams.social_distance_factor || 1}
              onChange={onParamChange}
              disabled={loading || simulationId}
            />
            <span className="value-display">{networkParams.social_distance_factor || 1}</span>
          </div>
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
      
      {/* Recovery Days Range - min and max */}
      <div className="param-group tooltip-wrapper">
        <label>
          Recovery Days Range:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="recovery_days_min"
              min="1" 
              max="30"
              value={networkParams.recovery_days?.[0] || 7}
              onChange={(e) => {
                const minDays = parseInt(e.target.value);
                const maxDays = networkParams.recovery_days?.[1] || 14;
                onParamChange({
                  target: {
                    name: 'recovery_days',
                    value: [minDays, maxDays],
                    type: 'array'
                  }
                });
              }}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <span style={{margin: '0 5px'}}>to</span>
            <input 
              type="number" 
              name="recovery_days_max"
              min="1" 
              max="30"
              value={networkParams.recovery_days?.[1] || 14}
              onChange={(e) => {
                const minDays = networkParams.recovery_days?.[0] || 7;
                const maxDays = parseInt(e.target.value);
                onParamChange({
                  target: {
                    name: 'recovery_days',
                    value: [minDays, maxDays],
                    type: 'array'
                  }
                });
              }}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <span>days</span>
          </div>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Recovery Period</div>
          <div className="tooltip-content">
            <p>Range of days it takes for an infected individual to recover (or die).</p>
            <p>Individuals will recover at a random day within this range.</p>
          </div>
        </div>
      </div>

      {/* Mortality Rate slider */}
      <div className="param-group tooltip-wrapper">
        <label>
          Mortality Rate:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="mortality_rate"
              min="0" 
              max="1"
              step="0.01"
              value={networkParams.mortality_rate}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <input 
              type="range" 
              name="mortality_rate"
              min="0" 
              max="1" 
              step="0.01"
              value={networkParams.mortality_rate}
              onChange={onParamChange}
              disabled={loading || simulationId}
            />
            <span>{(networkParams.mortality_rate * 100).toFixed(1)}%</span>
          </div>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Mortality Rate</div>
          <div className="tooltip-content">
            <p>Probability that an infected individual will die instead of recover.</p>
            <p>Higher values will lead to more deaths from the disease.</p>
          </div>
        </div>
      </div>

      {/* Immunity Period slider */}
      <div className="param-group tooltip-wrapper">
        <label>
          Immunity Period:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="immunity_period"
              min="1" 
              max="365"
              value={networkParams.immunity_period}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <input 
              type="range" 
              name="immunity_period"
              min="1" 
              max="365" 
              value={networkParams.immunity_period}
              onChange={onParamChange}
              disabled={loading || simulationId}
            />
            <span>{networkParams.immunity_period} days</span>
          </div>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Immunity Period</div>
          <div className="tooltip-content">
            <p>Number of days a recovered individual remains immune before becoming susceptible again.</p>
            <p>Longer periods mean recovered individuals stay protected longer.</p>
          </div>
        </div>
      </div>

      {/* Initial Infected Percent slider */}
      <div className="param-group tooltip-wrapper">
        <label>
          Initial Infected Percent:
          <div className="slider-with-input">
            <input 
              type="number" 
              name="initial_infected_percent"
              min="0.01" 
              max="5"
              step="0.01"
              value={networkParams.initial_infected_percent}
              onChange={onParamChange}
              disabled={loading || simulationId}
              className="numeric-input"
            />
            <input 
              type="range" 
              name="initial_infected_percent"
              min="0.01" 
              max="5" 
              step="0.01"
              value={networkParams.initial_infected_percent}
              onChange={onParamChange}
              disabled={loading || simulationId}
            />
            <span>{(networkParams.initial_infected_percent).toFixed(2)}%</span>
          </div>
        </label>
        <div className="tooltip">
          <div className="tooltip-title">Initial Infected Percentage</div>
          <div className="tooltip-content">
            <p>Percentage of the population infected at the start of the simulation.</p>
            <p>Higher values lead to faster initial spread patterns.</p>
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