'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

interface OptionsContextProps {
	isDifferentTypesOfArtists: boolean;
	setIsDifferentTypesOfArtists: (value: boolean) => void;
	isNotPopularArtists: boolean;
	setIsNotPopularArtists: (value: boolean) => void;
}

const OptionsContext = createContext<OptionsContextProps | undefined>(
	undefined,
);

const OptionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] =
		useState<boolean>(false);
	const [isNotPopularArtists, setIsNotPopularArtists] =
		useState<boolean>(false);

	return (
		<OptionsContext.Provider
			value={{
				isDifferentTypesOfArtists,
				setIsDifferentTypesOfArtists,
				isNotPopularArtists,
				setIsNotPopularArtists,
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
