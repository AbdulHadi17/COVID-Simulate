class EpidemicSimulationBuilder:
    """Builder class for EpidemicSimulation."""
    
    def __init__(self):
        # Default values
        self._network = None
        self._infection_probability = 0.3
        self._recovery_days = (7, 14)
        self._initial_infected_percent = 0.01
        self._mortality_rate = 0.02
        self._immunity_period = 60
        
        # Network generation parameters
        self._network_model = 'barabasi_albert'
        self._network_size = 1000
        self._network_param = 5
    
    def set_infection_probability(self, probability):
        """Set the infection probability."""
        self._infection_probability = probability
        return self  # Return self for chaining
    
    def set_recovery_days(self, min_days, max_days):
        """Set the recovery days range."""
        self._recovery_days = (min_days, max_days)
        return self
    
    def set_initial_infected_percent(self, percent):
        """Set the initial infected percentage."""
        self._initial_infected_percent = percent
        return self
    
    def set_mortality_rate(self, rate):
        """Set the mortality rate."""
        self._mortality_rate = rate
        return self
    
    def set_immunity_period(self, days):
        """Set the immunity period."""
        self._immunity_period = days
        return self
    
    def set_network_model(self, model, n=1000, m=5):
        """Set the network model and parameters."""
        self._network_model = model
        self._network_size = n
        self._network_param = m
        return self
    
    def set_interaction_distance(self, distance):
        """Set the distance over which infection can spread."""
        self.interaction_distance = distance
        return self
    
    def build(self):
        """Build and return the configured EpidemicSimulation."""
        # Import here to avoid circular import
        from simulation.EpidemicSimulation import EpidemicSimulation
        
        # Create network if not provided
        if self._network is None:
            self._create_network()
        
        # Create and return the simulation with parameters
        return EpidemicSimulation(
            network=self._network,
            infection_probability=self._infection_probability,
            recovery_days=self._recovery_days,
            initial_infected_percent=self._initial_infected_percent,
            mortality_rate=self._mortality_rate,
            immunity_period=self._immunity_period,
            interaction_distance=getattr(self, 'interaction_distance', 1)  # Default to 1 if not set
        )
    
    def _create_network(self):
        """Create a network based on the configured model and parameters."""
        import networkx as nx
        
        if self._network_model == 'barabasi_albert':
            # Scale-free network (power law degree distribution)
            self._network = nx.barabasi_albert_graph(self._network_size, self._network_param)
        elif self._network_model == 'watts_strogatz':
            # Small-world network
            k = self._network_param  # Number of neighbors
            p = 0.1  # Rewiring probability
            self._network = nx.watts_strogatz_graph(self._network_size, k, p)
        elif self._network_model == 'erdos_renyi':
            # Random network
            p = self._network_param / self._network_size  # Connection probability
            self._network = nx.erdos_renyi_graph(self._network_size, p)
        else:
            raise ValueError(f"Unknown network model: {self._network_model}")
        
        # Add node attributes (optional but makes visualization better)
        import numpy as np
        for node in self._network.nodes():
            # Add demographic attributes
            self._network.nodes[node]['age'] = np.random.normal(40, 15)  # Age distribution
            self._network.nodes[node]['health'] = np.random.uniform(0, 1)  # Health status
            self._network.nodes[node]['mobility'] = np.random.gamma(2, 1)  # Mobility patterns
        
        # Add weights to edges representing social distance
        max_distance = getattr(self, 'social_distance_factor', 1.0) * 3.0  # Maximum possible distance

        for u, v in self._network.edges():
            # Random social distance - close friends have lower values, distant acquaintances higher
            social_distance = np.random.gamma(
                shape=2.0,  # Shape parameter
                scale=max_distance/5.0  # Scale parameter - adjusts the spread
            )
            
            # Ensure distance is within reasonable range (0.5 to max_distance)
            social_distance = max(0.5, min(social_distance, max_distance))
            
            # Set the weight as social distance
            self._network[u][v]['weight'] = social_distance
            
            # Visual length for rendering
            self._network[u][v]['length'] = social_distance * 20
        
        print(f"Created {self._network_model} network with {self._network_size} nodes and {self._network.number_of_edges()} edges")