'use client';

import React, {
	ReactNode,
	RefObject,
	createContext,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';

interface InputContextProps {
	artistName: RefObject<HTMLInputElement>;
	spotifyPlaylist: RefObject<HTMLInputElement>;
	artistArray: string[];
	setArtistArray: (artists: string[]) => void;
}

const InputContext = createContext<InputContextProps | undefined>(undefined);

const InputProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const artistName = useRef<HTMLInputElement>(null);
	const [artistArray, setArtistArray] = useState<string[]>([]);
	const spotifyPlaylist = useRef<HTMLInputElement>(null);

	const value = useMemo(
		() => ({ artistName, artistArray, setArtistArray, spotifyPlaylist }),
		[artistArray, artistName, spotifyPlaylist],
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
