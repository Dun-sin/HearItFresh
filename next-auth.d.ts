import 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			name?: string | null;
			email?: string | null;
			image?: string | null;
			accessToken?: string;
			refreshToken?: string;
			expires_at?: number;
		};
	}

	interface Token {
		accessToken?: string;
		refreshToken?: string;
		expires_at?: number;
	}
}
