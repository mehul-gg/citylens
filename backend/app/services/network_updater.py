"""
Dynamic SUMO Network Updater
Converts user-drawn infrastructure to SUMO network elements
"""

import os
import xml.etree.ElementTree as ET
from typing import List, Tuple, Dict
from pathlib import Path
import subprocess

SUMO_DIR = Path("D:/citylens/sumo")
SUMO_HOME = os.environ.get('SUMO_HOME', 'D:/sumo')

class NetworkUpdater:
    """
    Handles dynamic updates to SUMO network based on user-drawn infrastructure
    """
    
    def __init__(self, base_network_file: str = "wakad.net.xml"):
        self.base_network = SUMO_DIR / base_network_file
        self.nodes_file = SUMO_DIR / "wakad.nod.xml"
        self.edges_file = SUMO_DIR / "wakad.edg.xml"
        self.output_network = SUMO_DIR / "wakad_dynamic.net.xml"
        
    def add_infrastructure(self, infrastructure: Dict) -> bool:
        """
        Add new infrastructure to the SUMO network
        
        Args:
            infrastructure: {
                'type': 'flyover'|'bridge'|'tunnel'|'road',
                'coordinates': [[lng, lat], [lng, lat], ...],
                'name': 'New Flyover 1',
                'lanes': 2
            }
        
        Returns:
            bool: Success status
        """
        try:
            infra_type = infrastructure.get('type', 'road')
            coordinates = infrastructure.get('coordinates', [])
            name = infrastructure.get('name', 'new_infra')
            lanes = infrastructure.get('lanes', 2)
            
            if len(coordinates) < 2:
                return False
            
            # Convert lat/lng to SUMO coordinates (UTM)
            sumo_coords = [self._latlon_to_utm(coord[0], coord[1]) for coord in coordinates]
            
            # Read existing nodes and edges
            nodes_tree = ET.parse(self.nodes_file)
            edges_tree = ET.parse(self.edges_file)
            
            nodes_root = nodes_tree.getroot()
            edges_root = edges_tree.getroot()
            
            # Generate unique IDs
            node_id_start = f"user_{name}_start"
            node_id_end = f"user_{name}_end"
            edge_id = f"user_{name}"
            
            # Add start node
            start_node = ET.SubElement(nodes_root, 'node')
            start_node.set('id', node_id_start)
            start_node.set('x', str(sumo_coords[0][0]))
            start_node.set('y', str(sumo_coords[0][1]))
            start_node.set('type', 'priority')
            
            # Add end node
            end_node = ET.SubElement(nodes_root, 'node')
            end_node.set('id', node_id_end)
            end_node.set('x', str(sumo_coords[-1][0]))
            end_node.set('y', str(sumo_coords[-1][1]))
            end_node.set('type', 'priority')
            
            # Add edge
            edge = ET.SubElement(edges_root, 'edge')
            edge.set('id', edge_id)
            edge.set('from', node_id_start)
            edge.set('to', node_id_end)
            edge.set('numLanes', str(lanes))
            
            # Set speed and priority based on type
            if infra_type == 'flyover':
                edge.set('speed', '16.67')  # 60 km/h
                edge.set('priority', '12')
            elif infra_type == 'bridge':
                edge.set('speed', '13.89')  # 50 km/h
                edge.set('priority', '10')
            elif infra_type == 'tunnel':
                edge.set('speed', '13.89')  # 50 km/h
                edge.set('priority', '10')
            else:  # road
                edge.set('speed', '11.11')  # 40 km/h
                edge.set('priority', '8')
            
            # Add intermediate shape points
            if len(sumo_coords) > 2:
                shape_points = []
                for coord in sumo_coords[1:-1]:
                    shape_points.append(f"{coord[0]},{coord[1]}")
                edge.set('shape', ' '.join(shape_points))
            
            # Save updated files
            nodes_tree.write(self.nodes_file, encoding='UTF-8', xml_declaration=True)
            edges_tree.write(self.edges_file, encoding='UTF-8', xml_declaration=True)
            
            # Regenerate network
            success = self._regenerate_network()
            
            return success
            
        except Exception as e:
            print(f"Error adding infrastructure: {e}")
            return False
    
    def _regenerate_network(self) -> bool:
        """
        Regenerate SUMO network using netconvert
        """
        try:
            netconvert_bin = os.path.join(SUMO_HOME, 'bin', 'netconvert.exe')
            
            cmd = [
                netconvert_bin,
                '--node-files', str(self.nodes_file),
                '--edge-files', str(self.edges_file),
                '--output-file', str(self.output_network),
                '--offset.disable-normalization', 'true',
                '--proj', '+proj=utm +zone=43 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("Network regenerated successfully")
                return True
            else:
                print(f"Network regeneration failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"Error regenerating network: {e}")
            return False
    
    def _latlon_to_utm(self, lon: float, lat: float) -> Tuple[float, float]:
        """
        Convert lat/lon to UTM coordinates (Zone 43N for Pune)
        
        This is a simplified conversion - for production use a proper library like pyproj
        """
        # Approximate conversion for Pune area (Zone 43N)
        # Origin at 73.728°E, 18.568°N
        origin_lon = 73.728
        origin_lat = 18.568
        
        # Meters per degree (approximate)
        meters_per_deg_lon = 111320 * 0.94  # Adjusted for latitude ~18.5°
        meters_per_deg_lat = 110540
        
        x = (lon - origin_lon) * meters_per_deg_lon
        y = (lat - origin_lat) * meters_per_deg_lat
        
        return (x, y)
    
    def reset_to_base_network(self):
        """
        Reset to original network without user modifications
        """
        # This would restore from backup copies
        pass


# Singleton instance
_network_updater = None

def get_network_updater() -> NetworkUpdater:
    global _network_updater
    if _network_updater is None:
        _network_updater = NetworkUpdater()
    return _network_updater
