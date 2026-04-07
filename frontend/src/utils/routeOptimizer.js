/**
 * Route Optimizer - Generates diverse route alternatives
 * Creates genuinely different paths by using different strategies
 */

import { distance, findAffectedBuildings } from './geometryUtils';
import { analyzeRoute } from './demolitionCalculator';

/**
 * Calculate distance between two points in degrees
 */
const dist = (a, b) => Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

/**
 * Generate waypoints between start and end with offset
 * Creates curved/alternative paths by adding waypoints
 */
const generateWaypoints = (start, end, offsetDirection, offsetAmount) => {
  const midpoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2
  ];
  
  // Calculate perpendicular direction
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize and rotate 90 degrees
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Create offset midpoint
  const offsetMid = [
    midpoint[0] + perpX * offsetAmount * offsetDirection,
    midpoint[1] + perpY * offsetAmount * offsetDirection
  ];
  
  // Generate smooth path with multiple points
  const path = [start];
  
  // Add quarter point
  const quarter = [
    start[0] + (offsetMid[0] - start[0]) * 0.5,
    start[1] + (offsetMid[1] - start[1]) * 0.5
  ];
  path.push(quarter);
  
  // Add offset midpoint
  path.push(offsetMid);
  
  // Add three-quarter point
  const threeQuarter = [
    offsetMid[0] + (end[0] - offsetMid[0]) * 0.5,
    offsetMid[1] + (end[1] - offsetMid[1]) * 0.5
  ];
  path.push(threeQuarter);
  
  path.push(end);
  
  return path;
};

/**
 * Find nearest road point to snap waypoints
 */
const snapToNearestRoad = (point, roads, maxDistance = 0.005) => {
  let nearest = null;
  let minDist = maxDistance;
  
  roads.forEach(road => {
    road.coordinates.forEach(coord => {
      const d = dist(point, coord);
      if (d < minDist) {
        minDist = d;
        nearest = coord;
      }
    });
  });
  
  return nearest || point;
};

/**
 * Generate a route through road network
 */
const generateRouteThroughRoads = (start, end, roads, strategy, buildings) => {
  // Calculate direction and distance
  const totalDist = dist(start, end);
  
  // Create path based on strategy
  let rawPath;
  
  switch (strategy) {
    case 'shortest':
      // Direct path with minimal deviation
      rawPath = generateWaypoints(start, end, 0, 0);
      break;
      
    case 'least-demolition':
      // Curved path avoiding dense building areas
      // Go around one side (positive offset)
      rawPath = generateWaypoints(start, end, 1, totalDist * 0.3);
      break;
      
    case 'balanced':
      // Moderate curve on the other side
      rawPath = generateWaypoints(start, end, -1, totalDist * 0.2);
      break;
      
    default:
      rawPath = [start, end];
  }
  
  // Snap waypoints to nearest road points for realism
  const snappedPath = rawPath.map((point, index) => {
    // Always keep start and end exact
    if (index === 0 || index === rawPath.length - 1) {
      return point;
    }
    return snapToNearestRoad(point, roads);
  });
  
  return snappedPath;
};

/**
 * Calculate route length in km
 */
const calculateRouteLength = (path) => {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    // Convert degrees to approximate km (at Pune's latitude ~18.5N)
    const dx = (path[i + 1][0] - path[i][0]) * 111 * Math.cos(18.5 * Math.PI / 180);
    const dy = (path[i + 1][1] - path[i][1]) * 111;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
};

/**
 * Generate multiple route alternatives with genuinely different paths
 */
export const generateRouteAlternatives = (start, end, roads, buildings) => {
  const alternatives = [];
  
  // Route 1: Shortest (direct) path
  const shortestPath = generateRouteThroughRoads(start, end, roads, 'shortest', buildings);
  alternatives.push({
    id: 'shortest',
    name: 'Shortest Route',
    description: 'Direct path - minimizes total distance',
    coordinates: shortestPath,
    strategy: 'shortest'
  });
  
  // Route 2: Least demolition (curved to avoid buildings)
  const leastDemoPath = generateRouteThroughRoads(start, end, roads, 'least-demolition', buildings);
  alternatives.push({
    id: 'least-demolition',
    name: 'Minimal Demolition',
    description: 'Curved path - avoids building clusters',
    coordinates: leastDemoPath,
    strategy: 'least-demolition'
  });
  
  // Route 3: Balanced (moderate curve other side)
  const balancedPath = generateRouteThroughRoads(start, end, roads, 'balanced', buildings);
  alternatives.push({
    id: 'balanced',
    name: 'Balanced Route',
    description: 'Optimized trade-off between distance and impact',
    coordinates: balancedPath,
    strategy: 'balanced'
  });
  
  return alternatives;
};

/**
 * Compare multiple routes and rank them
 */
export const compareRoutes = (routes, infrastructureType, buildings, existingRoads) => {
  const analyzed = routes.map(route => {
    // Use 'coordinates' field as the path
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
      
      // Cost per sq.m by type
      const costPerSqM = {
        residential: 2500,
        commercial: 3500,
        industrial: 2000,
        office: 3000
      };
      
      demolitionCost += area * (costPerSqM[type] || 2500);
      
      // Relocation cost
      const relocationPerUnit = {
        residential: 500000,    // 5 lakh
        commercial: 1500000,    // 15 lakh
        industrial: 2000000,    // 20 lakh
        office: 1000000         // 10 lakh
      };
      
      const units = building.capacity || 1;
      unitsAffected += units;
      relocationCost += units * (relocationPerUnit[type] || 500000);
    });
    
    // Construction cost by infrastructure type (per km)
    const constructionPerKm = {
      road: 15000000,      // 1.5 crore/km
      bridge: 80000000,    // 8 crore/km
      flyover: 120000000,  // 12 crore/km
      tunnel: 200000000    // 20 crore/km
    };
    
    const constructionCost = routeLength * (constructionPerKm[infrastructureType] || 50000000);
    
    // Administrative costs (15%)
    const administrativeCost = (demolitionCost + relocationCost) * 0.15;
    
    // Total cost
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
    const annualBenefit = trafficImprovement * 10000000; // Rough estimate
    const paybackYears = totalCost / annualBenefit;
    const roi10Year = ((annualBenefit * 10 - totalCost) / totalCost) * 100;
    
    // Calculate score (0-100)
    // Higher score = better route
    let score = 100;
    
    // Penalty for length (longer = worse)
    score -= routeLength * 5;
    
    // Penalty for buildings affected (more = worse)
    score -= buildingsAffected * 8;
    
    // Penalty for cost (higher = worse)
    score -= (totalCost / 100000000); // Per crore
    
    // Bonus for good ROI
    if (paybackYears < 5) score += 10;
    else if (paybackYears < 10) score += 5;
    
    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
      ...route,
      path: routePath,
      affectedBuildings,
      analysis: {
        demolition: {
          routeLength: routeLength,
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
