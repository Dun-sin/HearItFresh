'use client';

import React, {
	ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';

import { playlistSongDetails } from '@/app/types';

interface SeedSongsContextProps {
	extractedSongs: playlistSongDetails[];
	setExtractedSongs: (songs: playlistSongDetails[]) => void;
	selectedSeedIds: Set<string>;
	toggleSeed: (id: string) => void;
	clearSeeds: () => void;
	selectAllSeeds: () => void;
	extractedArtists: string[];
	setExtractedArtists: (artists: string[]) => void;
}

const SeedSongsContext = createContext<SeedSongsContextProps | undefined>(
	undefined,
);

const SeedSongsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [extractedSongs, setExtractedSongs] = useState<playlistSongDetails[]>(
		[],
	);
	const [selectedSeedIds, setSelectedSeedIds] = useState<Set<string>>(
		new Set(),
	);
	const [extractedArtists, setExtractedArtists] = useState<string[]>([]);

	const toggleSeed = useCallback((id: string) => {
		setSelectedSeedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				if (next.size >= 15) return prev; // max 15 seeds
				next.add(id);
			}
			return next;
		});
	}, []);

	const clearSeeds = useCallback(() => {
		setSelectedSeedIds(new Set());
		setExtractedSongs([]);
		setExtractedArtists([]);
	}, []);

	const selectAllSeeds = useCallback(() => {
		const ids = extractedSongs.slice(0, 15).map((s) => s.id);
		setSelectedSeedIds(new Set(ids));
	}, [extractedSongs]);

	const value = useMemo(
		() => ({
			extractedSongs,
			setExtractedSongs,
			selectedSeedIds,
			toggleSeed,
			clearSeeds,
			selectAllSeeds,
			extractedArtists,
			setExtractedArtists,
		}),
		[
			extractedSongs,
			selectedSeedIds,
			toggleSeed,
			clearSeeds,
			selectAllSeeds,
			extractedArtists,
		],
	);

	return (
		<SeedSongsContext.Provider value={value}>
			{children}
		</SeedSongsContext.Provider>
	);
};

const useSeedSongs = (): SeedSongsContextProps => {
	const context = useContext(SeedSongsContext);
	if (!context) {
		throw new Error('useSeedSongs must be used within a SeedSongsProvider');
	}
	return context;
};

export { SeedSongsProvider, useSeedSongs };
