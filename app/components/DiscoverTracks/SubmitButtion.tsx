'use client';

import {
  addTracksToPlayList,
  createPlayList,
} from '@/app/lib/spotify';
import {
	extractPlaylistId,
	getAllTracks,
	getEveryAlbum,
	getPlaylistTracks,
	isSpotifyPlaylistPermissionError,
	isValidPlaylistLink,
  SPOTIFY_PUBLIC_PLAYLIST_ERROR,
} from '@/app/lib/utils';

import React, { useRef, useState } from 'react';
import SubmitButtionContainer from '../SubmitButtonContainer';
import { addToUrl } from '@/app/lib/clientUtils';
import { addUserHistory } from '@/app/lib/db';
import { fetchSimilarArtistsFromAI } from '@/app/lib/utils';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/context/authContext';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useHistory } from '@/app/context/HistoryContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useOptions } from '@/app/context/optionsContext';
import { useSeedSongs } from '@/app/context/DiscoverTracks/seedSongsContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';

const SubmitButtion = () => {
	const { setLoading } = useLoading();
	const { type } = useType();
	const {
		setErrorMessages,
		errorMessages,
		buttonClick,
		setButtonClicked,
		setPlayListData,
	} = useGeneralState();
	const { user, logOut } = useAuth();
	const { setLoadingMessage } = useLoading();
	const { artistName, artistArray, spotifyPlaylist, setArtistArray } =
		useInput();
	const { setHistory } = useHistory();
	const { isNotPopularArtists, isDifferentTypesOfArtists } = useOptions();

  const { extractedSongs, setExtractedSongs, selectedSeedIds, extractedArtists, setExtractedArtists, clearSeeds } = useSeedSongs();

  // Refs for in-flight Inngest job management
  const abortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const activeGeneratedPlaylistIdRef = useRef<string | null>(null);
	const inngestStartedRef = useRef(false);

	// Terminal state flags
	const [failed, setFailed] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSeedPlaylistGeneration = async () => {
		if (buttonClick === true) return;

		const seedCount = selectedSeedIds.size;
		if (seedCount > 0 && (seedCount < 5 || seedCount > 15)) {
			toast.error(
				'Please select either 0 seeds (skip lyrics) or between 5 to 15 seeds.',
			);
			return;
		}

		// Abort any stale dev-mode controller, then reset state for a fresh run
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		abortedRef.current = false;
		activeRunIdRef.current = null;
		activeGeneratedPlaylistIdRef.current = null;

		setButtonClicked(true);
		setLoading(true);

		try {
			setLoadingMessage(
				'Analyzing your selected songs & generating a playlist! Please do not leave the page, this might take a minute...',
			);
			console.log('[handleSeedPlaylistGeneration] Starting...');
			const selectedSongsData = extractedSongs.filter((s: any) =>
				selectedSeedIds.has(s.id),
			);

			// if (process.env.NODE_ENV === 'production') {
			// Inngest path
			inngestStartedRef.current = true;
			const payload = {
				seeds: selectedSongsData,
				artistNames: extractedArtists,
				options: {
					isNotPopular: isNotPopularArtists,
					isDifferent: isDifferentTypesOfArtists,
				},
				userId: user?.user_id,
				sourcePlaylistId: spotifyPlaylist.current?.value
					? extractPlaylistId(spotifyPlaylist.current.value)
					: undefined,
			};
			const result = await fetch('/api/playlist/generate', {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			console.log('[handleSeedPlaylistGeneration] Starting polling...');
			const { generatedPlaylistId } = await result.json();
			console.log(
				'[handleSeedPlaylistGeneration] Got generatedPlaylistId, starting polling...',
			);
			activeGeneratedPlaylistIdRef.current = generatedPlaylistId;
			await pollForCompletion(payload, 0);
			// } else {
			  inngestStartedRef.current = false;
			  abortControllerRef.current = new AbortController();

        const result = await fetch('/api/playlist/dev-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seeds: selectedSongsData,
            artistNames: extractedArtists,
            options: { isNotPopular: isNotPopularArtists, isDifferent: isDifferentTypesOfArtists },
            userId: user?.user_id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;

        const resultData = await result.json();

        if (resultData.error || !resultData.tracks || resultData.tracks.length === 0) {
          throw new Error(resultData.error || 'Failed to generate tracks');
        }

        const playlistName = seedCount > 0
          ? 'HearItFresh - Lyrics Inspired'
          : 'HearItFresh - Similar to Playlist';

        setLoadingMessage('Creating your new playlist on Spotify...');
        const playlistInfo = await createPlayList(playlistName, 'Created by HearItFresh');
        if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;
        if ('isError' in playlistInfo) throw new Error(playlistInfo.err);

        const { id, link, name } = playlistInfo;
        const playListID = id.substring('spotify:playlist:'.length);

			//   setLoadingMessage('Adding the tracks to your Spotify playlist...');
			//   await addTracksToPlayList(resultData.tracks, playListID);
			//   if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;
			//   createSpotifyPlaylist(link, name);
			// }
		} catch (err: any) {
			// Swallow errors that occurred after a user-initiated cancel
			if (abortedRef.current) return;
			console.log({ err });
			console.log('[handleSeedPlaylistGeneration] Error:', err.message);
			setErrorMessages({
				...errorMessages,
				error:
					'Error occurred while generating playlist: A playlist might have still been created, refresh the page, before trying again',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
			setLoadingMessage(null);
			abortControllerRef.current = null;
		}
	};

	const pollForCompletion = async (
		payload: Record<string, any>,
		unexpectedRetries = 0,
	): Promise<void> => {
		const MAX_UNEXPECTED_RETRIES = 10;

		if (abortedRef.current) return;

		const generatedPlaylistId = activeGeneratedPlaylistIdRef.current;
		console.log(
			'[pollForCompletion] Polling for generatedPlaylistId:',
			generatedPlaylistId,
		);
		const params = new URLSearchParams();
		if (generatedPlaylistId)
			params.set('generatedPlaylistId', generatedPlaylistId);
		if (payload.userId) params.set('userId', payload.userId);

		const res = await fetch(`/api/playlist/status?${params.toString()}`);
		const data = await res.json();
		console.log('[pollForCompletion] Status:', data.status, data);

		// Track the runId so we can cancel it if the user requests
		if (data.runId) activeRunIdRef.current = data.runId;

		if (data.status === 'Completed') {
			console.log('[pollForCompletion] Completed!');
			const playlist = data.output ?? data.lastPlaylist;
			if (!playlist?.link || !playlist?.name) {
				throw new Error(
					'Playlist generation completed without playlist output',
				);
			}
			const { link, name } = playlist;
			await createSpotifyPlaylist(link, name);
		} else if (data.status === 'Failed') {
			console.log('[pollForCompletion] Failed!');
			setFailed(true);
			setErrorMessage(data.errorMessage || 'Playlist generation failed');
			throw new Error(data.errorMessage || 'Playlist generation failed');
		} else if (data.status === 'Cancelled') {
			console.warn('[pollForCompletion] Inngest reported job as Cancelled.');
			setFailed(true);
			setErrorMessage('Generation was cancelled');
			return;
		} else if (
			data.status === 'Pending' ||
			data.status === 'Running' ||
			data.status === 'Scheduled'
		) {
			console.log(
				'[pollForCompletion] Still processing, polling again in 10s...',
			);
			await new Promise((resolve) => setTimeout(resolve, 10000));
			if (!abortedRef.current) {
				await pollForCompletion(payload, 0);
			}
		} else {
			if (unexpectedRetries >= MAX_UNEXPECTED_RETRIES) {
				throw new Error(
					`Polling stopped after ${MAX_UNEXPECTED_RETRIES} unexpected status responses: ${data.status}`,
				);
			}
			console.warn(
				'[pollForCompletion] Unexpected status:',
				data.status,
				`— retrying in 10s... (attempt ${unexpectedRetries + 1}/${MAX_UNEXPECTED_RETRIES})`,
			);
			await new Promise((resolve) => setTimeout(resolve, 10000));
			if (!abortedRef.current) {
				await pollForCompletion(payload, unexpectedRetries + 1);
			}
		}
	};

	/**
	 * User-initiated cancel. Stops polling and calls the Inngest cancel API.
	 * Returns to the normal "Generate Playlist" state — no Retry button shown.
	 */
	const handleCancel = async () => {
		abortedRef.current = true;
		setLoading(false);
		setButtonClicked(false);
		setLoadingMessage(null);
		const generatedPlaylistId = activeGeneratedPlaylistIdRef.current;
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;
		activeRunIdRef.current = null;
		activeGeneratedPlaylistIdRef.current = null;

		if (generatedPlaylistId && inngestStartedRef.current) {
			try {
				await fetch('/api/playlist/cancel', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ generatedPlaylistId }),
				});
				console.log(
					'[handleCancel] Cancelled Inngest run for generatedPlaylistId:',
					generatedPlaylistId,
				);
			} catch (e) {
				console.warn('[handleCancel] Failed to cancel Inngest run:', e);
			}
		}
		setFailed(false);
		setErrorMessage(null);
		toast.info('Generation cancelled.');
	};

  const createSpotifyPlaylist = async (link: string, name: string) => {
    addToUrl('link', link.split('/').at(-1) as string);
    setPlayListData({ link, name });
    setArtistArray([]);
    clearSeeds();
    toast.success('Playlist Created');
  };

  const getSimilarArtists = async (artists: string[]) => {
    if (buttonClick === true) {
      setLoading(false);
      return;
    }
    setButtonClicked(true);

    try {
      setLoadingMessage('Discovering new artists similar to your selection...');

      const finalList = await fetchSimilarArtistsFromAI(artists, {
        isNotPopular: isNotPopularArtists,
        isDifferent: isDifferentTypesOfArtists
      });

      setLoadingMessage('Fetching latest albums from the discovered artists...');
			const albums = await getEveryAlbum(finalList);

      setLoadingMessage('Gathering the best tracks from their albums...');
      const tracks = await getAllTracks(albums as string[], 1) as string[];

      setLoadingMessage('Creating your new Similar Artists playlist on Spotify...');
			const playlistName = `Similar to ${artists.join(', ')}`;
			const playlistInfo = await Promise.resolve(
				createPlayList(
					playlistName,
					'Created by HearItFresh',
				),
			);

			if ('isError' in playlistInfo) {
				throw new Error(playlistInfo.err);
			}
			const { id, link, name } = playlistInfo;
			const playListID = id.substring('spotify:playlist:'.length);

      setLoadingMessage('Adding the selected tracks to your Spotify playlist...');

			if (tracks === null) throw new Error('Track is empty');
			addTracksToPlayList(tracks, playListID)
				.then(() => {
					addToUrl('link', link.split('/').at(-1) as string);
					setPlayListData({ link, name });
				})
				.catch((err) => {
					return err;
				});

      setLoadingMessage('Playlist successfully generated!');
			setArtistArray([]);
			toast.success('Playlist Created');
		} catch (err) {
			setErrorMessages({
				...errorMessages,
        error: 'Error occured while generating a playlist: a playlist might have still been generated, please check your Spotify before trying again.',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
			setLoadingMessage(null);
		}
	};

	async function handleIfItsAPlaylistLink(link: string) {
		// Reset abort flag — this is a fresh user-initiated operation
		abortedRef.current = false;
        inngestStartedRef.current = false;
        activeGeneratedPlaylistIdRef.current = Math.random().toString(36).substring(2, 15);
        const currentPlaylistId = activeGeneratedPlaylistIdRef.current;

		if (!isValidPlaylistLink(link)) {
			setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
			setLoading(false);
			return;
		}

		setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

		try {
      setLoadingMessage('Connecting to Spotify to extract your playlist details...');
			const playlistId = extractPlaylistId(link);

			await addHistoryToDB(playlistId);
      if (activeGeneratedPlaylistIdRef.current !== currentPlaylistId || abortedRef.current) return;

      setLoadingMessage('Retrieving all tracks from the provided playlist...');
			const playlistTracks = await getPlaylistTracks(playlistId);
      if (activeGeneratedPlaylistIdRef.current !== currentPlaylistId || abortedRef.current) return;

			const trackArtists = playlistTracks
				.flat()
				.map((item: any) => item.track.artists.slice(0, 2));
			const artistNames: string[] = trackArtists
				.flat()
				.map((item: any) => item.name);
			const uniqueArtistNames = [...new Set(artistNames)];

      // Phase 1: Set extracted songs into context for the UI picker
      const formattedTracks = playlistTracks.flat().map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name),
        image: item.track.album.images[0]?.url,
      }));

      setExtractedSongs(formattedTracks);
      setExtractedArtists(uniqueArtistNames);

    } catch (err) {
      if (activeGeneratedPlaylistIdRef.current !== currentPlaylistId || abortedRef.current) return;
			setErrorMessages({
				...errorMessages,
        error: isSpotifyPlaylistPermissionError(err)
          ? SPOTIFY_PUBLIC_PLAYLIST_ERROR
          : 'Error occured while extracting playlist. Please try again later.',
			});
			console.log(err);
    } finally {
      setLoading(false);
		}
	}

	const handleSubmit = async () => {
		if (type === 'artist') {
			setLoading(true);
			const artist = artistName.current;
			if (!artist) return;

			const extratext = artist?.value.trim();
			const array = [...artistArray];

			if (extratext || extratext !== '') {
				array.push(extratext);
			}

			await addHistoryToDB(array.join(', '));

			array && array.length > 1 && getSimilarArtists(array);
		} else if (type === 'playlist') {
      if (extractedSongs.length > 0) {
        handleSeedPlaylistGeneration();
      } else {
        setLoading(true);
        if (!spotifyPlaylist.current) {
          setLoading(false);
          return;
        }
        const link = spotifyPlaylist.current.value;
        handleIfItsAPlaylistLink(link);
      }
		}
	};

	const addHistoryToDB = async (text: string) => {
		if (!user) {
			logOut();
			return { message: 'error', history: [] };
		}

		const userId = user.user_id;
		const { message, history } = await addUserHistory(userId, text);

		const newHistory = history.map(
			({ text, lastUsed, generatedPlaylists }: { text: string; lastUsed: string; generatedPlaylists?: any[] }) => ({
				text,
				lastUsed: new Date(lastUsed),
				generatedPlaylists,
			}),
		);
		if (message === 'success') setHistory(newHistory);
	};

	return (
    <SubmitButtionContainer
      handleSubmit={handleSubmit}
      onCancel={handleCancel}
      failed={failed}
      errorMessage={errorMessage}
    />
  );
};

export default SubmitButtion;
