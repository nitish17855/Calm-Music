"use client";

import React, { useState } from 'react';
import { usePlaylist } from '@/context/PlaylistContext';
import { useMood } from '@/context/MoodContext';
import Image from 'next/image';
import { X, Plus, Check, ListMusic, Play, Sparkles } from 'lucide-react';

export default function AddToPlaylistModal() {
  const {
    playlists,
    isModalOpen,
    modalTrack,
    closeAddToPlaylistModal,
    addTrackToPlaylist,
    createPlaylist,
    playPlaylist,
  } = usePlaylist();
  const { config } = useMood();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Set<string>>(new Set());

  if (!isModalOpen || !modalTrack) return null;

  const handleAdd = (playlistId: string) => {
    addTrackToPlaylist(playlistId, modalTrack);
    setAddedPlaylistIds((prev) => {
      const next = new Set(prev);
      next.add(playlistId);
      return next;
    });
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl = createPlaylist(newPlaylistName.trim());
    addTrackToPlaylist(newPl.id, modalTrack);
    setAddedPlaylistIds((prev) => {
      const next = new Set(prev);
      next.add(newPl.id);
      return next;
    });
    setNewPlaylistName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel border border-white/20 shadow-2xl bg-[#0c1420]/90 text-white animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={closeAddToPlaylistModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <ListMusic className="w-5 h-5" style={{ color: config.accentColor }} />
          <h3 className="text-lg font-bold tracking-tight">Add to Playlist</h3>
        </div>

        {/* Selected Track Banner */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 shadow">
            <Image
              src={modalTrack.coverUrl}
              alt={modalTrack.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate text-white">{modalTrack.title}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{modalTrack.artistName}</p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin mb-5">
          <p className="text-xs font-medium text-slate-400 mb-1">Select a playlist:</p>
          {playlists.map((playlist) => {
            const alreadyInPlaylist =
              playlist.tracks.some((t) => t.id === modalTrack.id) ||
              addedPlaylistIds.has(playlist.id);

            return (
              <div
                key={playlist.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden relative flex-shrink-0">
                    <Image
                      src={playlist.coverUrl || modalTrack.coverUrl}
                      alt={playlist.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold truncate text-slate-200 group-hover:text-white">
                      {playlist.name}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {playlist.tracks.length > 0 && (
                    <button
                      onClick={() => {
                        playPlaylist(playlist.id);
                        closeAddToPlaylistModal();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Play this playlist now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  {alreadyInPlaylist ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(playlist.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-all active:scale-95"
                      style={{ backgroundColor: config.accentColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Playlist Inline Form */}
        <form onSubmit={handleCreateAndAdd} className="pt-3 border-t border-white/10">
          <p className="text-xs font-medium text-slate-400 mb-2">Or create a new playlist:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g. Night Cruiser, High Focus..."
              className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 flex-shrink-0 shadow"
              style={{ backgroundColor: config.accentColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create & Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
