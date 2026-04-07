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
  const [sumoSpeed, setSumoSpeed] = useState(10);
  
  // WebSocket connection for real-time SUMO simulation
  const { 
    connectionStatus,
    startSimulation: startSumoSimulation,
    stopSimulation: stopSumoSimulation,
    pauseSimulation,
    resumeSimulation
  } = useSimulationSocket();
  
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
    // SUMO state
    simulationStatus,
    simulationMetrics,
    useSumoVehicles,
    setUseSumoVehicles
  } = useStore();

  const infrastructureTypes = [
    { id: 'road', label: 'New Road', icon: Waypoints, color: 'bg-lime-500' },
    { id: 'bridge', label: 'Bridge', icon: ArrowUpRight, color: 'bg-cyan-500' },
    { id: 'flyover', label: 'Flyover', icon: Building, color: 'bg-purple-500' },
    { id: 'tunnel', label: 'Tunnel', icon: Mountain, color: 'bg-orange-500' },
  ];

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    
    // Get baseline (before) metrics
    const baseRoads = ROAD_SEGMENTS;
    const baseAvgDensity = baseRoads.reduce((sum, road) => sum + road.trafficDensity, 0) / baseRoads.length;
    const baseTravelTime = 8 + (baseAvgDensity * 27); // minutes
    const baseCongestion = baseAvgDensity * 100;
    
    // Wait a bit for visual effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
      beforeMetrics: {
        avgTravelTime: Math.round(baseTravelTime),
        congestionIndex: Math.round(baseCongestion)
      },
      afterMetrics: {
        avgTravelTime: Math.round(impactedTravelTime),
        congestionIndex: Math.round(impactedCongestion)
      },
      message: `Analyzed ${totalInfrastructure} infrastructure project(s)`
    });
    
    // Enable traffic visualization
    setTrafficSimulationActive(true);
    setIsSimulating(false);
  };

  return (
    <div className="absolute top-4 right-4 w-80 glass rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-white font-semibold">Scenario Builder</h3>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Add Infrastructure Buttons */}
          <div>
            <p className="text-slate-400 text-xs mb-2">
              {isDrawing 
                ? `Drawing ${infrastructureTypes.find(t => t.id === useStore.getState().drawingType)?.label || 'infrastructure'}... (${drawnPoints.length} points)`
                : 'Add Infrastructure (Click to draw on map)'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {infrastructureTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => !isDrawing && startDrawing(type.id)}
                  disabled={isDrawing}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm transition-all ${
                    isDrawing 
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-700/50 text-white hover:bg-slate-600'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${type.color}`}></div>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
            
            {/* Cancel drawing button */}
            {isDrawing && (
              <button
                onClick={cancelDrawing}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white py-2 rounded-lg transition-colors text-sm"
              >
                <X size={14} />
                <span>Cancel Drawing</span>
              </button>
            )}
          </div>

          {/* User Created Scenarios */}
          {scenarios.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs mb-2">Your Scenarios ({scenarios.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      activeScenario === scenario.id
                        ? 'bg-blue-600/30 border border-blue-500'
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                    onClick={() => setActiveScenario(scenario.id === activeScenario ? null : scenario.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        scenario.type === 'road' ? 'bg-lime-500' :
                        scenario.type === 'bridge' ? 'bg-cyan-500' :
                        scenario.type === 'flyover' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}></div>
                      <span className="text-white text-sm">{scenario.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScenario(scenario.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Infrastructure */}
          <div>
            <button 
              onClick={() => setShowProposed(!showProposed)}
              className="flex items-center justify-between w-full text-slate-400 text-xs mb-2"
            >
              <span>Proposed Infrastructure (Government)</span>
              {showProposed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showProposed && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {PROPOSED_INFRASTRUCTURE.map(infra => (
                  <div 
                    key={infra.id}
                    className={`bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 cursor-pointer transition-colors ${
                      activeScenario === infra.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setActiveScenario(infra.id === activeScenario ? null : infra.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        infra.type === 'flyover' ? 'bg-purple-500' :
                        infra.type === 'bridge' ? 'bg-cyan-500' :
                        'bg-orange-500'
                      }`}></div>
                      <span className="text-white text-sm font-medium">{infra.name}</span>
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{infra.description}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-400">-{infra.estimatedTimeReduction}% time</span>
                      <span className="text-slate-400">₹{infra.estimatedCost} Cr</span>
                      <span className={`${
                        infra.status === 'proposed' ? 'text-yellow-400' : 
                        infra.status === 'approved' ? 'text-green-400' :
                        'text-slate-500'
                      }`}>
                        {infra.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulation Result */}
          {simulationResult && (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Simulation Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Travel Time</span>
                  <p className="text-green-400 font-bold">-{simulationResult.metrics.travelTimeReduction.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Congestion</span>
                  <p className="text-green-400 font-bold">-{simulationResult.metrics.congestionReduction.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Run Simulation Button */}
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
              isSimulating 
                ? 'bg-blue-600/50 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSimulating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Run Simulation</span>
              </>
            )}
          </button>

          {/* Traffic Toggle */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Live Traffic View</span>
              <button
                onClick={() => setTrafficSimulationActive(!trafficSimulationActive)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  trafficSimulationActive ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    trafficSimulationActive ? 'translate-x-7' : 'translate-x-1'
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
