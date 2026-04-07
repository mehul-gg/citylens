/**
 * RouteVisualization - Displays alternative routes on the map
 * Shows all 3 routes in grey when toggle is ON
 */

import { Polyline, Popup } from 'react-leaflet';
import useStore from '../store/useStore';

const RouteVisualization = () => {
  const { 
    routeAlternatives, 
    selectedRouteId,
    showRouteSuggestions,
    showSuggestedRoutes  // NEW: Only show routes when this toggle is ON
  } = useStore();

  // Only render if panel is open AND toggle is ON
  if (!showRouteSuggestions || !showSuggestedRoutes || !routeAlternatives || routeAlternatives.length === 0) {
    return null;
  }

  // All routes shown in grey with different dash patterns for distinction
  const routeStyles = {
    'shortest': { color: '#6b7280', dashArray: null },           // Solid grey
    'least-demolition': { color: '#9ca3af', dashArray: '15, 5' }, // Dashed grey
    'balanced': { color: '#d1d5db', dashArray: '5, 10' }          // Dotted light grey
  };

  return (
    <>
      {routeAlternatives.map((route, index) => {
        // Safety checks - skip invalid routes
        if (!route || !route.path || !Array.isArray(route.path) || route.path.length === 0) {
          console.warn('Skipping invalid route:', route);
          return null;
        }

        const style = routeStyles[route.id] || { color: '#6b7280', dashArray: null };
        
        // Convert route coordinates from [lng, lat] to [lat, lng] for Leaflet
        const leafletCoords = route.path.map(coord => [coord[1], coord[0]]);

        // Safety check for summary data
        const summary = route.summary || { length: 0, buildingsAffected: 0 };
        const score = route.score || 0;

        return (
          <div key={route.id || `route-${index}`}>
            {/* Route path - all grey */}
            <Polyline
              positions={leafletCoords}
              color={style.color}
              weight={4}
              opacity={0.8}
              dashArray={style.dashArray}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-sm mb-1">{route.name || 'Unnamed Route'}</div>
                  <div className="text-slate-600">{route.description || 'No description'}</div>
                  <div className="mt-2 space-y-1">
                    <div><strong>Length:</strong> {summary.length} km</div>
                    <div><strong>Buildings Affected:</strong> {summary.buildingsAffected}</div>
                    <div><strong>Score:</strong> {score}/100</div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          </div>
        );
      })}
    </>
  );
};

export default RouteVisualization;
