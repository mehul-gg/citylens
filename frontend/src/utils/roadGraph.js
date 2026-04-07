/**
 * Road Network Graph - Creates a connected graph from road segments
 * Used for vehicle routing across the entire network
 */

import { ROAD_SEGMENTS } from '../data/puneData';

// Distance threshold for connecting roads (in coordinate units)
const CONNECTION_THRESHOLD = 0.002; // ~200m

/**
 * Calculate distance between two points
 */
const distance = (p1, p2) => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Build a graph of connected road segments
 * Each node is a road endpoint, edges connect nearby endpoints
 */
export const buildRoadGraph = (roads = ROAD_SEGMENTS, scenarios = []) => {
  // Combine base roads with user-drawn scenarios
  const allRoads = [
    ...roads,
    ...scenarios.map((s, i) => ({
      id: s.id || `scenario-${i}`,
      name: s.name || `New ${s.type}`,
      coordinates: s.coordinates,
      type: s.type,
      lanes: 2,
      speedLimit: s.type === 'flyover' ? 60 : s.type === 'tunnel' ? 50 : 40,
      currentSpeed: s.type === 'flyover' ? 50 : s.type === 'tunnel' ? 40 : 30,
      trafficDensity: 0.3, // New roads have low initial density
      isScenario: true
    }))
  ];

  const nodes = new Map(); // endpoint -> { roads: [], position: [lng, lat] }
  const edges = []; // { from, to, road, direction }

  // Create nodes for each road endpoint
  allRoads.forEach(road => {
    if (!road.coordinates || road.coordinates.length < 2) return;
    
    const start = road.coordinates[0];
    const end = road.coordinates[road.coordinates.length - 1];
    
    // Create unique keys for endpoints
    const startKey = `${start[0].toFixed(5)},${start[1].toFixed(5)}`;
    const endKey = `${end[0].toFixed(5)},${end[1].toFixed(5)}`;
    
    // Add to nodes map
    if (!nodes.has(startKey)) {
      nodes.set(startKey, { roads: [], position: start });
    }
    if (!nodes.has(endKey)) {
      nodes.set(endKey, { roads: [], position: end });
    }
    
    nodes.get(startKey).roads.push({ road, isStart: true });
    nodes.get(endKey).roads.push({ road, isStart: false });
    
    // Add edge for this road (bidirectional)
    edges.push({ from: startKey, to: endKey, road, direction: 1 });
    edges.push({ from: endKey, to: startKey, road, direction: -1 });
  });

  // Connect nearby endpoints (nodes that are close to each other)
  const nodeKeys = Array.from(nodes.keys());
  const connections = new Map(); // nodeKey -> [connected nodeKeys]
  
  nodeKeys.forEach(key => {
    connections.set(key, new Set());
  });

  // Find connections based on proximity
  for (let i = 0; i < nodeKeys.length; i++) {
    for (let j = i + 1; j < nodeKeys.length; j++) {
      const node1 = nodes.get(nodeKeys[i]);
      const node2 = nodes.get(nodeKeys[j]);
      
      if (distance(node1.position, node2.position) < CONNECTION_THRESHOLD) {
        connections.get(nodeKeys[i]).add(nodeKeys[j]);
        connections.get(nodeKeys[j]).add(nodeKeys[i]);
      }
    }
  }

  return { nodes, edges, connections, roads: allRoads };
};

/**
 * Generate routes through the network
 * Returns an array of route objects, each containing a sequence of road segments
 */
