# CityLens Frontend

AI-powered route optimization and infrastructure planning system for the Wakad-Hinjewadi corridor in Pune, India.

## Prerequisites

- Node.js 18+
- Python 3.7+ (for downloading OSM building data)
- Internet connection (for initial OSM data download)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Building for Production

```bash
npm run build
npm run preview
```

## OSM Building Data Setup

The application uses real OpenStreetMap (OSM) building data for the Wakad-Hinjewadi corridor. Before first run, you must download this data:

### Initial Download

```bash
npm run download-buildings
```

This command:
1. Queries the Overpass API for all buildings in the Wakad-Hinjewadi area (18.575°N-18.62°N, 73.72°E-73.79°E)
2. Parses building geometries, levels, heights, and estimated values
3. Saves processed data to `public/data/osm-buildings.json` (~11 MB)
4. Converts from raw OSM format to the application's internal format

**Note:** The first download may take 1-2 minutes. The Overpass API has multiple endpoints and the script will try them in sequence:
- `overpass-api.de` (primary)
- `overpass.kumi.systems` (backup 1)
- `overpass.openstreetmap.fr` (backup 2)

### Data Refresh

The downloaded data is cached in localStorage for 7 days. To refresh:

1. Delete the cache in browser DevTools → Application → Local Storage → Clear `citylens_osm_buildings`
2. Run `npm run download-buildings` again to update `osm-buildings.json`

### Output Format

Each building object contains:
```javascript
{
  id: "osm-123456",           // Unique identifier
  osmId: 123456,              // OpenStreetMap way/relation ID
  type: "residential",        // residential | commercial | industrial | office
  coordinates: [[lng,lat]...], // Closed polygon coordinates
  levels: 3,                  // Number of floors
  height: 10.5,               // Height in meters
  area: 450.5,                // Floor area in square meters
  estimatedValue: 22525000,   // Estimated property value in ₹
  capacity: 45,               // Residents or business units
  name: "Building Name",      // From OSM data or null
  street: "Street Name",      // From OSM data or null
  houseNumber: "123",         // From OSM data or null
  tags: { /* raw OSM tags */ } // Original OSM metadata
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
│   │   └── osm-buildings.json    # Downloaded OSM building data
│   └── index.html
├── src/
│   ├── components/               # React components
│   │   ├── CityMap.jsx
│   │   ├── RouteOptimization.jsx
│   │   ├── RouteComparisonPanel.jsx
│   │   └── ...
│   ├── services/
│   │   ├── osmService.js         # OSM data fetching & caching
│   │   └── ...
│   ├── utils/
│   │   ├── routeOptimizer.js     # Route generation algorithm
│   │   ├── geometryUtils.js      # Geometric calculations
│   │   ├── demolitionCalculator.js
│   │   └── ...
│   ├── data/
│   │   ├── puneData.js           # Corridor bounds, road network
│   │   ├── mockBuildings.js      # Fallback building data
│   │   └── ...
│   ├── store/
│   │   └── useStore.js           # Zustand state management
│   └── App.jsx
├── scripts/
│   └── download-osm-buildings.py # OSM data downloader
├── package.json
├── vite.config.js
└── README.md
```

## Troubleshooting

### OSM Data Download Fails

**Error:** "All Overpass endpoints failed"

1. Check internet connection
2. Overpass API might be temporarily unavailable
3. Try again in a few minutes
4. If using a proxy/firewall, may need to configure it

**Solution:** The app will use cached building data or mock buildings as fallback.

### Buildings Not Loading

1. Check browser console for errors
2. Verify `public/data/osm-buildings.json` exists
3. Check if JSON file is valid: `python -c "import json; json.load(open('public/data/osm-buildings.json'))"`
4. Clear localStorage: DevTools → Application → Local Storage → Delete

### Route Optimization Not Working

1. Make sure to draw a path first (click start point, then end point)
2. Check console for errors in route generation
3. Verify buildings are loaded

## Performance Tips

- OSM data file is ~11 MB but only downloaded once
- Cached in localStorage for 7 days
- Use toggle to hide suggested routes if map is slow
- Works on Chrome, Firefox, Edge (modern browsers)

## Data Sources

- **Building Data**: OpenStreetMap (ODbL License)
- **Road Network**: OpenStreetMap
- **Aerial Imagery**: OpenStreetMap tile servers
- **Bounding Box**: Wakad-Hinjewadi corridor, Pune, India

## License

Building data is licensed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/).
