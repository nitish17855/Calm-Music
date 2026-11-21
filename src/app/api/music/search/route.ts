import { NextResponse } from 'next/server';
import { searchJamendo, getJamendoByTag, searchAudius, CURATED_AMBIENT_TRACKS } from '@/services/musicService';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const tag = searchParams.get('tag')?.trim() || '';
  const source = searchParams.get('source')?.trim() || 'all';

  try {
    let tracks: Track[] = [];

    if (query) {
      if (source === 'audius') {
        tracks = await searchAudius(query, 24);
      } else if (source === 'jamendo') {
        tracks = await searchJamendo(query, 24);
      } else {
        // Query both Jamendo & Audius in parallel and combine
        const [jamendoTracks, audiusTracks] = await Promise.all([
          searchJamendo(query, 16),
          searchAudius(query, 8),
        ]);
        tracks = [...jamendoTracks, ...audiusTracks];
      }
    } else if (tag) {
      tracks = await getJamendoByTag(tag, 24);
    } else {
      // Default query: sunset ambient / calming
      tracks = await getJamendoByTag('ambient+relaxing', 24);
    }

    // Fallback if API is offline
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
      source: 'multi',
    });
  } catch (error) {
    console.error('Music search route error:', error);
    return NextResponse.json({
      tracks: CURATED_AMBIENT_TRACKS,
      total: CURATED_AMBIENT_TRACKS.length,
      source: 'curated',
    });
  }
}
