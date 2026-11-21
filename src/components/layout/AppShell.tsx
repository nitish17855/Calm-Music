"use client";

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import MoodBackground from '@/components/visuals/MoodBackground';
import Navbar from '@/components/layout/Navbar';
import PersistentPlayer from '@/components/player/PersistentPlayer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { audioEnergy } = usePlayer();

  return (
    <>
      {/* Living background reacts gently to audio analyser energy */}
      <MoodBackground audioEnergy={audioEnergy} />

      {/* Persistent Navigation */}
      <Navbar />

      {/* Main Page Content (swapped during route changes without unmounting player/visuals) */}
      <main className="min-h-screen pb-32">
        {children}
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <PersistentPlayer />
    </>
  );
}
