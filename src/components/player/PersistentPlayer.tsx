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
  Tv,
  MonitorSmartphone,
  ChevronDown,
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
    isVideoExpanded,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    audioEnergy,
    toggleVideoExpanded,
  } = usePlayer();

  const { config, mood, drivePerspective } = useMood();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDockedBottom, setIsDockedBottom] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Display as an In-Car Infotainment Tablet when driving in Cockpit View
  const isTabletMode = mood === 'drive' && drivePerspective === 'cockpit' && !isDockedBottom;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seek(newProgress * duration);
  };

  return (
    <>
      {isTabletMode ? (
        /* ------------------------------------------------------------- */
        /* IN-CAR INFOTAINMENT TABLET (Mounted on the BMW Dashboard)    */
        /* ------------------------------------------------------------- */
        <div className="fixed z-40 bottom-[5vh] sm:bottom-[7vh] left-1/2 -translate-x-[15%] lg:-translate-x-[10%] w-[92vw] max-w-[500px] lg:max-w-[560px] transition-all duration-500 animate-in fade-in zoom-in-95 pointer-events-auto">
          {/* Tablet Screen Casing */}
          <div className="relative rounded-2xl bg-[#070e17]/95 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95)] p-3 sm:p-4 text-white overflow-hidden ring-1 ring-white/10">
            
            {/* Ambient Screen Glow reflecting car lighting */}
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-300"
              style={{ backgroundColor: config.accentColor }}
            />

            {/* Automotive Top Header (Mercedes-Benz / GT Infotainment Style) */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5 text-[10px] text-slate-400 font-mono tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="font-semibold text-slate-200 tracking-wider text-[9px] uppercase">
                  MERCEDES-BENZ MBUX • SCENIC GT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] hidden sm:inline">24°C • CANYON RUN</span>
                <button
                  onClick={() => setIsDockedBottom(true)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all text-[9px]"
                  title="Dock player back to bottom of screen"
                >
                  <ChevronDown className="w-3 h-3" />
                  <span>Dock Below</span>
                </button>
              </div>
            </div>

            {/* Main Media Content */}
            <div className="flex items-center gap-3">
              {/* Album Art with Ambient Border */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 shadow-md border border-white/10">
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                {isPlaying && (
                  <div
                    className="absolute inset-0 border rounded-xl pointer-events-none transition-all duration-150"
                    style={{
                      borderColor: currentTrack.source === 'youtube' ? '#ef4444' : config.accentColor,
                      opacity: 0.3 + audioEnergy * 0.7,
                    }}
                  />
                )}
              </div>

              {/* Title & Artist & Equalizer */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate tracking-tight">
                    {currentTrack.title}
                  </h4>
                  <span
                    className={`text-[8.5px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold ${
                      currentTrack.source === 'youtube'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {currentTrack.source}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentTrack.artistName}</p>

                {/* Equalizer Bars on the Tablet */}
                <div className="mt-1 flex items-center">
                  <AudioVisualizerBars barCount={14} height={16} compact />
                </div>
              </div>
            </div>

            {/* Timeline Progress Slider */}
            <div className="w-full flex items-center gap-2 mt-2">
              <span className="text-[9px] font-mono text-slate-400 w-7 text-right">
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
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 5px)` }}
                />
              </div>

              <span className="text-[9px] font-mono text-slate-400 w-7">
                {formatTime(duration)}
              </span>
            </div>

            {/* In-Car Playback Controls & Utility Row */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
              {/* Transport Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleShuffle}
                  className={`p-1 rounded transition-colors ${
                    isShuffle ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-1 rounded text-slate-300 hover:text-white transition-colors"
                  title="Previous"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    backgroundColor: config.accentColor,
                    boxShadow: `0 4px 14px -2px ${config.accentColor}70`,
                  }}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-1 rounded text-slate-300 hover:text-white transition-colors"
                  title="Next"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-1 rounded transition-colors ${
                    repeatMode !== 'off' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center gap-2">
                {currentTrack.source === 'youtube' && (
                  <button
                    onClick={toggleVideoExpanded}
                    className={`p-1 rounded transition-all ${
                      isVideoExpanded ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title={isVideoExpanded ? 'Hide Video Window' : 'Show Floating Video Window'}
                  >
                    <Tv className="w-3.5 h-3.5" />
                  </button>
                )}

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
                    className="w-14 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: config.accentColor }}
                    aria-label="Volume slider"
                  />
                </div>

                <button
                  onClick={() => setIsQueueOpen((prev) => !prev)}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium transition-all ${
                    isQueueOpen ? 'bg-white/15 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Queue"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px]">{queue.length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* In-Car Tablet Stand / Mounting Bracket Connecting into Dashboard */}
          <div className="w-16 h-3 mx-auto bg-gradient-to-b from-[#111827] to-[#020508] border-x border-b border-white/20 rounded-b-md shadow-2xl flex items-center justify-center">
            <div className="w-6 h-0.5 bg-white/15 rounded-full" />
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* STANDARD BOTTOM BAR PLAYER (Or Passenger-Side in Cockpit)    */
        /* ------------------------------------------------------------- */
        <div
          className={`fixed z-40 pb-3 pt-1 transition-all duration-500 ${
            mood === 'drive' && drivePerspective === 'cockpit'
              ? 'bottom-2 right-2 sm:right-6 w-[94vw] max-w-[540px] lg:max-w-[580px]'
              : 'bottom-0 left-0 right-0 px-2 sm:px-6'
          }`}
        >
          <div className="max-w-7xl mx-auto glass-panel rounded-2xl md:rounded-3xl p-3 md:px-5 md:py-3 shadow-2xl border border-white/10 flex flex-col gap-2">
            
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
                        borderColor: currentTrack.source === 'youtube' ? '#ef4444' : config.accentColor,
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
                      className={`text-[9px] font-mono uppercase tracking-wider px-1 py-0.2 rounded font-semibold ${
                        currentTrack.source === 'youtube'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : ''
                      }`}
                      style={
                        currentTrack.source !== 'youtube'
                          ? {
                              backgroundColor: `${config.accentColor}15`,
                              color: config.accentColor,
                            }
                          : undefined
                      }
                    >
                      {currentTrack.source}
                    </span>
                  </div>
                </div>

                {/* Dynamic Equalizer Bars */}
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

              {/* Right: Mode Switcher / Stream / Volume / Queue */}
              <div className="flex items-center gap-2 sm:gap-2.5 justify-end min-w-0 max-w-[34%] sm:max-w-[300px]">
                
                {/* Mount to Dashboard Button (when in Cockpit View) */}
                {mood === 'drive' && drivePerspective === 'cockpit' && isDockedBottom && (
                  <button
                    onClick={() => setIsDockedBottom(false)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-emerald-300 hover:text-white border border-emerald-500/30 text-xs transition-all hover:bg-emerald-500/10"
                    title="Mount player to the BMW Dashboard as an Infotainment Tablet"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px] font-medium">Mount to Dash</span>
                  </button>
                )}

                {/* YouTube Video Toggle Button */}
                {currentTrack.source === 'youtube' && (
                  <button
                    onClick={toggleVideoExpanded}
                    className={`p-2 rounded-xl transition-all ${
                      isVideoExpanded ? 'bg-red-500 text-white' : 'glass-pill text-slate-300 hover:text-white'
                    }`}
                    title={isVideoExpanded ? 'Hide Video Window' : 'Show Floating Video Window'}
                  >
                    <Tv className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Play from Anywhere (Custom Stream / File) */}
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white glass-pill hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  title="Play Audio from Anywhere (Custom URL or Local File Drop)"
                >
                  <Radio className="w-3.5 h-3.5" style={{ color: config.accentColor }} />
                  <span className="text-[11px] font-medium hidden xl:inline">Stream</span>
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
      )}

      {/* Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Custom Stream & File Drop Modal */}
      <CustomAudioModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} />
    </>
  );
}