import { Check, X, Undo, MousePointer, AlertCircle, Lightbulb } from 'lucide-react';
import useStore from '../store/useStore';
import { ROAD_SEGMENTS } from '../data/puneData';

const DrawingToolbar = () => {
  const { 
    drawingType, 
    drawnPoints, 
    finishDrawing, 
    cancelDrawing,
    trafficSimulationActive,
    buildings,
    setRouteAlternatives,
    toggleRouteSuggestions,
    routeGenerationLoading,
    routeGenerationError,
    setRouteGenerationLoading,
    setRouteGenerationError
  } = useStore();

  const typeColors = {
    road: 'lime',
    bridge: 'cyan',
    flyover: 'purple',
    tunnel: 'orange'
  };

  const handleSuggestRoutes = async () => {
    if (drawnPoints.length >= 2) {
      const start = drawnPoints[0];
      const end = drawnPoints[drawnPoints.length - 1];
      
      setRouteGenerationLoading(true);
      setRouteGenerationError(null);
      
      try {
        // Import the utilities
        const { generateRouteAlternatives, compareRoutes } = await import('../utils/routeOptimizer');
        
        // Generate route alternatives (returns basic routes)
        const rawAlternatives = generateRouteAlternatives(
          start,
          end,
          ROAD_SEGMENTS,
          buildings
        );
        
        if (!rawAlternatives || rawAlternatives.length === 0) {
          throw new Error('No valid routes found. Try different start/end points.');
        }
        
        // Analyze and compare routes (adds analysis, score, summary, path, affectedBuildings)
        const analyzedRoutes = compareRoutes(
          rawAlternatives,
          drawingType,
          buildings,
          ROAD_SEGMENTS
        );
        
        if (!analyzedRoutes || analyzedRoutes.length === 0) {
          throw new Error('Failed to analyze routes. Please try again.');
        }
        
        console.log('✅ Generated routes:', analyzedRoutes);
        
        // Store in state and show the comparison panel
        setRouteAlternatives(analyzedRoutes);
        toggleRouteSuggestions();
      } catch (error) {
        console.error('Route generation error:', error);
        setRouteGenerationError(error.message || 'Failed to generate route alternatives');
      } finally {
        setRouteGenerationLoading(false);
      }
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass rounded-xl p-4 flex items-center gap-4">
      {/* Drawing Info */}
      <div className="flex items-center gap-2">
        <MousePointer size={18} className="text-slate-400" />
        <div>
          <p className="text-white font-medium">
            Drawing: <span className={`text-${typeColors[drawingType]}-400 capitalize`}>{drawingType}</span>
          </p>
          <p className="text-xs text-slate-400">
            {trafficSimulationActive ? (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertCircle size={12} />
                Pause simulation to draw
              </span>
            ) : (
              <span>Click on map to add points ({drawnPoints.length} points added)</span>
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-slate-600"></div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSuggestRoutes}
          disabled={drawnPoints.length < 2 || trafficSimulationActive || routeGenerationLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            drawnPoints.length >= 2 && !trafficSimulationActive && !routeGenerationLoading
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          title={trafficSimulationActive ? 'Pause the simulation to get route suggestions' : 'Get AI-optimized route suggestions'}
        >
          <Lightbulb size={16} className={routeGenerationLoading ? 'animate-pulse' : ''} />
          <span>{routeGenerationLoading ? 'Analyzing...' : 'Suggest Routes'}</span>
        </button>

        <button
          onClick={finishDrawing}
          disabled={drawnPoints.length < 2 || trafficSimulationActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            drawnPoints.length >= 2 && !trafficSimulationActive
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          title={trafficSimulationActive ? 'Pause the simulation to finish drawing' : ''}
        >
          <Check size={16} />
          <span>Finish</span>
        </button>

        <button
          onClick={cancelDrawing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs max-w-48">
        {routeGenerationError ? (
          <span className="text-red-400 font-semibold">⚠ {routeGenerationError}</span>
        ) : trafficSimulationActive ? (
          <span className="text-amber-500 font-semibold">⏸ Pause simulation to draw infrastructure</span>
        ) : (
          <span className="text-slate-400">Click at least 2 points on the map to define the {drawingType} path, then click Finish.</span>
        )}
      </div>
    </div>
  );
};

export default DrawingToolbar;
