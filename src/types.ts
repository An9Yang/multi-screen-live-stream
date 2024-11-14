export interface Game {
  id: number;
  title: string;
  league: string;
  status: string;
  minute: string;
  score: string;
  streamUrl: string;
}

export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Channel {
  id: number;
  name: string;
  category: string;
  url: string;
  country: string;
  logo: string;
}

export type StreamStatus = 'loading' | 'playing' | 'retrying' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}