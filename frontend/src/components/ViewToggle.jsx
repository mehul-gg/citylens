/**
 * ViewToggle - Tab buttons to switch between 2D map and 3D view
 */

import useStore from '../store/useStore';

const ViewToggle = () => {
  const { viewMode, setViewMode } = useStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-slate-800/90 rounded-lg p-1 border border-slate-700 shadow-lg backdrop-blur-sm">
      <button
        onClick={() => setViewMode('2d')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
          viewMode === '2d'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
          />
        </svg>
        2D Map
      </button>
      
      <button
        onClick={() => setViewMode('3d')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
          viewMode === '3d'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        3D View
      </button>
    </div>
  );
};

export default ViewToggle;
