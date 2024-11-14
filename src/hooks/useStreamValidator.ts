import { useState } from 'react';
import { Channel } from '../types';

export function useStreamValidator() {
  const [validatingChannels, setValidatingChannels] = useState<Set<number>>(new Set());

  const validateStream = async (channel: Channel): Promise<boolean> => {
    try {
      setValidatingChannels(prev => new Set(prev).add(channel.id));
      
      // Try to fetch manifest
      const response = await fetch(channel.url);
      if (!response.ok) return false;
      
      const content = await response.text();
      // Basic validation for HLS manifest
      return content.includes('#EXTM3U');
    } catch {
      return false;
    } finally {
      setValidatingChannels(prev => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });
    }
  };

  return {
    validatingChannels,
    validateStream
  };
}