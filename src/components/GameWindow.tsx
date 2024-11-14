import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Volume2, VolumeX, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Game, WindowPosition } from '../types';
import LiveStream from './LiveStream';

interface GameWindowProps {
  game: Game;
  position: WindowPosition;
  onPositionChange: (position: Partial<WindowPosition>) => void;
  onFocus: () => void;
  onRemove: () => void;
}

const GameWindow: React.FC<GameWindowProps> = ({
  game,
  position,
  onPositionChange,
  onFocus,
  onRemove
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
    onFocus();
  };

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    onPositionChange({ x: data.x, y: data.y });
  };

  const handleStreamError = (error: Error) => {
    setStreamError(error.message);
  };

  const handleRetry = () => {
    setStreamError(null);
    setKey(prev => prev + 1);
  };

  const initResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = position.width;
    const startHeight = position.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(320, Math.min(800, startWidth + (e.clientX - startX)));
        const newHeight = Math.max(240, Math.min(600, startHeight + (e.clientY - startY)));
        onPositionChange({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Draggable
      nodeRef={dragRef}
      handle=".window-header"
      position={{ x: position.x, y: position.y }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
      cancel=".window-controls"
    >
      <div
        ref={dragRef}
        className={`absolute bg-gray-800 rounded-lg overflow-hidden shadow-2xl transition-shadow ${
          isDragging ? 'shadow-2xl ring-2 ring-red-500/50' : ''
        }`}
        style={{ 
          width: position.width,
          height: position.height,
          zIndex: position.zIndex,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Window Header */}
          <div className="window-header bg-gray-700 p-2 flex items-center justify-between select-none">
            <div className="flex items-center space-x-3">
              <span className="text-white font-semibold">{game.title}</span>
              <span className="text-red-500 text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <div className="window-controls flex items-center space-x-2">
              {streamError && (
                <button
                  onClick={handleRetry}
                  className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
                  title="Retry stream"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onRemove}
                className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stream Content */}
          <div className="relative flex-1">
            {streamError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-red-500">
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-8 w-8" />
                  <span className="text-center px-4">{streamError}</span>
                  <button
                    onClick={handleRetry}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            ) : (
              <LiveStream
                key={key}
                url={game.streamUrl}
                isMuted={isMuted}
                onError={handleStreamError}
              />
            )}

            {/* Stream Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-300">{game.league}</span>
                  <span className="text-white font-semibold">{game.score}</span>
                </div>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors window-controls"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize window-controls"
              onMouseDown={initResize}
              style={{
                background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)'
              }}
            />
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default GameWindow;