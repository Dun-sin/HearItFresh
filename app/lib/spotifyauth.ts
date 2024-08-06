// import type { NextAuthOptions } from 'next-auth';
// import SpotifyProvider from 'next-auth/providers/spotify';
// import spotifyApi from './spotifyApi';

// export const authOptions: NextAuthOptions = {
// 	callbacks: {
// 		async jwt({ token, account }) {
// 			if (account) {
// 				// Save tokens and other info
// 				token.accessToken = account.access_token;
// 				token.refreshToken = account.refresh_token;

// 				const expires_in =
// 					typeof account.expires_in === 'number' ? account.expires_in : 3600;
// 				token.expires_at = Date.now() + expires_in * 1000;
// 			}
// 			return token;
// 		},
// 		async session({ session, token }) {
// 			if (token) {
// 				// Add token info to session
// 				session.user = {
// 					...session.user,
// 					accessToken: token.accessToken as string,
// 					refreshToken: token.refreshToken as string,
// 					expires_at: token.expires_at as number,
// 				};

// 				// Token refresh logic
// 				const now = Date.now();
// 				const expiresAt = token.expires_at as number;

// 				// If the token is about to expire or has expired, refresh it
// 				if (expiresAt - now <= 10 * 60 * 1000) {
// 					// 10 minutes before expiry
// 					console.log(
// 						'Token expired or about to expire, fetching a new one...',
// 					);

// 					try {
// 						const response = await fetch(
// 							'https://accounts.spotify.com/api/token',
// 							{
// 								method: 'POST',
// 								headers: {
// 									'Content-Type': 'application/x-www-form-urlencoded',
// 									Authorization: `Basic ${Buffer.from(
// 										`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
// 									).toString('base64')}`,
// 								},
// 								body: new URLSearchParams({
// 									grant_type: 'refresh_token',
// 									refresh_token: token.refreshToken as string,
// 								}),
// 								cache: 'no-cache',
// 							},
// 						);

// 						if (response.ok) {
// 							const data = await response.json();
// 							const { access_token, expires_in, refresh_token } = data;
// 							const newExpiresAt = Date.now() + expires_in * 1000;

// 							console.log(`New access token: ${access_token}`);

// 							// Update the token information
// 							session.user.accessToken = access_token;
// 							session.user.refreshToken = refresh_token;
// 							session.user.expires_at = newExpiresAt;

// 							// Optionally save the new token information somewhere if needed
// 						} else {
// 							console.error(
// 								`Failed to refresh token: ${response.status} ${response.statusText}`,
// 							);
// 						}
// 					} catch (error) {
// 						console.error(`Failed to fetch new token: ${error}`);
// 					}
// 				}
// 			}
// 			return session;
// 		},
// 	},
// 	providers: [
// 		SpotifyProvider({
// 			clientId: process.env.SPOTIFY_CLIENT_ID as string,
// 			clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
// 			authorization:
// 				'https://accounts.spotify.com/authorize?scope=playlist-read-private ,playlist-modify-public, user-read-private' +
// 				`&redirect_uri=${process.env.REDIRECT_URL}`,
// 		}),
// 	],
// 	// debug: true,
// 	secret: process.env.SECRET_KEY,
// };
