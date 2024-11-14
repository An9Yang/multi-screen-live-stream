import React from 'react';
import { RefreshCw } from 'lucide-react';

interface StreamControlsProps {
  isMuted: boolean;
  onRetry: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({ onRetry }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      <button
        onClick={onRetry}
        className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        title="Retry stream"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
};

export default StreamControls;