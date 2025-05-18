import os
import time
from EpidemicSimulation import EpidemicSimulation

# If this file is run directly, run a demo simulation
if __name__ == "__main__":
    # Create a simulation with smaller network for testing
    
    sim = EpidemicSimulation.builder()\
        .set_network_model('barabasi_albert', n=1000, m=5)\
        .build()
    
    # Run the simulation
    sim.run_simulation(days=100)  # Fewer days for testing

    # Create platform-independent paths for results
    # Use a relative path from the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    results_dir = os.path.join(project_root, "results")
    os.makedirs(results_dir, exist_ok=True)
    
    # Visualize the results with platform-independent paths
    sim.visualize_network(os.path.join(results_dir, "final_network_state.png"), dpi=600)
    sim.plot_statistics(os.path.join(results_dir, "disease_statistics.png"), dpi=600)
    
    # Save the simulation
    sim.save_simulation(os.path.join(results_dir, "simulation_results.pkl"))
    
    # Export data for Flourish
    sim.export_for_flourish(os.path.join(results_dir, "flourish_data"))
    
    # Create an animation (optional - can be time-consuming)
    sim.create_animation(days=20, save_path=os.path.join(results_dir, "disease_spread_animation.gif"), dpi=600)
    
    print("Simulation completed successfully!")
    print(f"Results saved to: {results_dir}")