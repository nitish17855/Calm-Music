"use client";

import React, { useState, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useMood } from '@/context/MoodContext';
import { X, UploadCloud, Link as LinkIcon, Play, Radio, FileAudio, Info, Check } from 'lucide-react';

interface CustomAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomAudioModal({ isOpen, onClose }: CustomAudioModalProps) {
  const { playCustomStream, playLocalFile } = usePlayer();
  const { config } = useMood();

  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;
    playCustomStream(streamUrl.trim(), streamTitle.trim() || undefined);
    onClose();
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
      playLocalFile(file);
      onClose();
    } else {
      alert('Please select a valid audio file (.mp3, .wav, .m4a, .flac).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-white" style={{ color: config.accentColor }} />
            <div>
              <h3 className="text-base font-semibold text-white">Play Audio from Anywhere</h3>
              <p className="text-[11px] text-slate-400">Stream web audio links or drop your own music files.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-black/40 border border-white/5 mb-5">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'url' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Direct Audio URL / Stream</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'file' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Drop Any Audio File</span>
          </button>
        </div>

        {/* Tab 1: URL Stream */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Direct Audio Stream or MP3 URL
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/audio-stream.mp3"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Track Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lofi Chill Station / Custom Meditation"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1"
              />
            </div>

            {/* Explanatory Note regarding YouTube / Direct Streams */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-300">
                <span className="font-semibold text-white">Streaming Tip:</span> Supports direct MP3, AAC, OGG, Icecast/Shoutcast radio, or public podcast URLs. (Raw YouTube web links are gated by YouTube anti-bot protocols; to play favorite YouTube songs, simply download or drop the MP3 file in the next tab!)
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium text-white text-xs shadow-lg flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.01]"
              style={{ backgroundColor: config.accentColor }}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Load & Start Playing</span>
            </button>
          </form>
        )}

        {/* Tab 2: File Drop */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-rose-400 bg-rose-500/10'
                  : 'border-white/15 hover:border-white/30 bg-black/20 hover:bg-black/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
              <h4 className="text-sm font-semibold text-white">Drag & drop any audio song here</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Supports MP3, WAV, FLAC, M4A. Audio stays private on your device and connects directly to the living visualizer.
              </p>
              <span
                className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white glass-pill"
                style={{ backgroundColor: `${config.accentColor}25` }}
              >
                Browse Computer Files
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
