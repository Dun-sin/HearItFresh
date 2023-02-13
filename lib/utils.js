import { getFiveArtistsAlbums, getOneAlbumTrack  } from "./spotify"

export const getEveryAlbum = async (artists) => {
    const getArtistAlbums = artists.map(getFiveArtistsAlbums)
    const albumArray = await Promise.all(getArtistAlbums)
    const albums = [...new Set(albumArray.flat())] 
  
    return albums
}

export const getAllTracks = async (albums) => {
    const getAlbumTracks = albums.map(getOneAlbumTrack)
    const tracks = await Promise.all(getAlbumTracks);
    const flattenedTracks = tracks.flat();

    const nonEmptyTracks = flattenedTracks.filter((track) => {
        if(track.toLowerCase().includes('spotify:track:')) return true

        return false
    });
    
    return nonEmptyTracks;
}

export const copyToClipboard = async (textToCopy) => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(textToCopy);
    } else {
      return document.execCommand('copy', true, textToCopy);
    }
  }

   // handle logic for if the link is correct
export function isValidPlaylistLink(link) {
    return link.trim().startsWith('https://open.spotify.com/playlist/');
  }

    // handle logic for if getting the playlist id from the link
export  function extractPlaylistId(link) {
    const playlistIdStartIndex = link.lastIndexOf('/') + 1;
    const playlistIdEndIndex = link.includes('?') ? link.indexOf('?') : link.length;
    return link.substring(playlistIdStartIndex, playlistIdEndIndex);
  }
