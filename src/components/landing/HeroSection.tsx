"use client";

import React from 'react';
import Link from 'next/link';
import { useMood, MOOD_CONFIGS } from '@/context/MoodContext';
import { MoodMode } from '@/types';
import { Play, Sparkles, Moon, CloudRain, Compass, ArrowRight, ShieldCheck, Headphones, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const { mood, setMood, config } = useMood();

  const moodsList: MoodMode[] = ['night', 'rain', 'focus'];

  return (
    <div className="relative pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      
      {/* Subtle Glowing Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 glass-pill"
        style={{
          borderColor: `${config.accentColor}40`,
          color: config.accentColor,
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Next-Generation Ambient Audio Experience</span>
      </motion.div>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12]"
      >
        Soundscapes for <br />
        <span
          className="bg-clip-text text-transparent transition-all duration-700"
          style={{
            backgroundImage: `linear-gradient(135deg, #ffffff 30%, ${config.accentColor} 100%)`,
          }}
        >
          Deep Focus & Tranquility
        </span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed"
      >
        Immerse yourself in royalty-free ambient music paired with living canvas visualizers. 
        Engineered for creative flow, mindfulness, and deep nighttime restoration.
      </motion.p>

      {/* Interactive Actions */}
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
          <span>Start Listening</span>
        </Link>

        <a
          href="#mood-explorer"
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-slate-200 glass-pill hover:text-white"
        >
          <span>Explore Mood Modes</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>

      {/* Interactive Mood Cards Showcase */}
      <section id="mood-explorer" className="w-full mt-24">
        <div className="text-left mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Environment Modes</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select an environment to modulate visual frequency, particle physics, and audio tone.
            </p>
          </div>
          <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">
            Current: <strong className="text-white capitalize">{mood}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {moodsList.map((m) => {
            const item = MOOD_CONFIGS[m];
            const isSelected = mood === m;

            return (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`relative text-left p-6 rounded-3xl glass-panel glass-panel-hover overflow-hidden transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-black' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 0 2px ${item.accentColor}` : undefined,
                }}
              >
                {/* Mood Accent Glow */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
                  style={{ backgroundColor: item.accentColor }}
                />

                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${item.accentColor}30, ${item.accentColor}10)`,
                      border: `1px solid ${item.accentColor}50`,
                    }}
                  >
                    {m === 'night' && <Moon className="w-6 h-6" style={{ color: item.accentColor }} />}
                    {m === 'rain' && <CloudRain className="w-6 h-6" style={{ color: item.accentColor }} />}
                    {m === 'focus' && <Compass className="w-6 h-6" style={{ color: item.accentColor }} />}
                  </div>

                  {isSelected && (
                    <span
                      className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full"
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

                <h3 className="text-lg font-semibold text-white tracking-tight mb-1">{item.name}</h3>
                <p className="text-xs text-slate-300 font-medium mb-3">{item.tagline}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>Particle Velocity</span>
                  <span className="font-mono text-slate-200">
                    {m === 'rain' ? 'High / Vertical' : m === 'night' ? 'Subtle Drift' : 'Ascending Orbs'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Engineering & Agency Highlights */}
      <section className="w-full mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        <div className="p-6 rounded-2xl glass-panel">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-cyan-400">
            <Headphones className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Legal Music Streaming</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full-track streaming powered by Jamendo and Audius APIs. Zero scraping, zero ad-interruption.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Web Audio API Analyser</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            HTML5 Audio routed into Web Audio AnalyserNodes to drive audio-reactive visuals in 60fps canvas.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1.5">Production Architecture</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Next.js App Router with persistent layout shells, Auth.js, Postgres with Prisma, and Vercel-ready CI.
          </p>
        </div>
      </section>

    </div>
  );
}
