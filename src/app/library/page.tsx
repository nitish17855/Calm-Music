"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
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
  Lock,
  Loader2,
  X,
} from 'lucide-react';

interface PlaylistWithTracks {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  tracks: {
    id: string;
    trackId: string;
    title: string;
    artistName: string;
    albumName?: string | null;
    duration: number;
    audioUrl: string;
    coverUrl: string;
    source: string;
  }[];
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { config } = useMood();

  const [activeTab, setActiveTab] = useState<'likes' | 'playlists'>('likes');
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [loading, setLoading] = useState(true);

  // New playlist modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLibraryData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const [likesRes, playlistsRes] = await Promise.all([
        fetch('/api/likes'),
        fetch('/api/playlists'),
      ]);

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

      if (playlistsRes.ok) {
        const pData = await playlistsRes.json();
        setPlaylists(pData.playlists || []);
      }
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlaylists((prev) => [data.playlist, ...prev]);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete playlist error:', err);
    }
  };

  const playEntireCollection = (tracksToPlay: Track[]) => {
    if (tracksToPlay.length > 0) {
      playTrack(tracksToPlay[0], tracksToPlay);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="pt-36 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: config.accentColor }} />
        <span className="text-xs">Accessing personal sound archive...</span>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-36 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your Sanctuary Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {session?.user?.name
              ? `Curated collections for ${session.user.name}`
              : 'Save beloved soundscapes and build custom restorative playlists.'}
          </p>
        </div>

        {/* Create Playlist Action */}
        {status === 'authenticated' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium text-white shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: config.accentColor,
              boxShadow: `0 8px 20px -4px ${config.accentColor}50`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>
        )}
      </div>

      {/* Guest Banner if Unauthenticated */}
      {status === 'unauthenticated' && (
        <div className="p-6 rounded-3xl glass-panel border border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Save your sacred soundscapes</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in to save liked songs, sync playlists to PostgreSQL, and preserve your listening sanctuary.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl font-medium text-xs text-white glass-pill hover:bg-white/10 flex-shrink-0"
          >
            Sign In / Register
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'likes'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Liked Soundscapes</span>
          <span className="text-[10px] font-mono text-slate-400">({likedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'playlists'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
          <span>Custom Playlists</span>
          <span className="text-[10px] font-mono text-slate-400">({playlists.length})</span>
        </button>
      </div>

      {/* Tab 1: Liked Tracks */}
      {activeTab === 'likes' && (
        <div>
          {likedTracks.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => playEntireCollection(likedTracks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass-pill text-xs font-medium text-white hover:bg-white/10"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play All Liked Soundscapes</span>
              </button>
            </div>
          )}

          {likedTracks.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto">
              <FolderHeart className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No liked tracks yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Discover ambient tracks in search and click the heart icon to save them to your library.
              </p>
              <Link
                href="/search"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white glass-pill hover:bg-white/10"
              >
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

      {/* Tab 2: Custom Playlists */}
      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto">
              <ListMusic className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No playlists yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Create tailored sound scape journeys for sleep, creative writing, or focus hours.
              </p>
              {status === 'authenticated' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white glass-pill hover:bg-white/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Playlist</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => {
                const trackList: Track[] = playlist.tracks.map((t) => ({
                  id: t.trackId,
                  title: t.title,
                  artistName: t.artistName,
                  albumName: t.albumName || undefined,
                  duration: t.duration,
                  audioUrl: t.audioUrl,
                  coverUrl: t.coverUrl,
                  source: (t.source as 'jamendo' | 'audius') || 'jamendo',
                }));

                return (
                  <div
                    key={playlist.id}
                    className="group relative p-5 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-slate-800">
                        <Image
                          src={playlist.coverUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80'}
                          alt={playlist.name}
                          fill
                          sizes="300px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {trackList.length > 0 && (
                          <button
                            onClick={() => playEntireCollection(trackList)}
                            className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ backgroundColor: config.accentColor }}
                            title="Play playlist"
                          >
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </button>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white tracking-tight truncate">{playlist.name}</h3>
                      {playlist.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{playlist.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <span>{playlist.tracks.length} soundscapes</span>
                      <button
                        onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                        className="p-1.5 rounded-lg hover:text-red-400 transition-colors"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Create New Sanctuary Playlist</h3>
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
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white shadow disabled:opacity-50"
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
