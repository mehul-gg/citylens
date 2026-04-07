import { 
  Map, 
  Layers, 
  BarChart3, 
  Play,
  Pause,
  Clock,
  Route,
  AlertTriangle,
  Gauge,
  Activity
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
    sidebarOpen,
  } = useStore();

  const panels = [
    { id: 'overview', icon: Map, label: 'Overview' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const layers = [
    { id: 'traffic', label: 'Traffic Flow', color: 'bg-green-500' },
    { id: 'infrastructure', label: 'Infrastructure', color: 'bg-purple-500' },
    { id: 'all', label: 'All Layers', color: 'bg-white' },
  ];

  return (
    <div className="w-80 sidebar-glass flex flex-col h-full z-20">
      {/* App Header */}
      <div className="p-8 pb-6">
        <div className="flex items-center gap-3.5 mb-1.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-blue-500/20 group">
            <Route className="text-white group-hover:scale-110 transition-transform duration-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              City<span className="text-blue-500">Lens</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] mt-1.5 uppercase">Digital Twin</p>
          </div>
        </div>
      </div>

      {/* Panel Navigation */}
      <nav className="px-4 py-2 space-y-1">
        {panels.map(panel => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`w-full nav-item ${
              activePanel === panel.id 
                ? 'nav-item-active' 
                : 'nav-item-inactive'
            }`}
          >
            <panel.icon size={20} strokeWidth={activePanel === panel.id ? 2.5 : 2} />
            <span className="text-sm font-bold tracking-tight">{panel.label}</span>
            {activePanel === panel.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="h-px bg-white/5 mx-8 my-4"></div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
        {/* Overview Panel */}
        {activePanel === 'overview' && (
          <div className="space-y-8 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Live Network</h2>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] text-green-500 font-black uppercase">Active</span>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Travel Time', value: CITY_METRICS.avgTravelTime, unit: 'min', color: 'text-white' },
                { label: 'Congestion', value: CITY_METRICS.congestionIndex, unit: '%', color: 'text-orange-500' },
                { label: 'Vehicles', value: (CITY_METRICS.dailyVehicles / 1000).toFixed(0), unit: 'k', color: 'text-white' },
                { label: 'Air Quality', value: CITY_METRICS.airQualityIndex, unit: 'aqi', color: 'text-red-500' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-4 hover-glow group cursor-default">
                  <p className="text-slate-500 text-[9px] font-black uppercase mb-1.5 group-hover:text-slate-400 transition-colors tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-2xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{stat.unit}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Control Card */}
            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12">
                <Clock size={80} className="text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Clock size={16} className="text-blue-400" />
                  </div>
                  <h3 className="text-blue-100 text-[11px] font-black uppercase tracking-widest">
                    Simulation
                  </h3>
                </div>
                <button
                  onClick={() => setTrafficSimulation(!trafficSimulationActive)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    trafficSimulationActive 
                      ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {trafficSimulationActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal flow</span>
                  <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                    <span className="text-white text-lg font-black font-mono tracking-tighter">
                      {currentHour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={currentHour}
                  onChange={(e) => setCurrentHour(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Selected Junction - Modernized */}
            {selectedJunction && (
              <div className="glass-card p-6 border-l-[6px] border-l-blue-500 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-black text-lg tracking-tight">{selectedJunction.name}</h3>
                  <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    selectedJunction.congestionLevel === 'critical' ? 'bg-red-500/20 text-red-500' :
                    selectedJunction.congestionLevel === 'high' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {selectedJunction.congestionLevel}
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-6 font-medium uppercase tracking-wide opacity-80">{selectedJunction.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Wait Time</p>
                    <p className="text-xl font-black text-white">{selectedJunction.avgWaitTime}<span className="text-[10px] ml-0.5 opacity-50">m</span></p>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Load</p>
                    <Activity size={16} className={
                      selectedJunction.congestionLevel === 'critical' ? 'text-red-500' :
                      selectedJunction.congestionLevel === 'high' ? 'text-orange-500' : 'text-green-500'
                    } />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layers Panel */}
        {activePanel === 'layers' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-4">Visual Layers</h2>
              <div className="grid grid-cols-1 gap-2.5">
                {layers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`group flex items-center justify-between px-5 py-4 rounded-[20px] transition-all duration-500 border-2 ${
                      selectedLayer === layer.id 
                        ? 'bg-blue-600/20 border-blue-500 shadow-2xl shadow-blue-500/20' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${layer.color} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}></div>
                      <span className={`text-sm font-black tracking-tight ${selectedLayer === layer.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        {layer.label}
                      </span>
                    </div>
                    {selectedLayer === layer.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Legend */}
            <div className="glass-card p-6 space-y-8">
              <div>
                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  Congestion Scale
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Minimal', range: '0-30%', color: 'bg-green-500' },
                    { label: 'Moderate', range: '30-60%', color: 'bg-yellow-500' },
                    { label: 'Heavy', range: '60-80%', color: 'bg-orange-500' },
                    { label: 'Critical', range: '80%+', color: 'bg-red-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-4">
                        <div className={`w-3.5 h-1.5 rounded-full ${item.color} group-hover:scale-x-125 transition-transform origin-left duration-300`}></div>
                        <span className="text-slate-400 text-[11px] font-bold tracking-tight">{item.label}</span>
                      </div>
                      <span className="text-slate-600 text-[10px] font-black font-mono tracking-tighter">{item.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  Infrastructure
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {[
                    { label: 'Flyover', color: 'bg-purple-500' },
                    { label: 'Bridge', color: 'bg-cyan-500' },
                    { label: 'Tunnel', color: 'bg-orange-400' },
                    { label: 'Road', color: 'bg-lime-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`}></div>
                      <span className="text-slate-400 text-[11px] font-bold tracking-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Panel */}
        {activePanel === 'analytics' && (
          <div className="space-y-6 pb-10">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6">Network Health</h2>
            
            <div className="space-y-3">
              {ROAD_SEGMENTS.map(road => (
                <div key={road.id} className="glass-card p-5 hover-glow group transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col max-w-[70%]">
                      <h4 className="text-white text-sm font-black leading-none mb-1.5 tracking-tight group-hover:text-blue-400 transition-colors">{road.name}</h4>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest opacity-60">
                        {road.lanes} Lanes • {road.speedLimit} km/h
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black tracking-tighter leading-none ${
                        road.trafficDensity > 0.8 ? 'text-red-500' :
                        road.trafficDensity > 0.6 ? 'text-orange-500' :
                        road.trafficDensity > 0.3 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {Math.round(road.trafficDensity * 100)}%
                      </span>
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">Load</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-950/50 rounded-full h-1.5 border border-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
                        road.trafficDensity > 0.8 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                        road.trafficDensity > 0.6 ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                        road.trafficDensity > 0.3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 
                        'bg-gradient-to-r from-green-600 to-green-400'
                      }`}
                      style={{ width: `${road.trafficDensity * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Gauge size={12} className="text-slate-500" />
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Velocity</span>
                    </div>
                    <span className="text-white text-xs font-black font-mono tracking-tighter">{road.currentSpeed} km/h</span>
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
