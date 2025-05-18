from flask import jsonify, request
from api.simulation_api import SimulationManager

# Create a global simulation manager to handle multiple simulation instances
simulation_manager = SimulationManager()

def setup_routes(app):
    # Create a new simulation
    @app.route('/api/simulations', methods=['POST'])
    def create_simulation():
        params = request.json
        sim_id = simulation_manager.create_simulation(params)
        return jsonify({"simulation_id": sim_id})
    
    # Get simulation state
    @app.route('/api/simulations/<sim_id>', methods=['GET'])
    def get_simulation(sim_id):
        return jsonify(simulation_manager.get_simulation_state(sim_id))
    
    # Advance simulation
    @app.route('/api/simulations/<sim_id>/advance', methods=['POST'])
    def advance_simulation(sim_id):
        days = request.json.get('days', 1)
        return jsonify(simulation_manager.advance_simulation(sim_id, days))
    
    # Get network data for visualization
    @app.route('/api/simulations/<sim_id>/network', methods=['GET'])
    def get_network(sim_id):
        return jsonify(simulation_manager.get_network_data(sim_id))
    
    # Get statistics for charts
    @app.route('/api/simulations/<sim_id>/stats', methods=['GET'])
    def get_stats(sim_id):
        return jsonify(simulation_manager.get_statistics(sim_id))