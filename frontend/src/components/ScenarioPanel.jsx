import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Square,
  ChevronDown, 
  ChevronUp,
  Waypoints,
  Building,
  Mountain,
  ArrowUpRight,
  X,
  Loader2,
  CheckCircle2,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import useStore from '../store/useStore';
import { PROPOSED_INFRASTRUCTURE, ROAD_SEGMENTS } from '../data/puneData';
import { calculateInfrastructureImpact } from '../utils/roadGraph';
import useSimulationSocket from '../hooks/useSimulationSocket';

const ScenarioPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showProposed, setShowProposed] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  
  const {
    scenarios,
    activeScenario,
    setActiveScenario,
    removeScenario,
    startDrawing,
    isDrawing,
    cancelDrawing,
    drawnPoints,
    trafficSimulationActive,
    setTrafficSimulationActive,
  } = useStore();

  const infrastructureTypes = [
    { id: 'road', label: 'New Road', icon: Waypoints, color: 'bg-lime-500', glow: 'shadow-lime-500/30' },
    { id: 'bridge', label: 'Bridge', icon: ArrowUpRight, color: 'bg-cyan-500', glow: 'shadow-cyan-500/30' },
    { id: 'flyover', label: 'Flyover', icon: Building, color: 'bg-purple-500', glow: 'shadow-purple-500/30' },
  ];

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    
    // Get baseline (before) metrics
    const baseRoads = ROAD_SEGMENTS;
    const baseAvgDensity = baseRoads.reduce((sum, road) => sum + road.trafficDensity, 0) / baseRoads.length;
    const baseTravelTime = 8 + (baseAvgDensity * 27); // minutes
    const baseCongestion = baseAvgDensity * 100;
    
    // Wait for visual effect with a nicer loader
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (scenarios.length === 0) {
      setSimulationResult({
        success: true,
        metrics: {
          travelTimeReduction: 0,
          congestionReduction: 0,
          costBenefit: 0
        },
        message: 'No infrastructure added'
      });
      setIsSimulating(false);
      return;
    }
    
    // Get impacted roads (after)
    const impactedRoads = calculateInfrastructureImpact(scenarios, baseRoads);
    const impactedAvgDensity = impactedRoads.reduce((sum, road) => sum + road.trafficDensity, 0) / impactedRoads.length;
    const impactedTravelTime = 8 + (impactedAvgDensity * 27);
    const impactedCongestion = impactedAvgDensity * 100;
    
    // Calculate actual reductions
    const travelTimeReduction = ((baseTravelTime - impactedTravelTime) / baseTravelTime) * 100;
    const congestionReduction = ((baseCongestion - impactedCongestion) / baseCongestion) * 100;
    
    // Calculate cost benefit (simplified)
    const totalInfrastructure = scenarios.length;
    const costBenefit = Math.max(1.5, Math.min(4.0, 2.0 + (travelTimeReduction / 20)));
    
    setSimulationResult({
      success: true,
      metrics: {
        travelTimeReduction: Math.max(0, travelTimeReduction),
        congestionReduction: Math.max(0, congestionReduction),
        costBenefit: costBenefit
      },
      message: `Optimized ${totalInfrastructure} Corridor(s)`
    });
    
    // Enable traffic visualization
    setTrafficSimulationActive(true);
    setIsSimulating(false);
  };

  return (
    <div className="absolute top-6 right-6 w-85 glass rounded-[32px] overflow-hidden z-20 shadow-2xl">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center">
            <Zap size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white text-base font-black tracking-tight leading-none mb-1.5">Scenario Builder</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Infrastructure Lab</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-6 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {/* Add Infrastructure Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                {isDrawing ? 'Design Mode' : 'Drafting Tools'}
              </h4>
              {isDrawing && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Drawing...</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {infrastructureTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => !isDrawing && startDrawing(type.id)}
                  disabled={isDrawing}
                  className={`group flex flex-col items-start gap-3 p-4 rounded-[24px] transition-all duration-500 border-2 ${
                    isDrawing 
                      ? 'bg-slate-900/40 border-transparent opacity-40 grayscale cursor-not-allowed' 
                      : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/20 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg ${type.glow}`}>
                    <type.icon size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-white">{type.label}</span>
                </button>
              ))}
            </div>
            
            {/* Cancel drawing button */}
            {isDrawing && (
              <button
                onClick={cancelDrawing}
                className="w-full mt-2 flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-[20px] transition-all duration-300 text-xs font-black uppercase tracking-widest border border-red-500/20"
              >
                <X size={16} />
                <span>Discard Draft</span>
              </button>
            )}
          </div>

          {/* User Created Scenarios */}
          {scenarios.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Drafts</h4>
              <div className="space-y-2">
                {scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    className={`group flex items-center justify-between p-4 rounded-[20px] cursor-pointer transition-all duration-500 border-2 ${
                      activeScenario === scenario.id
                        ? 'bg-blue-600/20 border-blue-500 shadow-xl'
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                    onClick={() => setActiveScenario(scenario.id === activeScenario ? null : scenario.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                        scenario.type === 'road' ? 'bg-lime-500 shadow-lime-500/40' :
                        scenario.type === 'bridge' ? 'bg-cyan-500 shadow-cyan-500/40' :
                        scenario.type === 'flyover' ? 'bg-purple-500 shadow-purple-500/40' :
                        'bg-orange-500 shadow-orange-500/40'
                      }`}></div>
                      <span className="text-white text-sm font-black tracking-tight">{scenario.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScenario(scenario.id);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/20 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Infrastructure */}
          <div className="space-y-3 pt-2">
            <button 
              onClick={() => setShowProposed(!showProposed)}
              className="flex items-center justify-between w-full text-[11px] font-black text-slate-500 uppercase tracking-widest"
            >
              <span>Government Proposals</span>
              {showProposed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showProposed && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {PROPOSED_INFRASTRUCTURE.map(infra => (
                  <div 
                    key={infra.id}
                    className={`group glass-card p-4 hover:bg-white/10 cursor-pointer transition-all duration-500 border-2 ${
                      activeScenario === infra.id ? 'border-purple-500 bg-purple-500/10' : 'border-transparent'
                    }`}
                    onClick={() => setActiveScenario(infra.id === activeScenario ? null : infra.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          infra.type === 'flyover' ? 'bg-purple-500' :
                          infra.type === 'bridge' ? 'bg-cyan-500' :
                          'bg-orange-500'
                        }`}></div>
                        <span className="text-white text-xs font-black tracking-tight">{infra.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-green-400">-{infra.estimatedTimeReduction}%</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase leading-relaxed mb-4 opacity-80">{infra.description}</p>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">₹{infra.estimatedCost} Cr</span>
                      <span className={`${
                        infra.status === 'proposed' ? 'text-yellow-500' : 
                        infra.status === 'approved' ? 'text-green-500' :
                        'text-slate-600'
                      }`}>
                        {infra.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run Simulation Button - Primary Action */}
          <div className="pt-4 space-y-4">
            {simulationResult && (
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-[24px] p-5 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-blue-400" />
                  </div>
                  <span className="text-blue-400 font-black text-[11px] uppercase tracking-[0.2em]">{simulationResult.message}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-500 text-[9px] font-black uppercase block mb-1">Time</span>
                    <p className="text-green-400 text-lg font-black tracking-tighter">-{simulationResult.metrics.travelTimeReduction.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-500 text-[9px] font-black uppercase block mb-1">Flow</span>
                    <p className="text-green-400 text-lg font-black tracking-tighter">-{simulationResult.metrics.congestionReduction.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className={`w-full group relative flex items-center justify-center gap-3 py-5 rounded-[24px] transition-all duration-700 overflow-hidden ${
                isSimulating 
                  ? 'bg-blue-900/40 cursor-wait' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] active:scale-95'
              } text-white`}
            >
              {isSimulating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Processing...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                  <Play size={20} fill="currentColor" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Run Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Live Toggle - Sleek Minimal Style */}
          <div className="pt-2">
            <div className="flex items-center justify-between glass-card p-5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${trafficSimulationActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                <span className="text-white text-xs font-black uppercase tracking-widest">Flow Visibility</span>
              </div>
              <button
                onClick={() => setTrafficSimulationActive(!trafficSimulationActive)}
                className={`relative w-14 h-7 rounded-full transition-all duration-500 ${
                  trafficSimulationActive ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800'
                }`}
              >
                <div 
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-lg ${
                    trafficSimulationActive ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioPanel;
