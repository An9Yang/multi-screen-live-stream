import Hls from 'hls.js';

const TIMEOUT_DURATION = 20000;

interface StreamConfig {
  video: HTMLVideoElement;
  url: string;
  isMuted: boolean;
}

interface HlsStreamConfig extends StreamConfig {
  hls: Hls;
}

export function createHlsInstance(): Hls {
  return new Hls({
    enableWorker: true,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 30 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 2,
    manifestLoadingTimeOut: TIMEOUT_DURATION,
    manifestLoadingMaxRetry: 2,
    manifestLoadingRetryDelay: 1000,
    levelLoadingTimeOut: TIMEOUT_DURATION,
    levelLoadingMaxRetry: 2,
    levelLoadingRetryDelay: 1000,
    fragLoadingTimeOut: TIMEOUT_DURATION,
    fragLoadingMaxRetry: 2,
    fragLoadingRetryDelay: 1000,
    startLevel: -1,
    abrEwmaDefaultEstimate: 500000,
    testBandwidth: true,
    progressive: true,
    lowLatencyMode: false,
  });
}

export function initializeHlsStream({ hls, video, url, isMuted }: HlsStreamConfig): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Stream initialization timeout'));
    }, TIMEOUT_DURATION);

    const cleanup = () => {
      clearTimeout(timeout);
      hls.off(Hls.Events.MEDIA_ATTACHED, onMediaAttached);
      hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      hls.off(Hls.Events.ERROR, onError);
    };

    const onMediaAttached = () => {
      hls.loadSource(url);
    };

    const onManifestParsed = async () => {
      cleanup();
      try {
        video.muted = isMuted;
        await video.play();
        resolve();
      } catch (error) {
        video.muted = true;
        try {
          await video.play();
          resolve();
        } catch (retryError) {
          reject(retryError);
        }
      }
    };

    const onError = (_event: any, data: Hls.errorData) => {
      if (data.fatal) {
        cleanup();
        reject(new Error(data.details));
      }
    };

    hls.on(Hls.Events.MEDIA_ATTACHED, onMediaAttached);
    hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    hls.on(Hls.Events.ERROR, onError);

    try {
      hls.attachMedia(video);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function initializeNativeStream({ video, url, isMuted }: StreamConfig): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Stream initialization timeout'));
    }, TIMEOUT_DURATION);

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
    };

    const onLoadedMetadata = async () => {
      cleanup();
      try {
        video.muted = isMuted;
        await video.play();
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    video.src = url;
    video.load();
  });
}