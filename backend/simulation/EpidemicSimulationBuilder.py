import EpidemicSimulation

class EpidemicSimulationBuilder:
    """Builder class for creating configured EpidemicSimulation instances."""
    
    def __init__(self):
        # Default values
        self._network = None
        self._infection_probability = 0.3
        self._recovery_days = (7, 14)
        self._initial_infected_percent = 0.01
        self._mortality_rate = 0.02
        self._immunity_period = 60
        
        # Network parameters (if needed)
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
    
    def build(self):
        """Build and return the configured EpidemicSimulation."""
        # Create a new simulation instance with our parameters
        sim = EpidemicSimulation.EpidemicSimulation(
            network=self._network,
            infection_probability=self._infection_probability,
            recovery_days=self._recovery_days,
            initial_infected_percent=self._initial_infected_percent,
            mortality_rate=self._mortality_rate,
            immunity_period=self._immunity_period
        )
        
        # Generate the network if one wasn't provided
        if self._network is None:
            sim.generate_network(
                model=self._network_model,
                n=self._network_size,
                m=self._network_param
            )
        
        return sim