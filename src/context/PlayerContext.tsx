"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track, RepeatMode } from '@/types';
import { CURATED_AMBIENT_TRACKS } from '@/services/musicService';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  audioEnergy: number;
  frequencyData: number[];

  playTrack: (track: Track, newQueue?: Track[]) => void;
  playCustomStream: (url: string, title?: string, artist?: string) => void;
  playLocalFile: (file: File) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(CURATED_AMBIENT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(CURATED_AMBIENT_TRACKS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>(CURATED_AMBIENT_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [audioEnergy, setAudioEnergy] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(0.1));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load Queue & Current Track from browser localStorage
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('calm_music_queue');
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueue(parsed);
          setCurrentTrack(parsed[0]);
          if (parsed[0].duration) setDuration(parsed[0].duration);
        }
      }
    } catch (e) {}
  }, []);

  // Save Queue to browser localStorage
  useEffect(() => {
    try {
      if (queue.length > 0) {
        localStorage.setItem('calm_music_queue', JSON.stringify(queue));
      }
    } catch (e) {}
  }, [queue]);

  // Initialize Web Audio API Analyser
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch (e) {
      console.warn('Web Audio Analyser setup notice:', e);
    }
  }, []);

  // Update audio-reactive energy & frequency bars loop
  useEffect(() => {
    if (!isPlaying) {
      setAudioEnergy(0);
      setFrequencyData(new Array(16).fill(0.08));
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const updateVisualizer = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 16));

        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(0.08, val / 255));
          sum += val;
        }

        const avg = sum / (bufferLength * 255);
        setAudioEnergy(avg);
        setFrequencyData(bars);
      } else {
        const t = Date.now() / 250;
        const simulated = Array.from({ length: 16 }, (_, i) => {
          return 0.15 + Math.abs(Math.sin(t + i * 0.4)) * 0.7;
        });
        setFrequencyData(simulated);
        setAudioEnergy(0.28 + Math.sin(t * 1.5) * 0.2);
      }

      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Handle Play Track
  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === track.id);
        if (existingIdx !== -1) {
          setQueueIndex(existingIdx);
          return prev;
        }
        setQueueIndex(prev.length);
        return [...prev, track];
      });
    }

    if (audioRef.current) {
      initAudioContext();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback notice:', e);
        setIsPlaying(false);
      });
    }
  }, [initAudioContext]);

  const playCustomStream = useCallback((url: string, title?: string, artist?: string) => {
    const customTrack: Track = {
      id: `custom-${Date.now()}`,
      title: title || 'Custom Web Stream',
      artistName: artist || 'Web Audio Source',
      albumName: 'Live Web Stream',
      duration: 0,
      audioUrl: url,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      source: 'custom',
    };
    playTrack(customTrack);
  }, [playTrack]);

  const playLocalFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const localTrack: Track = {
      id: `local-${Date.now()}`,
      title: fileName,
      artistName: 'Local Audio File',
      albumName: 'User Library',
      duration: 0,
      audioUrl: objectUrl,
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
      source: 'local',
    };
    playTrack(localTrack);
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    initAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src && currentTrack) {
        audioRef.current.src = currentTrack.audioUrl;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  }, [isPlaying, currentTrack, initAudioContext]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      setIsMuted(false);
    } else {
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;

    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextT = queue[nextIdx];
    if (nextT) {
      setQueueIndex(nextIdx);
      playTrack(nextT);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    const prevT = queue[prevIdx];
    if (prevT) {
      setQueueIndex(prevIdx);
      playTrack(prevT);
    }
  }, [queue, queueIndex, repeatMode, playTrack, seek, currentTime]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  }, [currentTrack]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, currentTime, setVolume, volume, toggleMute]);

  // -------------------------------------------------------------
  // ANDROID BACKGROUND AUDIO & MEDIA SESSION API INTEGRATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) {
      return;
    }

    try {
      // 1. Sync Native Lock-Screen & Notification Player Metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artistName,
        album: currentTrack.albumName || 'Calm Music - Ambient Soundscapes',
        artwork: [
          { src: currentTrack.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      // 2. Sync Native Playback State
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // 3. Register Native Hardware Buttons & Notification Controls
      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        seek(Math.max(0, (audioRef.current?.currentTime || 0) - skipTime));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        seek(Math.min(duration, (audioRef.current?.currentTime || 0) + skipTime));
      });
    } catch (err) {
      console.warn('MediaSession initialization warning:', err);
    }
  }, [currentTrack, isPlaying, duration, togglePlay, prevTrack, nextTrack, seek]);

  // Sync position state with lock-screen scrubber
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !duration || isNaN(duration)) {
      return;
    }
    try {
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1.0,
          position: Math.max(0, Math.min(currentTime, duration)),
        });
      }
    } catch (e) {}
  }, [currentTime, duration]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        queue,
        queueIndex,
        audioEnergy,
        frequencyData,
        playTrack,
        playCustomStream,
        playLocalFile,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        nextTrack,
        prevTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
      }}
    >
      {/* Persistent HTML5 Audio for pure high-quality streaming */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (repeatMode === 'one') {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          } else {
            nextTrack();
          }
        }}
      />

      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
