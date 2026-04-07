import { create } from 'zustand';

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
      set((state) => ({
        isDrawing: false,
        drawingType: null,
        drawnPoints: [],
        scenarios: [...state.scenarios, { ...newScenario, id: Date.now().toString() }]
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
}));

export default useStore;
