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
  ChevronUp,
  X,
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seek(newProgress * duration);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE COMPACT BOTTOM DOCK (< sm) - Sleek, Touch-Friendly     */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pointer-events-auto bg-[#070e17]/96 backdrop-blur-2xl border-t border-white/15 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {/* Micro Timeline Scrubber at the top edge of mobile bar */}
        <div
          className="relative w-full h-1 bg-white/10 cursor-pointer"
          onClick={handleSeek}
          role="slider"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
        >
          <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-100"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: config.accentColor,
            }}
          />
        </div>

        {/* Mobile Control Bar Content */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          {/* Album Art & Title -> Tapping expands to full MBUX controls */}
          <div
            onClick={() => setIsMobileExpanded(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer active:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 shadow-md">
              <Image
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                fill
                sizes="40px"
                className="object-cover"
              />
              {isPlaying && (
                <div
                  className="absolute inset-0 border-2 rounded-xl pointer-events-none"
                  style={{ borderColor: config.accentColor }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate tracking-tight">
                {currentTrack.title}
              </h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {currentTrack.artistName}
              </p>
            </div>
          </div>

          {/* Playback Controls & Queue */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={prevTrack}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Previous Track"
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
              style={{
                backgroundColor: config.accentColor,
                boxShadow: `0 4px 14px -2px ${config.accentColor}80`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Next Track"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsQueueOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white relative active:scale-95 transition-all ml-1"
              title="Queue"
              aria-label="Queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black text-[8px] font-bold flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileExpanded(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Expand Controls"
              aria-label="Expand player"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP DOCKED BOTTOM BAR (sm:block) - Centered & Unobtrusive */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden sm:block fixed bottom-3 left-1/2 -translate-x-1/2 w-[95vw] max-w-4xl z-40 pointer-events-auto">
        <div className="glass-panel rounded-2xl lg:rounded-3xl px-4 py-2.5 shadow-2xl border border-white/15 bg-[#070e17]/92 backdrop-blur-2xl flex flex-col gap-1.5">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Track Information & Live Equalizer Visualizer */}
            <div className="flex items-center gap-3 min-w-0 max-w-[32%] sm:max-w-[280px]">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 shadow-md">
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
                {isPlaying && (
                  <div
                    className="absolute inset-0 border-2 rounded-xl pointer-events-none transition-all duration-150"
                    style={{
                      borderColor: config.accentColor,
                      opacity: 0.4 + audioEnergy * 0.6,
                    }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate tracking-tight">
                  {currentTrack.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                  <span className="truncate">{currentTrack.artistName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.2 rounded font-semibold"
                    style={{
                      backgroundColor: `${config.accentColor}20`,
                      color: config.accentColor,
                    }}
                  >
                    {currentTrack.source}
                  </span>
                </div>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="hidden lg:block flex-shrink-0 pl-1">
                <AudioVisualizerBars barCount={10} height={22} compact />
              </div>
            </div>

            {/* Center: Playback Transport & Scrubber */}
            <div className="flex flex-col items-center flex-1 max-w-md">
              <div className="flex items-center gap-3">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`p-1 rounded-lg transition-colors ${
                    isShuffle ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ color: isShuffle ? config.accentColor : undefined }}
                  title="Shuffle queue"
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Previous */}
                <button
                  onClick={prevTrack}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Previous track"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    backgroundColor: config.accentColor,
                    boxShadow: `0 4px 16px -2px ${config.accentColor}80`,
                  }}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={nextTrack}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Next track"
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Repeat */}
                <button
                  onClick={toggleRepeat}
                  className={`p-1 rounded-lg transition-colors ${
                    repeatMode !== 'off' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ color: repeatMode !== 'off' ? config.accentColor : undefined }}
                  title={`Repeat: ${repeatMode}`}
                  aria-label="Repeat mode"
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Progress Bar & Timestamps */}
              <div className="w-full flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                  {formatTime(currentTime)}
                </span>

                <div
                  className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group py-1"
                  onClick={handleSeek}
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

            {/* Right: Volume & Queue */}
            <div className="flex items-center gap-2.5 justify-end min-w-0 max-w-[32%] sm:max-w-[240px]">
              {/* Volume Slider */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-14 h-1 bg-white/15 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: config.accentColor }}
                  aria-label="Volume slider"
                />
              </div>

              {/* Queue Button */}
              <button
                onClick={() => setIsQueueOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                  isQueueOpen ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                title="Toggle Queue"
                aria-label="Open queue drawer"
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">{queue.length}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE EXPANDED FULL MBUX MODAL (< sm)                         */}
      {/* ------------------------------------------------------------- */}
      {isMobileExpanded && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 pointer-events-auto">
          <div className="w-full bg-[#0a1219] border-t border-white/20 rounded-t-3xl p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="font-mono text-xs uppercase font-semibold text-slate-300">
                  MBUX Infotainment
                </span>
              </div>
              <button
                onClick={() => setIsMobileExpanded(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Album Cover & Details */}
            <div className="flex flex-col items-center text-center my-4">
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-4">
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight px-4 line-clamp-1">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{currentTrack.artistName}</p>

              {/* Visualizer bars in sheet */}
              <div className="mt-3">
                <AudioVisualizerBars barCount={18} height={20} compact />
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="w-full flex items-center gap-2.5 my-3">
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                className="relative flex-1 h-2 bg-white/10 rounded-full cursor-pointer py-1"
                onClick={handleSeek}
                role="slider"
                aria-valuenow={currentTime}
                aria-valuemin={0}
                aria-valuemax={duration}
              >
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-100"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: config.accentColor,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-8">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback Transport Buttons */}
            <div className="flex items-center justify-center gap-6 my-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-colors ${
                  isShuffle ? 'text-emerald-400' : 'text-slate-400'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="p-2 text-slate-300 hover:text-white"
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
                style={{
                  backgroundColor: config.accentColor,
                  boxShadow: `0 8px 24px -4px ${config.accentColor}80`,
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 text-slate-300 hover:text-white"
                title="Next Track"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-xl transition-colors ${
                  repeatMode !== 'off' ? 'text-emerald-400' : 'text-slate-400'
                }`}
                title="Repeat"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume & Utility Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <button onClick={toggleMute} className="text-slate-400">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: config.accentColor }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsQueueOpen(true);
                    setIsMobileExpanded(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium"
                >
                  <ListMusic className="w-4 h-4" />
                  <span>Queue ({queue.length})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Custom Stream & File Drop Modal */}
      <CustomAudioModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} />
    </>
  );
}
