import React, { useState, useCallback } from 'react';
import { Game } from '../types';
import { channels } from '../services/channels';
import { Loader, AlertCircle } from 'lucide-react';
import { useStreamValidator } from '../hooks/useStreamValidator';
import { useToast } from '../components/ui/Toast';

interface GameSelectorProps {
  onSelectGame: (game: Game) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { validatingChannels, validateStream } = useStreamValidator();
  const [failedChannels, setFailedChannels] = useState<Set<number>>(new Set());
  const { addToast } = useToast();
  
  const categories = ['all', ...new Set(channels.map(channel => channel.category))];
  
  const filteredChannels = selectedCategory === 'all' 
    ? channels 
    : channels.filter(channel => channel.category === selectedCategory);

  const handleSelectChannel = useCallback(async (channel: typeof channels[0]) => {
    if (validatingChannels.has(channel.id)) return;
    
    try {
      const isValid = await validateStream(channel);
      
      if (!isValid) {
        setFailedChannels(prev => new Set(prev).add(channel.id));
        addToast('Stream is currently unavailable', 'error');
        return;
      }

      const game: Game = {
        id: Date.now(), // Ensure unique IDs even for same channel
        title: channel.name,
        league: channel.category,
        status: 'LIVE',
        minute: 'LIVE',
        score: channel.country,
        streamUrl: channel.url
      };
      
      onSelectGame(game);
      (document.getElementById('game-selector') as HTMLDialogElement)?.close();
    } catch (error) {
      console.error('Failed to validate stream:', error);
      addToast('Failed to validate stream', 'error');
    }
  }, [onSelectGame, validateStream, validatingChannels, addToast]);

  return (
    <dialog id="game-selector" className="bg-gray-800 text-white rounded-lg p-0 backdrop:bg-black/50">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Live Channels</h2>
        
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredChannels.map((channel) => {
            const isValidating = validatingChannels.has(channel.id);
            const hasFailed = failedChannels.has(channel.id);

            return (
              <div
                key={channel.id}
                className={`bg-gray-700 p-4 rounded-lg transition-colors ${
                  isValidating
                    ? 'opacity-75 cursor-wait'
                    : hasFailed
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:bg-gray-600 cursor-pointer'
                }`}
                onClick={() => {
                  if (!isValidating && !hasFailed) {
                    handleSelectChannel(channel);
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{channel.name}</h3>
                      <span className={`text-sm font-semibold flex items-center ${
                        hasFailed ? 'text-red-400' : 'text-red-500'
                      }`}>
                        {isValidating ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : hasFailed ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                            LIVE
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-300">
                      <span>{channel.category}</span>
                      <span>•</span>
                      <span>{channel.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <form method="dialog" className="border-t border-gray-700 p-4 flex justify-end">
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          Close
        </button>
      </form>
    </dialog>
  );
};

export default GameSelector;