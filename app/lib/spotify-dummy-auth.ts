// app/lib/spotify-dummy-auth.ts

import axios from 'axios';

export async function getDummyAccessToken() {
  try {
    const { data } = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.SPOTIFY_DUMMY_REFRESH_TOKEN || ''
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')
        }
      }
    );
    return data.access_token; // valid for 1 hour
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new Error('Failed to refresh dummy Spotify access token — refresh token may have expired (6 month limit), re-run get-refresh-token.js');
    }
    throw err;
  }
}
