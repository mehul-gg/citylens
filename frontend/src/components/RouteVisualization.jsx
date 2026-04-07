/**
 * RouteVisualization - Displays alternative routes on the map
 * Highlights the selected route, shows others in grey when "Show All Routes" is enabled
 */

import { Polyline, Popup } from 'react-leaflet';
import useStore from '../store/useStore';

const RouteVisualization = () => {
  const { 
    routeAlternatives, 
    selectedRouteId,
    showRouteSuggestions,
    showSuggestedRoutes  // When true: show ALL routes. When false: show only selected route
  } = useStore();

  // Must have panel open and routes available
  if (!showRouteSuggestions || !routeAlternatives || routeAlternatives.length === 0) {
    return null;
  }

  // Define colors for each route type when selected
  const routeColors = {
    'shortest': { active: '#22c55e', inactive: '#6b7280' },           // Green when selected
    'least-demolition': { active: '#3b82f6', inactive: '#9ca3af' },   // Blue when selected
    'balanced': { active: '#f59e0b', inactive: '#d1d5db' }            // Orange when selected
  };

  // Determine which route is selected (default to first if none)
  const effectiveSelectedId = selectedRouteId || (routeAlternatives[0]?.id);
  
  // Get the selected route
  const selectedRoute = routeAlternatives.find(r => r.id === effectiveSelectedId);

  // If "Show All Routes" is OFF, only show the selected route
  if (!showSuggestedRoutes) {
    if (!selectedRoute || !selectedRoute.path || !Array.isArray(selectedRoute.path) || selectedRoute.path.length === 0) {
      return null;
    }

    const colors = routeColors[selectedRoute.id] || { active: '#22c55e', inactive: '#6b7280' };
    const leafletCoords = selectedRoute.path.map(coord => [coord[1], coord[0]]);
    const summary = selectedRoute.summary || { length: 0, buildingsAffected: 0 };

    return (
      <>
        {/* Glow/shadow effect for selected route */}
        <Polyline
          positions={leafletCoords}
          color={colors.active}
          weight={12}
          opacity={0.3}
          lineCap="round"
          lineJoin="round"
        />
        {/* Main selected route line */}
        <Polyline
          positions={leafletCoords}
          color={colors.active}
          weight={6}
          opacity={1}
          lineCap="round"
          lineJoin="round"
        >
          <Popup>
            <div className="text-xs">
              <div className="font-bold text-sm mb-1 flex items-center gap-2">
                {selectedRoute.name || 'Unnamed Route'}
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Selected</span>
              </div>
              <div className="text-slate-600">{selectedRoute.description || 'No description'}</div>
              <div className="mt-2 space-y-1">
                <div><strong>Length:</strong> {summary.length} km</div>
                <div><strong>Buildings Affected:</strong> {summary.buildingsAffected}</div>
                <div><strong>Score:</strong> {selectedRoute.score || 0}/100</div>
              </div>
            </div>
          </Popup>
        </Polyline>
      </>
    );
  }

  // "Show All Routes" is ON - show all routes with selected highlighted
  return (
    <>
      {/* First render non-selected routes (below) */}
      {routeAlternatives
        .filter(route => route.id !== effectiveSelectedId)
        .map((route, index) => {
          if (!route || !route.path || !Array.isArray(route.path) || route.path.length === 0) {
            return null;
          }

          const colors = routeColors[route.id] || { active: '#22c55e', inactive: '#6b7280' };
          const leafletCoords = route.path.map(coord => [coord[1], coord[0]]);
          const summary = route.summary || { length: 0, buildingsAffected: 0 };

          return (
            <Polyline
              key={route.id || `route-${index}`}
              positions={leafletCoords}
              color={colors.inactive}
              weight={4}
              opacity={0.5}
              dashArray="10, 5"
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-sm mb-1">{route.name || 'Unnamed Route'}</div>
                  <div className="text-slate-600">{route.description || 'No description'}</div>
                  <div className="mt-2 space-y-1">
                    <div><strong>Length:</strong> {summary.length} km</div>
                    <div><strong>Buildings Affected:</strong> {summary.buildingsAffected}</div>
                    <div><strong>Score:</strong> {route.score || 0}/100</div>
                  </div>
                  <div className="mt-2 text-blue-600 font-medium">Click to select this route</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

      {/* Then render selected route on top with highlight */}
      {selectedRoute && selectedRoute.path && Array.isArray(selectedRoute.path) && selectedRoute.path.length > 0 && (
        <>
          {/* Glow/shadow effect for selected route */}
          <Polyline
            positions={selectedRoute.path.map(coord => [coord[1], coord[0]])}
            color={routeColors[selectedRoute.id]?.active || '#22c55e'}
            weight={12}
            opacity={0.3}
            lineCap="round"
            lineJoin="round"
          />
          {/* Main selected route line */}
          <Polyline
            positions={selectedRoute.path.map(coord => [coord[1], coord[0]])}
            color={routeColors[selectedRoute.id]?.active || '#22c55e'}
            weight={6}
            opacity={1}
            lineCap="round"
            lineJoin="round"
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  {selectedRoute.name || 'Unnamed Route'}
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Selected</span>
                </div>
                <div className="text-slate-600">{selectedRoute.description || 'No description'}</div>
                <div className="mt-2 space-y-1">
                  <div><strong>Length:</strong> {selectedRoute.summary?.length || 0} km</div>
                  <div><strong>Buildings Affected:</strong> {selectedRoute.summary?.buildingsAffected || 0}</div>
                  <div><strong>Score:</strong> {selectedRoute.score || 0}/100</div>
                </div>
              </div>
            </Popup>
          </Polyline>
        </>
      )}
    </>
  );
};

export default RouteVisualization;
