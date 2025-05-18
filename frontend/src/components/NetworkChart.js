import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsNetworkgraph from 'highcharts/modules/networkgraph';

// Initialize the networkgraph module
highchartsNetworkgraph(Highcharts);

function NetworkChart({ networkData }) {
  const options = {
    chart: {
      type: 'networkgraph',
      height: 500
    },
    title: {
      text: 'Disease Spread Network'
    },
    plotOptions: {
      networkgraph: {
        layoutAlgorithm: {
          enableSimulation: true
        }
      }
    },
    series: [{
      dataLabels: { enabled: false },
      data: networkData.edges?.map(edge => [edge.source.toString(), edge.target.toString()]) || [],
      nodes: networkData.nodes?.map(node => ({
        id: node.id.toString(),
        color: node.state === 0 ? 'blue' : 
               node.state === 1 ? 'red' : 
               node.state === 2 ? 'green' : 'black'
      })) || []
    }]
  };

  return (
    <div className="chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default NetworkChart;