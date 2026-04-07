#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download OSM building data for Wakad-Hinjewadi corridor and save as JSON.
This script queries the Overpass API and converts buildings to the format
expected by the frontend application.

Usage:
    python scripts/download-osm-buildings.py

Output:
    public/data/osm-buildings.json
"""

import io
import json
import math
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
CORRIDOR_BOUNDS = {
    "southwest": [18.575, 73.72],  # [lat, lng]
    "northeast": [18.62, 73.79]     # [lat, lng]
}

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter"
]

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
OUTPUT_FILE = OUTPUT_DIR / "osm-buildings.json"

# Create output directory if it doesn't exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def build_overpass_query(bounds):
    """Build Overpass QL query for buildings in the specified area."""
    south, west = bounds["southwest"]
    north, east = bounds["northeast"]
    
    query = f"""
    [out:json][timeout:60];
    (
      way["building"]({south},{west},{north},{east});
      relation["building"]({south},{west},{north},{east});
    );
    out body;
    >;
    out skel qt;
    """
    return query.strip()


def calculate_polygon_area(coords):
    """Calculate polygon area in square meters (approximate)."""
    if len(coords) < 3:
        return 0
    
    area = 0
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        area += (lon1 * lat2) - (lon2 * lat1)
    
    area = abs(area) / 2
    
    # Convert to square meters (rough approximation for India)
    # 1 degree ≈ 111km at equator, varies by latitude
    meters_per_degree = 111000
    return area * meters_per_degree * meters_per_degree


def parse_building(way, nodes_dict):
    """Parse OSM way into building object."""
    try:
        # Get coordinates from node IDs
        coordinates = []
        for node_id in way.get("nodes", []):
            if node_id in nodes_dict:
                node = nodes_dict[node_id]
                coordinates.append([node["lon"], node["lat"]])
        
        if not coordinates:
            return None
        
        # Close polygon if not closed
        if len(coordinates) > 0:
            first = coordinates[0]
            last = coordinates[-1]
            if first[0] != last[0] or first[1] != last[1]:
                coordinates.append(first[:])
        
        if len(coordinates) < 3:
            return None
        
        # Extract metadata
        tags = way.get("tags", {})
        levels = int(tags.get("building:levels") or tags.get("levels", 2))
        
        # Extract height
        height_str = tags.get("height", "")
        if height_str:
            # Remove non-numeric characters except decimal point
            height_str = ''.join(c for c in height_str if c.isdigit() or c == '.')
            height = float(height_str) if height_str else levels * 3.5
        else:
            height = levels * 3.5
        
        # Determine building type
        building_type = "residential"  # default
        
        if (tags.get("building") == "commercial" or 
            tags.get("shop") or 
            tags.get("amenity") == "restaurant"):
            building_type = "commercial"
        elif (tags.get("building") == "industrial" or 
              tags.get("industrial")):
            building_type = "industrial"
        elif (tags.get("building") in ["retail", "supermarket"]):
            building_type = "commercial"
        elif (tags.get("building") in ["apartments", "residential"]):
            building_type = "residential"
        elif tags.get("office"):
            building_type = "office"
        
        # Calculate area
        area = calculate_polygon_area(coordinates)
        
        # Estimate value based on area and type
        value_per_sqm = {
            "residential": 50000,  # ₹50k per sq.m
            "commercial": 80000,   # ₹80k per sq.m
            "industrial": 30000,   # ₹30k per sq.m
            "office": 70000        # ₹70k per sq.m
        }
        
        estimated_value = area * value_per_sqm.get(building_type, 50000)
        
        # Estimate capacity
        if building_type == "residential":
            capacity = int(levels * (area / 100))  # ~100 sq.m per household
        else:
            capacity = int(area / 50)  # ~50 sq.m per business unit
        
        return {
            "id": f"osm-{way['id']}",
            "osmId": way["id"],
            "type": building_type,
            "coordinates": coordinates,
            "levels": levels,
            "height": height,
            "area": area,
            "estimatedValue": estimated_value,
            "capacity": capacity,
            "name": tags.get("name") or tags.get("addr:housename") or None,
            "street": tags.get("addr:street") or None,
            "houseNumber": tags.get("addr:housenumber") or None,
            "tags": tags
        }
    except Exception as e:
        print(f"⚠️  Error parsing building {way.get('id')}: {e}")
        return None


def fetch_from_overpass(query, endpoint_url):
    """Fetch data from Overpass API endpoint."""
    print(f"🔄 Querying Overpass endpoint: {endpoint_url}")
    
    try:
        req = Request(
            endpoint_url,
            data=f"data={query}".encode('utf-8'),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        with urlopen(req, timeout=60) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                return data
            else:
                print(f"❌ HTTP {response.status}: {response.reason}")
                return None
    
    except HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        return None
    except URLError as e:
        print(f"❌ Connection Error: {e.reason}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def download_buildings(bounds):
    """Download buildings from Overpass API."""
    query = build_overpass_query(bounds)
    print(f"📍 Corridor bounds: {bounds}")
    print(f"📝 Query:\n{query}\n")
    
    for endpoint in OVERPASS_ENDPOINTS:
        print(f"\n🔄 Attempting endpoint {OVERPASS_ENDPOINTS.index(endpoint) + 1}/{len(OVERPASS_ENDPOINTS)}")
        
        data = fetch_from_overpass(query, endpoint)
        if data:
            return data
        
        # Rate limiting between endpoint attempts
        print("⏳ Waiting before next attempt...")
        time.sleep(2)
    
    print("❌ All Overpass endpoints failed")
    return None


def process_osm_data(data):
    """Convert raw OSM data to building objects."""
    print(f"\n📊 Processing OSM data...")
    
    # Create node dictionary for fast lookup
    nodes_dict = {}
    ways = []
    
    for element in data.get("elements", []):
        if element.get("type") == "node":
            nodes_dict[element["id"]] = element
        elif element.get("type") == "way" and element.get("tags", {}).get("building"):
            ways.append(element)
    
    print(f"   Found {len(nodes_dict)} nodes and {len(ways)} building ways")
    
    # Parse buildings
    buildings = []
    for way in ways:
        building = parse_building(way, nodes_dict)
        if building:
            buildings.append(building)
    
    print(f"✅ Parsed {len(buildings)} valid buildings")
    return buildings


def save_buildings(buildings):
    """Save buildings to JSON file."""
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(buildings, f, indent=2)
        
        file_size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
        print(f"\n✅ Saved {len(buildings)} buildings to {OUTPUT_FILE}")
        print(f"   File size: {file_size_mb:.2f} MB")
        return True
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return False


def main():
    """Main entry point."""
    print("=" * 60)
    print("🏢 OSM Building Data Downloader")
    print("=" * 60)
    
    # Download data
    osm_data = download_buildings(CORRIDOR_BOUNDS)
    if not osm_data:
        print("\n❌ Failed to download OSM data")
        sys.exit(1)
    
    # Process data
    buildings = process_osm_data(osm_data)
    if not buildings:
        print("\n❌ Failed to parse buildings")
        sys.exit(1)
    
    # Save to file
    if save_buildings(buildings):
        print("\n✅ Download complete!")
        print(f"   You can now run the application - it will load buildings from {OUTPUT_FILE.relative_to(Path.cwd())}")
        sys.exit(0)
    else:
        print("\n❌ Failed to save buildings")
        sys.exit(1)


if __name__ == "__main__":
    main()
