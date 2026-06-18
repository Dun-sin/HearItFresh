// app/lib/spotify-dummy-auth.ts

export async function getDummyAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_DUMMY_REFRESH_TOKEN || ''
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh dummy Spotify access token — refresh token may have expired (6 month limit), re-run get-refresh-token.js');
  }

  const data = await response.json();
  return data.access_token; // valid for 1 hour
}
