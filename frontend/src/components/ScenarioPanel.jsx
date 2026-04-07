import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  ChevronDown, 
  ChevronUp,
  Waypoints,
  Building,
  Mountain,
  ArrowUpRight,
  X
} from 'lucide-react';
import useStore from '../store/useStore';
import { PROPOSED_INFRASTRUCTURE } from '../data/puneData';

const ScenarioPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showProposed, setShowProposed] = useState(true);
  
  const {
    scenarios,
    activeScenario,
    setActiveScenario,
    removeScenario,
    startDrawing,
    isDrawing
  } = useStore();

  const infrastructureTypes = [
    { id: 'road', label: 'New Road', icon: Waypoints, color: 'bg-lime-500' },
    { id: 'bridge', label: 'Bridge', icon: ArrowUpRight, color: 'bg-cyan-500' },
    { id: 'flyover', label: 'Flyover', icon: Building, color: 'bg-purple-500' },
    { id: 'tunnel', label: 'Tunnel', icon: Mountain, color: 'bg-orange-500' },
  ];

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
            <p className="text-slate-400 text-xs mb-2">Add Infrastructure (Click to draw on map)</p>
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
          </div>

          {/* User Created Scenarios */}
          {scenarios.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs mb-2">Your Scenarios</p>
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
                    className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 cursor-pointer transition-colors"
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
                      <span className={`${infra.status === 'proposed' ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {infra.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run Simulation Button */}
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors">
            <Play size={16} />
            <span>Run Simulation</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ScenarioPanel;
