import { getFiveArtistsAlbums, getTwoAlbumTracks  } from "./spotify"

export const getEveryAlbum = async (artists) => {
    const getArtistAlbums = artists.map(getFiveArtistsAlbums)
    const albumArray = await Promise.all(getArtistAlbums)
    const albums = [... new Set(albumArray.flat())] 
  
    return albums
}

export const getAllTracks = async (albums) => {
    const getAlbumTracks = albums.map(getTwoAlbumTracks)
    const trackArray = await Promise.all(getAlbumTracks);
    const tracks = [... new Set(trackArray.flat())]

    const nonEmptyTracks = tracks.flat().filter(Boolean);
    return nonEmptyTracks;
}

