'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

export interface SelectedArtist {
	id: string;
	name: string;
	image?: string;
	followers?: number;
	genres?: string[];
}

interface OptionsContextProps {
	isDifferentTypesOfArtists: boolean;
	setIsDifferentTypesOfArtists: (value: boolean) => void;
	isNotPopularArtists: boolean;
	setIsNotPopularArtists: (value: boolean) => void;
	selectedArtist: SelectedArtist | null;
	setSelectedArtist: (artist: SelectedArtist | null) => void;
}

const OptionsContext = createContext<OptionsContextProps | undefined>(
	undefined,
);

const OptionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] =
		useState<boolean>(false);
	const [isNotPopularArtists, setIsNotPopularArtists] =
		useState<boolean>(false);
	const [selectedArtist, setSelectedArtist] = useState<SelectedArtist | null>(
		null,
	);

	return (
		<OptionsContext.Provider
			value={{
				isDifferentTypesOfArtists,
				setIsDifferentTypesOfArtists,
				isNotPopularArtists,
				setIsNotPopularArtists,
				selectedArtist,
				setSelectedArtist,
			}}>
			{children}
		</OptionsContext.Provider>
	);
};

const useOptions = (): OptionsContextProps => {
	const context = useContext(OptionsContext);
	if (!context) {
		throw new Error('useOptions must be used within an OptionsProvider');
	}
	return context;
};

export { OptionsProvider, useOptions };
