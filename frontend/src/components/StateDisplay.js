import React from 'react';

function StateDisplay({ simulationState }) {
  if (!simulationState) return null;
  
  const stateColors = {
    susceptible: 'blue',
    infected: 'red',
    recovered: 'green',
    deceased: 'black'
  };
  
  const colorIndicatorStyle = (color) => ({
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: color,
    borderRadius: '50%',
    marginRight: '8px'
  });
  
  return (
    <div className="current-state">
      <h3>Current State (Day {simulationState.current_day})</h3>
      <div className="state-row">
        <div style={colorIndicatorStyle(stateColors.susceptible)}></div>
        <span>Susceptible: {simulationState.susceptible}</span>
      </div>
      
      <div className="state-row">
        <div style={colorIndicatorStyle(stateColors.infected)}></div>
        <span>Infected: {simulationState.infected}</span>
      </div>
      
      <div className="state-row">
        <div style={colorIndicatorStyle(stateColors.recovered)}></div>
        <span>Recovered: {simulationState.recovered}</span>
      </div>
      
      <div className="state-row">
        <div style={colorIndicatorStyle(stateColors.deceased)}></div>
        <span>Deceased: {simulationState.deceased}</span>
      </div>
    </div>
  );
}

export default StateDisplay;