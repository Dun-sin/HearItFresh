'use client';

import React, {
	ReactNode,
	RefObject,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';

interface InputContextProps {
	artistName: RefObject<HTMLInputElement>;
	spotifyPlaylist: RefObject<HTMLInputElement>;
	hasPlaylistLink: boolean;
	setPlaylistLink: (link: string) => void;
	artistArray: string[];
	setArtistArray: (artists: string[]) => void;
}

const InputContext = createContext<InputContextProps | undefined>(undefined);

const InputProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const artistName = useRef<HTMLInputElement>(null);
	const [artistArray, setArtistArray] = useState<string[]>([]);
	const spotifyPlaylist = useRef<HTMLInputElement>(null);
	const [hasPlaylistLink, setHasPlaylistLink] = useState(false);

	const setPlaylistLink = useCallback((link: string) => {
		if (spotifyPlaylist.current && spotifyPlaylist.current.value !== link) {
			spotifyPlaylist.current.value = link;
		}
		setHasPlaylistLink(link.trim().length > 0);
	}, []);

	const value = useMemo(
		() => ({
			artistName,
			artistArray,
			setArtistArray,
			spotifyPlaylist,
			hasPlaylistLink,
			setPlaylistLink,
		}),
		[artistArray, artistName, spotifyPlaylist, hasPlaylistLink, setPlaylistLink],
	);

	return (
		<InputContext.Provider value={value}>{children}</InputContext.Provider>
	);
};

const useInput = (): InputContextProps => {
	const context = useContext(InputContext);
	if (!context) {
		throw new Error('useInput must be used within an InputProvider');
	}
	return context;
};

export { InputProvider, useInput };
