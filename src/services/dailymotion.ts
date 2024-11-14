import { Game } from '../types';

interface DailymotionVideo {
  id: string;
  title: string;
  channel: string;
  duration: number;
}

interface DailymotionResponse {
  list: DailymotionVideo[];
}

const DAILYMOTION_API = 'https://api.dailymotion.com/videos';

export async function fetchLiveGames(): Promise<Game[]> {
  try {
    const params = new URLSearchParams({
      fields: 'id,title,channel,duration',
      channel: 'sport',
      flags: 'live_onair',
      limit: '4',
    });

    const response = await fetch(`${DAILYMOTION_API}?${params}`);
    if (!response.ok) throw new Error('API request failed');

    const data: DailymotionResponse = await response.json();
    
    return data.list.map((video, index) => ({
      id: index + 1,
      title: video.title,
      league: video.channel,
      status: 'LIVE',
      minute: generateRandomMinute(),
      score: generateRandomScore(),
      streamUrl: generateStreamUrl(video.id),
    }));
  } catch (error) {
    console.error('Failed to fetch live games:', error);
    throw new Error('Failed to load live games');
  }
}

function generateRandomMinute(): string {
  return `${Math.floor(Math.random() * 90)}'`;
}

function generateRandomScore(): string {
  return `${Math.floor(Math.random() * 5)} - ${Math.floor(Math.random() * 5)}`;
}

function generateStreamUrl(videoId: string): string {
  // Use Dailymotion's official player URL with optimal parameters
  return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=1&sharing-enable=0&queue-enable=0&ui-logo=0`;
}