"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MoodMode, MoodConfig, DrivePerspective } from '@/types';

export const MOOD_CONFIGS: Record<MoodMode, MoodConfig> = {
  drive: {
    id: 'drive',
    name: 'Scenic Canyon Drive',
    tagline: 'Sunset grand tourer cruising through panoramic canyon ridges',
    description: 'A breathtaking scenic mountain pass through terracotta canyon cliffs and alpine peaks under a glowing petrol sky.',
    icon: 'Car',
    gradient: {
      from: '#244855', // Deep Petrol Teal
      via: '#874F41',  // Earthy Canyon Bronze
      to: '#E64833',   // Sunburst Terracotta
    },
    accentColor: '#E64833',
    particleColor: 'rgba(251, 233, 208, 0.45)', // Warm desert cream golden embers
    particleCount: 40,
  },
  rose: {
    id: 'rose',
    name: 'Sunset Rose',
    tagline: 'Warm blush serenity, gentle ember glow and velvet calm',
    description: 'Soft calming crimson-rose twilight hues and floating petals designed to induce deep emotional peace.',
    icon: 'Heart',
    gradient: {
      from: '#16080e',
      via: '#2c101c',
      to: '#421727',
    },
    accentColor: '#f43f5e',
    particleColor: 'rgba(251, 113, 133, 0.4)',
    particleCount: 50,
  },
  night: {
    id: 'night',
    name: 'Deep Night',
    tagline: 'Starlit tranquil expanse for nocturnal reflection',
    description: 'Deep cosmic blues and slow starlight drifts designed to lower mental fatigue.',
    icon: 'Moon',
    gradient: {
      from: '#05070e',
      via: '#0c1222',
      to: '#161329',
    },
    accentColor: '#818cf8',
    particleColor: 'rgba(165, 180, 252, 0.4)',
    particleCount: 55,
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain',
    tagline: 'Melancholic drizzle and misty ripples',
    description: 'Cool slate-teal tones with brisk precipitation and droplet ripples.',
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
    particleColor: 'rgba(52, 211, 153, 0.4)',
    particleCount: 40,
  },
};

interface MoodContextType {
  mood: MoodMode;
  config: MoodConfig;
  setMood: (mood: MoodMode) => void;
  toggleNextMood: () => void;
  drivePerspective: DrivePerspective;
  setDrivePerspective: (p: DrivePerspective) => void;
  toggleDrivePerspective: () => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<MoodMode>('drive');
  const [drivePerspective, setDrivePerspectiveState] = useState<DrivePerspective>('cockpit');

  useEffect(() => {
    // Read persisted mood if available
    const saved = localStorage.getItem('calm_preferred_mood') as MoodMode;
    if (saved && MOOD_CONFIGS[saved]) {
      setMoodState(saved);
    }
    const savedPerspective = localStorage.getItem('calm_drive_perspective') as DrivePerspective;
    if (savedPerspective === 'cockpit' || savedPerspective === 'third-person') {
      setDrivePerspectiveState(savedPerspective);
    }
  }, []);

  const setMood = (newMood: MoodMode) => {
    setMoodState(newMood);
    try {
      localStorage.setItem('calm_preferred_mood', newMood);
    } catch {}
  };

  const setDrivePerspective = (p: DrivePerspective) => {
    setDrivePerspectiveState(p);
    try {
      localStorage.setItem('calm_drive_perspective', p);
    } catch {}
  };

  const toggleDrivePerspective = () => {
    const next = drivePerspective === 'cockpit' ? 'third-person' : 'cockpit';
    setDrivePerspective(next);
  };

  const toggleNextMood = () => {
    const moods: MoodMode[] = ['drive', 'rose', 'night', 'rain', 'focus'];
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
        drivePerspective,
        setDrivePerspective,
        toggleDrivePerspective,
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
