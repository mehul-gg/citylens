/**
 * Route Optimizer - A* Pathfinding on Road Network
 * Generates top 3 best overall route alternatives using a balanced scoring approach
 */

import { buildRoadGraph } from './roadGraph';
import { findAffectedBuildings } from './geometryUtils';

/**
 * Calculate distance between two points in coordinate units
 */
const dist = (a, b) => Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

/**
 * Calculate distance in kilometers (approximate, at Pune's latitude ~18.5N)
 */
const distKm = (a, b) => {
  const dx = (b[0] - a[0]) * 111 * Math.cos(18.5 * Math.PI / 180);
  const dy = (b[1] - a[1]) * 111;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the length of a path in kilometers
 */
const calculatePathLengthKm = (coordinates) => {
  let length = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    length += distKm(coordinates[i], coordinates[i + 1]);
  }
  return length;
};

/**
 * Simple MinHeap for A* priority queue
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[parentIdx].f <= this.heap[idx].f) break;
      [this.heap[parentIdx], this.heap[idx]] = [this.heap[idx], this.heap[parentIdx]];
      idx = parentIdx;
    }
  }

  bubbleDown(idx) {
    const length = this.heap.length;
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let smallest = idx;

      if (leftIdx < length && this.heap[leftIdx].f < this.heap[smallest].f) {
        smallest = leftIdx;
      }
      if (rightIdx < length && this.heap[rightIdx].f < this.heap[smallest].f) {
        smallest = rightIdx;
      }
      if (smallest === idx) break;
      
      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
      idx = smallest;
    }
  }
}

/**
 * Find the nearest node in the graph to a given point
 */
const findNearestNode = (graph, point) => {
  let nearestKey = null;
  let nearestDist = Infinity;

  graph.nodes.forEach((node, key) => {
    const d = dist(point, node.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestKey = key;
    }
  });

  return { key: nearestKey, distance: nearestDist, position: graph.nodes.get(nearestKey)?.position };
};

/**
 * Find the nearest point on any road segment to a given point
 * Returns both the point and the road segment info
 */
const findNearestPointOnRoads = (roads, point) => {
  let nearestPoint = null;
  let nearestDist = Infinity;
  let nearestRoad = null;
  let nearestSegmentIdx = 0;

  roads.forEach(road => {
    if (!road.coordinates || road.coordinates.length < 2) return;
    
    for (let i = 0; i < road.coordinates.length - 1; i++) {
      const segStart = road.coordinates[i];
      const segEnd = road.coordinates[i + 1];
      
      // Find closest point on this segment
      const closestPoint = closestPointOnSegment(point, segStart, segEnd);
      const d = dist(point, closestPoint);
      
      if (d < nearestDist) {
        nearestDist = d;
        nearestPoint = closestPoint;
        nearestRoad = road;
        nearestSegmentIdx = i;
      }
    }
  });

  return { point: nearestPoint, distance: nearestDist, road: nearestRoad, segmentIdx: nearestSegmentIdx };
};

/**
 * Find closest point on a line segment to a given point
 */
const closestPointOnSegment = (point, segStart, segEnd) => {
  const dx = segEnd[0] - segStart[0];
  const dy = segEnd[1] - segStart[1];
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) return segStart;
  
  let t = ((point[0] - segStart[0]) * dx + (point[1] - segStart[1]) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  
  return [segStart[0] + t * dx, segStart[1] + t * dy];
};

/**
 * Add connector edges from start/end points to the road network
 * This creates temporary virtual edges for pathfinding
 */
