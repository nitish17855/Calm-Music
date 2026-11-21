"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useMood, MOOD_CONFIGS } from '@/context/MoodContext';
import { usePlayer } from '@/context/PlayerContext';
import { MoodMode, Track } from '@/types';
import {
  Play,
  Pause,
  Sparkles,
  Moon,
  CloudRain,
  Compass,
  Heart,
  Car,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Zap,
  Radio,
  Flame,
  Volume2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AudioVisualizerBars from '@/components/visuals/AudioVisualizerBars';
import CustomAudioModal from '@/components/player/CustomAudioModal';

const SCENIC_JOURNEYS: {
  title: string;
  artist: string;
  mood: MoodMode;
  coverUrl: string;
  duration: number;
  audioUrl: string;
}[] = [
  {
    title: 'Midnight Highway Cruise',
    artist: 'Night Drive Sessions',
    mood: 'drive',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    duration: 220,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1885440&format=mp31&from=app-56d30c95',
  },
  {
    title: 'Rain on the Windshield',
    artist: 'Zen Sanctuary',
    mood: 'rain',
    coverUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=400&q=80',
    duration: 215,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1886257&format=mp31&from=app-56d30c95',
  },
  {
    title: 'Sunset Rose Reverie',
    artist: 'Velvet Horizon',
    mood: 'rose',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80',
    duration: 210,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1885437&format=mp31&from=app-56d30c95',
  },
  {
    title: 'Emerald Canopy Stillness',
    artist: 'Verdant Mind',
    mood: 'focus',
    coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    duration: 242,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1888439&format=mp31&from=app-56d30c95',
  },
];

export default function HeroSection() {
  const { mood, setMood, config } = useMood();
  const { isPlaying, togglePlay, playTrack, currentTrack } = usePlayer();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const moodsList: MoodMode[] = ['drive', 'rose', 'night', 'rain', 'focus'];

  const handleLaunchJourney = (journey: typeof SCENIC_JOURNEYS[0]) => {
    setMood(journey.mood);
    const track: Track = {
      id: `journey-${journey.title.toLowerCase().replace(/\s+/g, '-')}`,
      title: journey.title,
      artistName: journey.artist,
      duration: journey.duration,
      audioUrl: journey.audioUrl,
      coverUrl: journey.coverUrl,
      source: 'jamendo',
    };
    playTrack(track);
  };

  return (
    <div className="relative pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      
      {/* Dynamic Glowing Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 glass-pill"
        style={{
          borderColor: `${config.accentColor}40`,
          color: config.accentColor,
        }}
      >
        <Car className="w-3.5 h-3.5" />
        <span>Late-Night Scenic Jungle Drive & Ambient Audio Experience</span>
      </motion.div>

      {/* Main Hero Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12]"
      >
        Soundscapes for <br />
        <span
          className="bg-clip-text text-transparent transition-all duration-700"
          style={{
            backgroundImage: `linear-gradient(135deg, #ffffff 25%, ${config.accentColor} 100%)`,
          }}
        >
          Midnight Drives & Serenity
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed"
      >
        Cruise through a vast misty jungle as living headlights illuminate your path, or sink into calming rain and sunset hues. Search and stream **any song in the world** with live rhythmic equalizer bars.
      </motion.p>

      {/* Real-time Equalizer Audio Preview Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="mt-8 p-3 rounded-2xl glass-panel inline-flex items-center gap-3.5 border border-white/10 shadow-xl"
      >
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
          style={{ backgroundColor: config.accentColor }}
          title={isPlaying ? 'Pause music' : 'Start music'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-white">
            {currentTrack?.title || 'Ambient Frequency Spectrum'}
          </span>
          <span className="text-[10px] text-slate-400">
            {isPlaying ? 'Live 60 FPS audio-reactive waves' : 'Click to feel the rhythm'}
          </span>
        </div>

        <div className="pl-3 border-l border-white/10">
          <AudioVisualizerBars barCount={16} height={28} />
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          href="/search"
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-medium text-white shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: config.accentColor,
            boxShadow: `0 10px 25px -5px ${config.accentColor}60`,
          }}
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Search & Play Any Song</span>
        </Link>

        {/* Start Scenic Jungle Drive Action */}
        <button
          onClick={() => {
            setMood('drive');
            if (!isPlaying) togglePlay();
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-slate-200 glass-pill hover:text-white transition-all"
        >
          <Car className="w-4 h-4 text-emerald-400" />
          <span>Start Scenic Jungle Drive</span>
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-slate-300 glass-pill hover:text-white transition-all"
        >
          <Radio className="w-4 h-4" />
          <span>Stream Audio from Anywhere</span>
        </button>
      </motion.div>

      {/* Featured Scenic Soundscape Journeys */}
      <section className="w-full mt-24 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Curated Scenic Journeys</h2>
            <p className="text-sm text-slate-400 mt-1">
              One-click immersive soundscapes synced directly with dynamic environment visuals.
            </p>
          </div>
          <span className="text-xs font-mono uppercase text-slate-400">
            Selected: <strong className="text-white capitalize">{mood}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCENIC_JOURNEYS.map((j) => {
            const isCurrent = currentTrack?.title === j.title;
            const moodCfg = MOOD_CONFIGS[j.mood];

            return (
              <div
                key={j.title}
                onClick={() => handleLaunchJourney(j)}
                className={`group p-4 rounded-3xl glass-panel glass-panel-hover cursor-pointer border flex flex-col justify-between transition-all duration-300 ${
                  isCurrent ? 'ring-2 ring-white/20' : 'border-white/5'
                }`}
              >
                <div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-3.5 bg-slate-800">
                    <img
                      src={j.coverUrl}
                      alt={j.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: moodCfg.accentColor }}
                      >
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
                    style={{
                      backgroundColor: `${moodCfg.accentColor}20`,
                      color: moodCfg.accentColor,
                      border: `1px solid ${moodCfg.accentColor}40`,
                    }}
                  >
                    {moodCfg.name}
                  </span>

                  <h3 className="text-sm font-semibold text-white tracking-tight truncate">{j.title}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{j.artist}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scenic Route</span>
                  <span className="font-mono text-slate-200">Play Now →</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Mood Explorer Modes */}
      <section id="mood-explorer" className="w-full mt-24 text-left">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Active Living Environments</h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose your scenic atmosphere. Speed is kept steady and natural to prevent eye strain, while rain brings brisk precipitation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {moodsList.map((m) => {
            const item = MOOD_CONFIGS[m];
            const isSelected = mood === m;

            return (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`relative text-left p-5 rounded-3xl glass-panel glass-panel-hover overflow-hidden transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-black' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 0 2px ${item.accentColor}` : undefined,
                }}
              >
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
                  style={{ backgroundColor: item.accentColor }}
                />

                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${item.accentColor}30, ${item.accentColor}10)`,
                      border: `1px solid ${item.accentColor}50`,
                    }}
                  >
                    {m === 'drive' && <Car className="w-5 h-5 text-emerald-400" />}
                    {m === 'rose' && <Heart className="w-5 h-5 text-rose-400" />}
                    {m === 'night' && <Moon className="w-5 h-5 text-indigo-400" />}
                    {m === 'rain' && <CloudRain className="w-5 h-5 text-sky-400" />}
                    {m === 'focus' && <Compass className="w-5 h-5 text-emerald-400" />}
                  </div>

                  {isSelected && (
                    <span
                      className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${item.accentColor}25`,
                        color: item.accentColor,
                        border: `1px solid ${item.accentColor}40`,
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white tracking-tight mb-1">{item.name}</h3>
                <p className="text-xs text-slate-300 font-medium mb-2 line-clamp-1">{item.tagline}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{item.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Agency Standards & Engineering Badges */}
      <section className="w-full mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
        <div className="p-6 rounded-3xl glass-panel">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-emerald-400">
            <Car className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Atmospheric Scenic Canvas</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live 60 FPS perspective cruiser winding through vast misty jungle canopies with realistic glowing headlight cones and tail illumination.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Gentle Audio Reactivity</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Music energy pulses soft light and equalizer bars without dizzying acceleration, preserving eye comfort and mindfulness.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-indigo-400">
            <Headphones className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Universal Track Search</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant search across YouTube Music, Audius, Jamendo, or drop any local audio file directly into the player.
          </p>
        </div>
      </section>

      {/* Custom Stream & File Drop Modal */}
      <CustomAudioModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}
