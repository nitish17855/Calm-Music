import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calm Music - Ambient Soundscapes',
    short_name: 'Calm Music',
    description: 'Immersive ambient music soundscapes and 60 FPS scenic GT cruising.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070e17',
    theme_color: '#070e17',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
