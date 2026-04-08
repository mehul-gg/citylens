// Pune Wakad-Hinjewadi Area - Key locations and road network data
// Road geometry sourced from OpenStreetMap (ODbL license)

export const PUNE_CENTER = {
  longitude: 73.7492,
  latitude: 18.5912,
  height: 5000,
};

// Bounding box for the corridor - used to restrict map view
export const CORRIDOR_BOUNDS = {
  southwest: [18.575, 73.72],   // [lat, lng]
  northeast: [18.62, 73.79],    // [lat, lng]
};

// Key junctions in Wakad-Hinjewadi area (real coordinates from OSM)
export const KEY_JUNCTIONS = [
  {
    id: 'wakad-chowk',
    name: 'Wakad Chowk',
    coordinates: [73.7607, 18.5924],  // Near Wakad Flyover
    congestionLevel: 'high',
    avgWaitTime: 12,
    description: 'Major junction - Wakad flyover area'
  },
  {
    id: 'hinjewadi-phase1',
    name: 'Hinjewadi Phase 1 Entry',
    coordinates: [73.7339, 18.5859],
    congestionLevel: 'critical',
    avgWaitTime: 22,
    description: 'IT Park Phase 1 main entry - peak hour bottleneck'
  },
  {
    id: 'hinjewadi-phase2',
    name: 'Hinjewadi Phase 2 Junction',
    coordinates: [73.7323, 18.5940],
    congestionLevel: 'high',
    avgWaitTime: 15,
    description: 'Phase 2 junction - Rajiv Gandhi MIDC Road'
  },
  {
    id: 'dange-chowk',
    name: 'Dange Chowk',
    coordinates: [73.7400, 18.5957],
    congestionLevel: 'medium',
    avgWaitTime: 8,
    description: 'Key intersection on Dange Chowk Road'
  },
  {
    id: 'bypass-junction',
    name: 'NH48 Bypass Junction',
    coordinates: [73.7575, 18.5920],
    congestionLevel: 'high',
    avgWaitTime: 10,
    description: 'NH48 bypass interchange'
  },
  {
    id: 'kaspate-vasti',
    name: 'Kaspate Vasti',
    coordinates: [73.7734, 18.5910],
    congestionLevel: 'medium',
    avgWaitTime: 6,
    description: 'Residential area junction'
  }
];

