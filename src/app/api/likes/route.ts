import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all liked tracks for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const likedTracks = await prisma.likedTrack.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ likedTracks });
  } catch (error) {
    console.error('Fetch liked tracks error:', error);
    return NextResponse.json({ error: 'Failed to fetch liked tracks' }, { status: 500 });
  }
}

// POST toggle like track
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { trackId, title, artistName, albumName, duration, audioUrl, coverUrl, source } = body;

    if (!trackId || !title || !audioUrl) {
      return NextResponse.json({ error: 'Track details missing' }, { status: 400 });
    }

    // Check if already liked
    const existing = await prisma.likedTrack.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.likedTrack.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ isLiked: false });
    } else {
      // Like
      const created = await prisma.likedTrack.create({
        data: {
          userId,
          trackId,
          title,
          artistName: artistName || 'Unknown Artist',
          albumName: albumName || null,
          duration: duration || 180,
          audioUrl,
          coverUrl: coverUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
          source: source || 'jamendo',
        },
      });
      return NextResponse.json({ isLiked: true, track: created });
    }
  } catch (error) {
    console.error('Toggle like track error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
