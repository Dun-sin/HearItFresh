import {
	addPlaylistFullLinkFromID,
	addYoutubePlaylistFullLinkFromID,
	formatPlaylistTracks,
	getPlaylistTracks,
	isSpotifyPlaylistPermissionError,
	SPOTIFY_PUBLIC_PLAYLIST_ERROR,
} from '../lib/helpers';
import { SeedTrackHistory, playlistSongDetails } from '../types';
import type { ProviderName } from '../lib/providers/types';

import { toast } from 'react-toastify';
import { useRef } from 'react';
import { useAuth } from '../context/authContext';
import { useGeneralState } from '../context/generalStateContext';
import { useInput } from '../context/inputContext';
import { useLoading } from '../context/loadingContext';
import { useOptions } from '../context/optionsContext';
import { useSeedSongs } from '../context/seedSongsContext';
import { useYoutubeChannel } from '../context/youtubeChannelContext';

const toSongDetails = (seeds: SeedTrackHistory[]): playlistSongDetails[] =>
	seeds
		.filter((seed): seed is SeedTrackHistory & { id: string } =>
			Boolean(seed.id),
		)
		.map((seed) => ({
			id: seed.id,
			name: seed.name ?? 'Unknown track',
			artist: Array.isArray(seed.artist)
				? seed.artist
				: seed.artist
					? [seed.artist]
					: [],
			image: seed.image,
		}));

const useReuseSeeds = () => {
	const { loading, setLoading, setLoadingMessage } = useLoading();
	const { buttonClick, errorMessages, setErrorMessages, setProvider } =
		useGeneralState();
	const { user } = useAuth();
	const { setSelectedArtist } = useOptions();
	const { spotifyPlaylist } = useInput();
	const { setExtractedSongs, setExtractedArtists, selectSeeds } =
		useSeedSongs();
	const { ensureYoutubeChannel } = useYoutubeChannel();

	const loadedPlaylistRef = useRef<
		| ({ playlistId: string; provider: ProviderName } & ReturnType<
				typeof formatPlaylistTracks
		  >)
		| null
	>(null);

	const isReuseDisabled = loading || buttonClick;

	const loadPlaylist = async (playlistId: string, provider: ProviderName) => {
		const cached = loadedPlaylistRef.current;
		if (cached?.playlistId === playlistId && cached.provider === provider) {
			return cached;
		}

		setLoading(true);
		setLoadingMessage('Retrieving all tracks from the provided playlist...');

		try {
			const playlistData = await getPlaylistTracks(
				playlistId,
				true,
				provider,
				user?.user_id,
			);
			loadedPlaylistRef.current = {
				playlistId,
				provider,
				...formatPlaylistTracks(playlistData.tracks),
			};
			return loadedPlaylistRef.current;
		} catch (err) {
			toast.warning(
				isSpotifyPlaylistPermissionError(err)
					? `${SPOTIFY_PUBLIC_PLAYLIST_ERROR} Only the previous seeds are available for now.`
					: "Couldn't load the playlist. Only the previous seeds are available for now.",
			);
			return null;
		} finally {
			setLoading(false);
			setLoadingMessage(null);
		}
	};

	const reuseSeeds = async (
		sourcePlaylistId: string,
		seeds: SeedTrackHistory[],
		provider: ProviderName = 'spotify',
	) => {
		if (isReuseDisabled) return;

		const seedSongs = toSongDetails(seeds);
		if (seedSongs.length === 0) return;

		if (provider === 'youtube' && !(await ensureYoutubeChannel())) return;

		if (spotifyPlaylist.current) {
			spotifyPlaylist.current.value =
				provider === 'youtube'
					? addYoutubePlaylistFullLinkFromID(sourcePlaylistId)
					: addPlaylistFullLinkFromID(sourcePlaylistId);
		}
		setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });
		setProvider(provider);
		if (provider === 'youtube') setSelectedArtist(null);

		const seedIds = new Set(seedSongs.map((song) => song.id));
		let songs = seedSongs;
		let artistNames = [
			...new Set(seedSongs.flatMap((song) => song.artist.slice(0, 2))),
		];

		const playlist = await loadPlaylist(sourcePlaylistId, provider);
		if (playlist) {
			songs = [
				...seedSongs,
				...playlist.songs.filter((song) => !seedIds.has(song.id)),
			];
			artistNames = [...new Set([...playlist.artistNames, ...artistNames])];
		}

		setExtractedSongs(songs);
		setExtractedArtists(artistNames);
		selectSeeds([...seedIds]);
		spotifyPlaylist.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	};

	return { reuseSeeds, isReuseDisabled };
};

export default useReuseSeeds;
