import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

function StatisticsChart({ statisticsData }) {
  const options = {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Disease Progression'
    },
    xAxis: {
      title: { text: 'Day' },
      categories: statisticsData.days
    },
    yAxis: {
      title: { text: 'Number of People' }
    },
    series: [
      { name: 'Susceptible', data: statisticsData.susceptible, color: 'blue' },
      { name: 'Infected', data: statisticsData.infected, color: 'red' },
      { name: 'Recovered', data: statisticsData.recovered, color: 'green' },
      { name: 'Deceased', data: statisticsData.deceased, color: 'black' }
    ]
  };

  return (
    <div className="chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default StatisticsChart;