const extendGraphWithConnectors = (graph, start, end, roads) => {
  // Clone the graph structure
  const extendedNodes = new Map(graph.nodes);
  const extendedEdges = [...graph.edges];
  const extendedConnections = new Map();
  graph.connections.forEach((set, key) => {
    extendedConnections.set(key, new Set(set));
  });

  // Find nearest points on roads for start and end
  const startNearest = findNearestPointOnRoads(roads, start);
  const endNearest = findNearestPointOnRoads(roads, end);

  // Create virtual nodes for start and end
  const startKey = `start_${start[0].toFixed(5)},${start[1].toFixed(5)}`;
  const endKey = `end_${end[0].toFixed(5)},${end[1].toFixed(5)}`;

  extendedNodes.set(startKey, { position: start, roads: [], isVirtual: true });
  extendedNodes.set(endKey, { position: end, roads: [], isVirtual: true });
  extendedConnections.set(startKey, new Set());
  extendedConnections.set(endKey, new Set());

  // Create virtual node at the connection point on the road
  if (startNearest.point) {
    const connectorKey = `conn_start_${startNearest.point[0].toFixed(5)},${startNearest.point[1].toFixed(5)}`;
    extendedNodes.set(connectorKey, { position: startNearest.point, roads: [], isVirtual: true });
    extendedConnections.set(connectorKey, new Set());

    // Edge from start to connector
    const connectorEdge = {
      from: startKey,
      to: connectorKey,
      road: {
        id: 'virtual-start-connector',
        name: 'New Connection',
        coordinates: [start, startNearest.point],
        type: 'connector',
        lanes: 2,
        speedLimit: 40,
        currentSpeed: 40,
        trafficDensity: 0,
        isVirtual: true
      },
      direction: 1
    };
    extendedEdges.push(connectorEdge);
    extendedEdges.push({ ...connectorEdge, from: connectorKey, to: startKey, direction: -1 });

    // Connect to nearby existing nodes
    extendedNodes.forEach((node, key) => {
      if (key === startKey || key === connectorKey || key === endKey) return;
      const d = dist(startNearest.point, node.position);
      if (d < 0.003) { // ~300m threshold
        extendedConnections.get(connectorKey).add(key);
        extendedConnections.get(key)?.add(connectorKey);
      }
    });
  }

  if (endNearest.point) {
    const connectorKey = `conn_end_${endNearest.point[0].toFixed(5)},${endNearest.point[1].toFixed(5)}`;
    extendedNodes.set(connectorKey, { position: endNearest.point, roads: [], isVirtual: true });
    extendedConnections.set(connectorKey, new Set());

    // Edge from connector to end
    const connectorEdge = {
      from: connectorKey,
      to: endKey,
      road: {
        id: 'virtual-end-connector',
        name: 'New Connection',
        coordinates: [endNearest.point, end],
        type: 'connector',
        lanes: 2,
        speedLimit: 40,
        currentSpeed: 40,
        trafficDensity: 0,
        isVirtual: true
      },
      direction: 1
    };
    extendedEdges.push(connectorEdge);
    extendedEdges.push({ ...connectorEdge, from: endKey, to: connectorKey, direction: -1 });

    // Connect to nearby existing nodes
    extendedNodes.forEach((node, key) => {
      if (key === startKey || key === connectorKey || key === endKey) return;
      const d = dist(endNearest.point, node.position);
      if (d < 0.003) {
        extendedConnections.get(connectorKey).add(key);
        extendedConnections.get(key)?.add(connectorKey);
      }
    });
  }

  return {
    nodes: extendedNodes,
    edges: extendedEdges,
    connections: extendedConnections,
    roads: graph.roads,
    startKey,
    endKey
  };
};

/**
 * Get edge weight based on road properties
 */
const getEdgeLength = (edge) => {
  if (!edge.road?.coordinates || edge.road.coordinates.length < 2) return 0.001;
  return calculatePathLengthKm(edge.road.coordinates);
};

/**
 * Count buildings near an edge (for cost calculation)
 */
const countBuildingsNearEdge = (edge, buildings, threshold = 0.0003) => {
  if (!buildings || buildings.length === 0) return 0;
  if (!edge.road?.coordinates) return 0;

  let count = 0;
  const coords = edge.road.coordinates;

  buildings.forEach(building => {
    if (!building.coordinates || building.coordinates.length === 0) return;
    
    // Check centroid distance to any point on edge
    const centroid = building.coordinates.reduce(
      (acc, c) => [acc[0] + c[0], acc[1] + c[1]],
      [0, 0]
    ).map(v => v / building.coordinates.length);

    for (const coord of coords) {
      if (dist(centroid, coord) < threshold) {
        count++;
        break;
      }
    }
  });

  return count;
};

/**
 * Create a balanced cost function with configurable weights
 * Higher weight = more importance on that factor
 */
