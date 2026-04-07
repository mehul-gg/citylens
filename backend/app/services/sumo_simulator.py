"""
SUMO Traffic Simulator Service
Handles real-time traffic simulation using SUMO via TraCI
"""

import os
import sys
import asyncio
import subprocess
import math
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from pathlib import Path

# Add SUMO tools to path
SUMO_HOME = os.environ.get('SUMO_HOME', 'D:/sumo')
sys.path.append(os.path.join(SUMO_HOME, 'tools'))

try:
    import traci
    TRACI_AVAILABLE = True
except ImportError:
    TRACI_AVAILABLE = False
    print("Warning: TraCI not available. Install SUMO and set SUMO_HOME.")

@dataclass
class VehicleState:
    """Represents a vehicle's state at a point in time"""
    id: str
    x: float  # longitude
    y: float  # latitude
    speed: float  # m/s
    angle: float  # degrees
    edge: str
    lane: int

@dataclass 
class SimulationState:
    """Current state of the simulation"""
    time: float
    vehicles: List[VehicleState]
    total_vehicles: int
    avg_speed: float
    waiting_count: int

class SUMOSimulator:
    """
    SUMO Traffic Simulator with TraCI connection
    
    Provides real-time vehicle positions for streaming to frontend
    """
    
    def __init__(
        self,
        config_path: str = None,
        sumo_binary: str = None,
        port: int = 8813
    ):
        self.config_path = config_path or str(Path(__file__).parent.parent.parent.parent / "sumo" / "wakad.sumocfg")
        self.sumo_binary = sumo_binary or os.path.join(SUMO_HOME, 'bin', 'sumo.exe')
        self.port = port
        self.connected = False
        self.simulation_time = 0.0
        self.step_length = 0.1  # 100ms steps
        self.speed_factor = 1.0  # 1x realtime by default
        
        # Network bounds for coordinate conversion (from our network)
        # These are UTM coordinates that netconvert produces
        self._net_bounds = None
        self._geo_bounds = {
            'min_lon': 73.7280,
            'max_lon': 73.7800,
            'min_lat': 18.5680,
            'max_lat': 18.6000
        }
        
    def _utm_to_geo(self, x: float, y: float) -> tuple:
        """
        Convert SUMO network coordinates (UTM-like) to geographic coordinates
        Uses linear interpolation based on known bounds
        """
        if self._net_bounds is None:
            # Get network bounds from SUMO
            try:
                self._net_bounds = traci.simulation.getNetBoundary()
            except:
                # Fallback bounds based on our network
                self._net_bounds = ((73.728, 18.568), (73.780, 18.600))
        
        min_x, min_y = self._net_bounds[0]
        max_x, max_y = self._net_bounds[1]
        
        # Linear interpolation
        lon = self._geo_bounds['min_lon'] + (x - min_x) / (max_x - min_x) * (self._geo_bounds['max_lon'] - self._geo_bounds['min_lon'])
        lat = self._geo_bounds['min_lat'] + (y - min_y) / (max_y - min_y) * (self._geo_bounds['max_lat'] - self._geo_bounds['min_lat'])
        
        return (lon, lat)
    
    def start(self, gui: bool = False, speed_factor: float = 10.0) -> bool:
        """
        Start SUMO simulation with TraCI connection
        
        Args:
            gui: If True, start sumo-gui instead of sumo
            speed_factor: Simulation speed multiplier (10 = 10x faster)
        """
        if not TRACI_AVAILABLE:
            print("TraCI not available")
            return False
            
        self.speed_factor = speed_factor
        
        binary = self.sumo_binary
        if gui:
            binary = binary.replace('sumo.exe', 'sumo-gui.exe')
        
        # Check if file exists
        if not os.path.exists(self.config_path):
            print(f"Config file not found: {self.config_path}")
            return False
            
        sumo_cmd = [
            binary,
            "-c", self.config_path,
            "--step-length", str(self.step_length),
            "--start",  # Start simulation immediately (for GUI)
            "--quit-on-end", "false"
        ]
        
        try:
            traci.start(sumo_cmd, port=self.port)
            self.connected = True
            self.simulation_time = 0.0
            
            # Get network bounds for coordinate conversion
            self._net_bounds = traci.simulation.getNetBoundary()
            
            print(f"SUMO started successfully on port {self.port}")
            print(f"Network bounds: {self._net_bounds}")
            return True
            
        except Exception as e:
            print(f"Failed to start SUMO: {e}")
            self.connected = False
            return False
    
    def stop(self):
        """Stop the SUMO simulation"""
        if self.connected:
            try:
                traci.close()
            except:
                pass
            self.connected = False
            print("SUMO simulation stopped")
    
    def step(self, steps: int = 1) -> SimulationState:
        """
        Advance simulation by n steps and return current state
        """
        if not self.connected:
            return None
            
        try:
            for _ in range(steps):
                traci.simulationStep()
                self.simulation_time = traci.simulation.getTime()
            
            return self.get_state()
            
        except Exception as e:
            print(f"Simulation step error: {e}")
            return None
    
    def get_state(self) -> SimulationState:
        """Get current simulation state with all vehicles"""
        if not self.connected:
            return None
            
        try:
            vehicle_ids = traci.vehicle.getIDList()
            vehicles = []
            total_speed = 0.0
            waiting = 0
            
            for vid in vehicle_ids:
                pos = traci.vehicle.getPosition(vid)
                lon, lat = self._utm_to_geo(pos[0], pos[1])
                
                speed = traci.vehicle.getSpeed(vid)
                angle = traci.vehicle.getAngle(vid)
                edge = traci.vehicle.getRoadID(vid)
                lane = traci.vehicle.getLaneIndex(vid)
                
                vehicles.append(VehicleState(
                    id=vid,
                    x=lon,
                    y=lat,
                    speed=speed,
                    angle=angle,
                    edge=edge,
                    lane=lane
                ))
                
                total_speed += speed
                if speed < 0.1:  # Essentially stopped
                    waiting += 1
            
            avg_speed = total_speed / len(vehicles) if vehicles else 0
            
            return SimulationState(
                time=self.simulation_time,
                vehicles=vehicles,
                total_vehicles=len(vehicles),
                avg_speed=avg_speed,
                waiting_count=waiting
            )
            
        except Exception as e:
            print(f"Error getting state: {e}")
            return None
    
    def get_vehicles_json(self) -> List[Dict]:
        """Get vehicles in JSON-serializable format for WebSocket"""
        state = self.get_state()
        if not state:
            return []
        
        return [
            {
                "id": v.id,
                "position": [v.x, v.y],  # [lng, lat]
                "speed": round(v.speed * 3.6, 1),  # Convert m/s to km/h
                "angle": v.angle,
                "edge": v.edge
            }
            for v in state.vehicles
        ]
    
    def get_metrics(self) -> Dict:
        """Get current traffic metrics"""
        state = self.get_state()
        if not state:
            return {}
        
        return {
            "simulationTime": round(state.time, 1),
            "totalVehicles": state.total_vehicles,
            "avgSpeed": round(state.avg_speed * 3.6, 1),  # km/h
            "waitingVehicles": state.waiting_count,
            "congestionIndex": min(100, int((state.waiting_count / max(1, state.total_vehicles)) * 200))
        }
    
    async def run_simulation_stream(
        self, 
        callback: Callable[[Dict], None],
        duration: float = 3600,  # 1 hour simulated time
        update_interval: float = 0.5  # Send updates every 0.5 seconds real time
    ):
        """
        Run simulation and stream vehicle positions via callback
        
        Args:
            callback: Async function to call with vehicle data
            duration: Simulation duration in simulated seconds
            update_interval: Real-time interval between updates
        """
        if not self.connected:
            return
        
        steps_per_update = int(self.speed_factor / self.step_length * update_interval)
        
        while self.connected and self.simulation_time < duration:
            # Advance simulation
            self.step(steps_per_update)
            
            # Get current data
            data = {
                "type": "vehicle_update",
                "time": round(self.simulation_time, 1),
                "vehicles": self.get_vehicles_json(),
                "metrics": self.get_metrics()
            }
            
            # Send via callback
            await callback(data)
            
            # Wait for real-time interval
            await asyncio.sleep(update_interval)
        
        # Send completion message
        await callback({
            "type": "simulation_complete",
            "finalTime": self.simulation_time,
            "metrics": self.get_metrics()
        })


