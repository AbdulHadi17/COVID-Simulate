from flask import jsonify, request
from api.simulation_api import SimulationManager
import traceback

def setup_routes(app):
    simulation_manager = SimulationManager()
    
    @app.route('/api/test', methods=['GET'])
    def test_api():
        return jsonify({"message": "API is working!"})
    
    @app.route('/api/simulations', methods=['POST'])
    def create_simulation():
        try:
            # Debug request info
            print(f"[DEBUG] Received create simulation request")
            print(f"[DEBUG] Headers: {request.headers}")
            print(f"[DEBUG] Content-Type: {request.content_type}")
            
            # Get and validate request data
            params = request.json
            print(f"[DEBUG] Request params: {params}")
            
            if not params:
                print("[DEBUG] No params received or invalid JSON")
                return jsonify({"error": "Missing or invalid parameters"}), 400
                
            result = simulation_manager.create_simulation(params)
            print(f"[DEBUG] Simulation created: {result}")
            return jsonify(result)
            
        except Exception as e:
            print(f"[ERROR] Error creating simulation: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/simulations/<simulation_id>', methods=['GET'])
    def get_simulation_state(simulation_id):
        try:
            simulation = simulation_manager.simulations.get(simulation_id)
            if not simulation:
                return jsonify({"error": "Simulation not found"}), 404
                
            # Return current state
            return jsonify({
                "current_day": simulation.current_day,
                "susceptible": sum(1 for state in simulation.node_states.values() if state == 0),
                "infected": sum(1 for state in simulation.node_states.values() if state == 1),
                "recovered": sum(1 for state in simulation.node_states.values() if state == 2),
                "deceased": sum(1 for state in simulation.node_states.values() if state == 3),
            })
        except Exception as e:
            print(f"Error getting simulation state: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    
    # Advance simulation
    @app.route('/api/simulations/<sim_id>/advance', methods=['POST'])
    def advance_simulation(sim_id):
        try:
            days = request.json.get('days', 1)
            result = simulation_manager.advance_simulation(sim_id, days)
            return jsonify(result)
        except Exception as e:
            print(f"Error advancing simulation: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    
    # Get network data for visualization
    @app.route('/api/simulations/<sim_id>/network', methods=['GET'])
    def get_network(sim_id):
        try:
            return jsonify(simulation_manager.get_network_data(sim_id))
        except Exception as e:
            print(f"Error getting network data: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    
    # Get statistics for charts
    @app.route('/api/simulations/<sim_id>/stats', methods=['GET'])
    def get_stats(sim_id):
        try:
            return jsonify(simulation_manager.get_statistics(sim_id))
        except Exception as e:
            print(f"Error getting stats: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"error": str(e)}), 500