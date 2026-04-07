import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../store/useStore';
import { 
  PUNE_CENTER, 
  KEY_JUNCTIONS, 
  ROAD_SEGMENTS, 
  PROPOSED_INFRASTRUCTURE,
  getCongestionColor 
} from '../data/puneData';

// Map click handler component
const MapClickHandler = () => {
  const { isDrawing, addDrawnPoint } = useStore();
  
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        addDrawnPoint([e.latlng.lng, e.latlng.lat]);
      }
    },
  });
  
  return null;
};

// Vehicle animation component
const AnimatedVehicles = ({ roads }) => {
  const [vehicles, setVehicles] = useState([]);
  const { trafficSimulationActive } = useStore();

  useEffect(() => {
    if (!trafficSimulationActive) {
      setVehicles([]);
      return;
    }

    const generateVehicles = () => {
      const newVehicles = [];
      roads.forEach(road => {
        const numVehicles = Math.floor(road.trafficDensity * 10);
        for (let i = 0; i < numVehicles; i++) {
          const progress = Math.random();
          const segmentIndex = Math.floor(progress * (road.coordinates.length - 1));
          const segmentProgress = (progress * (road.coordinates.length - 1)) % 1;
          
          const start = road.coordinates[segmentIndex];
          const end = road.coordinates[Math.min(segmentIndex + 1, road.coordinates.length - 1)];
          
          const lng = start[0] + (end[0] - start[0]) * segmentProgress;
          const lat = start[1] + (end[1] - start[1]) * segmentProgress;
          
          newVehicles.push({
            id: `${road.id}-v-${i}`,
            position: [lat, lng]
          });
        }
      });
      setVehicles(newVehicles);
    };

    generateVehicles();
    const interval = setInterval(generateVehicles, 2000);
    return () => clearInterval(interval);
  }, [trafficSimulationActive, roads]);

  return (
    <>
      {vehicles.map(v => (
        <CircleMarker
          key={v.id}
          center={v.position}
          radius={4}
          fillColor="#fbbf24"
          fillOpacity={0.9}
          stroke={false}
        />
      ))}
    </>
  );
};

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

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  // Get color for infrastructure type
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
    <div className="w-full h-full">
      <MapContainer
        center={[PUNE_CENTER.latitude, PUNE_CENTER.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Dark tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Click handler for drawing */}
        <MapClickHandler />

        {/* Road Segments */}
        {(selectedLayer === 'traffic' || selectedLayer === 'all') &&
          ROAD_SEGMENTS.map(road => (
            <Polyline
              key={road.id}
              positions={toLatLng(road.coordinates)}
              color={getCongestionColor(road.trafficDensity)}
              weight={road.lanes * 2}
              opacity={0.8}
              eventHandlers={{
                click: () => setSelectedRoad(road)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{road.name}</strong><br/>
                  Speed: {road.currentSpeed}/{road.speedLimit} km/h<br/>
                  Lanes: {road.lanes}<br/>
                  Density: {Math.round(road.trafficDensity * 100)}%
                </div>
              </Popup>
            </Polyline>
          ))
        }

        {/* Junctions */}
        {(selectedLayer === 'traffic' || selectedLayer === 'all') &&
          KEY_JUNCTIONS.map(junction => (
            <CircleMarker
              key={junction.id}
              center={[junction.coordinates[1], junction.coordinates[0]]}
              radius={12}
              fillColor={
                junction.congestionLevel === 'critical' ? '#ef4444' :
                junction.congestionLevel === 'high' ? '#f97316' :
                junction.congestionLevel === 'medium' ? '#eab308' : '#22c55e'
              }
              fillOpacity={0.9}
              color="#ffffff"
              weight={2}
              eventHandlers={{
                click: () => setSelectedJunction(junction)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{junction.name}</strong><br/>
                  Wait Time: {junction.avgWaitTime} min<br/>
                  Status: {junction.congestionLevel.toUpperCase()}
                </div>
              </Popup>
            </CircleMarker>
          ))
        }

        {/* Animated Vehicles */}
        <AnimatedVehicles roads={ROAD_SEGMENTS} />

        {/* Proposed Infrastructure */}
        {(selectedLayer === 'infrastructure' || selectedLayer === 'all') &&
          PROPOSED_INFRASTRUCTURE.map(infra => (
            <Polyline
              key={infra.id}
              positions={toLatLng(infra.coordinates)}
              color={getInfraColor(infra.type)}
              weight={6}
              opacity={0.8}
              dashArray="10, 10"
            >
              <Popup>
                <div className="text-sm">
                  <strong>{infra.name}</strong><br/>
                  Type: {infra.type}<br/>
                  Cost: ₹{infra.estimatedCost} Cr<br/>
                  Time Saved: {infra.estimatedTimeReduction}%
                </div>
              </Popup>
            </Polyline>
          ))
        }

        {/* User-drawn scenarios */}
        {scenarios.map(scenario => (
          <Polyline
            key={scenario.id}
            positions={toLatLng(scenario.coordinates)}
            color={getInfraColor(scenario.type)}
            weight={6}
            opacity={0.9}
          >
            <Popup>{scenario.name}</Popup>
          </Polyline>
        ))}

        {/* Drawing points */}
        {isDrawing && drawnPoints.map((point, idx) => (
          <CircleMarker
            key={`draw-${idx}`}
            center={[point[1], point[0]]}
            radius={8}
            fillColor="#22c55e"
            fillOpacity={1}
            color="#ffffff"
            weight={2}
          />
        ))}

        {/* Drawing line */}
        {isDrawing && drawnPoints.length >= 2 && (
          <Polyline
            positions={toLatLng(drawnPoints)}
            color={getInfraColor(drawingType)}
            weight={6}
            opacity={0.9}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default CityMap;
