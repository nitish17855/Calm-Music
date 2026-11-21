"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useMood, MOOD_CONFIGS } from '@/context/MoodContext';
import { MoodMode } from '@/types';
import { Moon, CloudRain, Compass, Heart, Car, Music, User, LogOut } from 'lucide-react';

const MOOD_ICONS: Record<MoodMode, React.ReactNode> = {
  drive: <Car className="w-3.5 h-3.5" />,
  rose: <Heart className="w-3.5 h-3.5" />,
  night: <Moon className="w-3.5 h-3.5" />,
  rain: <CloudRain className="w-3.5 h-3.5" />,
  focus: <Compass className="w-3.5 h-3.5" />,
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mood, setMood, config } = useMood();

  const navLinks = [
    { href: '/', label: 'Discover' },
    { href: '/search', label: 'Search' },
    { href: '/library', label: 'Library' },
  ];

  const moods: MoodMode[] = ['drive', 'rose', 'night', 'rain', 'focus'];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 md:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel px-4 md:px-5 py-2.5 rounded-2xl">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${config.accentColor}40, ${config.accentColor}10)`,
              border: `1px solid ${config.accentColor}60`,
            }}
          >
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-wide text-white flex items-center gap-1.5">
              Calm
              <span
                className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded-full uppercase"
                style={{
                  background: `${config.accentColor}20`,
                  color: config.accentColor,
                  border: `1px solid ${config.accentColor}40`,
                }}
              >
                Music
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
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

        {/* Right Section: Mood Switcher & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
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

      </div>
    </header>
  );
}
