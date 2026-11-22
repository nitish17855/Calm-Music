import { NextResponse } from 'next/server';
import {
  searchSaavn,
  searchJamendo,
  getJamendoByTag,
  searchAudius,
  searchYouTube,
  CURATED_AMBIENT_TRACKS,
} from '@/services/musicService';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const tag = searchParams.get('tag')?.trim() || '';

  try {
    let tracks: Track[] = [];

    if (query) {
      // Search Saavn (pure 320kbps background audio), YouTube, Audius & Jamendo in parallel
      const [saavnTracks, ytTracks, audiusTracks, jamendoTracks] = await Promise.all([
        searchSaavn(query, 14).catch((err) => {
          console.warn('Saavn search fallback:', err);
          return [];
        }),
        searchYouTube(query, 12).catch((err) => {
          console.warn('YouTube search fallback:', err);
          return [];
        }),
        searchAudius(query, 8).catch((err) => {
          console.warn('Audius search fallback:', err);
          return [];
        }),
        searchJamendo(query, 8).catch((err) => {
          console.warn('Jamendo search fallback:', err);
          return [];
        }),
      ]);
      tracks = [...saavnTracks, ...ytTracks, ...audiusTracks, ...jamendoTracks];
    } else if (tag) {
      tracks = await getJamendoByTag(tag, 24);
    } else {
      tracks = await getJamendoByTag('ambient+relaxing', 24);
    }

    // Filter curated library if external search yielded few results
    if (tracks.length === 0) {
      if (query) {
        const lowerQ = query.toLowerCase();
        tracks = CURATED_AMBIENT_TRACKS.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQ) ||
            t.artistName.toLowerCase().includes(lowerQ) ||
            (t.albumName && t.albumName.toLowerCase().includes(lowerQ))
        );
      } else {
        tracks = CURATED_AMBIENT_TRACKS;
      }
    }

    return NextResponse.json({
      tracks,
      total: tracks.length,
      source: 'direct-audio',
    });
  } catch (error) {
    console.error('Music search route notice:', error);
    return NextResponse.json({
      tracks: CURATED_AMBIENT_TRACKS,
      total: CURATED_AMBIENT_TRACKS.length,
      source: 'curated',
    });
  }
}
