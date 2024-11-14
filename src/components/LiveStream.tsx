import React, { useEffect, useRef } from 'react';
import useStreamManager from '../hooks/useStreamManager';
import StreamPlayer from './StreamPlayer';
import StreamControls from './StreamControls';

interface LiveStreamProps {
  url: string;
  isMuted: boolean;
  onError?: (error: Error) => void;
}

const LiveStream: React.FC<LiveStreamProps> = ({ url, isMuted, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, retryCount, initializeStream } = useStreamManager({
    url,
    isMuted,
    videoRef,
    onError,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (video && status === 'playing') {
      video.muted = isMuted;
    }
  }, [isMuted, status]);

  return (
    <div className="relative w-full h-full bg-black">
      <StreamPlayer
        ref={videoRef}
        status={status}
        isMuted={isMuted}
        retryCount={retryCount}
      />
      {status === 'playing' && (
        <StreamControls
          isMuted={isMuted}
          onRetry={() => initializeStream()}
        />
      )}
    </div>
  );
};

export default LiveStream;