# CityLens - Digital Twin Platform for Smart City Planning

A **Digital Twin Platform** for smart city infrastructure planning and traffic simulation. CityLens allows users to visualize traffic flow, draw new infrastructure (roads, bridges, flyovers), and see AI-optimized route suggestions with real-time impact analysis.

---

## Quick Start

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

### Backend (FastAPI) - Optional
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Features

### Traffic Simulation
- Real-time vehicle animation on road network
- Congestion visualization with color-coded roads (green/yellow/orange/red)
- Time-of-day simulation with adjustable hour slider
- Dynamic metrics: Travel Time, Congestion Index

### Infrastructure Planning
- **Draw new infrastructure** directly on the map:
  - Roads - New road connections
  - Bridges - River/highway crossings
  - Flyovers - Grade-separated intersections
- Click to place start point, click again to place end point
- Infrastructure snaps to logical positions

### AI Route Suggestions
- When drawing infrastructure, the system generates **3 best route alternatives**
- Uses **A* pathfinding** on the existing road network graph
- Routes are scored based on:
  - Distance (shorter is better)
  - Building impact (fewer affected buildings is better)
  - Traffic relief potential (routing through congested areas)
  - Construction difficulty (road type multipliers)
- Each route shows: Length, Buildings Affected, Total Cost

### Dynamic Analytics
- **Live Network Panel**: Shows Travel Time and Congestion metrics
- **Network Analytics Panel**: Updates when infrastructure is built
- **AI Score**: 
  - Before infrastructure: Shows "Priority" score (need for infrastructure)
  - After infrastructure: Shows "Health" score (network improvement)
- Efficiency gains displayed: Travel time reduction, Congestion reduction

### Scenario Management
- Add multiple infrastructure projects
- Compare before/after states
- Run simulation to see combined impact
- Delete individual scenarios

---

## How It Works

### Route Suggestion Algorithm

1. **Road Graph Construction**: Road network converted to graph (nodes = intersections, edges = road segments)

2. **Graph Extension**: User's start/end points connected to nearest roads via virtual connector edges

3. **A* Pathfinding**: Finds optimal paths using `f(n) = g(n) + h(n)` where:
   - g(n) = actual cost from start
   - h(n) = heuristic (straight-line distance to goal)

4. **Balanced Cost Function**:
   ```
   cost = distance + buildingImpact + constructionDifficulty - trafficRelief
   ```

5. **Multiple Candidates**: Runs A* with 6 different weight configurations to generate diverse routes

6. **Route Scoring**: Each route scored 0-100 based on length, buildings affected, and traffic relief

7. **Top 3 Selection**: Selects best 3 unique routes (must differ by ~200m average)

### Infrastructure Impact Calculation

When infrastructure is built:
- Calculates which roads are "relieved" based on proximity
- Reduces traffic density on affected roads
- Updates Travel Time and Congestion metrics accordingly
- Recalculates Network Health score

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **Leaflet** - Map visualization
- **Tailwind CSS** - Styling
- **Zustand** - State management

### Backend
- **FastAPI** - REST API
- **Python** - Backend logic

### Data
- **OpenStreetMap** - Road network data
- **GeoJSON** - Data format

---

## Project Structure

```
citylens/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CityMap.jsx         - Main map component
│   │   │   ├── Sidebar.jsx         - Left sidebar with Live Network
│   │   │   ├── ScenarioPanel.jsx   - Infrastructure drawing tools
│   │   │   ├── AnalyticsPanel.jsx  - Network analytics & AI score
│   │   │   ├── RouteComparisonPanel.jsx - Route suggestions UI
│   │   │   ├── RouteVisualization.jsx   - Route polylines on map
│   │   │   └── BuildingLayer.jsx   - Building visualization
│   │   ├── store/
│   │   │   └── useStore.js         - Zustand state management
│   │   ├── utils/
│   │   │   ├── routeOptimizer.js   - A* pathfinding algorithm
│   │   │   ├── roadGraph.js        - Road network graph builder
│   │   │   └── geometryUtils.js    - Geometry calculations
│   │   └── data/
│   │       └── puneData.js         - Road segments, junctions, metrics
│   └── index.html
├── backend/
│   └── app/
│       └── main.py                 - FastAPI application
└── README.md
```

---

## Key Files

| File | Purpose |
|------|---------|
| `routeOptimizer.js` | A* pathfinding, route scoring, cost functions |
| `roadGraph.js` | Builds graph from road segments, calculates infrastructure impact |
| `useStore.js` | Global state: scenarios, routes, drawing mode |
| `puneData.js` | Road network data, traffic patterns, city metrics |
| `CityMap.jsx` | Leaflet map, vehicle animation, click handlers |
| `RouteComparisonPanel.jsx` | Shows 3 route options with metrics |
| `AnalyticsPanel.jsx` | Network analytics, AI health/priority score |

---

## Usage

### Drawing Infrastructure

1. Click an infrastructure button (Road, Bridge, or Flyover)
2. Click on map to set **start point**
3. Click again to set **end point**
4. View 3 suggested routes in the Route Suggestions panel
5. Select a route and click "Build This Route"
6. Or click "Discard" to cancel

### Viewing Impact

- **Live Network** (Sidebar): Shows current Travel Time and Congestion
- **Network Analytics** (Bottom right): Shows detailed metrics
- **AI Score**: Updates from "Priority" (need) to "Health" (improvement) after building

### Running Simulation

1. Add infrastructure projects
2. Click "Run Simulation" in Scenario Builder
3. View efficiency gains and updated metrics
4. Toggle "Flow Visibility" to see animated traffic

---

## Configuration

### City Metrics (puneData.js)
```javascript
export const CITY_METRICS = {
  avgTravelTime: 22,       // minutes
  congestionIndex: 78,     // out of 100
  accidentRate: 2.3,       // per 1000 vehicles
  dailyVehicles: 285000,
  publicTransportShare: 18 // percentage
};
```

### Route Scoring Weights
Adjust in `routeOptimizer.js`:
```javascript
const weightConfigs = [
  { distanceWeight: 1.5, buildingWeight: 0.8, trafficWeight: 1.0, constructionWeight: 0.6 },
  // ... more configurations
];
```

---

## Browser Support

- Chrome 90+ (Recommended)
- Edge 90+
- Firefox 88+
- Safari 14+

---

## Troubleshooting

### Map not loading
- Check if frontend is running on port 5173
- Open browser console (F12) for errors
- Try refreshing the page

### Routes not generating
- Ensure start/end points are near existing roads
- Check console for pathfinding errors
- Try drawing in a different area with more road coverage

### Slow performance
- Reduce vehicle count in simulation
- Close other browser tabs
- Use Chrome/Edge for best performance

---

## Credits

**Built for:** Hackathon Project  
**Domain:** Smart City Infrastructure Planning  
**Location:** Wakad-Hinjewadi Corridor, Pune, India

---

**Version:** 3.0.0  
**Last Updated:** April 8, 2026  
**Status:** Fully Functional
