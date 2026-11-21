"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MoodMode, MoodConfig } from '@/types';

export const MOOD_CONFIGS: Record<MoodMode, MoodConfig> = {
  night: {
    id: 'night',
    name: 'Deep Night',
    tagline: 'Starlit tranquil expanse for nocturnal reflection',
    description: 'Deep cosmic blues and starlight drifts designed to lower mental fatigue.',
    icon: 'Moon',
    gradient: {
      from: '#05070e',
      via: '#0c1222',
      to: '#161329',
    },
    accentColor: '#818cf8',
    particleColor: 'rgba(165, 180, 252, 0.6)',
    particleCount: 65,
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain',
    tagline: 'Melancholic drizzle and misty ripples',
    description: 'Cool slate-teal tones with subtle falling precipitation and droplet ripples.',
    icon: 'CloudRain',
    gradient: {
      from: '#061017',
      via: '#0b1d28',
      to: '#0d2b35',
    },
    accentColor: '#38bdf8',
    particleColor: 'rgba(56, 189, 248, 0.5)',
    particleCount: 90,
  },
  focus: {
    id: 'focus',
    name: 'Forest Focus',
    tagline: 'Emerald canopy and sun-dappled stillness',
    description: 'Warm organic moss and emerald hues tuned for sustained creative concentration.',
    icon: 'Compass',
    gradient: {
      from: '#05110d',
      via: '#092119',
      to: '#112f22',
    },
    accentColor: '#34d399',
    particleColor: 'rgba(52, 211, 153, 0.55)',
    particleCount: 50,
  },
};

interface MoodContextType {
  mood: MoodMode;
  config: MoodConfig;
  setMood: (mood: MoodMode) => void;
  toggleNextMood: () => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<MoodMode>('night');

  useEffect(() => {
    // Read persisted mood if available
    const saved = localStorage.getItem('calm_preferred_mood') as MoodMode;
    if (saved && MOOD_CONFIGS[saved]) {
      setMoodState(saved);
    }
  }, []);

  const setMood = (newMood: MoodMode) => {
    setMoodState(newMood);
    try {
      localStorage.setItem('calm_preferred_mood', newMood);
    } catch {}
  };

  const toggleNextMood = () => {
    const moods: MoodMode[] = ['night', 'rain', 'focus'];
    const nextIndex = (moods.indexOf(mood) + 1) % moods.length;
    setMood(moods[nextIndex]);
  };

  return (
    <MoodContext.Provider
      value={{
        mood,
        config: MOOD_CONFIGS[mood],
        setMood,
        toggleNextMood,
      }}
    >
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}
