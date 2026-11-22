"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { Track } from '@/types';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  FolderHeart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Search,
} from 'lucide-react';

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { config } = useMood();
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylist();

  const [activeTab, setActiveTab] = useState<'playlists' | 'likes'>('playlists');
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);

  // New playlist modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check URL query param for default tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'likes') {
        setActiveTab('likes');
      } else if (tabParam === 'playlists') {
        setActiveTab('playlists');
      }
    }
  }, []);

  // Fetch server likes if authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchLikes();
    }
  }, [status]);

  const fetchLikes = async () => {
    try {
      const likesRes = await fetch('/api/likes');
      if (likesRes.ok) {
        const likesData = await likesRes.json();
        setLikedTracks(
          (likesData.likedTracks || []).map((t: any) => ({
            id: t.trackId,
            title: t.title,
            artistName: t.artistName,
            albumName: t.albumName,
            duration: t.duration,
            audioUrl: t.audioUrl,
            coverUrl: t.coverUrl,
            source: t.source,
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load server likes:', err);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setIsModalOpen(false);
      setExpandedPlaylistId(created.id);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playEntireCollection = (tracksToPlay: Track[]) => {
    if (tracksToPlay.length > 0) {
      playTrack(tracksToPlay[0], tracksToPlay);
    }
  };

  return (
    <div className="pt-28 pb-36 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your Sanctuary Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build custom playlists and save beloved soundscapes for uninterrupted focus and sleep.
          </p>
        </div>

        {/* Create Playlist Action - Available to everyone! */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: config.accentColor,
            boxShadow: `0 8px 20px -4px ${config.accentColor}50`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Guest Notice (Subtle, Non-blocking) */}
      {status === 'unauthenticated' && (
        <div className="p-4 rounded-2xl glass-panel border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Local Sanctuary Active:</strong> Your playlists and queued songs are preserved on this device.
            </span>
          </div>
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex-shrink-0"
          >
            Sign in to sync across devices →
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'playlists'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
          <span>Playlists</span>
          <span className="text-[10px] font-mono text-slate-400">({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'likes'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Liked Soundscapes</span>
          <span className="text-[10px] font-mono text-slate-400">({likedTracks.length})</span>
        </button>
      </div>

      {/* Tab 1: Custom Playlists */}
      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto p-8">
              <ListMusic className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No playlists yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Create tailored sound journeys for driving, sleep, deep study, or meditation.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white glass-pill hover:bg-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Playlist</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => {
                const isExpanded = expandedPlaylistId === playlist.id;
                const hasTracks = playlist.tracks.length > 0;

                return (
                  <div
                    key={playlist.id}
                    className="p-5 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between border border-white/10 transition-all duration-200"
                  >
                    <div>
                      {/* Playlist Banner / Cover */}
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-slate-800 shadow-md group">
                        <Image
                          src={playlist.coverUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80'}
                          alt={playlist.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 350px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasTracks && (
                          <button
                            onClick={() => playPlaylist(playlist.id)}
                            className="absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                            style={{ backgroundColor: config.accentColor }}
                            title="Play all tracks sequentially"
                          >
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </button>
                        )}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-300">
                          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-white tracking-tight truncate">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        {hasTracks ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playPlaylist(playlist.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
                              style={{ backgroundColor: config.accentColor }}
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Play</span>
                            </button>
                            <button
                              onClick={() => setExpandedPlaylistId(isExpanded ? null : playlist.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
                            >
                              <span>Tracks</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <Link
                            href="/search"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                          >
                            <Search className="w-3 h-3" />
                            <span>Add songs from search</span>
                          </Link>
                        )}

                        <button
                          onClick={() => deletePlaylist(playlist.id)}
                          className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-slate-400"
                          title="Delete playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Expanded Tracklist */}
                      {isExpanded && hasTracks && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                          {playlist.tracks.map((track, trackIdx) => {
                            const isCurrent = currentTrack?.id === track.id;
                            return (
                              <div
                                key={`${track.id}-${trackIdx}`}
                                onClick={() => playPlaylist(playlist.id, trackIdx)}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all group/item ${
                                  isCurrent
                                    ? 'bg-white/15 text-white font-medium'
                                    : 'hover:bg-white/5 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="text-[10px] text-slate-400 font-mono w-4 flex-shrink-0">
                                    {trackIdx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className={`truncate font-medium text-xs ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                                      {track.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {track.artistName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {formatTime(track.duration)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTrackFromPlaylist(playlist.id, track.id);
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                    title="Remove song from playlist"
                                  >
                                    <X className="w-3.5 h-3.5" />
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
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Liked Tracks */}
      {activeTab === 'likes' && (
        <div>
          {likedTracks.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => playEntireCollection(likedTracks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass-pill text-xs font-semibold text-white hover:bg-white/10"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play All Liked Soundscapes</span>
              </button>
            </div>
          )}

          {likedTracks.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto p-8">
              <FolderHeart className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No liked tracks yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Discover ambient tracks in search and tap the heart icon to save them to your sanctuary.
              </p>
              <Link
                href="/search"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white glass-pill hover:bg-white/10"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Browse Music</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {likedTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, likedTracks)}
                    className={`group flex items-center justify-between p-3 rounded-2xl glass-panel glass-panel-hover cursor-pointer border ${
                      isCurrent ? 'ring-1 ring-white/20' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                        <Image
                          src={track.coverUrl}
                          alt={track.title}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Pause className="w-4 h-4 fill-white text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pl-3 flex-shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">{formatTime(track.duration)}</span>
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative bg-[#0c1420]/95 text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Create New Sanctuary Playlist</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midnight Coding Flow"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Deep alpha frequencies for uninterrupted focus..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPlaylistName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow disabled:opacity-50"
                  style={{ backgroundColor: config.accentColor }}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
