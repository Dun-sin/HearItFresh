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
import { nextSeedRole, type SeedRole } from '@/app/lib/seedRoles';

const MAX_SEEDS = 10;

interface SeedSongsContextProps {
	extractedSongs: playlistSongDetails[];
	setExtractedSongs: (songs: playlistSongDetails[]) => void;
	selectedSeedIds: Set<string>;
	seedRoles: Map<string, SeedRole>;
	clickSeed: (id: string) => void;
	removeSeed: (id: string) => void;
	selectSeeds: (ids: string[], roles?: Record<string, SeedRole>) => void;
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
	const [seedRoles, setSeedRoles] = useState<Map<string, SeedRole>>(new Map());
	const [extractedArtists, setExtractedArtists] = useState<string[]>([]);

	const selectedSeedIds = useMemo(() => new Set(seedRoles.keys()), [seedRoles]);

	const clickSeed = useCallback(
		(id: string) => {
			const artistCount =
				extractedSongs.find((s) => s.id === id)?.artist.length ?? 1;

			setSeedRoles((prev) => {
				const role = prev.get(id);
				if (!role && prev.size >= MAX_SEEDS) return prev;

				const next = new Map(prev);
				next.set(id, role ? nextSeedRole(role, artistCount) : 'expand');
				return next;
			});
		},
		[extractedSongs],
	);

	const removeSeed = useCallback((id: string) => {
		setSeedRoles((prev) => {
			if (!prev.has(id)) return prev;
			const next = new Map(prev);
			next.delete(id);
			return next;
		});
	}, []);

	const selectSeeds = useCallback(
		(ids: string[], roles?: Record<string, SeedRole>) => {
			setSeedRoles(
				new Map(
					ids.slice(0, MAX_SEEDS).map((id) => [id, roles?.[id] ?? 'expand']),
				),
			);
		},
		[],
	);

	const clearSeeds = useCallback(() => {
		setSeedRoles(new Map());
		setExtractedSongs([]);
		setExtractedArtists([]);
	}, []);

	const selectAllSeeds = useCallback(() => {
		setSeedRoles(
			new Map(
				extractedSongs
					.slice(0, MAX_SEEDS)
					.map((s) => [s.id, 'expand' as SeedRole]),
			),
		);
	}, [extractedSongs]);

	const value = useMemo(
		() => ({
			extractedSongs,
			setExtractedSongs,
			selectedSeedIds,
			seedRoles,
			clickSeed,
			removeSeed,
			selectSeeds,
			clearSeeds,
			selectAllSeeds,
			extractedArtists,
			setExtractedArtists,
		}),
		[
			extractedSongs,
			selectedSeedIds,
			seedRoles,
			clickSeed,
			removeSeed,
			selectSeeds,
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
