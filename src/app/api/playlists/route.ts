import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET playlists of current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Get playlists error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// POST create new playlist
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
        coverUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
