import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const SimulationService = {
  createSimulation: async (params) => {
    const response = await api.post('/simulations', params);
    return response.data;
  },

  getSimulationState: async (simulationId) => {
    const response = await api.get(`/simulations/${simulationId}`);
    return response.data;
  },

  advanceSimulation: async (simulationId, days) => {
    const response = await api.post(`/simulations/${simulationId}/advance`, { days });
    return response.data;
  },

  getNetworkData: async (simulationId) => {
    const response = await api.get(`/simulations/${simulationId}/network`);
    return response.data;
  },

  getStatistics: async (simulationId) => {
    const response = await api.get(`/simulations/${simulationId}/stats`);
    return response.data;
  }
};