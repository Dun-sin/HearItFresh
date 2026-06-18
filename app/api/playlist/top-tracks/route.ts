import { NextResponse } from 'next/server';
import { getAllTracks, getEveryAlbum } from '@/app/lib/utils';
import { createPlayList, addTracksToPlayList } from '@/app/lib/spotify';
import { setAccessToken } from '@/app/lib/spotifyApi';
import { getDummyAccessToken } from '@/app/lib/spotify-dummy-auth';

export async function POST(req: Request) {
  try {
    const { artists } = await req.json();

    if (!artists || artists.length === 0) {
      return NextResponse.json(
        { error: 'No artists provided' },
        { status: 400 }
      );
    }

    // Get dummy token and set it for Spotify API
    const token = await getDummyAccessToken();
    setAccessToken(token);

    // Calculate the max album to get based on the number of artists
    const maxAlbums = Math.floor(100 / (artists.length * 2));
    const maxTracksPerAlbum = Math.floor(100 / (artists.length * maxAlbums));

    // Get albums for each artist
    const albums: string[] = await getEveryAlbum(artists);

    // Get tracks from albums
    const tracks = await getAllTracks(albums, maxTracksPerAlbum) as string[];

    if (!tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found' },
        { status: 400 }
      );
    }

    // Create playlist
    const playlistName = `Top Tracks from ${artists.join(', ')}`;
    const playlistInfo = await createPlayList(playlistName, 'Created by HearItFresh');

    if ('isError' in playlistInfo) {
      throw new Error(playlistInfo.err);
    }

    const { id, link, name } = playlistInfo;
    const playListID = id.substring('spotify:playlist:'.length);

    // Add tracks to playlist
    await addTracksToPlayList(tracks, playListID);

    return NextResponse.json({
      success: true,
      link,
      name,
    });
  } catch (error: any) {
    console.error('Error creating top tracks playlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
