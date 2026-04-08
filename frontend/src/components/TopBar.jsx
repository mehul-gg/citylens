import { 
  Menu, 
  PanelLeftClose, 
  PanelLeft, 
  Route,
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
        
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-blue-500/20 group">
            <Route className="text-white group-hover:scale-110 transition-transform duration-500" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">
              City<span className="text-blue-500">Lens</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] mt-1 uppercase">Digital Twin</p>
          </div>
        </div>
      </div>

      {/* Center Section - Location */}
      <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-lg ml-auto">
        <span className="text-white font-medium">Pune</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300">Wakad-Hinjewadi Corridor</span>
      </div>
    </header>
  );
};

export default TopBar;
