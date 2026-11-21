import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET playlist by id
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
        },
        user: {
          select: { name: true, image: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Fetch playlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

// POST add track to playlist
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: { tracks: true },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { trackId, title, artistName, albumName, duration, audioUrl, coverUrl, source } = body;

    const existingTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId: params.id,
          trackId,
        },
      },
    });

    if (existingTrack) {
      return NextResponse.json({ message: 'Track already in playlist' }, { status: 200 });
    }

    const track = await prisma.playlistTrack.create({
      data: {
        playlistId: params.id,
        trackId,
        title,
        artistName: artistName || 'Unknown Artist',
        albumName: albumName || null,
        duration: duration || 180,
        audioUrl,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
        source: source || 'jamendo',
        position: playlist.tracks.length,
      },
    });

    // Bump updatedAt
    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error('Add track to playlist error:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

// DELETE playlist
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.playlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
