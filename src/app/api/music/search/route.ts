import { NextResponse } from 'next/server';
import { searchJamendo, getJamendoByTag, CURATED_AMBIENT_TRACKS } from '@/services/musicService';
import { Track } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const tag = searchParams.get('tag')?.trim() || '';

  try {
    let tracks: Track[] = [];

    if (query) {
      tracks = await searchJamendo(query, 24);
    } else if (tag) {
      tracks = await getJamendoByTag(tag, 24);
    } else {
      // Default ambient query
      tracks = await getJamendoByTag('ambient+relaxing', 24);
    }

    // If API returned empty (e.g. offline or client id rate-limited), seamlessly fallback to curated library
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
      source: 'jamendo',
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
