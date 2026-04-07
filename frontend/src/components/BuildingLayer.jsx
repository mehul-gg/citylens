/**
 * BuildingLayer - Renders OSM buildings on 2D map
 */

import { Polygon, Popup } from 'react-leaflet';
import { useMemo } from 'react';

const BuildingLayer = ({ buildings, affectedBuildings = [], onBuildingClick }) => {
  // Convert [lng, lat] to [lat, lng] for Leaflet
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  // Get building color based on type and impact status
  const getBuildingColor = (building) => {
    const affected = affectedBuildings.find(ab => ab.building.id === building.id);
    
    if (affected) {
      // Highlight affected buildings
      if (affected.demolitionRequired) {
        return '#ef4444'; // Red - full demolition
      } else if (affected.partialImpact) {
        return '#f97316'; // Orange - partial impact
      }
    }

    // Normal building colors by type
    switch (building.type) {
      case 'residential':
        return '#94a3b8'; // Light gray
      case 'commercial':
        return '#3b82f6'; // Blue
      case 'industrial':
        return '#f59e0b'; // Orange
      case 'office':
        return '#8b5cf6'; // Purple
      default:
        return '#64748b'; // Slate gray
    }
  };

  // Filter buildings that are too small to render (performance optimization)
  const visibleBuildings = useMemo(() => {
    return buildings.filter(b => b.area > 50); // Only show buildings > 50 sq.m
  }, [buildings]);

  if (!buildings || buildings.length === 0) {
    return null;
  }

  return (
    <>
      {visibleBuildings.map(building => {
        const color = getBuildingColor(building);
        const affected = affectedBuildings.find(ab => ab.building.id === building.id);
        
        return (
          <Polygon
            key={building.id}
            positions={toLatLng(building.coordinates)}
            pathOptions={{
              color: color,
              weight: affected ? 3 : 1,
              opacity: affected ? 1 : 0.6,
              fillColor: color,
              fillOpacity: affected ? 0.5 : 0.3
            }}
            eventHandlers={{
              click: () => onBuildingClick && onBuildingClick(building)
            }}
          >
            <Popup>
              <div className="text-sm p-1">
                <strong className="text-base capitalize">{building.type} Building</strong>
                {building.name && <div className="text-slate-600 text-xs mt-1">{building.name}</div>}
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <span className="text-slate-400">Floors:</span>
                  <span className="font-medium">{building.levels}</span>
                  
                  <span className="text-slate-400">Height:</span>
                  <span className="font-medium">{building.height.toFixed(1)}m</span>
                  
                  <span className="text-slate-400">Area:</span>
                  <span className="font-medium">{building.area.toFixed(0)} sq.m</span>
                  
                  {building.capacity > 0 && (
                    <>
                      <span className="text-slate-400">
                        {building.type === 'residential' ? 'Households:' : 'Units:'}
                      </span>
                      <span className="font-medium">{building.capacity}</span>
                    </>
                  )}
                </div>

                {affected && (
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <div className="text-xs font-semibold text-red-600 mb-1">
                      ⚠️ AFFECTED BY ROUTE
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Impact: <span className="font-medium capitalize">{affected.severity}</span></div>
                      {affected.impactDetails && (
                        <>
                          <div>
                            Units affected: <span className="font-medium">{affected.impactDetails.unitsAffected}</span>
                          </div>
                          <div>
                            Cost: <span className="font-medium">
                              ₹{(affected.impactDetails.totalCost / 10_000_000).toFixed(2)} Cr
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {building.street && (
                  <div className="mt-2 text-xs text-slate-500">
                    {building.houseNumber && `${building.houseNumber}, `}{building.street}
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export default BuildingLayer;
