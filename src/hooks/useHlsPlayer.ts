import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { StreamStatus } from '../types';

interface UseHlsPlayerProps {
  url: string;
  isMuted: boolean;
  onError: (error: Error) => void;
}

export function useHlsPlayer({ url, isMuted, onError }: UseHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<StreamStatus>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const TIMEOUT_DURATION = 15000;

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.removeAttribute('src');
      video.load();
    }
  };

  const createHlsInstance = () => {
    return new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 30 * 1000 * 1000,
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 2,
      manifestLoadingRetryDelay: 1000,
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: 2,
      levelLoadingRetryDelay: 1000,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      startLevel: -1,
      debug: false
    });
  };

  const handleError = async (error: unknown) => {
    if (!mountedRef.current) return;

    const errorMessage = error instanceof Error ? error.message : 'Stream playback failed';
    console.error('Stream error:', errorMessage);
    
    if (retryCount < MAX_RETRIES) {
      setStatus('retrying');
      setRetryCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (mountedRef.current) {
        initializeStream();
      }
    } else {
      setStatus('error');
      onError(new Error(errorMessage));
    }
  };

  const initializeStream = async () => {
    const video = videoRef.current;
    if (!video || !mountedRef.current) return;

    try {
      if (Hls.isSupported()) {
        const hls = createHlsInstance();
        hlsRef.current = hls;

        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Stream initialization timeout'));
          }, TIMEOUT_DURATION);

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              clearTimeout(timeoutId);
              reject(new Error(`HLS Error: ${data.type} - ${data.details}`));
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, async () => {
            clearTimeout(timeoutId);
            try {
              video.muted = isMuted;
              await video.play();
              if (mountedRef.current) {
                setStatus('playing');
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          });

          hls.attachMedia(video);
          hls.loadSource(url);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Stream initialization timeout'));
          }, TIMEOUT_DURATION);

          video.onloadedmetadata = async () => {
            clearTimeout(timeoutId);
            try {
              video.muted = isMuted;
              await video.play();
              if (mountedRef.current) {
                setStatus('playing');
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          };

          video.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Failed to load video'));
          };

          video.src = url;
        });
      } else {
        throw new Error('HLS playback is not supported in this browser');
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
      cleanup();
    };
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && status === 'playing') {
      video.muted = isMuted;
    }
  }, [isMuted, status]);

  return {
    videoRef,
    status,
    retryCount,
    retry: () => {
      if (mountedRef.current) {
        setRetryCount(0);
        initializeStream();
      }
    }
  };
}