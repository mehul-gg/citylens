/**
 * Demolition Impact Calculator
 * Calculates costs, affected residents, and route optimization metrics
 */

import { findAffectedBuildings } from '../utils/geometryUtils';

// Cost constants (in INR)
const COSTS = {
  // Demolition cost per square meter by building type
  demolition: {
    residential: 2500,    // ₹2,500/sq.m
    commercial: 3500,     // ₹3,500/sq.m
    industrial: 2000,     // ₹2,000/sq.m
    office: 3000          // ₹3,000/sq.m
  },

  // Construction cost per kilometer by infrastructure type
  construction: {
    road: 15_000_000,      // ₹1.5 crore/km
    bridge: 50_000_000,    // ₹5 crore/km
    flyover: 80_000_000,   // ₹8 crore/km
    tunnel: 120_000_000    // ₹12 crore/km
  },

  // Relocation cost per unit
  relocation: {
    residential: 500_000,  // ₹5 lakh per household
    commercial: 1_000_000, // ₹10 lakh per business
    industrial: 2_000_000, // ₹20 lakh per factory
    office: 1_500_000      // ₹15 lakh per office
  },

  // Legal and administrative costs (as percentage of total)
  administrative: 0.15, // 15% of demolition + relocation costs
};

/**
 * Calculate route length in kilometers
 */
const calculateRouteLength = (coordinates) => {
  let length = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    
    // Haversine formula approximation for short distances
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km
    
    length += distance;
  }
  return length;
};

/**
 * Calculate demolition impact for a single building
 */
const calculateBuildingImpact = (affectedBuilding) => {
  const { building, overlapRatio, severity, demolitionRequired } = affectedBuilding;
  const { type, area, estimatedValue, capacity } = building;

  // Calculate demolition cost
  const demolitionCostPerSqM = COSTS.demolition[type] || COSTS.demolition.residential;
  const effectiveArea = demolitionRequired ? area : area * overlapRatio;
  const demolitionCost = effectiveArea * demolitionCostPerSqM;

  // Calculate relocation cost
  const relocationCostPerUnit = COSTS.relocation[type] || COSTS.relocation.residential;
  const unitsAffected = demolitionRequired ? capacity : Math.ceil(capacity * overlapRatio);
  const relocationCost = unitsAffected * relocationCostPerUnit;

  // Total building impact cost
  const totalCost = demolitionCost + relocationCost;

  return {
    buildingId: building.id,
    buildingType: type,
    severity,
    demolitionRequired,
    area: effectiveArea,
    unitsAffected,
    demolitionCost,
    relocationCost,
    totalCost,
    buildingValue: estimatedValue
  };
};

/**
 * Calculate total demolition impact for a route
 */
export const calculateDemolitionImpact = (routeCoordinates, infrastructureType, buildings) => {
  // Find all affected buildings
  const roadWidth = infrastructureType === 'flyover' || infrastructureType === 'bridge' 
    ? 0.00015  // Wider for elevated structures (pillars)
    : 0.0001;  // Standard road width

  const affectedBuildings = findAffectedBuildings(routeCoordinates, buildings, roadWidth);

  // Calculate impact for each building
  const buildingImpacts = affectedBuildings.map(calculateBuildingImpact);

  // Aggregate costs
  const totalDemolitionCost = buildingImpacts.reduce((sum, b) => sum + b.demolitionCost, 0);
  const totalRelocationCost = buildingImpacts.reduce((sum, b) => sum + b.relocationCost, 0);
  const administrativeCost = (totalDemolitionCost + totalRelocationCost) * COSTS.administrative;

  // Calculate construction cost
  const routeLength = calculateRouteLength(routeCoordinates);
  const constructionCostPerKm = COSTS.construction[infrastructureType] || COSTS.construction.road;
  const constructionCost = routeLength * constructionCostPerKm;

  // Count affected units by type
  const affectedByType = {
    residential: 0,
    commercial: 0,
    industrial: 0,
    office: 0
  };

  buildingImpacts.forEach(impact => {
    affectedByType[impact.buildingType] = 
      (affectedByType[impact.buildingType] || 0) + impact.unitsAffected;
  });

  // Calculate total project cost
  const totalProjectCost = 
    totalDemolitionCost +
    totalRelocationCost +
    administrativeCost +
    constructionCost;

  return {
    // Summary
    buildingsAffected: affectedBuildings.length,
    buildingsForDemolition: buildingImpacts.filter(b => b.demolitionRequired).length,
    buildingsPartialImpact: buildingImpacts.filter(b => !b.demolitionRequired).length,
    
    // Costs (in INR)
    demolitionCost: totalDemolitionCost,
    relocationCost: totalRelocationCost,
    administrativeCost,
    constructionCost,
    totalCost: totalProjectCost,
    
    // Route details
    routeLength,
    infrastructureType,
    
    // People/businesses affected
    affectedUnits: affectedByType,
    totalUnitsAffected: Object.values(affectedByType).reduce((a, b) => a + b, 0),
    
    // Detailed breakdown
    buildingImpacts,
    affectedBuildings: affectedBuildings.map(ab => ({
      ...ab.building,
      impactDetails: buildingImpacts.find(bi => bi.buildingId === ab.building.id)
    }))
  };
};

