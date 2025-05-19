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
    
    def get_network_data(self, sim_id):
        """Get network data with weighted edges for visualization."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        import networkx as nx
        
        # Use stronger repulsion for layout calculation
        pos = nx.spring_layout(
            sim.network, 
            k=2.0,         # Increase repulsion strength (default is 0.1)
            iterations=100, # More iterations for better layout
            seed=42        # Fixed seed for reproducibility
        )
        
        nodes = []
        for node in sim.network.nodes():
            state = sim.node_states.get(node, 0)
            x, y = pos[node]
            
            # Scale positions up for better visualization
            nodes.append({
                "id": node,
                "state": state,
                "x": float(x * 1000),
                "y": float(y * 1000),
                "connections": sim.network.degree(node)
            })
        
        edges = []
        for u, v in sim.network.edges():
            # Include edge weight/length for frontend
            weight = sim.network[u][v].get('weight', 1.0)
            length = weight * 50  # Convert weight to visual length
            
            edges.append({
                "source": u,
                "target": v,
                "weight": float(weight),
                "length": float(length)
            })
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
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