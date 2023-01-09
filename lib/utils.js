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

    const nonEmptyTracks = flattenedTracks.filter(Boolean);
    return nonEmptyTracks;
}

export const copyToClipboard = async (textToCopy) => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(textToCopy);
    } else {
      return document.execCommand('copy', true, textToCopy);
    }
  }