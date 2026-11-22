"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Track } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { CURATED_AMBIENT_TRACKS } from '@/services/musicService';

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  tracks: Track[];
  createdAt: number;
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: Track) => boolean;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  playPlaylist: (playlistId: string, startIndex?: number) => void;
  isModalOpen: boolean;
  modalTrack: Track | null;
  openAddToPlaylistModal: (track: Track) => void;
  closeAddToPlaylistModal: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const STORAGE_KEY = 'calm_music_playlists';

const DEFAULT_PLAYLIST: Playlist = {
  id: 'pl-default-ambient',
  name: 'Sunset Cruise Sanctuary',
  description: 'Handpicked serene soundscapes for open-road driving and peaceful focus.',
  coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80',
  tracks: CURATED_AMBIENT_TRACKS.slice(0, 4),
  createdAt: Date.now(),
};

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { playTrack } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([DEFAULT_PLAYLIST]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  // Load playlists from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlaylists(parsed);
          return;
        }
      }
      // Save default initial playlist if none exists
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_PLAYLIST]));
    } catch (e) {
      console.warn('Playlist localStorage load notice:', e);
    }
  }, []);

  // Save to localStorage whenever playlists change
  const persistPlaylists = useCallback((updated: Playlist[]) => {
    setPlaylists(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Playlist save notice:', e);
    }
  }, []);

  // Create a new playlist
  const createPlaylist = useCallback((name: string, description?: string): Playlist => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Untitled Playlist',
      description: description?.trim() || null,
      coverUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
      tracks: [],
      createdAt: Date.now(),
    };

    setPlaylists((prev) => {
      const updated = [newPl, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return newPl;
  }, []);

  // Add a track to an existing playlist
  const addTrackToPlaylist = useCallback((playlistId: string, track: Track): boolean => {
    let wasAdded = false;
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;

        const alreadyExists = pl.tracks.some((t) => t.id === track.id);
        if (alreadyExists) return pl;

        wasAdded = true;
        const newTracks = [...pl.tracks, track];
        const newCover = pl.coverUrl || track.coverUrl;
        return {
          ...pl,
          tracks: newTracks,
          coverUrl: newCover,
        };
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return wasAdded;
  }, []);

  // Remove a track from a playlist
  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.id !== trackId),
        };
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Delete an entire playlist
  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((pl) => pl.id !== playlistId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Play an entire playlist sequentially one by one
  const playPlaylist = useCallback((playlistId: string, startIndex = 0) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || pl.tracks.length === 0) return;

    const startTrack = pl.tracks[startIndex] || pl.tracks[0];
    // Passing pl.tracks sets the queue to all tracks in this playlist
    // The player will play startTrack and then play each next song sequentially one by one
    playTrack(startTrack, pl.tracks);
  }, [playlists, playTrack]);

  // Modal open/close actions
  const openAddToPlaylistModal = useCallback((track: Track) => {
    setModalTrack(track);
    setIsModalOpen(true);
  }, []);

  const closeAddToPlaylistModal = useCallback(() => {
    setIsModalOpen(false);
    setModalTrack(null);
  }, []);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deletePlaylist,
        playPlaylist,
        isModalOpen,
        modalTrack,
        openAddToPlaylistModal,
        closeAddToPlaylistModal,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
