import React, { forwardRef } from 'react';
import { StreamStatus } from '../types';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';

interface StreamPlayerProps {
  status: StreamStatus;
  isMuted: boolean;
  retryCount: number;
}

const StreamPlayer = forwardRef<HTMLVideoElement, StreamPlayerProps>(
  ({ status, isMuted, retryCount }, ref) => {
    const renderOverlay = () => {
      switch (status) {
        case 'loading':
          return (
            <div className="flex flex-col items-center space-y-2">
              <Loader className="w-8 h-8 animate-spin text-red-500" />
              <span className="text-sm">Loading stream...</span>
            </div>
          );
        case 'retrying':
          return (
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
              <span className="text-sm">Retrying... (Attempt {retryCount}/3)</span>
            </div>
          );
        case 'error':
          return (
            <div className="flex flex-col items-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm">Failed to load stream</span>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <>
        <video
          ref={ref}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          muted={isMuted}
          controls={status === 'playing'}
        />
        {status !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white">
            {renderOverlay()}
          </div>
        )}
      </>
    );
  }
);

StreamPlayer.displayName = 'StreamPlayer';

export default StreamPlayer;