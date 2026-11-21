"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useMood, MOOD_CONFIGS } from '@/context/MoodContext';
import { useZen } from '@/components/layout/AppShell';
import { MoodMode } from '@/types';
import { Moon, CloudRain, Compass, Heart, Car, Music, User, LogOut, Eye, Search, SlidersHorizontal, X } from 'lucide-react';

const MOOD_ICONS: Record<MoodMode, React.ReactNode> = {
  drive: <Car className="w-4 h-4" />,
  rose: <Heart className="w-4 h-4" />,
  night: <Moon className="w-4 h-4" />,
  rain: <CloudRain className="w-4 h-4" />,
  focus: <Compass className="w-4 h-4" />,
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mood, setMood, config, drivePerspective, toggleDrivePerspective } = useMood();
  const { toggleZenMode } = useZen();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Discover' },
    { href: '/search', label: 'Search' },
    { href: '/library', label: 'Library' },
  ];

  const moods: MoodMode[] = ['drive', 'rose', 'night', 'rain', 'focus'];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 px-3 md:px-8 py-2.5 sm:py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-2xl border border-white/10 shadow-lg">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${config.accentColor}50, ${config.accentColor}15)`,
                border: `1px solid ${config.accentColor}60`,
              }}
            >
              <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-wide text-white">
                Calm
              </span>
              <span
                className="text-[9px] sm:text-[10px] font-mono tracking-widest px-1.5 py-0.2 rounded-full uppercase font-medium"
                style={{
                  background: `${config.accentColor}25`,
                  color: config.accentColor,
                  border: `1px solid ${config.accentColor}40`,
                }}
              >
                Music
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* DESKTOP RIGHT SECTION: Full View Controls */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
            
            {/* Perspective Toggle (when in Jungle Drive mode) */}
            {mood === 'drive' && (
              <button
                onClick={toggleDrivePerspective}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium glass-pill text-emerald-300 hover:text-white border border-emerald-500/30 transition-all hover:bg-emerald-500/10"
                title="Toggle Perspective: Driver Cockpit / Chase (Press V)"
              >
                <span>{drivePerspective === 'cockpit' ? '🚘 Cockpit' : '🚗 Chase'}</span>
                <span className="hidden lg:inline text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">V</span>
              </button>
            )}

            {/* Zen View / Scenic Mode Toggle Button */}
            <button
              onClick={toggleZenMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium glass-pill text-slate-300 hover:text-white transition-all"
              title="Toggle Scenic View / Hide UI (Press Z or Esc)"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Scenic View</span>
            </button>

            {/* Mood Mode Selector */}
            <div
              className="flex items-center p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto"
              role="radiogroup"
              aria-label="Select ambient mood mode"
            >
              {moods.map((m) => {
                const active = mood === m;
                const cfg = MOOD_CONFIGS[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    role="radio"
                    aria-checked={active}
                    title={`Switch to ${cfg.name}`}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                      active
                        ? 'text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: active ? `${cfg.accentColor}25` : 'transparent',
                      border: active ? `1px solid ${cfg.accentColor}60` : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: active ? cfg.accentColor : 'inherit' }}>
                      {MOOD_ICONS[m]}
                    </span>
                    <span className="capitalize hidden xl:inline">{m}</span>
                  </button>
                );
              })}
            </div>

            {/* User Auth Status */}
            {session?.user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <Link
                  href="/library"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-xs text-white"
                  title={session.user.name || 'Account'}
                >
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span className="truncate max-w-[80px] hidden sm:inline text-[11px] font-medium">
                    {session.user.name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white transition-all glass-pill hover:bg-white/10"
              >
                Sign In
              </Link>
            )}

          </div>

          {/* MOBILE RIGHT SECTION: Ultra-Clean Action Bar (No Clutter!) */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Quick Search Button */}
            <Link
              href="/search"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium glass-pill text-white transition-all hover:bg-white/15"
              style={{
                backgroundColor: `${config.accentColor}25`,
                border: `1px solid ${config.accentColor}50`,
              }}
              title="Search Music"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Search</span>
            </Link>

            {/* Driving Perspective Toggle (when in drive mode) */}
            {mood === 'drive' && (
              <button
                onClick={toggleDrivePerspective}
                className="p-1.5 rounded-xl text-emerald-300 glass-pill border border-emerald-500/30 transition-all hover:bg-emerald-500/10 text-xs"
                title="Toggle Cockpit / Chase View"
              >
                <span>{drivePerspective === 'cockpit' ? '🚘' : '🚗'}</span>
              </button>
            )}

            {/* Quick Settings & Themes Drawer Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-xl glass-pill text-slate-200 hover:text-white transition-all border border-white/15"
              title="Mood Settings & Menu"
              aria-label="Open settings menu"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE SETTINGS & MOOD DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full bg-[#0d151c] border-t border-white/20 rounded-t-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm tracking-wide">Atmosphere & Settings</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mood Environments Grid */}
            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2.5">
                Select Atmosphere
              </label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((m) => {
                  const active = mood === m;
                  const cfg = MOOD_CONFIGS[m];
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setMood(m);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all ${
                        active
                          ? 'text-white shadow-lg'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                      style={{
                        backgroundColor: active ? `${cfg.accentColor}30` : undefined,
                        border: active ? `1.5px solid ${cfg.accentColor}` : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cfg.accentColor}25` }}
                      >
                        <span style={{ color: cfg.accentColor }}>{MOOD_ICONS[m]}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block capitalize truncate">{cfg.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{cfg.tagline}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Display & View
              </label>

              {mood === 'drive' && (
                <button
                  onClick={() => {
                    toggleDrivePerspective();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Car Camera Angle</span>
                  </span>
                  <span className="text-emerald-300 font-semibold">
                    {drivePerspective === 'cockpit' ? 'Driver Cockpit' : 'Chase View'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  toggleZenMode();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Scenic Zen Mode (Hide Controls)</span>
                </span>
                <span className="text-slate-400">Toggle</span>
              </button>
            </div>

            {/* Links & Auth */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Link
                  href="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-white"
                >
                  Search
                </Link>
                <Link
                  href="/library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-white"
                >
                  Library
                </Link>
              </div>

              {session?.user ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
