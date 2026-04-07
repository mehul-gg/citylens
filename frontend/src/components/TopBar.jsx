import { 
  Menu, 
  PanelLeftClose, 
  PanelLeft, 
  Compass,
  SplitSquareHorizontal,
  Sun,
  Moon,
  Settings,
  HelpCircle
} from 'lucide-react';
import useStore from '../store/useStore';

const TopBar = () => {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    isCompareMode, 
    toggleCompareMode,
    viewMode,
    setViewMode
  } = useStore();

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
      {/* Left Section - Logo & Sidebar Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Compass size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">CityLens</h1>
            <p className="text-xs text-slate-400 leading-tight">Digital Twin Platform</p>
          </div>
        </div>
      </div>

      {/* Center Section - Location */}
      <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-lg">
        <span className="text-white font-medium">Pune</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300">Wakad-Hinjewadi Corridor</span>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === '2d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            2D
          </button>
        </div>

        {/* Compare Mode */}
        <button
          onClick={toggleCompareMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isCompareMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <SplitSquareHorizontal size={18} />
          <span className="text-sm">Compare</span>
        </button>

        {/* Help */}
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <HelpCircle size={20} />
        </button>

        {/* Settings */}
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
