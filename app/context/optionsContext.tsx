'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';
import type {
	ThemeFilterState,
	ThemeFilters,
	ThemeSlug,
} from '@/app/lib/themes/slugs';

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
	themeFilters: ThemeFilters;
	setThemeFilter: (theme: ThemeSlug, state: ThemeFilterState) => void;
	resetThemeFilters: () => void;
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
	const [themeFilters, setThemeFilters] = useState<ThemeFilters>({});

	const setThemeFilter = (theme: ThemeSlug, state: ThemeFilterState) =>
		setThemeFilters((current) => {
			const next = { ...current };
			if (state === 'yes') {
				delete next[theme];
			} else {
				next[theme] = state;
			}
			return next;
		});

	const resetThemeFilters = () => setThemeFilters({});

	return (
		<OptionsContext.Provider
			value={{
				isDifferentTypesOfArtists,
				setIsDifferentTypesOfArtists,
				isNotPopularArtists,
				setIsNotPopularArtists,
				selectedArtist,
				setSelectedArtist,
				themeFilters,
				setThemeFilter,
				resetThemeFilters,
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
