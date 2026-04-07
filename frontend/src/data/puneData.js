// Pune Wakad-Hinjewadi Area - Key locations and road network data

export const PUNE_CENTER = {
  longitude: 73.7358,
  latitude: 18.5913,
  height: 5000, // Camera altitude in meters
};

// Key junctions in Wakad-Hinjewadi area
export const KEY_JUNCTIONS = [
  {
    id: 'wakad-junction',
    name: 'Wakad Chowk',
    coordinates: [73.7625, 18.5987],
    congestionLevel: 'high',
    avgWaitTime: 12, // minutes
    description: 'Major junction connecting Wakad to Hinjewadi IT Park'
  },
  {
    id: 'hinjewadi-junction',
    name: 'Hinjewadi Phase 1 Entry',
    coordinates: [73.7168, 18.5913],
    congestionLevel: 'critical',
    avgWaitTime: 22,
    description: 'IT Park main entry - peak hour bottleneck'
  },
  {
    id: 'dange-chowk',
    name: 'Dange Chowk',
    coordinates: [73.7723, 18.6087],
    congestionLevel: 'medium',
    avgWaitTime: 8,
    description: 'Connecting road to Baner and Balewadi'
  },
  {
    id: 'mann-junction',
    name: 'Mann Gaon Junction',
    coordinates: [73.7012, 18.5856],
    congestionLevel: 'medium',
    avgWaitTime: 6,
    description: 'Alternative route junction'
  },
  {
    id: 'marunji',
    name: 'Marunji Junction',
    coordinates: [73.7245, 18.5678],
    congestionLevel: 'low',
    avgWaitTime: 3,
    description: 'New bypass road intersection'
  }
];

// Main road segments
export const ROAD_SEGMENTS = [
  {
    id: 'road-1',
    name: 'Mumbai-Bangalore Highway (NH48)',
    coordinates: [
      [73.7923, 18.6087],
      [73.7625, 18.5987],
      [73.7168, 18.5913],
      [73.6812, 18.5789]
    ],
    lanes: 6,
    speedLimit: 80,
    currentSpeed: 25, // During peak hours
    trafficDensity: 0.85,
    type: 'highway'
  },
  {
    id: 'road-2',
    name: 'Wakad-Hinjewadi Road',
    coordinates: [
      [73.7625, 18.5987],
      [73.7456, 18.5934],
      [73.7245, 18.5913],
      [73.7168, 18.5913]
    ],
    lanes: 4,
    speedLimit: 60,
    currentSpeed: 15,
    trafficDensity: 0.92,
    type: 'arterial'
  },
  {
    id: 'road-3',
    name: 'Dange Chowk Road',
    coordinates: [
      [73.7723, 18.6087],
      [73.7625, 18.5987]
    ],
    lanes: 4,
    speedLimit: 50,
    currentSpeed: 30,
    trafficDensity: 0.65,
    type: 'arterial'
  },
  {
    id: 'road-4',
    name: 'Hinjewadi Phase 2 Road',
    coordinates: [
      [73.7168, 18.5913],
      [73.7089, 18.5823],
      [73.7012, 18.5856]
    ],
    lanes: 4,
    speedLimit: 50,
    currentSpeed: 35,
    trafficDensity: 0.55,
    type: 'arterial'
  },
  {
    id: 'road-5',
    name: 'Marunji Bypass',
    coordinates: [
      [73.7012, 18.5856],
      [73.7123, 18.5745],
      [73.7245, 18.5678]
    ],
    lanes: 2,
    speedLimit: 40,
    currentSpeed: 38,
    trafficDensity: 0.25,
    type: 'local'
  }
];

// Traffic simulation data - vehicles per hour
export const TRAFFIC_DATA = {
  peakMorning: { start: 8, end: 11, multiplier: 2.5 },
  peakEvening: { start: 17, end: 21, multiplier: 2.8 },
  offPeak: { multiplier: 1.0 },
  baseVehiclesPerHour: 3500,
};

// Proposed infrastructure scenarios
export const PROPOSED_INFRASTRUCTURE = [
  {
    id: 'proposed-flyover-1',
    name: 'Wakad-Hinjewadi Flyover',
    type: 'flyover',
    status: 'proposed',
    coordinates: [
      [73.7625, 18.5987],
      [73.7456, 18.5950],
      [73.7245, 18.5913]
    ],
    estimatedCost: 450, // Crores INR
    estimatedTimeReduction: 58, // percentage
    constructionTime: 24, // months
    description: 'Elevated corridor bypassing Wakad junction'
  },
  {
    id: 'proposed-bridge-1',
    name: 'Mula River Bridge Extension',
    type: 'bridge',
    status: 'proposed',
    coordinates: [
      [73.7089, 18.5823],
      [73.6978, 18.5756]
    ],
    estimatedCost: 120,
    estimatedTimeReduction: 35,
    constructionTime: 18,
    description: 'New bridge connecting Phase 2 to Mann village'
  },
  {
    id: 'proposed-tunnel-1',
    name: 'Hinjewadi Underground Bypass',
    type: 'tunnel',
    status: 'concept',
    coordinates: [
      [73.7723, 18.6087],
      [73.7456, 18.5934],
      [73.7168, 18.5913]
    ],
    estimatedCost: 890,
    estimatedTimeReduction: 72,
    constructionTime: 48,
    description: 'Underground bypass for heavy vehicles'
  }
];

// Government services data (mock)
export const GOVT_SERVICES = {
  pwd: {
    name: 'Public Works Department',
    projects: [
      { id: 'pwd-1', name: 'Road widening near Wakad', status: 'ongoing', completion: 65 },
      { id: 'pwd-2', name: 'Drainage repair Hinjewadi', status: 'planned', completion: 0 },
      { id: 'pwd-3', name: 'Footpath construction', status: 'completed', completion: 100 }
    ]
  },
  traffic: {
    name: 'Traffic Police',
    data: {
      accidentHotspots: [
        { location: [73.7625, 18.5987], severity: 'high', incidents: 23 },
        { location: [73.7168, 18.5913], severity: 'medium', incidents: 12 }
      ],
      signalTimings: [
        { junction: 'wakad-junction', greenTime: 45, redTime: 90 },
        { junction: 'hinjewadi-junction', greenTime: 60, redTime: 120 }
      ]
    }
  },
  msrdc: {
    name: 'Maharashtra State Road Development Corporation',
    projects: [
      { id: 'msrdc-1', name: 'NH48 Expansion', status: 'ongoing', completion: 40 }
    ]
  }
};

// KPI metrics
export const CITY_METRICS = {
  avgTravelTime: 22, // minutes for 5km stretch
  congestionIndex: 78, // out of 100 (higher = worse)
  accidentRate: 2.3, // per 1000 vehicles
  airQualityIndex: 156, // AQI
  dailyVehicles: 285000,
  publicTransportShare: 18, // percentage
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
