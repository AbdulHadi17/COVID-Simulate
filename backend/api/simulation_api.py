import uuid
from simulation.EpidemicSimulation import EpidemicSimulation

class SimulationManager:
    """Manages multiple simulation instances for the web API."""
    
    def __init__(self):
        self.simulations = {}  # Map simulation IDs to instances
    
    def create_simulation(self, params):
        """Create a new simulation with the given parameters."""
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
        sim = builder.build()
        
        # Store the simulation
        self.simulations[sim_id] = sim
        
        return sim_id
    
    def get_simulation_state(self, sim_id):
        """Get the current state of a simulation."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        return {
            "current_day": sim.current_day,
            "susceptible": sim.stats["susceptible"][-1] if sim.stats["susceptible"] else 0,
            "infected": sim.stats["infected"][-1] if sim.stats["infected"] else 0,
            "recovered": sim.stats["recovered"][-1] if sim.stats["recovered"] else 0,
            "deceased": sim.stats["deceased"][-1] if sim.stats["deceased"] else 0
        }
    
    def advance_simulation(self, sim_id, days=1):
        """Advance a simulation by a number of days."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        
        # Initialize if needed
        if sim.current_day == 0 and not sim.stats["day"]:
            sim.initialize_infection()
        
        # Run for specified days
        for _ in range(days):
            active_spread = sim.simulate_day()
            
            # Check if simulation should end
            if sim.stats['infected'][-1] == 0:
                break
        
        return self.get_simulation_state(sim_id)
    
    def get_network_data(self, sim_id):
        """Get network data for visualization."""
        if sim_id not in self.simulations:
            return {"error": "Simulation not found"}
        
        sim = self.simulations[sim_id]
        import networkx as nx
        
        # Get node positions
        pos = nx.spring_layout(sim.network, seed=42)
        
        nodes = []
        for node in sim.network.nodes():
            state = sim.node_states.get(node, 0)
            nodes.append({
                "id": node,
                "state": state,
                "x": float(pos[node][0]),
                "y": float(pos[node][1]),
                "connections": sim.network.degree(node)
            })
        
        edges = []
        for u, v in sim.network.edges():
            edges.append({
                "source": u,
                "target": v
            })
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
    def get_statistics(self, sim_id):
        """Get time series data for charts."""
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