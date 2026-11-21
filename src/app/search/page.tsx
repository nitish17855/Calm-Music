"use client";

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import { Track } from '@/types';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import {
  Search as SearchIcon,
  Play,
  Pause,
  Plus,
  Heart,
  Loader2,
  Disc3,
  Check,
  X,
} from 'lucide-react';
import AudioVisualizerBars from '@/components/visuals/AudioVisualizerBars';

const QUICK_MOOD_TAGS = [
  { label: 'Chill Lo-Fi', tag: 'chillout+relax' },
  { label: 'Ambient Focus', tag: 'ambient' },
  { label: 'Gentle Rain', tag: 'rain+nature' },
  { label: 'Deep Meditation', tag: 'meditation' },
  { label: 'Nocturnal Piano', tag: 'piano+calm' },
  { label: 'Electronic Zen', tag: 'downtempo' },
];

export default function SearchPage() {
  const { currentTrack, isPlaying, playTrack, addToQueue } = usePlayer();
  const { config } = useMood();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('chillout+relax');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Load favorites from browser localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('calm_music_likes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLikedTrackIds(new Set(parsed));
        }
      }
    } catch (e) {}
  }, []);

  // Save favorites to browser localStorage
  const toggleLike = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSet = new Set(likedTrackIds);
    if (nextSet.has(trackId)) {
      nextSet.delete(trackId);
    } else {
      nextSet.add(trackId);
    }
    setLikedTrackIds(nextSet);
    try {
      localStorage.setItem('calm_music_likes', JSON.stringify(Array.from(nextSet)));
    } catch (e) {}
  };

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTracks(query, activeTag);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, activeTag]);

  const fetchTracks = async (searchQuery: string, tag: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      } else if (tag) {
        params.set('tag', tag);
      }

      const res = await fetch(`/api/music/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setAddedTrackId(track.id);
    setTimeout(() => setAddedTrackId(null), 1200);
  };

  return (
    <div className="pt-24 sm:pt-28 pb-32 px-4 md:px-8 max-w-5xl mx-auto">
      
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Search Music
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Instant high-quality ambient soundscapes and audio streams.
        </p>

        {/* Search Input Bar */}
        <div className="mt-4 relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setActiveTag('');
            }}
            placeholder="Search songs, artists, or soundscapes..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl glass-panel text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 backdrop-blur-2xl transition-all border border-white/15"
            style={{
              borderColor: `${config.accentColor}50`,
            }}
          />
          {loading ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setActiveTag('chillout+relax');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_MOOD_TAGS.map((item) => {
            const isTagActive = activeTag === item.tag && !query;
            return (
              <button
                key={item.tag}
                onClick={() => {
                  setQuery('');
                  setActiveTag(item.tag);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isTagActive
                    ? 'text-white shadow-md'
                    : 'text-slate-400 hover:text-white glass-pill border border-white/10'
                }`}
                style={{
                  backgroundColor: isTagActive ? `${config.accentColor}35` : undefined,
                  border: isTagActive ? `1px solid ${config.accentColor}80` : undefined,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      <div className="transition-all duration-300">
        {loading && tracks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-panel p-3.5 rounded-2xl animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl max-w-md mx-auto">
            <Disc3 className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-spin" style={{ animationDuration: '8s' }} />
            <h3 className="text-sm font-semibold text-white">No tracks found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Try searching for a different vibe or artist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  className={`group p-3 rounded-2xl glass-panel glass-panel-hover flex items-center justify-between gap-3 cursor-pointer border ${
                    isCurrent ? 'ring-1 ring-white/20' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        fill
                        sizes="48px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isCurrent ? 'text-white' : 'text-slate-200'
                          }`}
                          style={{ color: isCurrent ? config.accentColor : undefined }}
                        >
                          {track.title}
                        </h3>
                        {isCurrent && isPlaying && (
                          <AudioVisualizerBars barCount={4} height={12} compact />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{track.artistName}</p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => toggleLike(track.id, e)}
                      title={isLiked ? 'Unlike' : 'Save to Favorites'}
                      className={`p-2 rounded-xl transition-colors ${
                        isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleAddToQueue(track, e)}
                      title="Add to queue"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {addedTrackId === track.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
