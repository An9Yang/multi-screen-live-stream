import { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Plus, MonitorPlay, Grid } from 'lucide-react';
import GameWindow from './components/GameWindow';
import GameSelector from './components/GameSelector';
import { Game, WindowPosition } from './types';

function App() {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowPositions, setWindowPositions] = useState<Record<number, WindowPosition>>({});
  const [isAutoArranging, setIsAutoArranging] = useState(false);

  const addGame = (game: Game) => {
    setActiveGames([...activeGames, game]);
    
    // Calculate available space
    const mainContent = document.querySelector('main');
    const maxWidth = mainContent?.clientWidth || window.innerWidth;
    const maxHeight = mainContent?.clientHeight || window.innerHeight;
    
    // Improved cascade positioning
    const windowCount = activeGames.length;
    const offsetX = (windowCount * 40) % (maxWidth - 520); // 520 = window width + margin
    const offsetY = (windowCount * 40) % (maxHeight - 360); // 360 = window height + margin
    
    setWindowPositions({
      ...windowPositions,
      [game.id]: {
        x: offsetX,
        y: offsetY,
        width: 480,
        height: 320,
        zIndex: Math.max(...Object.values(windowPositions).map(p => p.zIndex || 0), 0) + 1
      }
    });
  };

  const removeGame = (gameId: number) => {
    setActiveGames(activeGames.filter(game => game.id !== gameId));
    const newPositions = { ...windowPositions };
    delete newPositions[gameId];
    setWindowPositions(newPositions);
  };

  const updatePosition = (gameId: number, position: Partial<WindowPosition>) => {
    setWindowPositions(prev => ({
      ...prev,
      [gameId]: { ...prev[gameId], ...position }
    }));
  };

  const bringToFront = (gameId: number) => {
    const maxZ = Math.max(...Object.values(windowPositions).map(p => p.zIndex || 0));
    updatePosition(gameId, { zIndex: maxZ + 1 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const autoArrangeWindows = () => {
    const mainContent = document.querySelector('main');
    if (!mainContent || activeGames.length === 0) return;
    
    setIsAutoArranging(true);
    
    const padding = 16; // Spacing between windows
    const containerWidth = mainContent.clientWidth;
    const containerHeight = mainContent.clientHeight;
    
    // Calculate optimal grid dimensions
    const count = activeGames.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    // Calculate window dimensions
    const windowWidth = Math.floor((containerWidth - (padding * (cols + 1))) / cols);
    const windowHeight = Math.floor((containerHeight - (padding * (rows + 1))) / rows);
    
    // Update positions for all windows
    const newPositions: Record<number, WindowPosition> = {};
    
    activeGames.forEach((game, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      newPositions[game.id] = {
        x: padding + (col * (windowWidth + padding)),
        y: padding + (row * (windowHeight + padding)),
        width: windowWidth,
        height: windowHeight,
        zIndex: windowPositions[game.id]?.zIndex || 1
      };
    });
    
    setWindowPositions(newPositions);

    // Reset the animation flag after animation completes
    setTimeout(() => {
      setIsAutoArranging(false);
    }, 300); // Match this with the CSS transition duration
  };

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (document.querySelector('main')) {
        autoArrangeWindows();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeGames.length]); // Re-run when game count changes

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 relative z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MonitorPlay className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">Multi-Screen Live</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={autoArrangeWindows}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Auto-arrange windows"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </button>
            <button
              onClick={() => (document.getElementById('game-selector') as HTMLDialogElement)?.showModal()}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Stream</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-[calc(100vh-73px)]">
        {activeGames.map((game) => (
          <GameWindow
            key={game.id}
            game={game}
            position={windowPositions[game.id]}
            onPositionChange={(pos) => updatePosition(game.id, pos)}
            onFocus={() => bringToFront(game.id)}
            onRemove={() => removeGame(game.id)}
            isAutoArranging={isAutoArranging}
          />
        ))}
        {activeGames.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MonitorPlay className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Click "Add Stream" to start watching</p>
            </div>
          </div>
        )}
      </main>

      {/* Game Selector Modal */}
      <GameSelector onSelectGame={addGame} />
    </div>
  );
}

export default App;