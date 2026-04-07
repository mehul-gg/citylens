import { useState, useEffect } from 'react';
import CityMap from './components/CityMap';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ScenarioPanel from './components/ScenarioPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import CompareView from './components/CompareView';
import DrawingToolbar from './components/DrawingToolbar';
import RouteComparisonPanel from './components/RouteComparisonPanel';
import useStore from './store/useStore';
import './index.css';

function App() {
  const { isCompareMode, isDrawing, sidebarOpen } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">CityLens</h1>
          <p className="text-slate-400">Loading Digital Twin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <TopBar />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}
        
        {/* Main Content */}
        <div className="flex-1 relative">
          {isCompareMode ? (
            <CompareView />
          ) : (
            <>
              {/* 2D Map View - Always enabled */}
              <CityMap />
              
              {/* Drawing Toolbar - shows when drawing mode is active */}
              {isDrawing && <DrawingToolbar />}
              
              {/* Floating Panels */}
              <ScenarioPanel />
              <AnalyticsPanel />
              <RouteComparisonPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
