import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, TrendingDown, Clock, Car } from 'lucide-react';
import useStore from '../store/useStore';
import { 
  PUNE_CENTER, 
  KEY_JUNCTIONS, 
  ROAD_SEGMENTS, 
  PROPOSED_INFRASTRUCTURE,
  getCongestionColor,
  CITY_METRICS
} from '../data/puneData';

const CompareView = () => {
  const { toggleCompareMode } = useStore();
  
  const afterMetrics = {
    avgTravelTime: 9,
    congestionIndex: 45,
    accidentRate: 1.8,
  };

  // Improved road segments after flyover
  const afterRoadSegments = ROAD_SEGMENTS.map(road => ({
    ...road,
    trafficDensity: Math.max(0.1, road.trafficDensity - 0.35),
    currentSpeed: Math.min(road.speedLimit, road.currentSpeed + 25)
  }));

  // Improved junctions after flyover
  const afterJunctions = KEY_JUNCTIONS.map(j => ({
    ...j,
    congestionLevel: (j.id === 'wakad-junction' || j.id === 'hinjewadi-junction') ? 'low' : j.congestionLevel
  }));

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  // Get congestion color for junctions
  const getJunctionColor = (level) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#64748b';
    }
  };

  // Shared map style
  const mapContainerStyle = { height: '100%', width: '100%' };

  return (
    <div className="h-full flex flex-col">
      {/* Compare Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold">Side-by-Side Comparison</h2>
          <span className="text-slate-400">|</span>
          <span className="text-purple-400">Wakad-Hinjewadi Flyover Impact</span>
        </div>
        <button 
          onClick={toggleCompareMode}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Exit Compare
        </button>
      </div>

      {/* Comparison Content */}
      <div className="flex-1 flex">
        {/* Before Panel */}
        <div className="flex-1 border-r border-slate-700 relative">
          <div className="absolute top-4 left-4 z-[1000] glass rounded-lg px-4 py-2">
            <span className="text-red-400 font-bold">BEFORE</span>
            <span className="text-slate-400 ml-2">Current State</span>
          </div>
          
          <div className="absolute bottom-4 left-4 z-[1000] glass rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-slate-400" />
              <span className="text-white">Avg Travel Time:</span>
              <span className="text-red-400 font-bold">{CITY_METRICS.avgTravelTime} min</span>
            </div>
            <div className="flex items-center gap-3">
              <Car size={16} className="text-slate-400" />
              <span className="text-white">Congestion:</span>
              <span className="text-red-400 font-bold">{CITY_METRICS.congestionIndex}%</span>
            </div>
          </div>

          <MapContainer
            center={[PUNE_CENTER.latitude, PUNE_CENTER.longitude]}
            zoom={14}
            style={mapContainerStyle}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Before: Road Segments */}
            {ROAD_SEGMENTS.map(road => (
              <Polyline
                key={`before-${road.id}`}
                positions={toLatLng(road.coordinates)}
                color={getCongestionColor(road.trafficDensity)}
                weight={road.lanes * 2}
                opacity={0.8}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{road.name}</strong><br/>
                    Speed: {road.currentSpeed}/{road.speedLimit} km/h<br/>
                    Density: {Math.round(road.trafficDensity * 100)}%
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Before: Junctions */}
            {KEY_JUNCTIONS.map(junction => (
              <CircleMarker
                key={`before-${junction.id}`}
                center={[junction.coordinates[1], junction.coordinates[0]]}
                radius={12}
                fillColor={getJunctionColor(junction.congestionLevel)}
                fillOpacity={0.9}
                color="#ffffff"
                weight={2}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{junction.name}</strong><br/>
                    Wait Time: {junction.avgWaitTime} min<br/>
                    Status: {junction.congestionLevel.toUpperCase()}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Center Arrow */}
        <div className="w-16 bg-slate-800 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <ArrowRight size={24} className="text-purple-400" />
            <span className="text-xs text-slate-400 text-center">WITH<br/>FLYOVER</span>
          </div>
        </div>

        {/* After Panel */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-[1000] glass rounded-lg px-4 py-2">
            <span className="text-green-400 font-bold">AFTER</span>
            <span className="text-slate-400 ml-2">With Flyover</span>
          </div>
          
          <div className="absolute bottom-4 left-4 z-[1000] glass rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-slate-400" />
              <span className="text-white">Avg Travel Time:</span>
              <span className="text-green-400 font-bold">{afterMetrics.avgTravelTime} min</span>
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 text-sm">-{CITY_METRICS.avgTravelTime - afterMetrics.avgTravelTime} min</span>
            </div>
            <div className="flex items-center gap-3">
              <Car size={16} className="text-slate-400" />
              <span className="text-white">Congestion:</span>
              <span className="text-green-400 font-bold">{afterMetrics.congestionIndex}%</span>
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 text-sm">-{CITY_METRICS.congestionIndex - afterMetrics.congestionIndex}%</span>
            </div>
          </div>

          <MapContainer
            center={[PUNE_CENTER.latitude, PUNE_CENTER.longitude]}
            zoom={14}
            style={mapContainerStyle}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* After: Improved Road Segments */}
            {afterRoadSegments.map(road => (
              <Polyline
                key={`after-${road.id}`}
                positions={toLatLng(road.coordinates)}
                color={getCongestionColor(road.trafficDensity)}
                weight={road.lanes * 2}
                opacity={0.8}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{road.name}</strong><br/>
                    Speed: {road.currentSpeed}/{road.speedLimit} km/h<br/>
                    Density: {Math.round(road.trafficDensity * 100)}%
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* After: Improved Junctions */}
            {afterJunctions.map(junction => (
              <CircleMarker
                key={`after-${junction.id}`}
                center={[junction.coordinates[1], junction.coordinates[0]]}
                radius={12}
                fillColor={getJunctionColor(junction.congestionLevel)}
                fillOpacity={0.9}
                color="#ffffff"
                weight={2}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{junction.name}</strong><br/>
                    Status: {junction.congestionLevel.toUpperCase()}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* After: New Flyover (purple dashed line) */}
            <Polyline
              positions={toLatLng(PROPOSED_INFRASTRUCTURE[0].coordinates)}
              color="#a855f7"
              weight={8}
              opacity={0.9}
              dashArray="10, 5"
            >
              <Popup>
                <div className="text-sm">
                  <strong>{PROPOSED_INFRASTRUCTURE[0].name}</strong><br/>
                  Type: Flyover (NEW)<br/>
                  Cost: ₹{PROPOSED_INFRASTRUCTURE[0].estimatedCost} Cr
                </div>
              </Popup>
            </Polyline>
          </MapContainer>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Travel Time Reduction</p>
            <p className="text-2xl font-bold text-green-400">-59%</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Estimated Cost</p>
            <p className="text-2xl font-bold text-white">₹450 Cr</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Annual Savings</p>
            <p className="text-2xl font-bold text-green-400">₹120 Cr</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Payback Period</p>
            <p className="text-2xl font-bold text-blue-400">3.75 Yrs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
