import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../store/useStore';
import { 
  PUNE_CENTER, 
  CORRIDOR_BOUNDS,
  KEY_JUNCTIONS, 
  ROAD_SEGMENTS, 
  PROPOSED_INFRASTRUCTURE,
  getCongestionColor,
  snapToRoad,
  findNearestPointOnRoad
} from '../data/puneData';
import { calculateInfrastructureImpact } from '../utils/roadGraph';

// Component to set map bounds
const MapBoundsController = () => {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds([
      [CORRIDOR_BOUNDS.southwest[0] - 0.02, CORRIDOR_BOUNDS.southwest[1] - 0.02],
      [CORRIDOR_BOUNDS.northeast[0] + 0.02, CORRIDOR_BOUNDS.northeast[1] + 0.02]
    ]);
    map.setMinZoom(13);
    map.setMaxZoom(18);
  }, [map]);
  
  return null;
};

// Map click handler with road snapping
const MapClickHandler = () => {
  const { isDrawing, addDrawnPoint, trafficSimulationActive } = useStore();
  
  useMapEvents({
    click: (e) => {
      if (isDrawing && !trafficSimulationActive) {
        const clickPoint = [e.latlng.lng, e.latlng.lat];
        const snapResult = snapToRoad(clickPoint, 0.003);
        
        if (snapResult.snapped) {
          addDrawnPoint(snapResult.point);
        } else {
          addDrawnPoint(clickPoint);
        }
      }
    },
  });
  
  return null;
};

