import { NextResponse } from 'next/server';
import { searchJamendo, getJamendoByTag, searchAudius, CURATED_AMBIENT_TRACKS } from '@/services/musicService';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const tag = searchParams.get('tag')?.trim() || '';

  try {
    let tracks: Track[] = [];

    if (query) {
      // Search Audius & Jamendo in parallel for legal, high-quality audio streams
      const [audiusTracks, jamendoTracks] = await Promise.all([
        searchAudius(query, 16),
        searchJamendo(query, 16),
      ]);
      tracks = [...audiusTracks, ...jamendoTracks];
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
        if (tracks.length === 0) {
          tracks = CURATED_AMBIENT_TRACKS;
        }
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