const createBalancedCostFn = (buildings, weights = {}) => {
  const {
    distanceWeight = 1.0,
    buildingWeight = 1.0,
    trafficWeight = 1.0,
    constructionWeight = 1.0
  } = weights;

  return (edge) => {
    const length = getEdgeLength(edge);
    
    // Distance component
    const distanceCost = length * distanceWeight;
    
    // Building impact component
    const nearbyBuildings = countBuildingsNearEdge(edge, buildings);
    const buildingCost = nearbyBuildings * 0.25 * buildingWeight;
    
    // Traffic relief component (lower cost for congested roads we want to help)
    const congestion = edge.road?.trafficDensity || 0;
    const lanes = edge.road?.lanes || 2;
    const trafficBonus = congestion * lanes * 0.15 * trafficWeight;
    
    // Construction difficulty component
    const constructionMultiplier = {
      highway: 1.2,
      arterial: 1.0,
      flyover: 1.8,
      bridge: 2.0,
      connector: 1.5,
      junction: 0.5,
      local: 0.8
    };
    const constructionCost = length * (constructionMultiplier[edge.road?.type] || 1.0) * constructionWeight * 0.3;
    
    return Math.max(0.01, distanceCost + buildingCost + constructionCost - trafficBonus);
  };
};

/**
 * A* Pathfinding Algorithm
 * Returns array of edges forming the optimal path
 */
const aStarPathfind = (graph, startKey, endKey, costFn, maxIterations = 1000) => {
  const { nodes, edges, connections } = graph;
  
  if (!nodes.has(startKey) || !nodes.has(endKey)) {
    console.warn('Start or end node not found in graph');
    return null;
  }

  const startPos = nodes.get(startKey).position;
  const endPos = nodes.get(endKey).position;

  // Heuristic: straight-line distance to goal
  const heuristic = (nodeKey) => {
    const pos = nodes.get(nodeKey)?.position;
    if (!pos) return Infinity;
    return distKm(pos, endPos);
  };

  // Priority queue
  const openSet = new MinHeap();
  const cameFrom = new Map(); // nodeKey -> { prevNode, edge }
  const gScore = new Map(); // nodeKey -> cost to reach this node
  const fScore = new Map(); // nodeKey -> gScore + heuristic

  // Initialize
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startKey));
  openSet.push({ key: startKey, f: fScore.get(startKey) });

  const visited = new Set();
  let iterations = 0;

  while (!openSet.isEmpty() && iterations < maxIterations) {
    iterations++;
    const current = openSet.pop();
    
    if (!current) break;
    
    const currentKey = current.key;

    // Goal reached!
    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let node = endKey;
      while (cameFrom.has(node)) {
        const { prevNode, edge } = cameFrom.get(node);
        path.unshift(edge);
        node = prevNode;
      }
      return path;
    }

    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    // Get all edges from current node
    const outgoingEdges = edges.filter(e => e.from === currentKey);
    
    // Also consider edges from connected nodes (junction connections)
    const connectedNodes = connections.get(currentKey) || new Set();
    connectedNodes.forEach(connectedKey => {
      if (!visited.has(connectedKey)) {
        // Create a virtual "junction crossing" edge
        const connectedPos = nodes.get(connectedKey)?.position;
        const currentPos = nodes.get(currentKey)?.position;
        if (connectedPos && currentPos) {
          outgoingEdges.push({
            from: currentKey,
            to: connectedKey,
            road: {
              id: `junction-${currentKey}-${connectedKey}`,
              name: 'Junction',
              coordinates: [currentPos, connectedPos],
              type: 'junction',
              lanes: 2,
              trafficDensity: 0.5,
              isJunction: true
            },
            direction: 1
          });
        }
      }
    });

    // Explore neighbors
    for (const edge of outgoingEdges) {
      const neighborKey = edge.to;
      if (visited.has(neighborKey)) continue;

      const edgeCost = costFn(edge);
      const tentativeG = (gScore.get(currentKey) || Infinity) + edgeCost;

      if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, { prevNode: currentKey, edge });
        gScore.set(neighborKey, tentativeG);
        const f = tentativeG + heuristic(neighborKey);
        fScore.set(neighborKey, f);
        openSet.push({ key: neighborKey, f });
      }
    }
  }

  // No path found
  console.warn(`A* did not find path after ${iterations} iterations`);
  return null;
};

/**
 * Flatten edges into a single coordinate array
 */
