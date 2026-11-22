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

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

function extractYouTubeId(track: Track): string | null {
  if (track.youtubeId) return track.youtubeId;
  if (!track.audioUrl) return null;
  const match = track.audioUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// 44-byte silent WAV data URI to keep the mobile OS audio pipeline alive in background
const SILENT_AUDIO_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

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

  // YouTube IFrame Player refs
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const pendingYtVideoIdRef = useRef<string | null>(null);
  const ytPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextTrackRef = useRef<() => void>(() => {});
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const currentTrackRef = useRef<Track | null>(currentTrack);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Keep background audio active when screen turns off or app minimizes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPlayingRef.current) {
        if (currentTrackRef.current?.source === 'youtube' && ytPlayerRef.current) {
          setTimeout(() => {
            try {
              if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
                ytPlayerRef.current.playVideo();
              }
              if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
              }
            } catch (e) {}
          }, 80);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function initYouTubePlayer() {
      if (ytPlayerRef.current || !window.YT || !window.YT.Player) return;
      try {
        ytPlayerRef.current = new window.YT.Player('calm-yt-player', {
          height: '100%',
          width: '100%',
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: () => {
              isYtReadyRef.current = true;
              try {
                ytPlayerRef.current.setVolume(volume * 100);
              } catch (e) {}
              if (pendingYtVideoIdRef.current) {
                const vid = pendingYtVideoIdRef.current;
                pendingYtVideoIdRef.current = null;
                try {
                  ytPlayerRef.current.loadVideoById(vid);
                  ytPlayerRef.current.playVideo();
                  setIsPlaying(true);
                } catch (e) {}
              } else if (currentTrack?.source === 'youtube') {
                const initId = extractYouTubeId(currentTrack);
                if (initId && typeof ytPlayerRef.current.cueVideoById === 'function') {
                  try {
                    ytPlayerRef.current.cueVideoById(initId);
                  } catch (e) {}
                }
              }
            },
            onStateChange: (event: any) => {
              // 1 = playing, 2 = paused, 0 = ended
              if (event.data === 1) {
                setIsPlaying(true);
                // Ensure native silent audio anchor keeps Android background lock
                if (audioRef.current && audioRef.current.paused) {
                  audioRef.current.play().catch(() => {});
                }
              } else if (event.data === 2) {
                // If paused due to mobile screen locking or app switching while meant to play, resume
                if (isPlayingRef.current && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                  try {
                    ytPlayerRef.current.playVideo();
                    return;
                  } catch (e) {}
                }
                setIsPlaying(false);
              } else if (event.data === 0) {
                if (repeatModeRef.current === 'one') {
                  try {
                    ytPlayerRef.current.seekTo(0, true);
                    ytPlayerRef.current.playVideo();
                  } catch (e) {}
                } else {
                  nextTrackRef.current();
                }
              }
            },
            onError: (event: any) => {
              console.warn('YouTube playback event notice:', event.data);
              // Video cannot be embedded (error 101 or 150) -> advance to next track
              if (event.data === 101 || event.data === 150) {
                nextTrackRef.current();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YT initialization notice:', err);
      }
    }

    function checkAndInit() {
      if (ytPlayerRef.current) return;
      if (window.YT && window.YT.Player) {
        initYouTubePlayer();
      } else {
        setTimeout(checkAndInit, 150);
      }
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') {
        try { prevReady(); } catch (e) {}
      }
      initYouTubePlayer();
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    } else {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      checkAndInit();
    }

    return () => {
      if (ytPollIntervalRef.current) clearInterval(ytPollIntervalRef.current);
    };
  }, [volume]);

  // Track YouTube player progress
  useEffect(() => {
    if (currentTrack?.source === 'youtube' && isPlaying) {
      ytPollIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(curr);
            if (dur > 0 && !isNaN(dur)) {
              setDuration(dur);
            }
          } catch (e) {}
        }
      }, 500);
    } else {
      if (ytPollIntervalRef.current) {
        clearInterval(ytPollIntervalRef.current);
        ytPollIntervalRef.current = null;
      }
    }

    return () => {
      if (ytPollIntervalRef.current) {
        clearInterval(ytPollIntervalRef.current);
        ytPollIntervalRef.current = null;
      }
    };
  }, [currentTrack, isPlaying]);

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

    const isYouTubeTrack = track.source === 'youtube' || !!extractYouTubeId(track);

    if (isYouTubeTrack) {
      // Start silent native audio anchor to keep Android / iOS MediaSession and background process active
      if (audioRef.current) {
        if (audioRef.current.src !== SILENT_AUDIO_URI) {
          audioRef.current.src = SILENT_AUDIO_URI;
        }
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      }

      const ytId = extractYouTubeId(track);
      if (ytId) {
        if (isYtReadyRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          try {
            ytPlayerRef.current.loadVideoById(ytId);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {
            console.warn('YT play notice:', e);
          }
        } else {
          pendingYtVideoIdRef.current = ytId;
          setIsPlaying(true);
        }
      }
      return;
    }

    // Native audio stream (Audius / Jamendo / Local / Custom)
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch (e) {}
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
    const isYt = currentTrack?.source === 'youtube' || (currentTrack ? !!extractYouTubeId(currentTrack) : false);

    if (isYt) {
      if (isPlaying) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        const ytId = currentTrack ? extractYouTubeId(currentTrack) : null;
        if (audioRef.current) {
          if (audioRef.current.src !== SILENT_AUDIO_URI) {
            audioRef.current.src = SILENT_AUDIO_URI;
          }
          audioRef.current.loop = true;
          audioRef.current.play().catch(() => {});
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          try {
            const currentUrl = typeof ytPlayerRef.current.getVideoUrl === 'function' ? ytPlayerRef.current.getVideoUrl() : '';
            if (ytId && (!currentUrl || !currentUrl.includes(ytId))) {
              ytPlayerRef.current.loadVideoById(ytId);
            }
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {
            console.warn('YT togglePlay notice:', e);
          }
        } else if (ytId) {
          pendingYtVideoIdRef.current = ytId;
          setIsPlaying(true);
        }
      }
      return;
    }

    if (!audioRef.current) return;
    initAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src && currentTrack && currentTrack.source !== 'youtube') {
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
    if (currentTrack?.source === 'youtube') {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(seconds, true);
          setCurrentTime(seconds);
        } catch (e) {}
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, [currentTrack]);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(clamped * 100);
      } catch (e) {}
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        try {
          ytPlayerRef.current.unMute();
        } catch (e) {}
      }
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      setIsMuted(false);
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        try {
          ytPlayerRef.current.mute();
        } catch (e) {}
      }
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

  // Keep nextTrackRef current for YouTube player callbacks
  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

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
          if (audioRef.current && currentTrack?.source !== 'youtube') {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && currentTrack?.source !== 'youtube' && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (currentTrack?.source === 'youtube') return;
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

      {/* Active YouTube IFrame Player (kept in DOM viewport with minimal footprint to prevent OS background culling) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
          opacity: 0.001,
          overflow: 'hidden',
          zIndex: -999,
        }}
        aria-hidden="true"
      >
        <div id="calm-yt-player" style={{ width: '100%', height: '100%' }} />
      </div>

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
