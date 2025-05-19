import uuid
import traceback
from simulation.EpidemicSimulation import EpidemicSimulation

class SimulationManager:
    """Manages multiple simulation instances for the web API."""
    
    def __init__(self):
        self.simulations = {}  # Map simulation IDs to instances
    
    def create_simulation(self, params):
        """Create a new simulation with the given parameters."""
        try:
            # Generate a unique ID
            sim_id = str(uuid.uuid4())
            
            # Create a simulation through the builder pattern
            builder = EpidemicSimulation.builder()
            
            # Set parameters from request
            if 'network_model' in params:
                builder.set_network_model(
                    params.get('network_model', 'barabasi_albert'),
                    params.get('network_size', 1000),
                    params.get('network_connections', 5)
                )
            
            if 'infection_probability' in params:
                builder.set_infection_probability(params.get('infection_probability', 0.3))
            
            if 'recovery_days' in params:
                recovery = params.get('recovery_days', [7, 14])
                builder.set_recovery_days(recovery[0], recovery[1])
            
            if 'initial_infected_percent' in params:
                builder.set_initial_infected_percent(params.get('initial_infected_percent', 0.01))
            
            if 'mortality_rate' in params:
                builder.set_mortality_rate(params.get('mortality_rate', 0.02))
            
            if 'immunity_period' in params:
                builder.set_immunity_period(params.get('immunity_period', 60))
            
            # Build the simulation
            simulation = builder.build()
            
            # Initialize the infection state
            simulation.initialize_infection()
            
            # Store the simulation
            self.simulations[sim_id] = simulation
            
            return {"simulation_id": sim_id}
        except Exception as e:
            print(f"Error in create_simulation: {str(e)}")
            print(traceback.format_exc())
            raise
    
    def advance_simulation(self, sim_id, days=1):
        """Advance the simulation by the specified number of days."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        
        # Simulate the specified number of days
        for _ in range(days):
            sim.simulate_day()
        
        return {"success": True, "current_day": sim.current_day}
    
    def get_simulation_state(self, sim_id):
        """Get the current state of a simulation."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        
        return {
            "current_day": sim.current_day,
            "susceptible": sum(1 for state in sim.node_states.values() if state == 0),
            "infected": sum(1 for state in sim.node_states.values() if state == 1),
            "recovered": sum(1 for state in sim.node_states.values() if state == 2),
            "deceased": sum(1 for state in sim.node_states.values() if state == 3)
        }
    
    def get_network_data(self, simulation_id):
        """Get network structure with node states for visualization."""
        # Fix: Use direct dictionary access instead of non-existent get_simulation method
        if simulation_id not in self.simulations:
            return {"nodes": [], "edges": []}
        
        simulation = self.simulations[simulation_id]
        network = simulation.network
        states = simulation.node_states
        
        # Use more aggressive spring layout for better node distribution
        import networkx as nx
        
        # Generate positions with stronger repulsion
        pos = nx.spring_layout(
            network, 
            k=2.0,         # Stronger repulsion
            iterations=100, # More iterations for better layout
            seed=42        # Consistent results
        )
        
        # Create nodes list with states and positions
        nodes = [
            {
                "id": node_id,
                "state": states.get(node_id, 0),
                "connections": len(list(network.neighbors(node_id))),
                "x": float(pos[node_id][0] * 1000), # Scale positions up
                "y": float(pos[node_id][1] * 1000)  # for better visibility
            }
            for node_id in network.nodes()
        ]
        
        # Create edges list with weights
        edges = [
            {
                "source": u,
                "target": v,
                "weight": network[u][v].get('weight', 1.0)
            }
            for u, v in network.edges()
        ]
        
        return {"nodes": nodes, "edges": edges}
    
    def get_statistics(self, sim_id):
        """Get statistics data for charts."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        
        return {
            "days": sim.stats["day"],
            "susceptible": sim.stats["susceptible"],
            "infected": sim.stats["infected"],
            "recovered": sim.stats["recovered"],
            "deceased": sim.stats["deceased"]
        }