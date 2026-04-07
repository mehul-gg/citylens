import { Check, X, Undo, MousePointer } from 'lucide-react';
import useStore from '../store/useStore';

const DrawingToolbar = () => {
  const { 
    drawingType, 
    drawnPoints, 
    finishDrawing, 
    cancelDrawing 
  } = useStore();

  const typeColors = {
    road: 'lime',
    bridge: 'cyan',
    flyover: 'purple',
    tunnel: 'orange'
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass rounded-xl p-4 flex items-center gap-4">
      {/* Drawing Info */}
      <div className="flex items-center gap-2">
        <MousePointer size={18} className="text-slate-400" />
        <div>
          <p className="text-white font-medium">
            Drawing: <span className={`text-${typeColors[drawingType]}-400 capitalize`}>{drawingType}</span>
          </p>
          <p className="text-xs text-slate-400">
            Click on map to add points ({drawnPoints.length} points added)
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-slate-600"></div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={finishDrawing}
          disabled={drawnPoints.length < 2}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            drawnPoints.length >= 2
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check size={16} />
          <span>Finish</span>
        </button>

        <button
          onClick={cancelDrawing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-400 max-w-48">
        Click at least 2 points on the map to define the {drawingType} path, then click Finish.
      </div>
    </div>
  );
};

export default DrawingToolbar;