/**
 * Estimate traffic improvement for a route
 * Based on route type, length, and connectivity
 */
export const estimateTrafficImprovement = (routeCoordinates, infrastructureType, existingRoads) => {
  const routeLength = calculateRouteLength(routeCoordinates);

  // Base improvement by infrastructure type
  const baseImprovement = {
    road: 0.10,      // 10% improvement for new road
    bridge: 0.25,    // 25% for bridge (avoids congestion)
    flyover: 0.35,   // 35% for flyover (grade separation)
    tunnel: 0.30     // 30% for tunnel (direct route)
  };

  const improvement = baseImprovement[infrastructureType] || 0.10;

  // Length factor (longer routes have more impact)
  const lengthFactor = Math.min(1.5, 1 + (routeLength / 5)); // Cap at 50% bonus

  // Calculate affected road network capacity increase
  const capacityIncrease = improvement * lengthFactor;

  // Estimate vehicles diverted (rough approximation)
  const avgDailyTraffic = 50000; // vehicles/day in corridor
  const vehiclesDiverted = Math.floor(avgDailyTraffic * capacityIncrease);

  // Estimate time savings
  const avgSpeedImprovement = infrastructureType === 'flyover' || infrastructureType === 'tunnel' 
    ? 15  // km/h improvement
    : 10; // km/h improvement

  const timeSavedPerVehicle = (routeLength / avgSpeedImprovement) * 60; // minutes

  return {
    congestionReduction: capacityIncrease * 100, // as percentage
    vehiclesDiverted,
    timeSavedPerVehicle,
    totalTimeSavedDaily: vehiclesDiverted * timeSavedPerVehicle, // vehicle-minutes
    estimatedAnnualBenefit: vehiclesDiverted * timeSavedPerVehicle * 365 * 50 // ₹50/hr average
  };
};

/**
 * Calculate Return on Investment (ROI)
 */
export const calculateROI = (demolitionImpact, trafficImprovement) => {
  const { totalCost } = demolitionImpact;
  const { estimatedAnnualBenefit } = trafficImprovement;

  const paybackPeriod = estimatedAnnualBenefit > 0 
    ? totalCost / estimatedAnnualBenefit 
    : Infinity;

  const roi = estimatedAnnualBenefit > 0
    ? ((estimatedAnnualBenefit * 10 - totalCost) / totalCost) * 100 // 10-year ROI
    : -100;

  return {
    paybackPeriodYears: paybackPeriod,
    roi10Year: roi,
    annualBenefit: estimatedAnnualBenefit,
    feasible: paybackPeriod < 15 && roi > 0 // Feasible if payback < 15 years
  };
};

/**
 * Generate complete route analysis
 */
export const analyzeRoute = (routeCoordinates, infrastructureType, buildings, existingRoads) => {
  const demolitionImpact = calculateDemolitionImpact(routeCoordinates, infrastructureType, buildings);
  const trafficImprovement = estimateTrafficImprovement(routeCoordinates, infrastructureType, existingRoads);
  const roi = calculateROI(demolitionImpact, trafficImprovement);

  return {
    demolition: demolitionImpact,
    traffic: trafficImprovement,
    roi,
    score: calculateRouteScore(demolitionImpact, trafficImprovement, roi)
  };
};

/**
 * Calculate overall route score (0-100)
 * Higher is better
 */
const calculateRouteScore = (demolition, traffic, roi) => {
  // Normalize factors (0-1 scale)
  const costFactor = Math.max(0, 1 - (demolition.totalCost / 100_00_00_000)); // Worse if > ₹100 crore
  const buildingFactor = Math.max(0, 1 - (demolition.buildingsAffected / 50)); // Worse if > 50 buildings
  const trafficFactor = Math.min(1, traffic.congestionReduction / 50); // Better if > 50% improvement
  const roiFactor = roi.feasible ? 1 : 0.3; // Penalty if not feasible

  // Weighted average
  const score = (
    costFactor * 0.3 +
    buildingFactor * 0.3 +
    trafficFactor * 0.25 +
    roiFactor * 0.15
  ) * 100;

  return Math.round(score);
};

/**
 * Format currency in Indian Rupees
 */
export const formatINR = (amount) => {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`; // Crores
  } else if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} L`; // Lakhs
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)} K`; // Thousands
  } else {
    return `₹${amount.toFixed(0)}`;
  }
};

export default {
  calculateDemolitionImpact,
  estimateTrafficImprovement,
  calculateROI,
  analyzeRoute,
  formatINR
};
