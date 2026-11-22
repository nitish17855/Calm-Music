"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import MoodBackground from '@/components/visuals/MoodBackground';
import Navbar from '@/components/layout/Navbar';
import PersistentPlayer from '@/components/player/PersistentPlayer';
import AddToPlaylistModal from '@/components/playlist/AddToPlaylistModal';
import { Eye, EyeOff, Compass } from 'lucide-react';

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
  const { mood, drivePerspective, toggleDrivePerspective } = useMood();
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleZenMode = () => setIsZenMode((prev) => !prev);

  // Keyboard shortcuts:
  // - 'Z' or 'Escape': toggle Zen / Scenic Mode
  // - 'V': toggle BMW Driver POV vs Exterior Third-Person POV (when in Jungle Drive mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'KeyZ' || (e.code === 'Escape' && isZenMode)) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.code === 'KeyV' && mood === 'drive') {
        e.preventDefault();
        toggleDrivePerspective();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, mood, toggleDrivePerspective]);

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

      {/* Floating Zen Controls (when UI is hidden) */}
      {isZenMode && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
          {mood === 'drive' && (
            <button
              onClick={toggleDrivePerspective}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-panel text-white text-xs font-medium shadow-2xl hover:scale-105 transition-all border border-emerald-500/30 bg-black/60"
              title="Toggle BMW View: Driver Cockpit / Chase (Press V)"
            >
              <span>{drivePerspective === 'cockpit' ? '🚘 Cockpit View' : '🚗 Chase View'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">V</span>
            </button>
          )}

          <button
            onClick={toggleZenMode}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel text-white text-xs font-medium shadow-2xl hover:scale-105 transition-all border border-white/20 bg-black/60"
            title="Restore user interface (or press Esc / Z)"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Show Interface (Esc)</span>
          </button>
        </div>
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

      {/* Global Add to Playlist Modal */}
      <AddToPlaylistModal />
    </ZenContext.Provider>
  );
}
