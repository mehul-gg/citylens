/**
 * BuildingLayer - Renders OSM buildings on 2D map
 */

import { Polygon, Popup } from 'react-leaflet';
import { useMemo } from 'react';

const BuildingLayer = ({ buildings, affectedBuildings = [], onBuildingClick, isDrawing = false }) => {
  // Convert [lng, lat] to [lat, lng] for Leaflet
  const toLatLng = (coords) => coords.map(c => [c[1], c[0]]);

  // Get building color based on type and impact status
  const getBuildingStyle = (building) => {
    const affected = affectedBuildings.find(ab => ab.building.id === building.id);
    
    if (affected) {
      // Buildings affected by BUILT infrastructure (permanent)
      if (affected.isBuilt) {
        if (affected.isNewlyBuilt) {
          // Newly built - bright pulsing highlight
          return {
            color: '#22c55e', // Green border
            weight: 4,
            opacity: 1,
            fillColor: affected.demolitionRequired ? '#dc2626' : '#22c55e',
            fillOpacity: 0.7,
            dashArray: '4, 4'
          };
        } else {
          // Previously built - subtle but visible
          return {
            color: affected.demolitionRequired ? '#ef4444' : '#10b981',
            weight: 3,
            opacity: 0.9,
            fillColor: affected.demolitionRequired ? '#ef4444' : '#10b981',
            fillOpacity: 0.5,
            dashArray: null
          };
        }
      }
      
      // Preview affected (during drawing/selection)
      if (affected.demolitionRequired) {
        return {
          color: '#ef4444', // Red - full demolition
          weight: 3,
          opacity: 1,
          fillColor: '#ef4444',
          fillOpacity: 0.5,
          dashArray: null
        };
      } else if (affected.partialImpact) {
        return {
          color: '#f97316', // Orange - partial impact
          weight: 3,
          opacity: 1,
          fillColor: '#f97316',
          fillOpacity: 0.5,
          dashArray: null
        };
      }
      
      // Generic affected
      return {
        color: '#fbbf24', // Yellow
        weight: 2,
        opacity: 1,
        fillColor: '#fbbf24',
        fillOpacity: 0.4,
        dashArray: null
      };
    }

    // Normal building colors by type
    let fillColor;
    switch (building.type) {
      case 'residential':
        fillColor = '#94a3b8'; // Light gray
        break;
      case 'commercial':
        fillColor = '#3b82f6'; // Blue
        break;
      case 'industrial':
        fillColor = '#f59e0b'; // Orange
        break;
      case 'office':
        fillColor = '#8b5cf6'; // Purple
        break;
      default:
        fillColor = '#64748b'; // Slate gray
    }
    
    return {
      color: fillColor,
      weight: 1,
      opacity: 0.6,
      fillColor: fillColor,
      fillOpacity: 0.3,
      dashArray: null
    };
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
        const style = getBuildingStyle(building);
        const affected = affectedBuildings.find(ab => ab.building.id === building.id);
        
        return (
          <Polygon
            key={building.id}
            positions={toLatLng(building.coordinates)}
            pathOptions={style}
            eventHandlers={{
              click: () => onBuildingClick && onBuildingClick(building)
            }}
          >
            {!isDrawing && (
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
                      <div className={`text-xs font-semibold mb-1 ${
                        affected.isBuilt 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {affected.isBuilt 
                          ? (affected.isNewlyBuilt ? '🏗️ NEWLY BUILT ROUTE' : '✓ BUILT INFRASTRUCTURE')
                          : '⚠️ AFFECTED BY ROUTE'
                        }
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Impact: <span className="font-medium capitalize">{affected.severity || 'moderate'}</span></div>
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
            )}
          </Polygon>
        );
      })}
    </>
  );
};

export default BuildingLayer;
