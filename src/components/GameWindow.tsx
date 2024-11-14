import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Volume2, VolumeX, X, AlertCircle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { Game, WindowPosition } from '../types';
import LiveStream from './LiveStream';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface GameWindowProps {
  game: Game;
  position: WindowPosition;
  onPositionChange: (position: Partial<WindowPosition>) => void;
  onFocus: () => void;
  onRemove: () => void;
  isAutoArranging?: boolean; // Add this new prop
}

const GameWindow: React.FC<GameWindowProps> = ({
  game,
  position,
  onPositionChange,
  onFocus,
  onRemove,
  isAutoArranging = false // Default to false
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [originalPosition, setOriginalPosition] = useState<WindowPosition | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [minimizedPosition, setMinimizedPosition] = useState<WindowPosition | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainContentRef.current = document.querySelector('main');
  }, []);

  const handleDragStart = () => {
    setIsDragging(true);
    onFocus();
  };

  const handleDrag = (_e: any, data: { x: number; y: number }) => {
    if (!isFullscreen) {
      onPositionChange({ x: data.x, y: data.y });
    }
  };

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    if (!isFullscreen) {
      onPositionChange({ x: data.x, y: data.y });
    }
  };

  const handleStreamError = (error: Error) => {
    setStreamError(error.message);
  };

  const handleRetry = () => {
    setStreamError(null);
    setKey(prev => prev + 1);
  };

  const handleResize = (_e: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    if (!isFullscreen) {
      onPositionChange({
        width: size.width,
        height: size.height
      });
    }
  };

  const toggleFullscreen = () => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    if (isFullscreen) {
      // Restore to minimized position
      if (minimizedPosition) {
        onPositionChange(minimizedPosition);
        setMinimizedPosition(null);
      }
    } else {
      // Store current position before maximizing
      setMinimizedPosition(position);
      
      // Calculate main content dimensions
      const rect = mainContent.getBoundingClientRect();
      onPositionChange({
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
        zIndex: position.zIndex
      });
    }
    setIsFullscreen(!isFullscreen);
  };

  const windowClasses = [
    'game-window',
    isDragging && 'dragging',
    isAutoArranging && 'auto-arranging',
    isFullscreen && 'fullscreen-transition',
    position.focused && 'focused'
  ].filter(Boolean).join(' ');

  return (
    <Draggable
      nodeRef={dragRef}
      handle=".window-header"
      position={{ x: position.x, y: position.y }}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      cancel=".window-controls"
      disabled={isFullscreen}
    >
      <div 
        ref={dragRef}
        style={{
          position: 'absolute',
          zIndex: position.zIndex,
          width: position.width,
          height: position.height,
          transform: `translate3d(0, 0, 0)`, // Force GPU acceleration
          willChange: 'transform, width, height', // Optimize animations
          transition: isAutoArranging ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 
                     isFullscreen ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 
                     'none'
        }}
        className={windowClasses}
      >
        <ResizableBox
          width={position.width}
          height={position.height}
          minConstraints={[320, 240]}
          maxConstraints={[
            mainContentRef.current?.clientWidth || window.innerWidth,
            mainContentRef.current?.clientHeight || window.innerHeight
          ]}
          onResize={handleResize}
          resizeHandles={isFullscreen ? [] : ['se']}
          className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg 
            ${isFullscreen ? 'rounded-none' : ''}
            transition-shadow duration-200`}
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
                  onClick={toggleFullscreen}
                  className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
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
            </div>
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default GameWindow;