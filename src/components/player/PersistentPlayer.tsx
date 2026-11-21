"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Radio,
} from 'lucide-react';
import QueueDrawer from './QueueDrawer';
import AudioVisualizerBars from '@/components/visuals/AudioVisualizerBars';
import CustomAudioModal from './CustomAudioModal';

export default function PersistentPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    queue,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    audioEnergy,
  } = usePlayer();

  const { config } = useMood();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-6 pb-3 pt-1">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl md:rounded-3xl p-3 md:px-6 md:py-3.5 shadow-2xl border border-white/10 flex flex-col gap-2">
          
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Track Information & Live Equalizer Visualizer Bars */}
            <div className="flex items-center gap-3 min-w-0 max-w-[34%] sm:max-w-[320px]">
              <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 shadow-md">
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
                {isPlaying && (
                  <div
                    className="absolute inset-0 border-2 rounded-xl pointer-events-none transition-all duration-150"
                    style={{
                      borderColor: config.accentColor,
                      opacity: 0.3 + audioEnergy * 0.7,
                    }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs md:text-sm font-semibold text-white truncate tracking-tight">
                  {currentTrack.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                  <span className="truncate">{currentTrack.artistName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.2 rounded"
                    style={{
                      backgroundColor: `${config.accentColor}15`,
                      color: config.accentColor,
                    }}
                  >
                    {currentTrack.source}
                  </span>
                </div>
              </div>

              {/* Dynamic Equalizer Bars jumping up and down to the music */}
              <div className="hidden lg:block flex-shrink-0 pl-1">
                <AudioVisualizerBars barCount={12} height={26} compact />
              </div>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex flex-col items-center flex-1 max-w-xl">
              <div className="flex items-center gap-3 md:gap-5">
                
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                    isShuffle ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ color: isShuffle ? config.accentColor : undefined }}
                  title="Shuffle queue"
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* Previous */}
                <button
                  onClick={prevTrack}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Previous (or restart)"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
                  style={{
                    backgroundColor: config.accentColor,
                    boxShadow: `0 8px 20px -4px ${config.accentColor}70`,
                  }}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={nextTrack}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Next track"
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Repeat */}
                <button
                  onClick={toggleRepeat}
                  className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                    repeatMode !== 'off' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ color: repeatMode !== 'off' ? config.accentColor : undefined }}
                  title={`Repeat: ${repeatMode}`}
                  aria-label="Repeat mode"
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Progress Bar & Timestamps */}
              <div className="w-full flex items-center gap-2.5 mt-1.5">
                <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                  {formatTime(currentTime)}
                </span>

                <div
                  className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group py-1"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
                    seek(newProgress * duration);
                  }}
                  role="slider"
                  aria-valuenow={currentTime}
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-label="Seek progress slider"
                >
                  <div
                    className="absolute top-1 bottom-1 left-0 rounded-full transition-all duration-100"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: config.accentColor,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow transition-opacity"
                    style={{ left: `calc(${progressPercent}% - 6px)` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-400 w-8">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right: Custom URL / File Stream + Volume & Queue */}
            <div className="flex items-center gap-2 sm:gap-3 justify-end min-w-0 max-w-[32%] sm:max-w-[260px]">
              
              {/* Play from Anywhere (Custom Stream / File) */}
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="p-2 rounded-xl text-slate-300 hover:text-white glass-pill hover:bg-white/10 transition-colors flex items-center gap-1.5"
                title="Play Audio from Anywhere (Custom URL or Local File Drop)"
              >
                <Radio className="w-3.5 h-3.5" style={{ color: config.accentColor }} />
                <span className="text-[11px] font-medium hidden xl:inline">Stream Anywhere</span>
              </button>

              {/* Volume Slider */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: config.accentColor }}
                  aria-label="Volume slider"
                />
              </div>

              {/* Queue Button */}
              <button
                onClick={() => setIsQueueOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isQueueOpen ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                title="Toggle Queue"
                aria-label="Open queue drawer"
              >
                <ListMusic className="w-4 h-4" />
                <span className="text-[11px] font-mono hidden sm:inline">{queue.length}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Custom Stream & File Drop Modal */}
      <CustomAudioModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} />
    </>
  );
}
