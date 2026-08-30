'use client';

export const addToUrl = (key: string, value: string) => {
  if (typeof window === 'undefined') {
		return;
	}
	try {
		const searchParams = new URLSearchParams(window.location.search);
		searchParams.set(key, value);
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
		window.history.pushState({}, '', newUrl);
	} catch (error) {
		console.log('Error adding to url', error);
	}
};

export const copyToClipboard = async (textToCopy: string) => {
	if ('clipboard' in navigator) {
		return await navigator.clipboard.writeText(textToCopy);
	} else {
		return document.execCommand('copy', true, textToCopy);
	}
};

export const getFromUrl = (key: string) => {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.get(key);
};

export type YoutubeGuestCredentials = {
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
};

export type YoutubeConnectResult = {
	connected: boolean;
	guestCredentials?: YoutubeGuestCredentials;
};


export function openYoutubeConnectPopup(
	userId?: string | null,
): Promise<YoutubeConnectResult> {
	return new Promise((resolve) => {
		const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
		const popup = window.open(
			`/api/youtube/connect${qs}`,
			'youtube-connect',
			'width=500,height=650',
		);

		if (!popup) {
			resolve({ connected: false });
			return;
		}

		let settled = false;
		const finish = (result: YoutubeConnectResult) => {
			if (settled) return;
			settled = true;
			window.removeEventListener('message', onMessage);
			clearInterval(pollClosed);
			resolve(result);
		};

		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type !== 'youtube-oauth') return;
			finish({
				connected: event.data.status === 'connected',
				guestCredentials: event.data.guestCredentials,
			});
		};
		window.addEventListener('message', onMessage);

		const pollClosed = setInterval(() => {
			if (popup.closed) finish({ connected: false });
		}, 500);
	});
}
