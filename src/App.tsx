import React, { useState } from 'react';
import { Maximize2, Minimize2, Plus, MonitorPlay } from 'lucide-react';
import GameWindow from './components/GameWindow';
import GameSelector from './components/GameSelector';
import { Game, WindowPosition } from './types';

function App() {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowPositions, setWindowPositions] = useState<Record<number, WindowPosition>>({});

  const addGame = (game: Game) => {
    if (activeGames.length < 4) {
      setActiveGames([...activeGames, game]);
      // Position new window with offset from last window
      const offset = activeGames.length * 40;
      setWindowPositions({
        ...windowPositions,
        [game.id]: {
          x: 100 + offset,
          y: 100 + offset,
          width: 480,
          height: 320,
          zIndex: Math.max(...Object.values(windowPositions).map(p => p.zIndex || 0), 0) + 1
        }
      });
    }
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
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </button>
            <button
              onClick={() => document.getElementById('game-selector')?.showModal()}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={activeGames.length >= 4}
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