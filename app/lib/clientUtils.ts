'use client';

const PENDING_PLAYLIST_LINK_KEY = 'hif_pending_playlist_link';

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

export function savePendingPlaylistLink(link: string) {
	if (typeof window === 'undefined') return;
	window.sessionStorage.setItem(PENDING_PLAYLIST_LINK_KEY, link);
}

export function takePendingPlaylistLink(): string | null {
	if (typeof window === 'undefined') return null;
	const link = window.sessionStorage.getItem(PENDING_PLAYLIST_LINK_KEY);
	window.sessionStorage.removeItem(PENDING_PLAYLIST_LINK_KEY);
	return link;
}

export type YoutubeConnectRedirectResult =
	| { status: 'connected'; guestCredentials?: YoutubeGuestCredentials }
	| { status: 'error' | 'no_refresh'; reason?: string };


export function consumeYoutubeConnectRedirect(): YoutubeConnectRedirectResult | null {
	if (typeof window === 'undefined') return null;

	const params = new URLSearchParams(window.location.search);
	const outcome = params.get('youtube');
	if (!outcome) return null;

	const reason = params.get('reason') ?? undefined;

	const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
	const accessToken = hash.get('at');
	const refreshToken = hash.get('rt');
	const expiresAt = hash.get('exp');

	const url = new URL(window.location.href);
	url.searchParams.delete('youtube');
	url.searchParams.delete('reason');
	url.hash = '';
	window.history.replaceState({}, '', url.toString());

	if (outcome === 'error' || outcome === 'no_refresh') {
		return { status: outcome, reason };
	}

	if (accessToken && refreshToken && expiresAt) {
		return {
			status: 'connected',
			guestCredentials: { accessToken, refreshToken, expiresAt },
		};
	}
	return { status: 'connected' };
}
