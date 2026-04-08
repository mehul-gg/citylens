/**
 * RouteComparisonPanel - Shows alternative routes with analytics
 */

import { X, Check, TrendingUp, Home, DollarSign, CheckCircle, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import { formatINR } from '../utils/demolitionCalculator';

const RouteComparisonPanel = () => {
  const { 
    routeAlternatives, 
    selectedRouteId,
    setSelectedRoute,
    showRouteSuggestions,
    clearRouteAlternatives,
    showSuggestedRoutes,
    toggleShowSuggestedRoutes,
    applySelectedRoute,
    cancelDrawing
  } = useStore();

  if (!showRouteSuggestions || !routeAlternatives || routeAlternatives.length === 0) {
    return null;
  }

  const selectedRoute = routeAlternatives.find(r => r.id === selectedRouteId) || routeAlternatives[0];

  // When closing panel, apply the selected route (make it permanent)
  const handleClose = () => {
    applySelectedRoute(); // This adds the selected route as a scenario and clears everything
  };

  // Discard without building
  const handleDiscard = () => {
    cancelDrawing(); // This clears drawing state and route suggestions
  };

  return (
    <div className="absolute top-20 right-4 w-96 max-h-[calc(100vh-160px)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[1000]">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Route Suggestions</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {routeAlternatives.length} alternatives analyzed
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Close and apply selected route"
        >
          <X size={20} />
        </button>
      </div>

      {/* Toggle Button - Show/Hide Suggested Routes on Map */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={toggleShowSuggestedRoutes}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            showSuggestedRoutes 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          {showSuggestedRoutes ? (
            <>
              <EyeOff size={18} />
              <span>Hide Other Routes</span>
            </>
          ) : (
            <>
              <Eye size={18} />
              <span>Show All Routes on Map</span>
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          {showSuggestedRoutes 
            ? 'Showing all 3 routes on map. Click a route below to highlight it.' 
            : 'Showing selected route only. Click a route below to switch.'}
        </p>
      </div>

      {/* Routes List */}
      <div className="overflow-y-auto max-h-[calc(100vh-350px)] custom-scrollbar">
        {routeAlternatives.map((route, index) => {
          // Safety checks
          if (!route || !route.summary) {
            console.warn('Skipping invalid route data:', route);
            return null;
          }

          const isSelected = route.id === selectedRouteId || (index === 0 && !selectedRouteId);
          const { summary } = route;

          return (
            <div
              key={route.id || `route-${index}`}
              className={`p-4 border-b border-slate-800 cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-600/20 border-l-4 border-l-blue-500' 
                  : 'hover:bg-slate-800/50'
              }`}
              onClick={() => setSelectedRoute(route.id)}
            >
              {/* Route Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold">{route.name || 'Unnamed Route'}</h4>
                    {route.recommended && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{route.description || 'No description'}</p>
                </div>
              </div>

              {/* Quick Stats Grid - Simplified */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Length */}
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Length</span>
                  </div>
                  <div className="text-white font-bold">{summary.length || 0} km</div>
                </div>

                {/* Buildings Affected */}
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Home size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Buildings</span>
                  </div>
                  <div className={`font-bold ${
                    summary.buildingsAffected === 0 ? 'text-green-400' :
                    summary.buildingsAffected < 10 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {summary.buildingsAffected}
                  </div>
                </div>

                {/* Total Cost */}
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Cost</span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {formatINR(summary.totalCost)}
                  </div>
                </div>
              </div>

              {/* Select Button */}
              {isSelected && (
                <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                  <Check size={14} />
                  <span>Selected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed View for Selected Route */}
      {selectedRoute && selectedRoute.analysis && (
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <h4 className="text-white font-bold text-sm mb-3">Cost Breakdown</h4>
          
          <div className="space-y-2 text-xs">
            {/* Construction Cost */}
            <div className="flex justify-between">
              <span className="text-slate-400">Construction:</span>
              <span className="text-white font-medium">
                {formatINR(selectedRoute.analysis.demolition.constructionCost)}
              </span>
            </div>

            {/* Demolition Costs */}
            <div className="flex justify-between">
              <span className="text-slate-400">Demolition:</span>
              <span className="text-white font-medium">
                {formatINR(selectedRoute.analysis.demolition.demolitionCost)}
              </span>
            </div>

            {/* Relocation Costs */}
            <div className="flex justify-between">
              <span className="text-slate-400">Relocation:</span>
              <span className="text-white font-medium">
                {formatINR(selectedRoute.analysis.demolition.relocationCost)}
              </span>
            </div>

            <div className="border-t border-slate-600 pt-2 mt-2">
              {/* Total */}
              <div className="flex justify-between">
                <span className="text-slate-300 font-bold">Total:</span>
                <span className="text-white font-bold">
                  {formatINR(selectedRoute.analysis.demolition.totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-slate-800/70 border-t border-slate-700 space-y-2">
        <button
          onClick={applySelectedRoute}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-green-600/30"
        >
          <CheckCircle size={20} />
          <span>Build This Route</span>
        </button>
        <button
          onClick={handleDiscard}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all text-sm"
        >
          <X size={16} />
          <span>Discard</span>
        </button>
      </div>
    </div>
  );
};

export default RouteComparisonPanel;
