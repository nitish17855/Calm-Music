export type MoodMode = 'night' | 'rain' | 'focus' | 'rose';

export interface MoodConfig {
  id: MoodMode;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: {
    from: string;
    via: string;
    to: string;
  };
  accentColor: string;
  particleColor: string;
  particleCount: number;
}

export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName?: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  source: 'jamendo' | 'audius' | 'custom' | 'local';
  waveform?: number[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface SearchResult {
  tracks: Track[];
  source: 'jamendo' | 'audius' | 'curated';
  total: number;
}
