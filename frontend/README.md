# CityLens Frontend

AI-powered route optimization and infrastructure planning system for the Wakad-Hinjewadi corridor in Pune, India.

## Prerequisites

- Node.js 18+
- Internet connection (for one-time OSM data download, if needed)

## Quick Start

```bash
npm install
npm run dev
```

The application will start at `http://localhost:5173`

All 15,325 real OSM buildings are pre-loaded and available immediately - no API calls needed!

## Building for Production

```bash
npm run build
npm run preview
```

## How It Works

### Building Data

The application uses **pre-downloaded real OpenStreetMap (OSM) building data** for the Wakad-Hinjewadi corridor:

- ✅ **15,325 real buildings** from OSM
- ✅ **Pre-downloaded** and stored in `public/data/osm-buildings.json`
- ✅ **Loads instantly** - no API calls during startup
- ✅ **Works offline** - no internet required after first setup
- ✅ **11 MB file** - downloaded once at setup

### Updating Building Data

To refresh the building data with latest OSM information:

```bash
npm run download-buildings
```

This command:
1. Queries the Overpass API for all buildings in Wakad-Hinjewadi area
2. Processes and parses OSM data
3. Saves updated `public/data/osm-buildings.json`
4. No changes needed to app - just refresh browser

**Note:** Requires Python 3.7+ and internet connection. Takes 1-2 minutes.

### Building Object Format

Each building in the dataset contains:

```javascript
{
  id: "osm-123456",              // Unique identifier
  osmId: 123456,                 // OpenStreetMap way/relation ID
  type: "residential",           // residential | commercial | industrial | office
  coordinates: [[lng,lat]...],   // Closed polygon coordinates
  levels: 3,                     // Number of floors
  height: 10.5,                  // Height in meters
  area: 450.5,                   // Floor area in square meters
  estimatedValue: 22525000,      // Estimated property value in ₹
  capacity: 45,                  // Residents or business units affected
  name: "Building Name",         // From OSM data or null
  street: "Street Name",         // From OSM data or null
  houseNumber: "123",            // From OSM data or null
  tags: { /* raw OSM tags */ }   // Original OSM metadata
}
```

## Features

### Route Optimization
- Draw infrastructure routes (roads, flyovers, tunnels, bridges)
- Get 3 AI-suggested alternative routes:
  - **Shortest**: Direct path between endpoints
  - **Least Demolition**: Optimized to avoid buildings
  - **Balanced**: Compromise between distance and impact
- See analytics for each route:
  - Total length (km)
  - Buildings affected
  - Estimated demolition cost (₹)
  - Demolition severity score (0-100)
  - Route quality score (0-100)

### Building Analysis
- View buildings affected by infrastructure routes
- Color-coded demolition impact:
  - **Red**: Full demolition required
  - **Orange**: Partial impact/displacement
  - **Colored by type**: Not affected
- See building details: area, levels, estimated value, affected families

### Route Visualization
- Toggle suggested routes on/off
- Compare multiple alternatives on the same map
- See real OSM building data with geometries
- Interactive map with zoom and pan

## Project Structure

```
frontend/
├── public/
│   ├── data/
│   │   └── osm-buildings.json    # Pre-downloaded OSM buildings (11 MB)
│   └── index.html
├── src/
│   ├── components/               # React components
│   │   ├── CityMap.jsx
│   │   ├── RouteOptimization.jsx
│   │   ├── RouteComparisonPanel.jsx
│   │   └── ...
│   ├── services/
│   │   ├── osmService.js         # Building data loader (local file only)
│   │   └── ...
│   ├── utils/
│   │   ├── routeOptimizer.js     # Route generation algorithm
│   │   ├── geometryUtils.js      # Geometric calculations
│   │   ├── demolitionCalculator.js
│   │   └── ...
│   ├── data/
│   │   ├── puneData.js           # Corridor bounds, road network
│   │   └── ...
│   ├── store/
│   │   └── useStore.js           # Zustand state management
│   └── App.jsx
├── scripts/
│   └── download-osm-buildings.py # Update OSM building data
├── package.json
├── vite.config.js
└── README.md
```

## Troubleshooting

### Buildings Not Loading

1. Check that `public/data/osm-buildings.json` exists
2. Verify file is valid JSON: 
   ```bash
   python -c "import json; json.load(open('public/data/osm-buildings.json'))"
   ```
3. Check browser console (DevTools → Console) for errors
4. Clear browser cache: DevTools → Network → Disable cache

### Route Optimization Not Working

1. Draw a path first (click start point, then end point on the map)
2. Check console for errors
3. Verify buildings are visible on the map

### Building Data Download Fails

If you need to update building data:

1. Check internet connection
2. Overpass API might be temporarily unavailable
3. Try running the script again: `npm run download-buildings`

The app will still work with existing `osm-buildings.json` - you don't need to update unless you want fresh data.

## Performance

- **Fast startup**: Buildings load from local file (<100ms)
- **Large dataset**: 15,325 buildings handled efficiently
- **No API dependency**: Works even if OSM API is down
- **Optimized rendering**: Only affected buildings highlighted when route drawn

Works on all modern browsers: Chrome, Firefox, Edge, Safari.

## Data Sources

- **Building Data**: OpenStreetMap (ODbL License)
- **Road Network**: OpenStreetMap
- **Bounding Box**: Wakad-Hinjewadi corridor, Pune, India (18.575°N-18.62°N, 73.72°E-73.79°E)

## License

Building data is licensed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/).
