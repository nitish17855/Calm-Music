import { NextResponse } from 'next/server';
import { searchYouTube, searchJamendo, getJamendoByTag, searchAudius, CURATED_AMBIENT_TRACKS } from '@/services/musicService';
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
      if (source === 'youtube') {
        tracks = await searchYouTube(query, 24);
      } else if (source === 'audius') {
        tracks = await searchAudius(query, 24);
      } else if (source === 'jamendo') {
        tracks = await searchJamendo(query, 24);
      } else {
        // Query YouTube, Jamendo, and Audius in parallel for maximum coverage
        const [ytTracks, jamendoTracks, audiusTracks] = await Promise.all([
          searchYouTube(query, 12),
          searchJamendo(query, 10),
          searchAudius(query, 6),
        ]);
        // Put YouTube & Audius top results first when searching for specific songs
        tracks = [...ytTracks, ...audiusTracks, ...jamendoTracks];
      }
    } else if (tag) {
      tracks = await getJamendoByTag(tag, 24);
    } else {
      tracks = await getJamendoByTag('ambient+relaxing', 24);
    }

    // Fallback if API returned empty
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
