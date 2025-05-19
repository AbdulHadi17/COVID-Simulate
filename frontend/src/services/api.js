import axios from 'axios';

// Create an axios instance with default settings
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request/response interceptors for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class SimulationService {
  static async createSimulation(params) {
    console.log('Creating simulation with params:', params);
    try {
      const response = await api.post('/api/simulations', params);
      console.log('Simulation created:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating simulation:', error);
      throw error;
    }
  }

  static async getSimulationState(simulationId) {
    // Fix: Added /api prefix
    const response = await api.get(`/api/simulations/${simulationId}`);
    return response;
  }

  static async advanceSimulation(simulationId, days) {
    // Fix: Added /api prefix
    const response = await api.post(`/api/simulations/${simulationId}/advance`, { days });
    return response;
  }

  static async getNetworkData(simulationId) {
    // Fix: Added /api prefix
    const response = await api.get(`/api/simulations/${simulationId}/network`);
    return response;
  }

  static async getStatistics(simulationId) {
    // Fix: Added /api prefix
    const response = await api.get(`/api/simulations/${simulationId}/stats`);
    return response;
  }
};