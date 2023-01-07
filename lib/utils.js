import { getFiveArtistsAlbums, getTwoAlbumTracks  } from "./spotify"

export const getEveryAlbum = async (artists) => {
    const getArtistAlbums = artists.map(getFiveArtistsAlbums)
    const albumArray = await Promise.all(getArtistAlbums)
    const albums = [...new Set(albumArray.flat())] 
  
    return albums
}

export const getAllTracks = async (albums) => {
    const getAlbumTracks = albums.map(getTwoAlbumTracks)
    const tracks = await Promise.all(getAlbumTracks);
    const flattenedTracks = tracks.flat();

    const uniqueTracks = flattenedTracks.filter((track, index) => {
      // Check if the track is a remix
      if (track.name.toLowerCase().includes('remix')) {
        return false;
      }

      // Check if the track is a repetition
      for (let i = 0; i < index; i++) {
        if (flattenedTracks[i].name === track.name) {
          return false;
        }
      }

      return true;
    }).map(item => item.uri);

    const nonEmptyTracks = uniqueTracks.filter(Boolean);
    return nonEmptyTracks;
}