const flattenEdgesToPath = (edges) => {
  if (!edges || edges.length === 0) return [];
  
  const path = [];
  
  edges.forEach((edge, idx) => {
    if (!edge.road?.coordinates) return;
    
    let coords = edge.road.coordinates;
    if (edge.direction === -1) {
      coords = [...coords].reverse();
    }
    
    // Skip first point of subsequent edges to avoid duplicates
    const startIdx = idx === 0 ? 0 : 1;
    for (let i = startIdx; i < coords.length; i++) {
      path.push(coords[i]);
    }
  });
  
  return path;
};

/**
 * Generate a fallback geometric route when A* fails
 */
const generateFallbackRoute = (start, end, offsetDirection, offsetAmount) => {
  const midpoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2
  ];
  
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return [start, end];
  
  const perpX = -dy / length;
  const perpY = dx / length;
  
  const offsetMid = [
    midpoint[0] + perpX * offsetAmount * offsetDirection,
    midpoint[1] + perpY * offsetAmount * offsetDirection
  ];
  
  return [start, offsetMid, end];
};

/**
 * Check if two paths are significantly different
 * Returns true if paths differ by more than the threshold
 */
const arePathsDifferent = (path1, path2, threshold = 0.3) => {
  if (!path1 || !path2 || path1.length === 0 || path2.length === 0) return true;
  
  // Compare total lengths
  const len1 = calculatePathLengthKm(path1);
  const len2 = calculatePathLengthKm(path2);
  if (Math.abs(len1 - len2) / Math.max(len1, len2) > threshold) return true;
  
  // Sample points along both paths and check distances
  const sampleCount = 5;
  let totalDiff = 0;
  
  for (let i = 0; i < sampleCount; i++) {
    const idx1 = Math.floor((i / sampleCount) * (path1.length - 1));
    const idx2 = Math.floor((i / sampleCount) * (path2.length - 1));
    const p1 = path1[idx1];
    const p2 = path2[idx2];
    totalDiff += dist(p1, p2);
  }
  
  const avgDiff = totalDiff / sampleCount;
  return avgDiff > 0.002; // ~200m average difference
};

/**
 * Score a route for overall quality (higher = better)
 */
const scoreRoute = (path, edges, buildings) => {
  if (!path || path.length < 2) return 0;
  
  const length = calculatePathLengthKm(path);
  
  // Count affected buildings
  let buildingsNearPath = 0;
  buildings?.forEach(building => {
    if (!building.coordinates || building.coordinates.length === 0) return;
    const centroid = building.coordinates.reduce(
      (acc, c) => [acc[0] + c[0], acc[1] + c[1]],
      [0, 0]
    ).map(v => v / building.coordinates.length);
    
    for (const coord of path) {
      if (dist(centroid, coord) < 0.0003) {
        buildingsNearPath++;
        break;
      }
    }
  });
  
  // Calculate traffic relief potential
  let trafficRelief = 0;
  edges?.forEach(edge => {
    const congestion = edge.road?.trafficDensity || 0;
    const lanes = edge.road?.lanes || 2;
    trafficRelief += congestion * lanes;
  });
  
  // Score calculation (higher is better)
  let score = 100;
  score -= length * 8;                    // Penalize longer routes
  score -= buildingsNearPath * 12;        // Penalize building impact
  score += trafficRelief * 2;             // Reward traffic relief potential
  score += (edges?.length || 0) > 0 ? 10 : 0;  // Bonus for valid A* path
  
  return Math.max(0, score);
};

/**
 * Generate multiple route alternatives using A* pathfinding
 * Returns top 3 best overall routes ranked by combined score
 */
