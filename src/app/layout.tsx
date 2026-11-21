import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MoodProvider } from '@/context/MoodContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { PwaProvider } from '@/components/pwa/PwaProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Calm Music | Ambient Music & Scenic Driving',
  description: 'Relaxing ambient music streaming and 60 FPS interactive canyon driving.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Calm Music',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#070e17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070e17] text-slate-100 antialiased selection:bg-rose-500/30 selection:text-rose-200">
        <AuthProvider>
          <MoodProvider>
            <PlayerProvider>
              <PwaProvider>
                <AppShell>
                  {children}
                </AppShell>
              </PwaProvider>
            </PlayerProvider>
          </MoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
