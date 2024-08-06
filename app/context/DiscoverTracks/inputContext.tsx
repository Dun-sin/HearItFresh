'use client';

import React, {
	ReactNode,
	RefObject,
	createContext,
	useContext,
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

	return (
		<InputContext.Provider
			value={{ artistName, artistArray, setArtistArray, spotifyPlaylist }}>
			{children}
		</InputContext.Provider>
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
