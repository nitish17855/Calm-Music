"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Sparkles,
  Disc3,
  Check,
} from 'lucide-react';

const MOOD_TAGS = [
  { label: 'Ambient Focus', tag: 'ambient' },
  { label: 'Rain & Nature', tag: 'rain+nature' },
  { label: 'Deep Meditation', tag: 'meditation' },
  { label: 'Chill Lo-Fi', tag: 'chillout' },
  { label: 'Nocturnal Piano', tag: 'piano+calm' },
  { label: 'Electronic Zen', tag: 'downtempo' },
];

export default function SearchPage() {
  const { data: session } = useSession();
  const { currentTrack, isPlaying, playTrack, addToQueue } = usePlayer();
  const { config } = useMood();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('ambient');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Load existing liked tracks if user is authenticated
  useEffect(() => {
    if (session?.user) {
      fetch('/api/likes')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.likedTracks) {
            setLikedTrackIds(new Set(data.likedTracks.map((t: any) => t.trackId)));
          }
        })
        .catch(() => {});
    }
  }, [session]);

  // Debounced search / tag fetch
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTracks(query, activeTag);
    }, 350);

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

  const handleToggleLike = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }

    const wasLiked = likedTrackIds.has(track.id);
    const nextSet = new Set(likedTrackIds);
    if (wasLiked) {
      nextSet.delete(track.id);
    } else {
      nextSet.add(track.id);
    }
    setLikedTrackIds(nextSet);

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          title: track.title,
          artistName: track.artistName,
          albumName: track.albumName,
          duration: track.duration,
          audioUrl: track.audioUrl,
          coverUrl: track.coverUrl,
          source: track.source,
        }),
      });
    } catch (err) {
      console.error('Like toggle error:', err);
      // Revert if error
      setLikedTrackIds(likedTrackIds);
    }
  };

  return (
    <div className="pt-28 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore Music & Soundscapes
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Stream full-length ambient tracks directly from Jamendo&apos;s licensed open library.
        </p>

        {/* Search Bar */}
        <div className="mt-6 relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setActiveTag('');
            }}
            placeholder="Search tracks, ambient artists, meditative moods..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl glass-panel text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: `${config.accentColor}40`,
            }}
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Moods:
          </span>
          {MOOD_TAGS.map((item) => {
            const isTagActive = activeTag === item.tag && !query;
            return (
              <button
                key={item.tag}
                onClick={() => {
                  setQuery('');
                  setActiveTag(item.tag);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isTagActive ? 'text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isTagActive ? `${config.accentColor}30` : 'rgba(255, 255, 255, 0.04)',
                  border: isTagActive ? `1px solid ${config.accentColor}70` : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid / Table */}
      {loading && tracks.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl animate-pulse flex items-center gap-3">
              <div className="w-14 h-14 bg-white/10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl max-w-lg mx-auto">
          <Disc3 className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-spin" style={{ animationDuration: '8s' }} />
          <h3 className="text-base font-semibold text-white">No soundscapes found</h3>
          <p className="text-xs text-slate-400 mt-1">Try another keyword or select one of the ambient mood pills above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isLiked = likedTrackIds.has(track.id);

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, tracks)}
                className={`group relative p-3 rounded-2xl glass-panel glass-panel-hover flex items-center justify-between gap-3 cursor-pointer border ${
                  isCurrent ? 'ring-1 ring-white/20' : 'border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  
                  {/* Cover Art with Hover Play Overlay */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      fill
                      sizes="56px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
                        isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-white' : 'text-slate-200'
                      }`}
                      style={{ color: isCurrent ? config.accentColor : undefined }}
                    >
                      {track.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{track.artistName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTime(track.duration)}
                      </span>
                      <span className="text-[9px] uppercase font-mono tracking-wider px-1 rounded bg-white/5 text-slate-400">
                        {track.source}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Actions: Like & Queue */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleToggleLike(track, e)}
                    title={isLiked ? 'Unlike' : 'Save to Library'}
                    className={`p-2 rounded-xl transition-colors ${
                      isLiked ? 'text-rose-400 hover:text-rose-300' : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    aria-label="Like soundscape"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleAddToQueue(track, e)}
                    title="Add to queue"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Add track to queue"
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
  );
}
