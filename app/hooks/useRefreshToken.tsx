import { useEffect } from 'react';

export default function useRefreshToken(
	expires: number | null,
	refreshAccessToken: () => void,
) {
	useEffect(() => {
		if (!expires) return;

		const handle = setTimeout(() => {
			refreshAccessToken();
		}, (expires - 200) * 1000);

		return () => clearTimeout(handle);
	}, [expires, refreshAccessToken]);
}
