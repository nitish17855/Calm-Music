import { Track } from '@/types';
import CryptoJS from 'crypto-js';

export const CURATED_AMBIENT_TRACKS: Track[] = [
  {
    id: 'curated-1',
    title: 'Sunset Rose Reverie',
    artistName: 'Velvet Horizon',
    albumName: 'Crimson Calm',
    duration: 210,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1885440&format=mp31&from=app-56d30c95',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80',
    source: 'jamendo',
  },
  {
    id: 'curated-2',
    title: 'Rain on Bamboo Leaves',
    artistName: 'Zen Garden Sanctuary',
    albumName: 'Precipitation',
    duration: 215,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1886257&format=mp31&from=app-56d30c95',
    coverUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=400&q=80',
    source: 'jamendo',
  },
  {
    id: 'curated-3',
    title: 'Forest Canopy Stillness',
    artistName: 'Verdant Mind',
    albumName: 'Deep Focus Alpha',
    duration: 242,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1888439&format=mp31&from=app-56d30c95',
    coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    source: 'jamendo',
  },
  {
    id: 'curated-4',
    title: 'Nocturnal Solitude',
    artistName: 'Astral Echoes',
    albumName: 'Night Wanderer',
    duration: 184,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1885437&format=mp31&from=app-56d30c95',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    source: 'jamendo',
  },
  {
    id: 'curated-5',
    title: 'Deep Water Resonance',
    artistName: 'Aquatic Dreams',
    albumName: 'Liquid Peace',
    duration: 260,
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1886259&format=mp31&from=app-56d30c95',
    coverUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    source: 'jamendo',
  },
];

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '56d30c95';

// Helper to parse "4:33" or "1:02:15" into seconds
function parseDuration(timeStr?: string): number {
  if (!timeStr) return 180;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 180;
}

// Helper to fetch and scrape YouTube results HTML
async function fetchYouTubeScrape(queryStr: string, limit = 12): Promise<Track[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryStr)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const marker = 'ytInitialData = ';
    const idx = html.indexOf(marker);
    if (idx === -1) return [];

    const endIdx = html.indexOf(';</script>', idx);
    const jsonStr = html.slice(idx + marker.length, endIdx !== -1 ? endIdx : undefined);
    const data = JSON.parse(jsonStr);

    const sectionList =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    if (!Array.isArray(sectionList)) return [];

    const tracks: Track[] = [];

    for (const section of sectionList) {
      const contents = section.itemSectionRenderer?.contents;
      if (!Array.isArray(contents)) continue;

      for (const item of contents) {
        if (!item.videoRenderer) continue;
        const vr = item.videoRenderer;
        const videoId = vr.videoId;
        if (!videoId) continue;

        const title = vr.title?.runs?.[0]?.text || 'Untitled Song';
        const channel = vr.ownerText?.runs?.[0]?.text || 'YouTube Music';
        const durationStr = vr.lengthText?.simpleText;
        const duration = parseDuration(durationStr);

        const thumb =
          vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        tracks.push({
          id: `yt-${videoId}`,
          title,
          artistName: channel,
          albumName: 'YouTube Official Stream',
          duration,
          audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: thumb,
          source: 'youtube',
          youtubeId: videoId,
        });

        if (tracks.length >= limit) break;
      }
      if (tracks.length >= limit) break;
    }

    return tracks;
  } catch (err) {
    console.warn('YouTube scrape error:', err);
    return [];
  }
}

// Search YouTube directly with smart music fallback for age-gated/misclassified queries
export async function searchYouTube(query: string, limit = 12): Promise<Track[]> {
  const cleanQ = query.trim();
  let tracks = await fetchYouTubeScrape(cleanQ, limit);

  // If YouTube age-gated the raw phrase or returned empty, append "song" to classify as music
  if (tracks.length === 0) {
    const lower = cleanQ.toLowerCase();
    if (!lower.includes('song') && !lower.includes('music') && !lower.includes('audio') && !lower.includes('track')) {
      tracks = await fetchYouTubeScrape(`${cleanQ} song`, limit);
    }
  }

  return tracks;
}

