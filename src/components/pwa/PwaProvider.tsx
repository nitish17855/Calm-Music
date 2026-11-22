"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Download, Sparkles, X } from 'lucide-react';

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  installApp: async () => {},
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Evict stale browser caches from old builds
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name !== 'calm-music-v2') {
              caches.delete(name);
            }
          });
        });
      }

      // 2. On localhost during development, unregister service workers to avoid stale cached chunks
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocalhost && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      } else if ('serviceWorker' in navigator) {
        // Register Service Worker in production
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .catch((err) => console.warn('Service worker registration note:', err));
        });
      }
    }

    // 2. Check if already installed (standalone display mode)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Capture beforeinstallprompt event (Chrome on Android & Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <PwaContext.Provider value={{ isInstallable, isInstalled, installApp }}>
      {children}

      {/* Floating One-Tap PWA Install Banner */}
      {isInstallable && !isInstalled && !isBannerDismissed && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#09131d]/95 backdrop-blur-2xl border border-emerald-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.85)] text-white">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1">
                Install Calm Music
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-[10px] text-slate-400">
                Play audio in background & lock screen
              </span>
            </div>
            <button
              onClick={installApp}
              className="ml-2 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-semibold text-xs shadow-md transition-all whitespace-nowrap"
            >
              Install
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg ml-1"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
