import { create } from 'zustand';
import { calculateInfrastructureImpact } from '../utils/roadGraph';
import { ROAD_SEGMENTS } from '../data/puneData';

const useStore = create((set, get) => ({
  // Map state
  viewMode: '2d', // '3d' or '2d'
  selectedLayer: 'traffic', // 'traffic', 'infrastructure', 'govt', 'all'
  
  // Scenario state
  activeScenario: null, // null = current state, or scenario ID
  scenarios: [],
  isCompareMode: false,
  
  // Drawing state
  isDrawing: false,
  drawingType: null, // 'bridge', 'road', 'tunnel', 'flyover'
  drawnPoints: [],
  
  // Traffic simulation (local animation)
  trafficSimulationActive: true,
  simulationSpeed: 1, // 1x, 2x, 4x
  currentHour: 9, // 24-hour format
  
  // SUMO Simulation state (real-time from backend)
  sumoConnected: false,
  simulationStatus: 'stopped', // 'stopped', 'running', 'paused', 'completed', 'error'
  simulationVehicles: [], // Real vehicles from SUMO
  simulationMetrics: {
    simulationTime: 0,
    totalVehicles: 0,
    avgSpeed: 0,
    waitingVehicles: 0,
    congestionIndex: 0
  },
  useSumoVehicles: false, // Toggle between mock animation and SUMO vehicles
  
  // Selected items
  selectedJunction: null,
  selectedRoad: null,
  selectedInfrastructure: null,
  
  // UI state
  sidebarOpen: true,
  activePanel: 'overview', // 'overview', 'scenario', 'analytics', 'govt'
  
  // 3D View state
  showBefore: true, // true = show "before" state (no new infrastructure), false = "after"
  
  // Roads with recalculated traffic after infrastructure changes
  roadsWithImpact: null, // Stores roads with updated traffic densities after drawing
  
  // Building data from OSM
  buildings: [],
  buildingsLoaded: false,
  buildingsLoading: false,
  selectedBuilding: null,
  
  // Route optimization
  routeAlternatives: [], // Array of alternative routes with analysis
  selectedRouteId: null, // ID of currently selected route alternative
  showRouteSuggestions: false, // Toggle route suggestion panel
  routeGenerationLoading: false, // Loading state for route generation
  routeGenerationError: null, // Error message if route generation fails
  showSuggestedRoutes: false, // Toggle to show all 3 suggested routes on map (vs original drawn path)
  
  // Highlight newly built roads
  newlyBuiltScenarioIds: [], // IDs of scenarios that were just built (for highlighting)
  
  // Buildings affected by built infrastructure
  builtRouteAffectedBuildings: [], // Buildings affected by permanently built routes
  
  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  
  setActiveScenario: (scenarioId) => set({ activeScenario: scenarioId }),
  addScenario: (scenario) => set((state) => ({
    scenarios: [...state.scenarios, { ...scenario, id: Date.now().toString() }]
  })),
  removeScenario: (scenarioId) => set((state) => ({
    scenarios: state.scenarios.filter(s => s.id !== scenarioId)
  })),
  toggleCompareMode: () => set((state) => ({ isCompareMode: !state.isCompareMode })),
  
  startDrawing: (type) => set({ isDrawing: true, drawingType: type, drawnPoints: [] }),
  addDrawnPoint: (point) => set((state) => ({
    drawnPoints: [...state.drawnPoints, point]
  })),
  finishDrawing: () => {
    const state = get();
    if (state.drawnPoints.length >= 2) {
      const newScenario = {
        type: state.drawingType,
        coordinates: state.drawnPoints,
        name: `New ${state.drawingType}`,
        createdAt: new Date().toISOString()
      };
      const updatedScenarios = [...state.scenarios, { ...newScenario, id: Date.now().toString() }];
      
      // Calculate traffic impact of new infrastructure
      const roadsWithImpact = calculateInfrastructureImpact(updatedScenarios, ROAD_SEGMENTS);
      
      set((state) => ({
        isDrawing: false,
        drawingType: null,
        drawnPoints: [],
        scenarios: updatedScenarios,
        roadsWithImpact: roadsWithImpact // Store updated roads for rendering
      }));
    } else {
      set({ isDrawing: false, drawingType: null, drawnPoints: [] });
    }
  },
  cancelDrawing: () => set({ isDrawing: false, drawingType: null, drawnPoints: [] }),
  
  // Local traffic animation controls
  setTrafficSimulation: (active) => set({ trafficSimulationActive: active }),
  setTrafficSimulationActive: (active) => set({ trafficSimulationActive: active }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setCurrentHour: (hour) => set({ currentHour: hour }),
  
  // SUMO simulation controls
  setSumoConnected: (connected) => set({ sumoConnected: connected }),
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  setSimulationVehicles: (vehicles) => set({ simulationVehicles: vehicles }),
  setSimulationMetrics: (metrics) => set({ simulationMetrics: metrics }),
  setUseSumoVehicles: (use) => set({ useSumoVehicles: use }),
  
  // Toggle between mock and SUMO vehicles
  toggleVehicleSource: () => set((state) => ({ 
    useSumoVehicles: !state.useSumoVehicles,
    // If switching to SUMO, disable local animation
    trafficSimulationActive: state.useSumoVehicles ? true : false
  })),
  
  setSelectedJunction: (junction) => set({ selectedJunction: junction }),
  setSelectedRoad: (road) => set({ selectedRoad: road }),
  setSelectedInfrastructure: (infra) => set({ selectedInfrastructure: infra }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  // 3D View actions
  setShowBefore: (showBefore) => set({ showBefore }),
  toggleShowBefore: () => set((state) => ({ showBefore: !state.showBefore })),
  
  // Update roads with traffic impact calculations
  setRoadsWithImpact: (roads) => set({ roadsWithImpact: roads }),
  
  // Building actions
  setBuildings: (buildings) => set({ buildings, buildingsLoaded: true, buildingsLoading: false }),
  setBuildingsLoading: (loading) => set({ buildingsLoading: loading }),
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  
  // Route optimization actions
  setRouteAlternatives: (alternatives) => set({ routeAlternatives: alternatives }),
  setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),
  toggleRouteSuggestions: () => set((state) => ({ showRouteSuggestions: !state.showRouteSuggestions })),
  clearRouteAlternatives: () => set({ routeAlternatives: [], selectedRouteId: null, showSuggestedRoutes: false }),
  setRouteGenerationLoading: (loading) => set({ routeGenerationLoading: loading }),
  setRouteGenerationError: (error) => set({ routeGenerationError: error }),
  toggleShowSuggestedRoutes: () => set((state) => ({ showSuggestedRoutes: !state.showSuggestedRoutes })),
  
  // Apply selected route - converts the selected route to a scenario with traffic
  applySelectedRoute: () => {
    const state = get();
    const { routeAlternatives, selectedRouteId, drawingType } = state;
    
    // Find the selected route (or default to first)
    const effectiveSelectedId = selectedRouteId || (routeAlternatives[0]?.id);
    const selectedRoute = routeAlternatives.find(r => r.id === effectiveSelectedId);
    
    if (!selectedRoute || !selectedRoute.path) {
      console.warn('No valid route selected to apply');
      return;
    }
    
    // Create a new scenario from the selected route
    const newScenarioId = Date.now().toString();
    const newScenario = {
      id: newScenarioId,
      type: drawingType || 'flyover',
      coordinates: selectedRoute.path,
      name: selectedRoute.name || `New ${drawingType || 'flyover'}`,
      createdAt: new Date().toISOString(),
      fromRoute: selectedRoute.id, // Track which route this came from
      affectedBuildings: selectedRoute.affectedBuildings || [],
      isNew: true // Flag for highlighting
    };
    
    const updatedScenarios = [...state.scenarios, newScenario];
    
    // Calculate traffic impact of new infrastructure
    const roadsWithImpact = calculateInfrastructureImpact(updatedScenarios, ROAD_SEGMENTS);
    
    set({
      // Clear drawing state
      isDrawing: false,
      drawingType: null,
      drawnPoints: [],
      // Add the route as a scenario
      scenarios: updatedScenarios,
      roadsWithImpact: roadsWithImpact,
      // Close route suggestions panel
      showRouteSuggestions: false,
      showSuggestedRoutes: false,
      routeAlternatives: [],
      selectedRouteId: null,
      // Mark this scenario as newly built for highlighting
      newlyBuiltScenarioIds: [...state.newlyBuiltScenarioIds, newScenarioId],
      // Store affected buildings for permanent highlighting
      builtRouteAffectedBuildings: [
        ...state.builtRouteAffectedBuildings,
        ...(selectedRoute.affectedBuildings || []).map(ab => ({
          ...ab,
          scenarioId: newScenarioId,
          isNewlyBuilt: true
        }))
      ]
    });
    
    // Clear the "new" highlight after 10 seconds (but keep buildings highlighted)
    setTimeout(() => {
      set((state) => ({
        newlyBuiltScenarioIds: state.newlyBuiltScenarioIds.filter(id => id !== newScenarioId),
        // Mark buildings as no longer "newly built" but still affected
        builtRouteAffectedBuildings: state.builtRouteAffectedBuildings.map(ab => 
          ab.scenarioId === newScenarioId ? { ...ab, isNewlyBuilt: false } : ab
        )
      }));
    }, 10000);
    
    console.log('✅ Applied route as scenario:', newScenario.name);
  },
}));

export default useStore;
