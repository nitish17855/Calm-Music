"use client";

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import { X, Play, Trash2, Music2, Sparkles } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const {
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    isAutoplay,
    toggleAutoplay,
    autoplayPool,
  } = usePlayer();
  const { config } = useMood();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] sm:w-96 max-h-[75vh] z-50 glass-panel rounded-3xl p-5 flex flex-col shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-slate-300" />
          <h3 className="text-sm font-semibold text-white">Play Queue</h3>
          <span className="text-xs font-mono text-slate-400">({queue.length})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              title="Clear queue"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Autoplay Toggle Bar */}
      <div className="flex items-center justify-between py-2 px-3 mt-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-white">Autoplay Radio</span>
        </div>
        <button
          onClick={toggleAutoplay}
          className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
            isAutoplay ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
          title={isAutoplay ? 'Disable Autoplay' : 'Enable Autoplay'}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              isAutoplay ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Queue Track List */}
      <div className="overflow-y-auto mt-3 space-y-2 pr-1 max-h-[40vh] scrollbar-thin">
        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Queue is empty</div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || idx === queueIndex;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all duration-200 ${
                  isCurrent ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div
                  className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                  onClick={() => playTrack(track)}
                >
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                    {isCurrent && (
                      <div
                        className="absolute inset-0 bg-black/40 flex items-center justify-center"
                        style={{ color: config.accentColor }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="truncate flex-1">
                    <p className={`text-xs font-medium truncate ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{formatTime(track.duration)}</span>
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                    title="Remove from queue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Autoplay Up Next Preview */}
      {isAutoplay && autoplayPool.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Up Next (Autoplay Pool)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">{autoplayPool.length} ready</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
              <Image
                src={autoplayPool[0].coverUrl}
                alt={autoplayPool[0].title}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-emerald-200 truncate">{autoplayPool[0].title}</p>
              <p className="text-[10px] text-slate-400 truncate">{autoplayPool[0].artistName}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
