"use client";

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';

interface AudioVisualizerBarsProps {
  barCount?: number;
  height?: number; // max height in px
  compact?: boolean;
}

export default function AudioVisualizerBars({
  barCount = 16,
  height = 36,
  compact = false,
}: AudioVisualizerBarsProps) {
  const { frequencyData, isPlaying } = usePlayer();
  const { config } = useMood();

  const bars = frequencyData.slice(0, barCount);

  return (
    <div
      className={`flex items-end gap-[3px] select-none ${
        compact ? 'h-6 px-1' : 'h-9 px-2'
      }`}
      aria-hidden="true"
      title="Live Audio Equalizer"
    >
      {bars.map((val, idx) => {
        // Height calculated with non-linear curve for musical aesthetic
        const normalized = Math.min(1, Math.max(0.12, Math.pow(val, 0.85)));
        const barHeight = Math.round(normalized * height);

        return (
          <div
            key={idx}
            className="w-[3px] sm:w-[4px] rounded-full transition-all duration-75 ease-out shadow-sm"
            style={{
              height: isPlaying ? `${barHeight}px` : '4px',
              backgroundColor: config.accentColor,
              opacity: isPlaying ? 0.45 + val * 0.55 : 0.25,
              boxShadow: isPlaying && val > 0.4
                ? `0 0 8px ${config.accentColor}80`
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
