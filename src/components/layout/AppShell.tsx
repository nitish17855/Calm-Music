"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import MoodBackground from '@/components/visuals/MoodBackground';
import Navbar from '@/components/layout/Navbar';
import PersistentPlayer from '@/components/player/PersistentPlayer';
import { Eye, EyeOff } from 'lucide-react';

interface ZenContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
  setZenMode: (val: boolean) => void;
}

const ZenContext = createContext<ZenContextType>({
  isZenMode: false,
  toggleZenMode: () => {},
  setZenMode: () => {},
});

export const useZen = () => useContext(ZenContext);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { audioEnergy } = usePlayer();
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleZenMode = () => setIsZenMode((prev) => !prev);

  // Keyboard shortcut: Press 'Z' or 'Escape' to toggle Zen / Scenic Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'KeyZ' || (e.code === 'Escape' && isZenMode)) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

  return (
    <ZenContext.Provider value={{ isZenMode, toggleZenMode, setZenMode: setIsZenMode }}>
      {/* Living background reacts gently to audio analyser energy */}
      <MoodBackground audioEnergy={audioEnergy} />

      {/* Persistent Navigation (fades out in Zen Mode) */}
      <div
        className={`transition-all duration-500 ${
          isZenMode ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100'
        }`}
      >
        <Navbar />
      </div>

      {/* Floating Zen Mode Restore Pill (when UI is hidden) */}
      {isZenMode && (
        <button
          onClick={toggleZenMode}
          className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel text-white text-xs font-medium shadow-2xl hover:scale-105 transition-all border border-white/20 animate-in fade-in zoom-in-95 duration-300"
          title="Restore user interface (or press Esc / Z)"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Show Interface (Esc)</span>
        </button>
      )}

      {/* Main Page Content (collapses smoothly in Zen Mode for unobstructed view of the car & landscape) */}
      <main
        className={`min-h-screen pb-32 transition-all duration-700 ease-in-out ${
          isZenMode
            ? 'opacity-0 pointer-events-none scale-95 blur-sm'
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        {children}
      </main>

      {/* Persistent Bottom Audio Player Bar remains accessible */}
      <PersistentPlayer />
    </ZenContext.Provider>
  );
}