// SUMO vehicles from real-time WebSocket
const SUMOVehicles = () => {
  const { simulationVehicles, useSumoVehicles } = useStore();
  
  if (!useSumoVehicles || simulationVehicles.length === 0) {
    return null;
  }
  
  return (
    <>
      {simulationVehicles.map(v => (
        <CircleMarker
          key={v.id}
          center={[v.position[1], v.position[0]]}
          radius={4}
          fillColor={v.speed > 40 ? '#22c55e' : v.speed > 20 ? '#fbbf24' : '#ef4444'}
          fillOpacity={0.95}
          stroke={true}
          color="#ffffff"
          weight={1}
        >
          <Popup>
            <div className="text-xs">
              <strong>{v.id}</strong>
              <div>Speed: {v.speed} km/h</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

// Improved vehicle animation with realistic movement along connected roads
const AnimatedVehicles = ({ roads, userScenarios }) => {
  const [vehicles, setVehicles] = useState([]);
  const { trafficSimulationActive, useSumoVehicles } = useStore();
  const animationRef = useRef(null);
  const vehicleDataRef = useRef([]);

  // Focus on main corridor roads only (filter by importance)
  const mainRoads = useMemo(() => {
    // Only use main highways and arterial roads, skip smaller local roads
    return roads.filter(road => 
      road.type === 'highway' || 
      road.type === 'arterial' || 
      road.type === 'flyover' ||
      road.name.includes('NH48') ||
      road.name.includes('Wakad') ||
      road.name.includes('Hinjewadi')
    );
  }, [roads]);

  // Build road network graph for routing
  const roadNetwork = useMemo(() => {
    const allRoads = [...mainRoads, ...userScenarios.map((s, i) => ({
      id: `user-${s.id || i}`,
      coordinates: s.coordinates,
      trafficDensity: 0.3,
      currentSpeed: 40,
      speedLimit: 50,
      type: s.type
    }))];
    
    // Create connection points between roads
    const connections = new Map();
    
    allRoads.forEach(road => {
      const startKey = `${road.coordinates[0][0].toFixed(4)},${road.coordinates[0][1].toFixed(4)}`;
      const endKey = `${road.coordinates[road.coordinates.length-1][0].toFixed(4)},${road.coordinates[road.coordinates.length-1][1].toFixed(4)}`;
      
      if (!connections.has(startKey)) connections.set(startKey, []);
      if (!connections.has(endKey)) connections.set(endKey, []);
      
      connections.get(startKey).push({ road, isStart: true });
      connections.get(endKey).push({ road, isStart: false });
    });
    
    return { roads: allRoads, connections };
  }, [mainRoads, userScenarios]);

  // Initialize vehicles
  useEffect(() => {
    if (!trafficSimulationActive || useSumoVehicles) {
      setVehicles([]);
      vehicleDataRef.current = [];
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // Create initial vehicles distributed across main roads only
    const initialVehicles = [];
    const allRoads = roadNetwork.roads;
    
    allRoads.forEach(road => {
      // Fewer vehicles overall, more realistic
      const numVehicles = Math.max(1, Math.floor(road.trafficDensity * 5));
      
      for (let i = 0; i < numVehicles; i++) {
        const progress = i / numVehicles; // Evenly distribute
        // Speed based on road conditions
        const baseSpeed = (road.currentSpeed / road.speedLimit) * 0.00015;
        const speedVariation = 0.8 + Math.random() * 0.4;
        
        initialVehicles.push({
          id: `${road.id}-v-${i}`,
          roadId: road.id,
          progress: progress,
          speed: baseSpeed * speedVariation,
          direction: 1, // Always forward for simplicity
          // Vehicle type affects size/color
          type: Math.random() > 0.8 ? 'truck' : Math.random() > 0.5 ? 'car' : 'bike',
          // Track current road for potential re-routing
          currentRoad: road
        });
      }
    });
    
    vehicleDataRef.current = initialVehicles;
    
    // Animation loop
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = Math.min(currentTime - lastTime, 50); // Cap delta to prevent jumps
      lastTime = currentTime;
      
      const roadMap = new Map(roadNetwork.roads.map(r => [r.id, r]));
      
      // Update vehicle positions
      vehicleDataRef.current = vehicleDataRef.current.map(v => {
        let newProgress = v.progress + (v.speed * deltaTime * v.direction);
        let newDirection = v.direction;
        let newRoadId = v.roadId;
        
        // When reaching end of road, loop back to start (simple approach)
        if (newProgress > 1) {
          newProgress = 0;
        } else if (newProgress < 0) {
          newProgress = 1;
          newDirection = 1;
        }
        
        return { ...v, progress: newProgress, direction: newDirection, roadId: newRoadId };
      });
      
      // Calculate positions
      const positions = vehicleDataRef.current.map(v => {
        const road = roadMap.get(v.roadId);
        if (!road || !road.coordinates || road.coordinates.length < 2) return null;
        
        const totalLength = road.coordinates.length - 1;
        const exactIndex = Math.max(0, Math.min(v.progress * totalLength, totalLength - 0.01));
        const segmentIndex = Math.floor(exactIndex);
        const segmentProgress = exactIndex - segmentIndex;
        
        const safeIndex = Math.min(segmentIndex, road.coordinates.length - 2);
        const start = road.coordinates[safeIndex];
        const end = road.coordinates[safeIndex + 1];
        
        if (!start || !end) return null;
        
        const lng = start[0] + (end[0] - start[0]) * segmentProgress;
        const lat = start[1] + (end[1] - start[1]) * segmentProgress;
        
        // Calculate heading angle
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
        
        return {
          id: v.id,
          position: [lat, lng],
          speed: road.currentSpeed,
          type: v.type,
          angle: v.direction > 0 ? angle : angle + 180
        };
      }).filter(Boolean);
      
      setVehicles(positions);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trafficSimulationActive, useSumoVehicles, roadNetwork]);

  // Get vehicle color based on speed
  const getVehicleColor = (speed, type) => {
    if (type === 'truck') return '#60a5fa'; // Blue for trucks
    if (speed > 40) return '#22c55e';
    if (speed > 20) return '#fbbf24';
    return '#ef4444';
  };

  // Get vehicle size based on type
  const getVehicleSize = (type) => {
    switch (type) {
      case 'truck': return 5;
      case 'car': return 3.5;
      case 'bike': return 2.5;
      default: return 3;
    }
  };

  return (
    <>
      {vehicles.map(v => (
        <CircleMarker
          key={v.id}
          center={v.position}
          radius={getVehicleSize(v.type)}
          fillColor={getVehicleColor(v.speed, v.type)}
          fillOpacity={0.9}
          stroke={v.type === 'truck'}
          color="#ffffff"
          weight={v.type === 'truck' ? 1 : 0}
        />
      ))}
    </>
  );
};

// Road network with smooth connections
const RoadNetwork = ({ roads, onRoadClick }) => {
  // Convert [lng, lat] to [lat, lng] for Leaflet
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  return (
    <>
      {/* Road shadow/outline for depth effect */}
      {roads.map(road => (
        <Polyline
          key={`shadow-${road.id}-${road.trafficDensity}`}
          positions={toLatLng(road.coordinates)}
          color="#000000"
          weight={(road.type === 'highway' ? 8 : road.type === 'flyover' ? 7 : road.lanes * 2) + 2}
          opacity={0.3}
          lineCap="round"
          lineJoin="round"
        />
      ))}
      
      {/* Main road lines */}
      {roads.map(road => (
        <Polyline
          key={`${road.id}-${Math.round(road.trafficDensity * 100)}`}
          positions={toLatLng(road.coordinates)}
          color={getCongestionColor(road.trafficDensity)}
          weight={road.type === 'highway' ? 8 : road.type === 'flyover' ? 7 : road.lanes * 2}
          opacity={0.9}
          lineCap="round"
          lineJoin="round"
          eventHandlers={{
            click: () => onRoadClick(road)
          }}
        >
          <Popup className="road-popup">
            <div className="text-sm p-1">
              <strong className="text-base">{road.name}</strong>
              {road.isBridge && <span className="ml-2 text-purple-400 text-xs">(Flyover)</span>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <span className="text-slate-400">Speed:</span>
                <span className="font-medium">{road.currentSpeed}/{road.speedLimit} km/h</span>
                <span className="text-slate-400">Lanes:</span>
                <span className="font-medium">{road.lanes}</span>
                <span className="text-slate-400">Congestion:</span>
                <span className="font-medium" style={{ color: getCongestionColor(road.trafficDensity) }}>
                  {Math.round(road.trafficDensity * 100)}%
                </span>
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}
      
      {/* Road center line for highways */}
      {roads.filter(r => r.type === 'highway' || r.lanes >= 3).map(road => (
        <Polyline
          key={`center-${road.id}-${road.trafficDensity}`}
          positions={toLatLng(road.coordinates)}
          color="#ffffff"
          weight={1}
          opacity={0.3}
          dashArray="10, 15"
          lineCap="round"
          lineJoin="round"
        />
      ))}
    </>
  );
};

// Junction markers without animation glitches
const JunctionMarkers = ({ junctions, onJunctionClick }) => {
  const getJunctionColor = (level) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#64748b';
    }
  };

  return (
    <>
      {/* Outer glow for critical junctions - static, no animation */}
      {junctions.filter(j => j.congestionLevel === 'critical').map(junction => (
        <CircleMarker
          key={`glow-${junction.id}`}
          center={[junction.coordinates[1], junction.coordinates[0]]}
          radius={18}
          fillColor="#ef4444"
          fillOpacity={0.2}
          stroke={false}
        />
      ))}
      
      {/* Main junction markers */}
      {junctions.map(junction => (
        <CircleMarker
          key={junction.id}
          center={[junction.coordinates[1], junction.coordinates[0]]}
          radius={junction.congestionLevel === 'critical' ? 12 : 9}
          fillColor={getJunctionColor(junction.congestionLevel)}
          fillOpacity={0.9}
          color="#ffffff"
          weight={2}
          eventHandlers={{
            click: () => onJunctionClick(junction)
          }}
        >
          <Popup>
            <div className="text-sm p-1">
              <strong className="text-base">{junction.name}</strong>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Wait Time:</span>
                  <span className="font-medium">{junction.avgWaitTime} min</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Status:</span>
                  <span 
                    className="font-medium px-2 py-0.5 rounded text-white text-xs"
                    style={{ backgroundColor: getJunctionColor(junction.congestionLevel) }}
                  >
                    {junction.congestionLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{junction.description}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

// Road connection markers - show where roads connect
const RoadConnectionMarkers = ({ roads }) => {
  const connections = React.useMemo(() => {
    const foundConnections = [];
    const CONNECTION_THRESHOLD = 200; // meters
    
    const distance = (coord1, coord2) => {
      const R = 6371000; // Earth radius in meters
      const lat1 = coord1[1] * Math.PI / 180;
      const lat2 = coord2[1] * Math.PI / 180;
      const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
      const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    for (let i = 0; i < roads.length; i++) {
      const road1 = roads[i];
      const road1End = road1.coordinates[road1.coordinates.length - 1];
      
      for (let j = 0; j < roads.length; j++) {
        if (i === j) continue;
        
        const road2 = roads[j];
        const road2Start = road2.coordinates[0];
        const dist = distance(road1End, road2Start);
        
        if (dist < CONNECTION_THRESHOLD) {
          // Calculate midpoint
          const midpoint = [
            (road1End[1] + road2Start[1]) / 2,
            (road1End[0] + road2Start[0]) / 2
          ];
          
          foundConnections.push({
            id: `${road1.id}-${road2.id}`,
            position: midpoint,
            road1: road1.name,
            road2: road2.name,
            distance: Math.round(dist)
          });
        }
      }
    }
    
    return foundConnections;
  }, [roads]);
  
  return (
    <>
      {connections.map(connection => (
        <CircleMarker
          key={connection.id}
          center={connection.position}
          radius={5}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.8,
            weight: 2
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-blue-600 mb-1">Road Connection</div>
              <div className="text-xs space-y-1">
                <div><strong>From:</strong> {connection.road1}</div>
                <div><strong>To:</strong> {connection.road2}</div>
                <div><strong>Gap:</strong> {connection.distance}m</div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

// User-drawn scenarios with better visuals
const UserScenarios = ({ scenarios }) => {
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);
  
  const getInfraColor = (type) => {
    switch (type) {
      case 'flyover': return '#a855f7';
      case 'bridge': return '#06b6d4';
      case 'tunnel': return '#f97316';
      case 'road': return '#84cc16';
      default: return '#ffffff';
    }
  };

  return (
    <>
      {scenarios.map(scenario => (
        <React.Fragment key={scenario.id}>
          {/* Shadow */}
          <Polyline
            positions={toLatLng(scenario.coordinates)}
            color="#000000"
            weight={10}
            opacity={0.3}
            lineCap="round"
            lineJoin="round"
          />
          {/* Main line */}
          <Polyline
            positions={toLatLng(scenario.coordinates)}
            color={getInfraColor(scenario.type)}
            weight={7}
            opacity={0.95}
            lineCap="round"
            lineJoin="round"
          >
            <Popup>
              <div className="text-sm">
                <strong>{scenario.name}</strong>
                <span className="ml-2 text-xs opacity-70">{scenario.type}</span>
              </div>
            </Popup>
          </Polyline>
          {/* Animated dashed overlay for "under construction" effect */}
          <Polyline
            positions={toLatLng(scenario.coordinates)}
            color="#ffffff"
            weight={2}
            opacity={0.5}
            dashArray="8, 12"
            lineCap="round"
            lineJoin="round"
          />
        </React.Fragment>
      ))}
    </>
  );
};

// Need to import React for Fragment
import React from 'react';

const CityMap = () => {
  const { 
    isDrawing, 
    drawingType, 
    drawnPoints,
    selectedLayer,
    setSelectedJunction,
    setSelectedRoad,
    scenarios
  } = useStore();

  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  const getInfraColor = (type) => {
    switch (type) {
      case 'flyover': return '#a855f7';
      case 'bridge': return '#06b6d4';
      case 'tunnel': return '#f97316';
      case 'road': return '#84cc16';
      default: return '#ffffff';
    }
  };

  // Memoize sorted roads for rendering (highways on bottom), with infrastructure impact
  const sortedRoads = useMemo(() => {
    // Apply infrastructure impact from user scenarios
    const impactedRoads = scenarios.length > 0 
      ? calculateInfrastructureImpact(scenarios, ROAD_SEGMENTS)
      : ROAD_SEGMENTS;
    
    // Sort by type for rendering order
    return [...impactedRoads].sort((a, b) => {
      const order = { highway: 0, arterial: 1, local: 2, flyover: 3 };
      return (order[a.type] || 0) - (order[b.type] || 0);
    });
  }, [scenarios]);

  return (
    <div className="w-full h-full relative">
      {/* Drawing mode indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">Drawing {drawingType}:</span> 
          <span>Click on map to add points ({drawnPoints.length} added)</span>
        </div>
      )}
      
      <MapContainer
        center={[PUNE_CENTER.latitude, PUNE_CENTER.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapBoundsController />
        
        {/* Dark tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler />

        {/* Road Network with smooth rendering */}
        {(selectedLayer === 'traffic' || selectedLayer === 'all') && (
          <RoadNetwork roads={sortedRoads} onRoadClick={setSelectedRoad} />
        )}

        {/* Junction markers - fixed, no animation glitch */}
        {(selectedLayer === 'traffic' || selectedLayer === 'all') && (
          <JunctionMarkers junctions={KEY_JUNCTIONS} onJunctionClick={setSelectedJunction} />
        )}

        {/* Road connection markers - show where roads connect */}
        {(selectedLayer === 'traffic' || selectedLayer === 'all') && (
          <RoadConnectionMarkers roads={sortedRoads} />
        )}

         {/* Animated Vehicles - now uses user scenarios too and updated roads with traffic impact */}
         <AnimatedVehicles roads={sortedRoads} userScenarios={scenarios} />
        
        {/* SUMO Vehicles */}
        <SUMOVehicles />

        {/* Proposed Infrastructure */}
        {(selectedLayer === 'infrastructure' || selectedLayer === 'all') &&
          PROPOSED_INFRASTRUCTURE.map(infra => (
            <React.Fragment key={infra.id}>
              <Polyline
                positions={toLatLng(infra.coordinates)}
                color="#000000"
                weight={10}
                opacity={0.2}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                positions={toLatLng(infra.coordinates)}
                color={getInfraColor(infra.type)}
                weight={8}
                opacity={0.85}
                dashArray="15, 10"
                lineCap="round"
                lineJoin="round"
              >
                <Popup>
                  <div className="text-sm p-1">
                    <strong className="text-base">{infra.name}</strong>
                    <span 
                      className="ml-2 text-xs px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: getInfraColor(infra.type) + '30',
                        color: getInfraColor(infra.type)
                      }}
                    >
                      {infra.type.toUpperCase()}
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <span className="text-slate-400">Est. Cost:</span>
                      <span className="font-medium">₹{infra.estimatedCost} Cr</span>
                      <span className="text-slate-400">Time Saved:</span>
                      <span className="font-medium text-green-400">-{infra.estimatedTimeReduction}%</span>
                      <span className="text-slate-400">Status:</span>
                      <span className="font-medium capitalize">{infra.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{infra.description}</p>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          ))
        }

        {/* User-drawn scenarios with vehicles */}
        <UserScenarios scenarios={scenarios} />

        {/* Drawing points */}
        {isDrawing && drawnPoints.map((point, idx) => (
          <CircleMarker
            key={`draw-${idx}`}
            center={[point[1], point[0]]}
            radius={8}
            fillColor="#22c55e"
            fillOpacity={1}
            color="#ffffff"
            weight={3}
          >
            <Popup>Point {idx + 1}</Popup>
          </CircleMarker>
        ))}

        {/* Drawing line connecting points */}
        {isDrawing && drawnPoints.length >= 2 && (
          <>
            <Polyline
              positions={toLatLng(drawnPoints)}
              color="#000000"
              weight={8}
              opacity={0.3}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              positions={toLatLng(drawnPoints)}
              color={getInfraColor(drawingType)}
              weight={6}
              opacity={0.95}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default CityMap;