export const generateRouteAlternatives = (start, end, roads, buildings) => {
  console.log('Generating route alternatives using A* pathfinding...');
  
  // Build the road graph
  const baseGraph = buildRoadGraph(roads);
  
  // Extend graph with connector edges from start/end points
  const graph = extendGraphWithConnectors(baseGraph, start, end, roads);
  
  const totalDist = dist(start, end);
  const candidateRoutes = [];

  // Generate multiple candidate routes with different weight configurations
  const weightConfigs = [
    { distanceWeight: 1.5, buildingWeight: 0.8, trafficWeight: 1.0, constructionWeight: 0.6 },
    { distanceWeight: 1.0, buildingWeight: 1.5, trafficWeight: 0.8, constructionWeight: 1.0 },
    { distanceWeight: 0.8, buildingWeight: 1.0, trafficWeight: 1.5, constructionWeight: 0.8 },
    { distanceWeight: 1.2, buildingWeight: 1.2, trafficWeight: 1.2, constructionWeight: 1.2 },
    { distanceWeight: 1.0, buildingWeight: 0.5, trafficWeight: 1.2, constructionWeight: 1.5 },
    { distanceWeight: 0.6, buildingWeight: 1.8, trafficWeight: 0.6, constructionWeight: 0.8 },
  ];

  weightConfigs.forEach((weights, idx) => {
    const costFn = createBalancedCostFn(buildings, weights);
    const path = aStarPathfind(graph, graph.startKey, graph.endKey, costFn);
    
    if (path && path.length > 0) {
      const coords = flattenEdgesToPath(path);
      const score = scoreRoute(coords, path, buildings);
      
      candidateRoutes.push({
        coordinates: coords,
        edges: path,
        score,
        configIdx: idx
      });
    }
  });

  // Also try a direct geometric fallback
  candidateRoutes.push({
    coordinates: generateFallbackRoute(start, end, 0, 0),
    edges: [],
    score: scoreRoute(generateFallbackRoute(start, end, 0, 0), [], buildings) - 20, // Penalty for fallback
    isFallback: true,
    configIdx: -1
  });

  candidateRoutes.push({
    coordinates: generateFallbackRoute(start, end, 1, totalDist * 0.15),
    edges: [],
    score: scoreRoute(generateFallbackRoute(start, end, 1, totalDist * 0.15), [], buildings) - 25,
    isFallback: true,
    configIdx: -2
  });

  // Sort by score (highest first)
  candidateRoutes.sort((a, b) => b.score - a.score);

  // Select top 3 unique routes
  const selectedRoutes = [];
  
  for (const route of candidateRoutes) {
    if (selectedRoutes.length >= 3) break;
    
    // Check if this route is different enough from already selected ones
    let isDifferent = true;
    for (const selected of selectedRoutes) {
      if (!arePathsDifferent(route.coordinates, selected.coordinates)) {
        isDifferent = false;
        break;
      }
    }
    
    if (isDifferent) {
      selectedRoutes.push(route);
    }
  }

  // If we don't have 3 routes, add more fallbacks
  while (selectedRoutes.length < 3) {
    const offset = selectedRoutes.length === 1 ? 1 : -1;
    const amount = totalDist * (0.1 + selectedRoutes.length * 0.08);
    selectedRoutes.push({
      coordinates: generateFallbackRoute(start, end, offset, amount),
      edges: [],
      score: 30 - selectedRoutes.length * 10,
      isFallback: true
    });
  }

  // Format final routes with names and descriptions
  const alternatives = selectedRoutes.map((route, index) => {
    const length = calculatePathLengthKm(route.coordinates);
    const isAStarRoute = !route.isFallback && route.edges.length > 0;
    
    let description;
    if (index === 0) {
      description = 'Best overall route balancing distance, cost, and impact';
    } else if (index === 1) {
      description = 'Alternative route with different path characteristics';
    } else {
      description = 'Additional alternative for comparison';
    }

    return {
      id: `option-${index + 1}`,
      name: `Option ${index + 1}`,
      description,
      coordinates: route.coordinates,
      edges: route.edges,
      score: route.score,
      isFallback: route.isFallback,
      isAStarRoute
    };
  });

  console.log(`Generated ${alternatives.length} route alternatives`);
  return alternatives;
};

/**
 * Calculate route length in km
 */
const calculateRouteLength = (path) => {
  if (!path || path.length < 2) return 0;
  return calculatePathLengthKm(path);
};

/**
 * Compare multiple routes and rank them
 */