export async function searchJamendo(query: string, limit = 20): Promise<Track[]> {
  try {
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('namesearch', query);
    url.searchParams.set('audioformat', 'mp32');
    url.searchParams.set('include', 'musicinfo');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: `jamendo-${item.id}`,
      title: item.name || 'Untitled Ambient Track',
      artistName: item.artist_name || 'Calm Artist',
      albumName: item.album_name || 'Ambient Collection',
      duration: item.duration || 180,
      audioUrl: item.audio || item.audiodownload,
      coverUrl: item.image || item.album_image || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
      source: 'jamendo' as const,
    }));
  } catch (err) {
    console.warn('Error fetching from Jamendo:', err);
    return [];
  }
}

export async function getJamendoByTag(tags: string, limit = 20): Promise<Track[]> {
  try {
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('tags', tags);
    url.searchParams.set('boost', 'popularity_total');
    url.searchParams.set('audioformat', 'mp32');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: `jamendo-${item.id}`,
      title: item.name || 'Calm Soundscape',
      artistName: item.artist_name || 'Ambient Composer',
      albumName: item.album_name || 'Peaceful Vibes',
      duration: item.duration || 180,
      audioUrl: item.audio || item.audiodownload,
      coverUrl: item.image || item.album_image || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
      source: 'jamendo' as const,
    }));
  } catch {
    return [];
  }
}

export async function searchAudius(query: string, limit = 10): Promise<Track[]> {
  try {
    const url = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
      query
    )}&limit=${limit}&app_name=CALM_MUSIC`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: any) => ({
      id: `audius-${item.id}`,
      title: item.title || 'Audius Track',
      artistName: item.user?.name || 'Audius Creator',
      albumName: 'Audius Release',
      duration: item.duration || 180,
      audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=CALM_MUSIC`,
      coverUrl:
        item.artwork?.['480x480'] ||
        item.artwork?.['150x150'] ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      source: 'audius' as const,
    }));
  } catch (err) {
    console.warn('Audius search error:', err);
    return [];
  }
}

// Decrypt direct 320kbps audio stream URL from JioSaavn encrypted media token
export function decryptSaavnMediaUrl(encryptedUrl?: string): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    const rawUrl = decrypted.toString(CryptoJS.enc.Utf8);
    // Upgrade 96kbps / 160kbps stream to crystal-clear 320kbps studio stream
    return rawUrl.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
  } catch (err) {
    console.warn('Saavn media decryption notice:', err);
    return '';
  }
}

// Search direct high-fidelity audio streams for Bollywood, Indie, Pop & Global tracks
export async function searchSaavn(query: string, limit = 12): Promise<Track[]> {
  try {
    const cleanQ = query.trim();
    if (!cleanQ) return [];

    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(
      cleanQ
    )}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const text = await res.text();
    const data = JSON.parse(text);
    const results = data.results || [];
    if (!Array.isArray(results)) return [];

    const tracks: Track[] = [];

    for (const item of results) {
      const enc = item.more_info?.encrypted_media_url;
      const directAudioUrl = decryptSaavnMediaUrl(enc);
      if (!directAudioUrl) continue;

      const title = (item.title || 'Untitled Song')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');

      const artist = (item.more_info?.primary_artists || item.subtitle || 'Featured Artist')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');

      const album = (item.more_info?.album || 'Official Studio Audio')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');

      // Request highest resolution 500x500 album art
      const cover =
        (item.image || '')
          .replace('150x150.jpg', '500x500.jpg')
          .replace('50x50.jpg', '500x500.jpg') ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

      const duration = parseInt(item.more_info?.duration || '180', 10);

      tracks.push({
        id: `saavn-${item.id}`,
        title,
        artistName: artist,
        albumName: album,
        duration: isNaN(duration) ? 180 : duration,
        audioUrl: directAudioUrl,
        coverUrl: cover,
        source: 'saavn',
      });

      if (tracks.length >= limit) break;
    }

    return tracks;
  } catch (err) {
    console.warn('Saavn search notice:', err);
    return [];
  }
}
