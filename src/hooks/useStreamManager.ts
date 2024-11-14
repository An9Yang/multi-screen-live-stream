import { useState, useEffect, useRef, RefObject } from 'react';
import Hls from 'hls.js';
import { StreamStatus } from '../types';
import { createHlsInstance, initializeHlsStream, initializeNativeStream } from '../utils/streamUtils';

interface UseStreamManagerProps {
  url: string;
  isMuted: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  onError?: (error: Error) => void;
}

export default function useStreamManager({
  url,
  isMuted,
  videoRef,
  onError,
}: UseStreamManagerProps) {
  const [status, setStatus] = useState<StreamStatus>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const hlsRef = useRef<Hls | null>(null);
  const mountedRef = useRef(true);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const handleError = async (error: unknown) => {
    if (!mountedRef.current) return;

    console.error('Stream error:', error instanceof Error ? error.message : 'Unknown error');
    
    if (retryCount < MAX_RETRIES) {
      setStatus('retrying');
      setRetryCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      initializeStream();
    } else {
      setStatus('error');
      onError?.(error instanceof Error ? error : new Error('Stream playback failed'));
    }
  };

  const initializeStream = async () => {
    const video = videoRef.current;
    if (!video || !mountedRef.current) return;

    try {
      if (Hls.isSupported()) {
        const hls = createHlsInstance();
        hlsRef.current = hls;
        await initializeHlsStream({ hls, video, url, isMuted });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        await initializeNativeStream({ video, url, isMuted });
      } else {
        throw new Error('HLS playback is not supported');
      }

      if (mountedRef.current) {
        setStatus('playing');
      }
    } catch (error) {
      if (mountedRef.current) {
        handleError(error);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    setStatus('loading');
    initializeStream();

    return () => {
      mountedRef.current = false;
      destroyHls();
    };
  }, [url]);

  return {
    status,
    retryCount,
    initializeStream: () => {
      setRetryCount(0);
      initializeStream();
    },
  };
}