export const compareRoutes = (routes, infrastructureType, buildings, existingRoads) => {
  const analyzed = routes.map(route => {
    const routePath = route.coordinates || [];
    
    if (!routePath || routePath.length === 0) {
      console.warn('Route has no coordinates:', route);
      return null;
    }
    
    // Calculate route metrics
    const routeLength = calculateRouteLength(routePath);
    
    // Find affected buildings for this route
    const affectedBuildings = findAffectedBuildings(routePath, buildings, 0.0002);
    
    // Calculate costs based on affected buildings
    const buildingsAffected = affectedBuildings.length;
    
    // Demolition cost estimates (in INR)
    let demolitionCost = 0;
    let relocationCost = 0;
    let unitsAffected = 0;
    
    affectedBuildings.forEach(ab => {
      const building = ab.building;
      const area = building.area || 100;
      const type = building.type || 'residential';
      
      const costPerSqM = {
        residential: 2500,
        commercial: 3500,
        industrial: 2000,
        office: 3000
      };
      
      demolitionCost += area * (costPerSqM[type] || 2500);
      
      const relocationPerUnit = {
        residential: 500000,
        commercial: 1500000,
        industrial: 2000000,
        office: 1000000
      };
      
      const units = building.capacity || 1;
      unitsAffected += units;
      relocationCost += units * (relocationPerUnit[type] || 500000);
    });
    
    // Construction cost by infrastructure type (per km)
    const constructionPerKm = {
      road: 15000000,
      bridge: 80000000,
      flyover: 120000000,
      tunnel: 200000000
    };
    
    const constructionCost = routeLength * (constructionPerKm[infrastructureType] || 50000000);
    const administrativeCost = (demolitionCost + relocationCost) * 0.15;
    const totalCost = demolitionCost + relocationCost + constructionCost + administrativeCost;
    
    // Traffic improvement estimates
    const congestionReduction = {
      road: 10,
      bridge: 25,
      flyover: 35,
      tunnel: 30
    };
    
    const trafficImprovement = congestionReduction[infrastructureType] || 15;
    
    // ROI calculation
    const annualBenefit = trafficImprovement * 10000000;
    const paybackYears = totalCost / annualBenefit;
    const roi10Year = ((annualBenefit * 10 - totalCost) / totalCost) * 100;
    
    // Calculate score (0-100)
    let score = 100;
    score -= routeLength * 5;
    score -= buildingsAffected * 8;
    score -= (totalCost / 100000000);
    if (paybackYears < 5) score += 10;
    else if (paybackYears < 10) score += 5;
    
    // Bonus for A* routes (not fallback)
    if (!route.isFallback) score += 5;
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
      ...route,
      path: routePath,
      affectedBuildings,
      analysis: {
        demolition: {
          routeLength,
          buildingsAffected,
          demolitionCost,
          relocationCost,
          constructionCost,
          administrativeCost,
          totalCost,
          totalUnitsAffected: unitsAffected
        },
        traffic: {
          congestionReduction: trafficImprovement,
          estimatedAnnualBenefit: annualBenefit
        },
        roi: {
          paybackPeriodYears: paybackYears,
          roi10Year,
          feasible: paybackYears < 15
        }
      },
      score,
      summary: {
        length: routeLength.toFixed(2),
        buildingsAffected,
        totalCost,
        congestionReduction: trafficImprovement.toFixed(1),
        paybackYears: paybackYears.toFixed(1),
        feasible: paybackYears < 15
      }
    };
  }).filter(route => route !== null);

  // Sort by score (highest first)
  analyzed.sort((a, b) => b.score - a.score);

  // Mark recommended route
  if (analyzed.length > 0) {
    analyzed[0].recommended = true;
  }

  return analyzed;
};

/**
 * Smooth a route path using Catmull-Rom spline
 */
export const smoothRoute = (coordinates, segments = 20) => {
  if (coordinates.length < 3) return coordinates;

  const smoothed = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[Math.max(0, i - 1)];
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const p3 = coordinates[Math.min(coordinates.length - 1, i + 2)];

    for (let t = 0; t < segments; t++) {
      const u = t / segments;
      const uu = u * u;
      const uuu = uu * u;

      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * u +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * uu +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * uuu
      );

      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * u +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * uu +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * uuu
      );

      smoothed.push([x, y]);
    }
  }

  smoothed.push(coordinates[coordinates.length - 1]);
  return smoothed;
};

/**
 * Format currency in INR (Crores/Lakhs)
 */
export const formatINR = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default {
  generateRouteAlternatives,
  compareRoutes,
  smoothRoute,
  formatINR
};
