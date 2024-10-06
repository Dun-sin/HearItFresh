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