export const generateRoutes = (graph, numRoutes = 30) => {
  const routes = [];
  const { nodes, edges, connections, roads } = graph;
  const nodeKeys = Array.from(nodes.keys());
  
  if (nodeKeys.length === 0 || roads.length === 0) return routes;

  for (let i = 0; i < numRoutes; i++) {
    // Start from a random node
    let currentNode = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
    const route = [];
    const visitedEdges = new Set();
    const maxSteps = 8; // Maximum number of road segments per route
    
    for (let step = 0; step < maxSteps; step++) {
      // Get available edges from current node
      const availableEdges = edges.filter(e => 
        e.from === currentNode && !visitedEdges.has(`${e.from}-${e.to}-${e.road.id}`)
      );
      
      // Also consider connected nodes (junction connections)
      const connectedNodes = connections.get(currentNode) || new Set();
      connectedNodes.forEach(connectedKey => {
        const moreEdges = edges.filter(e => 
          e.from === connectedKey && !visitedEdges.has(`${e.from}-${e.to}-${e.road.id}`)
        );
        availableEdges.push(...moreEdges);
      });
      
      if (availableEdges.length === 0) break;
      
      // Pick a random edge, weighted by road type (prefer main roads)
      const weights = availableEdges.map(e => {
        if (e.road.type === 'highway') return 3;
        if (e.road.type === 'arterial') return 2;
        if (e.road.type === 'flyover') return 2.5;
        return 1;
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let w = 0; w < weights.length; w++) {
        random -= weights[w];
        if (random <= 0) {
          selectedIdx = w;
          break;
        }
      }
      
      const selectedEdge = availableEdges[selectedIdx];
      route.push({
        road: selectedEdge.road,
        direction: selectedEdge.direction,
        coordinates: selectedEdge.direction === 1 
          ? selectedEdge.road.coordinates 
          : [...selectedEdge.road.coordinates].reverse()
      });
      
      visitedEdges.add(`${selectedEdge.from}-${selectedEdge.to}-${selectedEdge.road.id}`);
      currentNode = selectedEdge.to;
    }
    
    if (route.length > 0) {
      routes.push({
        id: `route-${i}`,
        segments: route,
        isLoop: route.length >= 3 // Consider as loop if it has multiple segments
      });
    }
  }
  
  return routes;
};

/**
 * Get a flattened path of coordinates for a route
 */
export const getRoutePath = (route) => {
  const path = [];
  route.segments.forEach((segment, idx) => {
    const coords = segment.coordinates;
    // Skip first point of subsequent segments to avoid duplicates
    const startIdx = idx === 0 ? 0 : 1;
    for (let i = startIdx; i < coords.length; i++) {
      path.push(coords[i]);
    }
  });
  return path;
};

/**
 * Calculate traffic density reduction for roads affected by new infrastructure
 */
export const calculateInfrastructureImpact = (scenarios, baseRoads = ROAD_SEGMENTS) => {
  if (!scenarios || scenarios.length === 0) {
    return baseRoads;
  }

  // Create a copy of roads with updated traffic density
  return baseRoads.map(road => {
    let densityReduction = 0;

    scenarios.forEach(scenario => {
      if (!scenario.coordinates || scenario.coordinates.length < 2) return;

      // Check if this road is near the scenario
      const scenarioStart = scenario.coordinates[0];
      const scenarioEnd = scenario.coordinates[scenario.coordinates.length - 1];
      
      // Check proximity to road endpoints and midpoints
      const roadStart = road.coordinates[0];
      const roadEnd = road.coordinates[road.coordinates.length - 1];
      const roadMid = road.coordinates[Math.floor(road.coordinates.length / 2)];
      
      // Check if scenario intersects or is very close to this road
      let minDist = Infinity;
      scenario.coordinates.forEach(scenarioPoint => {
        road.coordinates.forEach(roadPoint => {
          const d = distance(scenarioPoint, roadPoint);
          if (d < minDist) minDist = d;
        });
      });
      
      const nearStart = distance(scenarioStart, roadStart) < 0.01 || 
                        distance(scenarioStart, roadEnd) < 0.01 ||
                        distance(scenarioStart, roadMid) < 0.01;
      const nearEnd = distance(scenarioEnd, roadStart) < 0.01 || 
                      distance(scenarioEnd, roadEnd) < 0.01 ||
                      distance(scenarioEnd, roadMid) < 0.01;
      
      if (nearStart || nearEnd || minDist < 0.01) {
        // Road is connected to or intersects scenario - significant impact
        switch (scenario.type) {
          case 'flyover':
            densityReduction += 0.40; // 40% reduction
            break;
          case 'bridge':
            densityReduction += 0.35;
            break;
          case 'tunnel':
            densityReduction += 0.35;
            break;
          default:
            densityReduction += 0.20;
        }
      } else {
        // Check if road is in the general vicinity (parallel roads get some benefit)
        const midScenario = scenario.coordinates[Math.floor(scenario.coordinates.length / 2)];
        const midRoad = road.coordinates[Math.floor(road.coordinates.length / 2)];
        
        if (distance(midScenario, midRoad) < 0.02) {
          densityReduction += 0.20; // 20% reduction for nearby roads
        }
      }
    });

    // Cap reduction at 60%
    densityReduction = Math.min(densityReduction, 0.6);

    return {
      ...road,
      trafficDensity: Math.max(0.1, road.trafficDensity - densityReduction),
      currentSpeed: Math.min(road.speedLimit, road.currentSpeed + (densityReduction * 30)),
      hasInfrastructureImpact: densityReduction > 0
    };
  });
};

export default { buildRoadGraph, generateRoutes, getRoutePath, calculateInfrastructureImpact };
