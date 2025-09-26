import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
	clientId: process.env.SPOTIFY_CLIENT_ID,
	clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
	redirectUri: process.env.REDIRECT_URL,
});

export const setAccessToken = (accessToken: string) => {
	spotifyApi.setAccessToken(accessToken);
};

export default spotifyApi;
