import React from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Game } from '../types';

interface GameStreamProps {
  game: Game;
  onRemove: () => void;
}

const GameStream: React.FC<GameStreamProps> = ({ game, onRemove }) => {
  const [isMuted, setIsMuted] = React.useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Stream Header - Draggable Handle */}
      <div className="stream-header bg-gray-700 p-2 cursor-move flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-white font-semibold">{game.title}</span>
          <span className="text-red-500 text-sm font-semibold flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stream Content */}
      <div className="relative flex-1 bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Live Stream Placeholder</div>
        </div>

        {/* Stream Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-300">{game.league}</span>
              <span className="text-gray-300">{game.minute}</span>
              <span className="text-white font-semibold">{game.score}</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStream;