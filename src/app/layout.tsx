import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MoodProvider } from '@/context/MoodContext';
import { PlayerProvider } from '@/context/PlayerContext';
import AuthProvider from '@/components/providers/AuthProvider';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Calm | Ambient Music Streaming for Focus & Tranquility',
  description: 'Relaxing ambient music streaming web app with living audio-reactive visual environments. Portfolio showcase for digital agency.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#05070e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05070e] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          <MoodProvider>
            <PlayerProvider>
              <AppShell>
                {children}
              </AppShell>
            </PlayerProvider>
          </MoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
