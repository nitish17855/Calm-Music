import { Track } from '@/types';

// Robust curated fallback tracks if API is rate-limited or offline
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

export async function searchJamendo(query: string, limit = 20): Promise<Track[]> {
  try {
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('namesearch', query);
    url.searchParams.set('audioformat', 'mp32');
    url.searchParams.set('include', 'musicinfo');

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.warn('Jamendo API responded with error status:', res.status);
      return [];
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

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
    console.error('Error fetching from Jamendo:', err);
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

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
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

// Audius open search API for secondary decentralized music search
export async function searchAudius(query: string, limit = 10): Promise<Track[]> {
  try {
    const url = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
      query
    )}&limit=${limit}&app_name=CALM_MUSIC`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
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