// Main road segments with REAL geometry from OpenStreetMap
export const ROAD_SEGMENTS = [
  {
    id: 'wakad-flyover',
    name: 'Wakad Flyover',
    osmId: 28726864,
    coordinates: [
      [73.7551657, 18.5920159],
      [73.7559317, 18.5920162],
      [73.7568089, 18.5920148],
      [73.7574691, 18.5920537],
      [73.7582882, 18.5921234],
      [73.7586825, 18.5921769],
      [73.7592544, 18.5922578],
      [73.7600939, 18.5923809]
    ],
    lanes: 2,
    speedLimit: 60,
    currentSpeed: 45,
    trafficDensity: 0.55,
    type: 'flyover',
    isBridge: true
  },
  {
    id: 'hinjewadi-wakad-road',
    name: 'Hinjawadi - Wakad Road',
    osmId: 53199257,
    coordinates: [
      [73.7404388, 18.5911137],
      [73.7410038, 18.5910532],
      [73.7416493, 18.5910135],
      [73.7423034, 18.5910781],
      [73.7435141, 18.5912668],
      [73.7448575, 18.5911739],
      [73.7456239, 18.5911012],
      [73.7470498, 18.5908873],
      [73.7474993, 18.5908199],
      [73.7480450, 18.5908450],
      [73.7486749, 18.5909484],
      [73.7491198, 18.5910025],
      [73.7492476, 18.5910032]
    ],
    lanes: 3,
    speedLimit: 50,
    currentSpeed: 18,
    trafficDensity: 0.88,
    type: 'arterial'
  },
  {
    id: 'wakad-road',
    name: 'Wakad Road',
    osmId: 53199255,
    coordinates: [
      [73.7607678, 18.5924792],
      [73.7611396, 18.5925073],
      [73.7615808, 18.5925210],
      [73.7616930, 18.5925107],
      [73.7623592, 18.5924057],
      [73.7626834, 18.5923675],
      [73.7628419, 18.5923513]
    ],
    lanes: 3,
    speedLimit: 50,
    currentSpeed: 22,
    trafficDensity: 0.78,
    type: 'arterial'
  },
  {
    id: 'dange-chowk-road',
    name: 'Dange Chowk Road',
    osmId: 54936966,
    coordinates: [
      [73.7390074, 18.5915890],
      [73.7390668, 18.5922052],
      [73.7390816, 18.5923261],
      [73.7391028, 18.5925085],
      [73.7390930, 18.5927202],
      [73.7390816, 18.5930030],
      [73.7391403, 18.5932812],
      [73.7392626, 18.5934558],
      [73.7393148, 18.5936274],
      [73.7393718, 18.5939674],
      [73.7394842, 18.5944641],
      [73.7395871, 18.5948668],
      [73.7397479, 18.5953038],
      [73.7398659, 18.5955421],
      [73.7400077, 18.5957013]
    ],
    lanes: 2,
    speedLimit: 40,
    currentSpeed: 28,
    trafficDensity: 0.62,
    type: 'arterial'
  },
  {
    id: 'hinjewadi-phase2-road',
    name: 'Hinjawadi Phase 2 Road',
    osmId: 53348368,
    coordinates: [
      [73.7323344, 18.5939608],
      [73.7324895, 18.5939557],
      [73.7335039, 18.5939222],
      [73.7347046, 18.5938825],
      [73.7351365, 18.5938661],
      [73.7354310, 18.5937688],
      [73.7355308, 18.5936978],
      [73.7365371, 18.5929429],
      [73.7372422, 18.5924135],
      [73.7376991, 18.5920560],
      [73.7383003, 18.5915856],
      [73.7387132, 18.5913231],
      [73.7388641, 18.5912632]
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 20,
    trafficDensity: 0.72,
    type: 'arterial'
  },
  {
    id: 'rajiv-gandhi-midc',
    name: 'Rajiv Gandhi MIDC Road',
    osmId: 60975032,
    coordinates: [
      [73.7338478, 18.5862635],
      [73.7336400, 18.5865576],
      [73.7334955, 18.5868011],
      [73.7330760, 18.5881894],
      [73.7327371, 18.5893106],
      [73.7327331, 18.5895250],
      [73.7329563, 18.5902809],
      [73.7330652, 18.5908547],
      [73.7328301, 18.5918551],
      [73.7326287, 18.5926795],
      [73.7323512, 18.5938354],
      [73.7323344, 18.5939608]
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 22,
    trafficDensity: 0.68,
    type: 'arterial'
  },
  {
    id: 'hinjewadi-phase1-road',
    name: 'Hinjawadi Phase 1 Road',
    osmId: 60975324,
    coordinates: [
      [73.7351920, 18.5860522],
      [73.7349844, 18.5860030],
      [73.7347651, 18.5859786],
      [73.7345665, 18.5859713],
      [73.7344230, 18.5859556],
      [73.7339428, 18.5858839]
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 15,
    trafficDensity: 0.82,
    type: 'arterial'
  },
  {
    id: 'nh48-bypass-north',
    name: 'NH48 Katraj-Dehu Bypass',
    osmId: 52875674,
    coordinates: [
      [73.7646604, 18.5718772],
      [73.7645762, 18.5721021],
      [73.7642285, 18.5730308],
      [73.7638029, 18.5741799],
      [73.7634482, 18.5751374],
      [73.7627480, 18.5770276],
      [73.7610287, 18.5816291],
      [73.7595288, 18.5855892]
    ],
    lanes: 3,
    speedLimit: 80,
    currentSpeed: 55,
    trafficDensity: 0.45,
    type: 'highway'
  },
  {
    id: 'kaspate-vasti-road',
    name: 'Kaspate Vasti Road',
    osmId: 54937122,
    coordinates: [
      [73.7733601, 18.5904252],
      [73.7733640, 18.5906143],
      [73.7733782, 18.5910555],
      [73.7733874, 18.5913393],
      [73.7734056, 18.5916112],
      [73.7734129, 18.5918105]
    ],
    lanes: 2,
    speedLimit: 40,
    currentSpeed: 32,
    trafficDensity: 0.52,
    type: 'local'
  },
  {
    id: 'blue-ridge-road',
    name: 'Blue Ridge Road, Phase 1',
    osmId: 60976071,
    coordinates: [
      [73.7339082, 18.5858409],
      [73.7338578, 18.5856808],
      [73.7338343, 18.5856026],
      [73.7338467, 18.5854836],
      [73.7339127, 18.5853615],
      [73.7341501, 18.5851740],
      [73.7344001, 18.5849927],
      [73.7349188, 18.5846303],
      [73.7352894, 18.5843854]
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 25,
    trafficDensity: 0.48,
    type: 'local'
  },
  // === CONNECTOR ROADS (added for network continuity) ===
  {
    id: 'wakad-flyover-to-road-connector',
    name: 'Wakad Junction Connector',
    coordinates: [
      [73.7600939, 18.5923809],  // End of Wakad Flyover
      [73.7607678, 18.5924792]   // Start of Wakad Road
    ],
    lanes: 2,
    speedLimit: 40,
    currentSpeed: 35,
    trafficDensity: 0.60,
    type: 'arterial',
    isConnector: true
  },
  {
    id: 'dange-to-phase2-connector',
    name: 'Dange Chowk to Phase 2 Connector',
    coordinates: [
      [73.7388641, 18.5912632],  // End of Phase 2 Road
      [73.7390074, 18.5915890]   // Start of Dange Chowk Road
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 25,
    trafficDensity: 0.65,
    type: 'arterial',
    isConnector: true
  },
  {
    id: 'phase2-to-hinjewadi-wakad-connector',
    name: 'Phase 2 to Hinjewadi-Wakad Connector',
    coordinates: [
      [73.7388641, 18.5912632],  // End of Phase 2 Road
      [73.7395, 18.5911],        // Midpoint
      [73.7404388, 18.5911137]   // Start of Hinjewadi-Wakad Road
    ],
    lanes: 2,
    speedLimit: 40,
    currentSpeed: 20,
    trafficDensity: 0.75,
    type: 'arterial',
    isConnector: true
  },
  {
    id: 'rajiv-gandhi-to-phase1-connector',
    name: 'MIDC to Phase 1 Connector',
    coordinates: [
      [73.7338478, 18.5862635],  // Start of Rajiv Gandhi MIDC
      [73.7339428, 18.5858839]   // End of Phase 1 Road
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 22,
    trafficDensity: 0.70,
    type: 'arterial',
    isConnector: true
  },
  {
    id: 'rajiv-gandhi-to-blue-ridge-connector',
    name: 'MIDC to Blue Ridge Connector',
    coordinates: [
      [73.7338478, 18.5862635],  // Start of Rajiv Gandhi MIDC
      [73.7339082, 18.5858409]   // Start of Blue Ridge Road
    ],
    lanes: 2,
    speedLimit: 30,
    currentSpeed: 24,
    trafficDensity: 0.55,
    type: 'local',
    isConnector: true
  },
  {
    id: 'hinjewadi-wakad-to-flyover-connector',
    name: 'Hinjewadi-Wakad to Flyover Connector',
    coordinates: [
      [73.7492476, 18.5910032],  // End of Hinjewadi-Wakad Road
      [73.7510, 18.5913],        // Midpoint  
      [73.7530, 18.5917],        // Midpoint
      [73.7551657, 18.5920159]   // Start of Wakad Flyover
    ],
    lanes: 3,
    speedLimit: 50,
    currentSpeed: 30,
    trafficDensity: 0.82,
    type: 'arterial',
    isConnector: true
  }
];

// Traffic simulation data
export const TRAFFIC_DATA = {
  peakMorning: { start: 8, end: 11, multiplier: 2.5 },
  peakEvening: { start: 17, end: 21, multiplier: 2.8 },
  offPeak: { multiplier: 1.0 },
  baseVehiclesPerHour: 3500,
};

// Realistic Pune Wakad-Hinjewadi traffic patterns (based on real data)
// Hourly traffic multipliers (0-23 hours)
export const HOURLY_TRAFFIC_PATTERNS = {
  // Weekday patterns
  weekday: [
    0.15, 0.10, 0.08, 0.08, 0.12, 0.25, // 0-5: Night/early morning
    0.55, 0.85, 1.00, 0.95, 0.75, 0.60, // 6-11: Morning rush
    0.55, 0.50, 0.55, 0.60, 0.75, 0.95, // 12-17: Afternoon
    1.00, 0.98, 0.85, 0.65, 0.45, 0.25  // 18-23: Evening rush & night
  ],
  // Weekend patterns
  weekend: [
    0.12, 0.08, 0.06, 0.06, 0.08, 0.15, // 0-5
    0.30, 0.45, 0.55, 0.65, 0.75, 0.80, // 6-11
    0.75, 0.70, 0.65, 0.60, 0.55, 0.60, // 12-17
    0.65, 0.55, 0.45, 0.35, 0.25, 0.18  // 18-23
  ]
};

// Realistic AQI patterns for Pune (seasonal + time-based)
export const AQI_PATTERNS = {
  // Base AQI by month (1-12)
  monthly: [145, 138, 125, 110, 95, 85, 75, 72, 78, 105, 135, 155],
  // Hourly variation multiplier
  hourly: [
    0.85, 0.82, 0.80, 0.78, 0.80, 0.88, // 0-5
    1.05, 1.15, 1.20, 1.15, 1.05, 0.95, // 6-11
    0.90, 0.88, 0.90, 0.95, 1.05, 1.18, // 12-17
    1.22, 1.15, 1.05, 0.95, 0.90, 0.87  // 18-23
  ]
};

// Get current traffic metrics based on time
export const getRealtimeMetrics = (date = new Date()) => {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  const pattern = isWeekend ? HOURLY_TRAFFIC_PATTERNS.weekend : HOURLY_TRAFFIC_PATTERNS.weekday;
  const trafficMultiplier = pattern[hour];
  
  // Calculate metrics
  const baseVehicles = 285000;
  const peakHourVehicles = Math.round(baseVehicles * trafficMultiplier);
  
  // Travel time increases with traffic (base 10 min, up to 35 min in peak)
  const baseTravelTime = 10;
  const travelTime = Math.round(baseTravelTime + (trafficMultiplier * 25));
  
  // Congestion index (0-100)
  const congestionIndex = Math.round(trafficMultiplier * 95);
  
  // Average speed inversely related to congestion
  const avgSpeed = Math.round(50 - (trafficMultiplier * 35)); // 15-50 km/h range
  
  return {
    timestamp: date.toISOString(),
    hour,
    isWeekend,
    isPeakHour: trafficMultiplier > 0.85,
    trafficMultiplier: Math.round(trafficMultiplier * 100) / 100,
    metrics: {
      avgTravelTime: travelTime,
      congestionIndex: Math.min(100, congestionIndex),
      dailyVehicles: peakHourVehicles,
      avgSpeed,
      fuelWasted: Math.round(trafficMultiplier * 1200), // Liters per hour wasted in traffic
      co2Emissions: Math.round(trafficMultiplier * 2800), // kg CO2 per hour
      productivityLoss: Math.round(trafficMultiplier * 45), // Lakhs per hour
      accidentRisk: trafficMultiplier > 0.9 ? 'High' : trafficMultiplier > 0.6 ? 'Medium' : 'Low'
    }
  };
};

// Get road-specific metrics based on time
export const getRoadMetrics = (roadId, date = new Date()) => {
  const baseMetrics = getRealtimeMetrics(date);
  const road = ROAD_SEGMENTS.find(r => r.id === roadId);
  
  if (!road) return null;
  
  // Adjust based on road type
  const typeMultiplier = {
    highway: 0.7,
    flyover: 0.6,
    arterial: 1.0,
    local: 0.8
  }[road.type] || 1.0;
  
  const adjustedDensity = Math.min(1, road.trafficDensity * baseMetrics.trafficMultiplier * typeMultiplier);
  const adjustedSpeed = Math.round(road.speedLimit * (1 - adjustedDensity * 0.7));
  
  return {
    ...road,
    currentDensity: adjustedDensity,
    currentSpeed: Math.max(5, adjustedSpeed),
    waitTime: Math.round(adjustedDensity * 15),
    isPeakCongestion: adjustedDensity > 0.85
  };
};

// Proposed infrastructure scenarios (aligned with real road network)
export const PROPOSED_INFRASTRUCTURE = [
  {
    id: 'proposed-flyover-1',
    name: 'Wakad-Hinjewadi Elevated Corridor',
    type: 'flyover',
    status: 'proposed',
    coordinates: [
      [73.7607678, 18.5924792],  // Starts at Wakad Road
      [73.7574691, 18.5920537],
      [73.7540000, 18.5915000],
      [73.7492476, 18.5910032],
      [73.7456239, 18.5911012],
      [73.7404388, 18.5911137],  // Connects to Hinjewadi-Wakad Road
      [73.7388641, 18.5912632]   // Ends at Phase 2
    ],
    estimatedCost: 450,
    estimatedTimeReduction: 58,
    constructionTime: 24,
    description: 'Elevated corridor bypassing all ground-level junctions'
  },
  {
    id: 'proposed-underpass-1',
    name: 'Dange Chowk Underpass',
    type: 'tunnel',
    status: 'approved',
    coordinates: [
      [73.7400077, 18.5957013],
      [73.7393718, 18.5939674],
      [73.7390074, 18.5915890]
    ],
    estimatedCost: 180,
    estimatedTimeReduction: 35,
    constructionTime: 18,
    description: 'Underground bypass at Dange Chowk junction'
  },
  {
    id: 'proposed-bridge-1',
    name: 'Phase 1-2 Connector Bridge',
    type: 'bridge',
    status: 'proposed',
    coordinates: [
      [73.7339428, 18.5858839],
      [73.7323344, 18.5939608]
    ],
    estimatedCost: 120,
    estimatedTimeReduction: 25,
    constructionTime: 12,
    description: 'Direct elevated connection between Phase 1 and Phase 2'
  }
];

// Government services data
export const GOVT_SERVICES = {
  pwd: {
    name: 'Public Works Department',
    projects: [
      { id: 'pwd-1', name: 'Road widening near Wakad Chowk', status: 'ongoing', completion: 65 },
      { id: 'pwd-2', name: 'Drainage improvement Hinjewadi', status: 'planned', completion: 0 },
      { id: 'pwd-3', name: 'Footpath construction Phase 1', status: 'completed', completion: 100 }
    ]
  },
  traffic: {
    name: 'Traffic Police',
    data: {
      accidentHotspots: [
        { location: [73.7607, 18.5924], severity: 'high', incidents: 23 },
        { location: [73.7339, 18.5859], severity: 'medium', incidents: 12 },
        { location: [73.7400, 18.5957], severity: 'medium', incidents: 8 }
      ],
      signalTimings: [
        { junction: 'wakad-chowk', greenTime: 45, redTime: 90 },
        { junction: 'hinjewadi-phase1', greenTime: 60, redTime: 120 },
        { junction: 'dange-chowk', greenTime: 40, redTime: 80 }
      ]
    }
  },
  msrdc: {
    name: 'Maharashtra State Road Development Corporation',
    projects: [
      { id: 'msrdc-1', name: 'NH48 Service Road Extension', status: 'ongoing', completion: 40 }
    ]
  }
};

// KPI metrics for the corridor
export const CITY_METRICS = {
  avgTravelTime: 22,       // minutes for Wakad to Hinjewadi Phase 2
  congestionIndex: 78,     // out of 100 (higher = worse)
  accidentRate: 2.3,       // per 1000 vehicles
  dailyVehicles: 285000,
  publicTransportShare: 18 // percentage
};

// Color scales for visualization
export const CONGESTION_COLORS = {
  low: '#22c55e',      // Green
  medium: '#eab308',   // Yellow  
  high: '#f97316',     // Orange
  critical: '#ef4444'  // Red
};

export const getCongestionColor = (density) => {
  if (density < 0.3) return CONGESTION_COLORS.low;
  if (density < 0.6) return CONGESTION_COLORS.medium;
  if (density < 0.8) return CONGESTION_COLORS.high;
  return CONGESTION_COLORS.critical;
};

// Helper function to find nearest point on a road segment
export const findNearestPointOnRoad = (point, roads = ROAD_SEGMENTS) => {
  let nearestRoad = null;
  let nearestPoint = null;
  let minDistance = Infinity;
  let nearestSegmentIndex = 0;

  roads.forEach(road => {
    for (let i = 0; i < road.coordinates.length - 1; i++) {
      const start = road.coordinates[i];
      const end = road.coordinates[i + 1];
      
      // Find closest point on this segment
      const result = closestPointOnSegment(point, start, end);
      
      if (result.distance < minDistance) {
        minDistance = result.distance;
        nearestPoint = result.point;
        nearestRoad = road;
        nearestSegmentIndex = i;
      }
    }
  });

  return { road: nearestRoad, point: nearestPoint, distance: minDistance, segmentIndex: nearestSegmentIndex };
};

// Helper: Find closest point on a line segment
const closestPointOnSegment = (point, start, end) => {
  const [px, py] = point;
  const [ax, ay] = start;
  const [bx, by] = end;
  
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  
  const ab2 = abx * abx + aby * aby;
  const ap_ab = apx * abx + apy * aby;
  
  let t = ab2 === 0 ? 0 : ap_ab / ab2;
  t = Math.max(0, Math.min(1, t));
  
  const closestX = ax + t * abx;
  const closestY = ay + t * aby;
  
  const dx = px - closestX;
  const dy = py - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return { point: [closestX, closestY], distance, t };
};

// Snap a point to the nearest road
export const snapToRoad = (point, maxDistance = 0.002) => {
  const result = findNearestPointOnRoad(point);
  if (result.distance <= maxDistance) {
    return { snapped: true, point: result.point, road: result.road };
  }
  return { snapped: false, point: point, road: null };
};
