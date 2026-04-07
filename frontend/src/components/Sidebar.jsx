import { 
  Map, 
  Layers, 
  BarChart3, 
  Play,
  Pause,
  Clock,
  Route,
  AlertTriangle
} from 'lucide-react';
import useStore from '../store/useStore';
import { KEY_JUNCTIONS, CITY_METRICS, ROAD_SEGMENTS } from '../data/puneData';

const Sidebar = () => {
  const { 
    activePanel, 
    setActivePanel, 
    selectedLayer, 
    setSelectedLayer,
    trafficSimulationActive,
    setTrafficSimulation,
    currentHour,
    setCurrentHour,
    selectedJunction,
    selectedRoad,
    sidebarOpen,
    toggleSidebar
  } = useStore();

  const panels = [
    { id: 'overview', icon: Map, label: 'Overview' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const layers = [
    { id: 'traffic', label: 'Traffic Flow', color: 'bg-green-500' },
    { id: 'infrastructure', label: 'Infrastructure', color: 'bg-purple-500' },
    { id: 'govt', label: 'Govt Projects', color: 'bg-blue-500' },
    { id: 'all', label: 'All Layers', color: 'bg-white' },
  ];

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Panel Navigation */}
      <div className="flex border-b border-slate-700">
        {panels.map(panel => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${
              activePanel === panel.id 
                ? 'bg-slate-700 text-blue-400' 
                : 'text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <panel.icon size={20} />
            <span className="text-xs">{panel.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Panel */}
        {activePanel === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">City Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Avg Travel Time</p>
                <p className="text-2xl font-bold text-white">{CITY_METRICS.avgTravelTime} min</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Congestion Index</p>
                <p className="text-2xl font-bold text-orange-400">{CITY_METRICS.congestionIndex}/100</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Daily Vehicles</p>
                <p className="text-2xl font-bold text-white">{(CITY_METRICS.dailyVehicles / 1000).toFixed(0)}K</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Air Quality</p>
                <p className="text-2xl font-bold text-red-400">{CITY_METRICS.airQualityIndex}</p>
              </div>
            </div>

            {/* Traffic Simulation Control */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Route size={16} />
                  Traffic Simulation
                </h3>
                <button
                  onClick={() => setTrafficSimulation(!trafficSimulationActive)}
                  className={`p-2 rounded-lg ${trafficSimulationActive ? 'bg-green-600' : 'bg-slate-600'}`}
                >
                  {trafficSimulationActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={currentHour}
                  onChange={(e) => setCurrentHour(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-16 text-right">
                  {currentHour.toString().padStart(2, '0')}:00
                </span>
              </div>
            </div>

            {/* Selected Junction Info */}
            {selectedJunction && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">{selectedJunction.name}</h3>
                <p className="text-slate-400 text-sm mb-2">{selectedJunction.description}</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Wait Time</p>
                    <p className="text-white font-semibold">{selectedJunction.avgWaitTime} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Congestion</p>
                    <p className={`font-semibold ${
                      selectedJunction.congestionLevel === 'critical' ? 'text-red-400' :
                      selectedJunction.congestionLevel === 'high' ? 'text-orange-400' :
                      selectedJunction.congestionLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {selectedJunction.congestionLevel.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hotspots */}
            <div>
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                Congestion Hotspots
              </h3>
              <div className="space-y-2">
                {KEY_JUNCTIONS.filter(j => j.congestionLevel === 'critical' || j.congestionLevel === 'high').map(junction => (
                  <div 
                    key={junction.id}
                    className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm">{junction.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        junction.congestionLevel === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {junction.avgWaitTime} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layers Panel */}
        {activePanel === 'layers' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Map Layers</h2>
            
            <div className="space-y-2">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedLayer === layer.id 
                      ? 'bg-blue-600' 
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${layer.color}`}></div>
                  <span className="text-white">{layer.label}</span>
                </button>
              ))}
            </div>

            {/* Layer Legend */}
            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">Congestion Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Low (0-30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Medium (30-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-orange-500 rounded"></div>
                  <span className="text-slate-300 text-sm">High (60-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Critical (80%+)</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">Infrastructure Types</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-purple-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Flyover</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-cyan-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Bridge</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-orange-400 rounded"></div>
                  <span className="text-slate-300 text-sm">Tunnel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-lime-500 rounded"></div>
                  <span className="text-slate-300 text-sm">Road</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Panel */}
        {activePanel === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Road Analytics</h2>
            
            <div className="space-y-3">
              {ROAD_SEGMENTS.map(road => (
                <div key={road.id} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white text-sm font-medium">{road.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      road.trafficDensity > 0.8 ? 'bg-red-500/20 text-red-400' :
                      road.trafficDensity > 0.6 ? 'bg-orange-500/20 text-orange-400' :
                      road.trafficDensity > 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {Math.round(road.trafficDensity * 100)}% capacity
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        road.trafficDensity > 0.8 ? 'bg-red-500' :
                        road.trafficDensity > 0.6 ? 'bg-orange-500' :
                        road.trafficDensity > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${road.trafficDensity * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Speed: {road.currentSpeed}/{road.speedLimit} km/h</span>
                    <span>Lanes: {road.lanes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
