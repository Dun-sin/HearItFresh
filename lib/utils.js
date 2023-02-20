import { getArtistsAlbums, getTracks } from "./spotify"

export const getEveryAlbum = async (artists) => {
  const artistAlbums = artists.map(item => getArtistsAlbums(item, artists.length))
  const albumArray = await Promise.all(artistAlbums)
  const albums = [...new Set(albumArray.flat())]

  return albums
}

export const getAllTracks = async (albums, numTracks) => {
  const tracks = await getTracks(albums);

  // arrange the tracks into sub arrays based on albums
  let subTracks = tracks.reduce((acc, item) => {
    const found = acc.find(arr => arr[0].albumName === item.albumName);
    if (found) {
      found.push(item);
    } else {
      acc.push([item]);
    }
    return acc;
  }, []);

  // get one random track from each sub array
  subTracks = subTracks.map(subarray => {
    const result = [];
    for (let i = 0; i < numTracks; i++) {
      const randomIndex = Math.floor(Math.random() * subarray.length);
      const randomTrack = subarray.splice(randomIndex, 1)[0];
      result.push(randomTrack);
    }
    return result;
  });

  subTracks = subTracks.flat().filter(item => item != undefined)
  const allTracksID = subTracks.map(item => item.uri)
  return allTracksID
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
export function extractPlaylistId(link) {
  const playlistIdStartIndex = link.lastIndexOf('/') + 1;
  const playlistIdEndIndex = link.includes('?') ? link.indexOf('?') : link.length;
  return link.substring(playlistIdStartIndex, playlistIdEndIndex);
}

export const convertToSubArray = (albums) => {
  const subArrays = [];

  for (let i = 0; i < albums.length; i += 20) {
    subArrays.push(albums.slice(i, i + 20));
  }
  return subArrays
}


// export const getAllTracks = async (albums) => {
//   const getAlbumTracks = albums.map(getOneAlbumTrack)
//   const tracks = await Promise.all(getAlbumTracks);
//   const flattenedTracks = tracks.flat();

//   const nonEmptyTracks = flattenedTracks.filter((track) => {
//     if (track.toLowerCase().includes('spotify:track:')) return true

//     return false
//   });

//   return nonEmptyTracks;
// }