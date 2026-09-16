import axios from 'axios';

export type GoogleUser = {
	display_name: string;
	user_id: string;
	profile_image_url: string;
};

export async function getGoogleUser(
	accessToken: string,
): Promise<GoogleUser | null> {
	if (!accessToken) return null;

	try {
		const response = await axios.get(
			'https://www.googleapis.com/oauth2/v2/userinfo',
			{ headers: { Authorization: `Bearer ${accessToken}` } },
		);

		const { name, id, picture } = response.data;
		return {
			display_name: name,
			user_id: id,
			profile_image_url: picture,
		};
	} catch (error) {
		console.error('Failed to fetch Google user info:', error);
		return null;
	}
}
