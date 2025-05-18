import React from 'react';

function StateDisplay({ simulationState }) {
  if (!simulationState) return null;
  
  return (
    <div className="current-state">
      <h3>Current State (Day {simulationState.current_day})</h3>
      <p>Susceptible: {simulationState.susceptible}</p>
      <p>Infected: {simulationState.infected}</p>
      <p>Recovered: {simulationState.recovered}</p>
      <p>Deceased: {simulationState.deceased}</p>
    </div>
  );
}

export default StateDisplay;