class MockSUMOSimulator:
    """
    Mock SUMO simulator for testing without SUMO installed
    Generates realistic-looking vehicle movements
    """
    
    def __init__(self):
        self.simulation_time = 0.0
        self.connected = False
        self.vehicles = []
        self._init_vehicles()
        
    def _init_vehicles(self):
        """Initialize mock vehicles on routes"""
        import random
        
        # Routes based on our road network
        routes = [
            # Hinjewadi to Wakad (main corridor)
            [[73.7339, 18.5859], [73.7404, 18.5911], [73.7448, 18.5912], [73.7492, 18.5910], [73.7575, 18.5920], [73.7607, 18.5924]],
            # Wakad to Hinjewadi (reverse)
            [[73.7607, 18.5924], [73.7575, 18.5920], [73.7492, 18.5910], [73.7448, 18.5912], [73.7404, 18.5911], [73.7339, 18.5859]],
            # NH48 Bypass
            [[73.7647, 18.5719], [73.7638, 18.5742], [73.7610, 18.5816], [73.7595, 18.5856], [73.7575, 18.5920]],
            # Dange Chowk Road
            [[73.7404, 18.5911], [73.7390, 18.5916], [73.7391, 18.5933], [73.7400, 18.5957]],
        ]
        
        self.vehicles = []
        for i in range(50):
            route = random.choice(routes)
            progress = random.random()
            speed = random.uniform(20, 60)  # km/h
            
            self.vehicles.append({
                'id': f'veh_{i}',
                'route': route,
                'progress': progress,
                'speed': speed,
                'route_idx': int(progress * (len(route) - 1))
            })
    
    def start(self, gui: bool = False, speed_factor: float = 10.0) -> bool:
        self.connected = True
        self.speed_factor = speed_factor
        return True
    
    def stop(self):
        self.connected = False
    
    def step(self, steps: int = 1):
        """Advance mock simulation"""
        dt = 0.1 * steps * self.speed_factor
        self.simulation_time += 0.1 * steps
        
        for v in self.vehicles:
            # Move along route
            v['progress'] += (v['speed'] / 3600) * dt / 5  # Approximate
            if v['progress'] >= 1.0:
                v['progress'] = 0.0  # Loop
            v['route_idx'] = min(int(v['progress'] * (len(v['route']) - 1)), len(v['route']) - 2)
    
    def get_vehicles_json(self) -> List[Dict]:
        """Get mock vehicles in JSON format"""
        result = []
        for v in self.vehicles:
            idx = v['route_idx']
            route = v['route']
            
            # Interpolate position
            t = (v['progress'] * (len(route) - 1)) - idx
            p1 = route[idx]
            p2 = route[min(idx + 1, len(route) - 1)]
            
            lon = p1[0] + t * (p2[0] - p1[0])
            lat = p1[1] + t * (p2[1] - p1[1])
            
            # Calculate angle
            angle = math.degrees(math.atan2(p2[0] - p1[0], p2[1] - p1[1]))
            
            result.append({
                'id': v['id'],
                'position': [lon, lat],
                'speed': round(v['speed'], 1),
                'angle': angle,
                'edge': f'route_{idx}'
            })
        return result
    
    def get_metrics(self) -> Dict:
        avg_speed = sum(v['speed'] for v in self.vehicles) / len(self.vehicles) if self.vehicles else 0
        return {
            "simulationTime": round(self.simulation_time, 1),
            "totalVehicles": len(self.vehicles),
            "avgSpeed": round(avg_speed, 1),
            "waitingVehicles": int(len(self.vehicles) * 0.1),
            "congestionIndex": 45
        }
    
    async def run_simulation_stream(
        self, 
        callback: Callable[[Dict], None],
        duration: float = 3600,
        update_interval: float = 0.5
    ):
        steps_per_update = int(self.speed_factor / 0.1 * update_interval)
        
        while self.connected and self.simulation_time < duration:
            self.step(steps_per_update)
            
            data = {
                "type": "vehicle_update",
                "time": round(self.simulation_time, 1),
                "vehicles": self.get_vehicles_json(),
                "metrics": self.get_metrics()
            }
            
            await callback(data)
            await asyncio.sleep(update_interval)
        
        await callback({
            "type": "simulation_complete",
            "finalTime": self.simulation_time,
            "metrics": self.get_metrics()
        })


def get_simulator(use_mock: bool = False) -> SUMOSimulator:
    """Factory function to get appropriate simulator"""
    if use_mock or not TRACI_AVAILABLE:
        return MockSUMOSimulator()
    return SUMOSimulator()
