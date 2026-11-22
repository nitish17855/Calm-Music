"use client";

import React, { useState, useEffect } from 'react';
import { useMood } from '@/context/MoodContext';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/types';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import {
  Search as SearchIcon,
  Play,
  Pause,
  Plus,
  Heart,
  Check,
  Loader2,
  Eye,
  EyeOff,
  X,
  ListPlus,
} from 'lucide-react';
import AudioVisualizerBars from '@/components/visuals/AudioVisualizerBars';
import { usePlaylist } from '@/context/PlaylistContext';

const QUICK_MOOD_PROMPTS = [
  'Chill Lo-Fi',
  'Night Drive Synth',
  'Gentle Rain & Piano',
  'Deep Meditation',
  'Ambient Guitar',
];

export default function HeroSection() {
  const { config, mood } = useMood();
  const { currentTrack, isPlaying, playTrack, addToQueue, togglePlay } = usePlayer();
  const { openAddToPlaylistModal } = usePlaylist();

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [isResultsHidden, setIsResultsHidden] = useState(false);

  // Load liked tracks from browser localStorage (No Auth Required)
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

  // Save liked tracks to browser localStorage
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

  // Debounced live music search
  useEffect(() => {
    if (!query.trim()) {
      setTracks([]);
      setLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        const res = await fetch(`/api/music/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks || []);
          setIsResultsHidden(false);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleAddToQueue = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setAddedTrackId(track.id);
    setTimeout(() => setAddedTrackId(null), 1200);
  };

  return (
    <div className="relative pt-24 sm:pt-28 pb-32 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col items-center">
      
      {/* ------------------------------------------------------------- */}
      {/* FLOATING DIRECT SEARCH BAR                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-2xl relative z-20">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any song, artist, or ambient vibe..."
            className="w-full pl-12 pr-24 py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl glass-panel text-white placeholder-slate-400 text-sm sm:text-base border border-white/20 shadow-2xl focus:outline-none focus:ring-2 backdrop-blur-2xl transition-all"
            style={{
              borderColor: `${config.accentColor}50`,
            }}
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {loading && (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin mr-1" />
            )}
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setTracks([]);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Vibe Chips (Click to Search Instantly) */}
        {!query && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_MOOD_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setQuery(prompt)}
                className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white glass-pill border border-white/10 hover:border-white/25 transition-all whitespace-nowrap active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH RESULTS DROPDOWN / LIST (Clean, Fast & Non-Intrusive)  */}
      {/* ------------------------------------------------------------- */}
      {loading && query && (
        <div className="w-full max-w-2xl mt-3 relative z-20 flex items-center justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel text-xs text-slate-300 shadow-xl border border-white/10">
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Searching Studio Audio, YouTube, Audius & Jamendo...</span>
          </div>
        </div>
      )}

      {!loading && query && tracks.length === 0 && (
        <div className="w-full max-w-2xl mt-3 relative z-20 text-center py-6 px-4 rounded-2xl glass-panel border border-white/10 shadow-2xl backdrop-blur-2xl">
          <p className="text-sm text-slate-200 font-medium">
            No soundscapes found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try checking the spelling or searching with artist name
          </p>
        </div>
      )}

      {query && tracks.length > 0 && (
        <div className="w-full max-w-2xl mt-4 relative z-20 transition-all duration-300">
          
          {/* Header with Hide/Show Toggle */}
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-mono text-slate-400">
              {tracks.length} soundscapes found
            </span>
            <button
              onClick={() => setIsResultsHidden((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white glass-pill px-2.5 py-1 rounded-xl"
            >
              {isResultsHidden ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Show Results</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scenic Mode (Hide)</span>
                </>
              )}
            </button>
          </div>

          {!isResultsHidden && (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 scrollbar-thin rounded-2xl glass-panel p-2 border border-white/15 shadow-2xl backdrop-blur-2xl">
              {tracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isLiked = likedTrackIds.has(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() =>
                      isCurrent
                        ? togglePlay()
                        : playTrack(
                            track,
                            undefined,
                            tracks.filter((t) => t.id !== track.id)
                          )
                    }
                    className={`group p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                        : 'bg-black/40 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    {/* Left: Artwork & Metadata */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 shadow">
                        <Image
                          src={track.coverUrl}
                          alt={track.title}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                        <div
                          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-white text-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isCurrent ? 'text-white' : 'text-slate-200'
                            }`}
                            style={{ color: isCurrent ? config.accentColor : undefined }}
                          >
                            {track.title}
                          </h4>
                          {isCurrent && isPlaying && (
                            <AudioVisualizerBars barCount={5} height={12} compact />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {track.artistName}
                        </p>
                      </div>
                    </div>

                    {/* Right: Duration, Like & Add to Queue */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        {formatTime(track.duration)}
                      </span>

                      {/* Favorite Button (Saved to localStorage) */}
                      <button
                        onClick={(e) => toggleLike(track.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isLiked
                            ? 'text-rose-400'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isLiked ? 'Unlike' : 'Save to Favorites'}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                      </button>

                      {/* Add to Playlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddToPlaylistModal(track);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/10 transition-colors"
                        title="Add to Playlist"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      {/* Add to Queue Button (Saved to localStorage) */}
                      <button
                        onClick={(e) => handleAddToQueue(track, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all active:scale-95"
                        title="Add to play queue"
                      >
                        {addedTrackId === track.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Queue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* When no query is typed: Pure Unobstructed View */}
      {!query && (
        <div className="mt-8 text-center pointer-events-none select-none">
          <p className="text-xs sm:text-sm font-medium text-white/50 tracking-wider">
            Type any song above • Or cruise freely with steering & speed controls
          </p>
        </div>
      )}

    </div>
  );
}
