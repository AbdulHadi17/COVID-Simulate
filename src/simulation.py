import networkx as nx
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import random
import time
from tqdm import tqdm
import os
import pickle
from matplotlib.animation import FuncAnimation

# Create necessary directories if they don't exist
os.makedirs("../data", exist_ok=True)
os.makedirs("../results", exist_ok=True)

class EpidemicSimulation:
    """
    A class to simulate the spread of an infectious disease through a social network.
    """
    
    def __init__(self, network=None, infection_probability=0.3, 
                 recovery_days=(7, 14), initial_infected_percent=0.01,
                 mortality_rate=0.02, immunity_period=60):
        """
        Initialize the simulation with a social network and disease parameters.
        
        Parameters:
        -----------
        network : networkx.Graph, optional
            The social network to simulate on. If None, a network will be generated.
        infection_probability : float, optional
            The probability of infection transmission during an interaction.
        recovery_days : tuple, optional
            The range (min, max) of days it takes to recover from the infection.
        initial_infected_percent : float, optional
            The percentage of initially infected individuals.
        mortality_rate : float, optional
            The probability that an infected individual will die.
        immunity_period : int, optional
            The number of days a recovered individual remains immune.
        """
        self.network = network
        self.infection_probability = infection_probability
        self.recovery_days_range = recovery_days
        self.initial_infected_percent = initial_infected_percent
        self.mortality_rate = mortality_rate
        self.immunity_period = immunity_period
        
        # Node states: 0 = susceptible, 1 = infected, 2 = recovered, 3 = deceased
        self.node_states = {}
        
        # Additional node attributes
        self.infection_day = {}  # Day when node was infected
        self.recovery_day = {}   # Day when node will recover
        self.immunity_until = {} # Day until which node is immune
        
        # Simulation statistics
        self.stats = {
            'susceptible': [],
            'infected': [],
            'recovered': [],
            'deceased': [],
            'day': []
        }
        
        self.current_day = 0
        
        if self.network is None:
            self.generate_network()
    
    def generate_network(self, model='barabasi_albert', n=1000, m=5):
        """
        Generate a synthetic social network.
        
        Parameters:
        -----------
        model : str, optional
            The network model to use ('barabasi_albert', 'watts_strogatz', 'erdos_renyi').
        n : int, optional
            The number of nodes in the network.
        m : int, optional
            Model-specific parameter (connections per new node for BA, neighbors for WS, etc.).
        """
        if model == 'barabasi_albert':
            # Scale-free network (power law degree distribution)
            self.network = nx.barabasi_albert_graph(n, m)
        elif model == 'watts_strogatz':
            # Small-world network
            p = 0.1  # Rewiring probability
            self.network = nx.watts_strogatz_graph(n, m, p)
        elif model == 'erdos_renyi':
            # Random network
            p = m / n  # Probability of edge creation
            self.network = nx.erdos_renyi_graph(n, p)
        else:
            raise ValueError(f"Unknown model: {model}")
        
        print(f"Generated {model} network with {n} nodes and {self.network.number_of_edges()} edges")
        
        # Add node attributes
        for node in self.network.nodes():
            # Add demographic attributes (age, health status, etc.)
            self.network.nodes[node]['age'] = np.random.normal(40, 15)  # Age distribution
            self.network.nodes[node]['health'] = np.random.uniform(0, 1)  # Health status (0=poor, 1=excellent)
            
            # Add mobility patterns (how much they move around)
            self.network.nodes[node]['mobility'] = np.random.gamma(2, 1)  # Gamma distribution for mobility
    
    def initialize_infection(self):
        """Initialize the infection state of nodes in the network."""
        # Set all nodes as susceptible initially
        for node in self.network.nodes():
            self.node_states[node] = 0  # Susceptible
        
        # Randomly select initial infected nodes
        num_initial_infected = int(self.initial_infected_percent * len(self.network.nodes()))
        initial_infected = random.sample(list(self.network.nodes()), num_initial_infected)
        
        for node in initial_infected:
            self.node_states[node] = 1  # Infected
            self.infection_day[node] = 0
            # Determine recovery day based on the range
            recovery_period = random.randint(self.recovery_days_range[0], self.recovery_days_range[1])
            self.recovery_day[node] = self.current_day + recovery_period
        
        self._update_stats()
        
    def _update_stats(self):
        """Update simulation statistics."""
        susceptible = sum(1 for state in self.node_states.values() if state == 0)
        infected = sum(1 for state in self.node_states.values() if state == 1)
        recovered = sum(1 for state in self.node_states.values() if state == 2)
        deceased = sum(1 for state in self.node_states.values() if state == 3)
        
        self.stats['day'].append(self.current_day)
        self.stats['susceptible'].append(susceptible)
        self.stats['infected'].append(infected)
        self.stats['recovered'].append(recovered)
        self.stats['deceased'].append(deceased)
    
    def simulate_day(self):
        """Simulate one day of disease spread."""
        self.current_day += 1
        
        # Process recoveries and deaths first
        for node, state in list(self.node_states.items()):
            if state == 1:  # Infected
                if self.recovery_day[node] <= self.current_day:
                    # Determine if the person recovers or dies
                    if random.random() < self.mortality_rate:
                        self.node_states[node] = 3  # Deceased
                    else:
                        self.node_states[node] = 2  # Recovered
                        self.immunity_until[node] = self.current_day + self.immunity_period
            
            elif state == 2:  # Recovered
                # Check if immunity has worn off
                if node in self.immunity_until and self.immunity_until[node] <= self.current_day:
                    self.node_states[node] = 0  # Back to susceptible
        
        # Process new infections
        new_infections = []
        
        for node, state in self.node_states.items():
            if state == 1:  # If node is infected
                # Interact with neighbors
                for neighbor in self.network.neighbors(node):
                    if self.node_states[neighbor] == 0:  # If neighbor is susceptible
                        # Calculate infection probability based on node attributes
                        base_prob = self.infection_probability
                        
                        # Adjust based on neighbor's health and age
                        health_factor = 1 - self.network.nodes[neighbor]['health']  # Less healthy = more susceptible
                        age_factor = 1 + max(0, (self.network.nodes[neighbor]['age'] - 50) / 100)  # Older = more susceptible
                        
                        # Mobility affects contact intensity
                        mobility_factor = (self.network.nodes[node]['mobility'] + self.network.nodes[neighbor]['mobility']) / 2
                        
                        # Calculate final probability
                        adjusted_prob = base_prob * health_factor * age_factor * mobility_factor
                        adjusted_prob = min(adjusted_prob, 0.95)  # Cap at 95%
                        
                        # Determine if infection occurs
                        if random.random() < adjusted_prob:
                            new_infections.append(neighbor)
        
        # Update states for newly infected nodes
        for node in new_infections:
            self.node_states[node] = 1  # Infected
            self.infection_day[node] = self.current_day
            # Determine recovery day
            recovery_period = random.randint(self.recovery_days_range[0], self.recovery_days_range[1])
            self.recovery_day[node] = self.current_day + recovery_period
        
        self._update_stats()
        return len(new_infections) > 0  # Return True if there were new infections
    
    def run_simulation(self, days=100):
        """
        Run the simulation for a specified number of days.
        
        Parameters:
        -----------
        days : int, optional
            The number of days to simulate.
        """
        self.initialize_infection()
        
        print(f"Starting simulation with {self.stats['infected'][0]} initially infected individuals")
        
        # Run simulation for specified days or until no more infections
        for day in tqdm(range(days)):
            active_spread = self.simulate_day()
            
            # Stop if no more infected individuals
            if self.stats['infected'][-1] == 0:
                print(f"Simulation ended on day {self.current_day}: No more infected individuals")
                break
                
            # Stop if no new infections and we've gone past the longest recovery period
            if not active_spread and day > max(self.recovery_days_range):
                last_infection_day = max(self.infection_day.values())
                if self.current_day - last_infection_day > max(self.recovery_days_range):
                    print(f"Simulation ended on day {self.current_day}: Disease spread has stopped")
                    break
        
        return self.stats
    
    def visualize_network(self, save_path=None):
        """
        Visualize the current state of the network.
        
        Parameters:
        -----------
        save_path : str, optional
            Path to save the visualization. If None, the plot is displayed.
        """
        plt.figure(figsize=(12, 10))
        
        # Create a color map
        color_map = []
        for node in self.network.nodes():
            if node in self.node_states:
                if self.node_states[node] == 0:
                    color_map.append('blue')      # Susceptible
                elif self.node_states[node] == 1:
                    color_map.append('red')       # Infected
                elif self.node_states[node] == 2:
                    color_map.append('green')     # Recovered
                else:
                    color_map.append('black')     # Deceased
            else:
                color_map.append('gray')          # Unknown state
        
        # Position nodes using force-directed layout
        pos = nx.spring_layout(self.network, seed=42)
        
        # Draw the network
        nx.draw(self.network, pos, node_color=color_map, with_labels=False, 
                node_size=50, alpha=0.8, linewidths=0.5, width=0.2)
        
        # Add a legend
        plt.plot([0], [0], 'o', color='blue', label='Susceptible')
        plt.plot([0], [0], 'o', color='red', label='Infected')
        plt.plot([0], [0], 'o', color='green', label='Recovered')
        plt.plot([0], [0], 'o', color='black', label='Deceased')
        
        plt.legend(loc='lower right')
        plt.title(f'Disease Spread Simulation - Day {self.current_day}')
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
        else:
            plt.show()
    
    def plot_statistics(self, save_path=None):
        """
        Plot the statistics of the simulation.
        
        Parameters:
        -----------
        save_path : str, optional
            Path to save the plot. If None, the plot is displayed.
        """
        plt.figure(figsize=(12, 8))
        
        plt.plot(self.stats['day'], self.stats['susceptible'], 'b-', label='Susceptible')
        plt.plot(self.stats['day'], self.stats['infected'], 'r-', label='Infected')
        plt.plot(self.stats['day'], self.stats['recovered'], 'g-', label='Recovered')
        plt.plot(self.stats['day'], self.stats['deceased'], 'k-', label='Deceased')
        
        plt.xlabel('Day')
        plt.ylabel('Number of Individuals')
        plt.title('Disease Spread Over Time')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
        else:
            plt.show()
    
    def save_simulation(self, filepath):
        """
        Save the simulation state to a file.
        
        Parameters:
        -----------
        filepath : str
            Path to save the simulation state.
        """
        with open(filepath, 'wb') as f:
            pickle.dump({
                'network': self.network,
                'node_states': self.node_states,
                'infection_day': self.infection_day,
                'recovery_day': self.recovery_day,
                'immunity_until': self.immunity_until,
                'stats': self.stats,
                'current_day': self.current_day,
                'parameters': {
                    'infection_probability': self.infection_probability,
                    'recovery_days_range': self.recovery_days_range,
                    'initial_infected_percent': self.initial_infected_percent,
                    'mortality_rate': self.mortality_rate,
                    'immunity_period': self.immunity_period
                }
            }, f)
        print(f"Simulation saved to {filepath}")
    
    @classmethod
    def load_simulation(cls, filepath):
        """
        Load a simulation state from a file.
        
        Parameters:
        -----------
        filepath : str
            Path to the saved simulation state.
            
        Returns:
        --------
        EpidemicSimulation
            The loaded simulation.
        """
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        
        # Create a new simulation instance
        sim = cls(network=data['network'],
                 infection_probability=data['parameters']['infection_probability'],
                 recovery_days=data['parameters']['recovery_days_range'],
                 initial_infected_percent=data['parameters']['initial_infected_percent'],
                 mortality_rate=data['parameters']['mortality_rate'],
                 immunity_period=data['parameters']['immunity_period'])
        
        # Restore simulation state
        sim.node_states = data['node_states']
        sim.infection_day = data['infection_day']
        sim.recovery_day = data['recovery_day']
        sim.immunity_until = data['immunity_until']
        sim.stats = data['stats']
        sim.current_day = data['current_day']
        
        print(f"Simulation loaded from {filepath}")
        return sim
    
    def create_animation(self, days=50, interval=200, save_path=None):
        """
        Create an animation of the disease spread.
        
        Parameters:
        -----------
        days : int, optional
            Number of days to animate.
        interval : int, optional
            Interval between frames in milliseconds.
        save_path : str, optional
            Path to save the animation. If None, the animation is displayed.
        """
        # Save the current state to restore later
        current_state = {
            'node_states': self.node_states.copy(),
            'infection_day': self.infection_day.copy(),
            'recovery_day': self.recovery_day.copy(),
            'immunity_until': self.immunity_until.copy(),
            'stats': {k: v.copy() for k, v in self.stats.items()},
            'current_day': self.current_day
        }
        
        # Reset simulation
        self.node_states = {}
        self.infection_day = {}
        self.recovery_day = {}
        self.immunity_until = {}
        self.stats = {k: [] for k in self.stats}
        self.current_day = 0
        
        # Initialize infection
        self.initialize_infection()
        
        # Set up the figure
        fig, ax = plt.subplots(figsize=(12, 10))
        
        # Position nodes using force-directed layout
        pos = nx.spring_layout(self.network, seed=42)
        
        # Function to update the plot for each frame
        def update(frame):
            ax.clear()
            
            # Simulate a day if not the first frame
            if frame > 0:
                self.simulate_day()
            
            # Create color map
            color_map = []
            for node in self.network.nodes():
                if node in self.node_states:
                    if self.node_states[node] == 0:
                        color_map.append('blue')      # Susceptible
                    elif self.node_states[node] == 1:
                        color_map.append('red')       # Infected
                    elif self.node_states[node] == 2:
                        color_map.append('green')     # Recovered
                    else:
                        color_map.append('black')     # Deceased
                else:
                    color_map.append('gray')          # Unknown state
            
            # Draw the network
            nx.draw(self.network, pos, ax=ax, node_color=color_map, with_labels=False, 
                    node_size=50, alpha=0.8, linewidths=0.5, width=0.2)
            
            # Add a legend
            ax.plot([0], [0], 'o', color='blue', label='Susceptible')
            ax.plot([0], [0], 'o', color='red', label='Infected')
            ax.plot([0], [0], 'o', color='green', label='Recovered')
            ax.plot([0], [0], 'o', color='black', label='Deceased')
            
            ax.legend(loc='lower right')
            ax.set_title(f'Disease Spread Simulation - Day {self.current_day}')
            
            # Add statistics
            if self.stats['day']:
                stats_text = (
                    f"Day: {self.current_day}\n"
                    f"Susceptible: {self.stats['susceptible'][-1]}\n"
                    f"Infected: {self.stats['infected'][-1]}\n"
                    f"Recovered: {self.stats['recovered'][-1]}\n"
                    f"Deceased: {self.stats['deceased'][-1]}"
                )
                ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, 
                        verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
            
            return ax,
        
        # Create the animation
        ani = FuncAnimation(fig, update, frames=days, interval=interval, blit=False)
        
        if save_path:
            ani.save(save_path, writer='pillow', fps=5)
            plt.close()
        else:
            plt.show()
        
        # Restore the original state
        self.node_states = current_state['node_states']
        self.infection_day = current_state['infection_day']
        self.recovery_day = current_state['recovery_day']
        self.immunity_until = current_state['immunity_until']
        self.stats = current_state['stats']
        self.current_day = current_state['current_day']
        
    def export_for_flourish(self, save_path):
        """
        Export simulation data in a format suitable for Flourish visualizations.
        
        Parameters:
        -----------
        save_path : str
            Path to save the CSV file for Flourish.
        """
        # Calculate layout once for all nodes
        pos = nx.spring_layout(self.network, seed=42)
        
        # Prepare data for network visualization
        nodes_data = []
        for node in self.network.nodes():
            state_name = {0: 'Susceptible', 1: 'Infected', 2: 'Recovered', 3: 'Deceased'}.get(
                self.node_states.get(node, 0), 'Unknown'
            )
            
            # Get node attributes
            age = self.network.nodes[node].get('age', 0)
            health = self.network.nodes[node].get('health', 0)
            mobility = self.network.nodes[node].get('mobility', 0)
            
            # Get position from pre-calculated layout
            x, y = pos[node]
            
            # Get degree (number of connections)
            degree = self.network.degree(node)
            
            nodes_data.append({
                'id': node,
                'state': state_name,
                'age': age,
                'health': health,
                'mobility': mobility,
                'x': x,
                'y': y,
                'connections': degree,
                'size': degree * 2  # Size based on connections
            })
        
        # Create edges data
        edges_data = []
        for source, target in self.network.edges():
            source_state = self.node_states.get(source, 0)
            target_state = self.node_states.get(target, 0)
            
            # Determine if this edge was involved in transmission
            transmission = (source_state == 1 and target_state == 1) or \
                        (source_state == 1 and target_state == 0) or \
                        (source_state == 0 and target_state == 1)
            
            edges_data.append({
                'source': source,
                'target': target,
                'transmission': 'Yes' if transmission else 'No'
            })
        
        # Export nodes data
        nodes_df = pd.DataFrame(nodes_data)
        nodes_df.to_csv(f"{save_path}_nodes.csv", index=False)
        
        # Export edges data
        edges_df = pd.DataFrame(edges_data)
        edges_df.to_csv(f"{save_path}_edges.csv", index=False)
        
        # Export time series data for animation
        time_series = []
        for day in range(len(self.stats['day'])):
            time_series.append({
                'day': self.stats['day'][day],
                'susceptible': self.stats['susceptible'][day],
                'infected': self.stats['infected'][day],
                'recovered': self.stats['recovered'][day],
                'deceased': self.stats['deceased'][day]
            })
        
        time_df = pd.DataFrame(time_series)
        time_df.to_csv(f"{save_path}_timeseries.csv", index=False)
        
        print(f"Data exported for Flourish visualization to {save_path}_*.csv")

# If this file is run directly, run a demo simulation
if __name__ == "__main__":
    # Create a simulation with smaller network for testing
    sim = EpidemicSimulation()
    sim.generate_network(n=500, m=3)  # Smaller network for faster execution
    
    # Run the simulation
    sim.run_simulation(days=50)  # Fewer days for testing
    
    # Create platform-independent paths for results
    # Use a relative path from the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    results_dir = os.path.join(project_root, "results")
    os.makedirs(results_dir, exist_ok=True)
    
    # Visualize the results with platform-independent paths
    sim.visualize_network(os.path.join(results_dir, "final_network_state.png"))
    sim.plot_statistics(os.path.join(results_dir, "disease_statistics.png"))
    
    # Save the simulation
    sim.save_simulation(os.path.join(results_dir, "simulation_results.pkl"))
    
    # Export data for Flourish
    sim.export_for_flourish(os.path.join(results_dir, "flourish_data"))
    
    # Create an animation (optional - can be time-consuming)
    # sim.create_animation(days=20, save_path=os.path.join(results_dir, "disease_spread_animation.gif"))
    
    print("Simulation completed successfully!")
    print(f"Results saved to: {results_dir}")