'use client';

import {
  addTracksToPlayList,
  createPlayList,
  getAllTracksInAPlaylist,
} from '@/app/lib/spotify';
import {
	extractPlaylistId,
	getAllTracks,
	getEveryAlbum,
	isValidPlaylistLink,
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
  const activeJobIdRef = useRef<string | null>(null);
  const inngestStartedRef = useRef(false);

  // Only set when Inngest itself reports status = 'Cancelled' (not user-initiated)
  const [cancelledPayload, setCancelledPayload] = useState<Record<string, any> | null>(null);

  const handleSeedPlaylistGeneration = async () => {
    if (buttonClick === true) return;

    const seedCount = selectedSeedIds.size;
    if (seedCount > 0 && (seedCount < 5 || seedCount > 15)) {
      toast.error('Please select either 0 seeds (skip lyrics) or between 5 to 15 seeds.');
      return;
    }

    // Abort any stale dev-mode controller, then reset state for a fresh run
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    abortedRef.current = false;
    activeRunIdRef.current = null;
    activeJobIdRef.current = Math.random().toString(36).substring(2, 15);
    const currentJobId = activeJobIdRef.current;
    setCancelledPayload(null);

    setButtonClicked(true);
    setLoading(true);

    try {
      setLoadingMessage('Analyzing your selected songs & generating a playlist! Please do not leave the page, this might take a minute...');
      console.log('[handleSeedPlaylistGeneration] Starting...');
      const selectedSongsData = extractedSongs.filter((s: any) => selectedSeedIds.has(s.id));

      if (process.env.NODE_ENV === 'production') {
        // Inngest path
        inngestStartedRef.current = true;
        const payload = {
          seeds: selectedSongsData,
          artistNames: extractedArtists,
          options: { isNotPopular: isNotPopularArtists, isDifferent: isDifferentTypesOfArtists },
          userId: user?.user_id,
          jobId: activeJobIdRef.current,
        };
        const result = await fetch('/api/playlist/generate', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        console.log('[handleSeedPlaylistGeneration] Got eventId, starting polling...');
        const { eventId } = await result.json();
        await pollForCompletion(eventId, payload);
      } else {
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

        setLoadingMessage('Adding the tracks to your Spotify playlist...');
        await addTracksToPlayList(resultData.tracks, playListID);
        if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;
        createSpotifyPlaylist(link, name);
      }
    } catch (err: any) {
      // Swallow errors that occurred after a user-initiated cancel
      if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;
      console.log({err})
      console.log('[handleSeedPlaylistGeneration] Error:', err.message);
      setErrorMessages({
        ...errorMessages,
        error: 'Error occurred while generating playlist: A playlist might have still been generated, please check your Spotify, before trying again',
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
    eventId: string,
    payload: Record<string, any>,
    unexpectedRetries = 0,
  ): Promise<void> => {
    const MAX_UNEXPECTED_RETRIES = 10;

    if (abortedRef.current) return;

    console.log('[pollForCompletion] Polling for eventId:', eventId);
    const res = await fetch(`/api/playlist/status?eventId=${eventId}`);
    const data = await res.json();
    console.log('[pollForCompletion] Status:', data.status, data);

    // Track the runId so we can cancel it if the user requests
    if (data.runId) activeRunIdRef.current = data.runId;

    if (data.status === 'Completed') {
      console.log('[pollForCompletion] Completed!');
      const { link, name } = data.output;
      await createSpotifyPlaylist(link, name);

    } else if (data.status === 'Failed') {
      console.log('[pollForCompletion] Failed!');
      throw new Error('Playlist generation failed');

    } else if (data.status === 'Cancelled') {
      // Inngest itself cancelled the job — surface Retry button to the user
      console.warn('[pollForCompletion] Inngest reported job as Cancelled.');
      setCancelledPayload(payload);
      // Return normally; the finally block in the caller clears loading state

    } else if (data.status === 'Running' || data.status === 'Scheduled') {
      console.log('[pollForCompletion] Still processing, polling again in 10s...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      if (!abortedRef.current) {
        await pollForCompletion(eventId, payload, 0);
      }

    } else {
      if (unexpectedRetries >= MAX_UNEXPECTED_RETRIES) {
        throw new Error(`Polling stopped after ${MAX_UNEXPECTED_RETRIES} unexpected status responses: ${data.status}`);
      }
      console.warn('[pollForCompletion] Unexpected status:', data.status, `— retrying in 10s... (attempt ${unexpectedRetries + 1}/${MAX_UNEXPECTED_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      if (!abortedRef.current) {
        await pollForCompletion(eventId, payload, unexpectedRetries + 1);
      }
    }
  };

  /**
   * User-initiated cancel. Stops polling and calls the Inngest cancel API.
   * Returns to the normal "Generate Playlist" state — no Retry button shown.
   */
  const handleCancel = async () => {
    abortedRef.current = true;
    // Immediately reset UI — don't wait for the in-flight await to resolve
    setLoading(false);
    setButtonClicked(false);
    setLoadingMessage(null);
    const jobId = activeJobIdRef.current;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeRunIdRef.current = null;
    activeJobIdRef.current = null;
    setCancelledPayload(null);

    if (jobId && inngestStartedRef.current) {
      try {
        await fetch('/api/playlist/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        console.log('[handleCancel] Cancelled Inngest run for jobId:', jobId);
      } catch (e) {
        console.warn('[handleCancel] Failed to cancel Inngest run:', e);
      }
    }
    // Do NOT set cancelledPayload — user cancelled deliberately, just go back to normal
    toast.info('Generation cancelled.');
  };

  /**
   * Retry — only shown when Inngest itself reported status = 'Cancelled'.
   * Re-fires the original payload as a new Inngest job.
   */
  const handleRetry = async () => {
    const payload = cancelledPayload;
    if (!payload) return;

    setCancelledPayload(null);
    abortedRef.current = false;
    activeRunIdRef.current = null;
    activeJobIdRef.current = Math.random().toString(36).substring(2, 15);
    inngestStartedRef.current = true;
    
    const newPayload = { ...payload, jobId: activeJobIdRef.current };

    setButtonClicked(true);
    setLoading(true);
    setLoadingMessage('Retrying playlist generation...');

    try {
      const result = await fetch('/api/playlist/generate', {
        method: 'POST',
        body: JSON.stringify(newPayload),
      });
      const { eventId } = await result.json();
      await pollForCompletion(eventId, newPayload);
    } catch (err: any) {
      if (abortedRef.current) return;
      console.log('[handleRetry] Error:', err.message);
      setErrorMessages({
        ...errorMessages,
        error: 'Error occurred while generating playlist: A playlist might have still been generated, please check your Spotify, before trying again',
      });
    } finally {
      setLoading(false);
      setButtonClicked(false);
      setLoadingMessage(null);
    }
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
        activeJobIdRef.current = Math.random().toString(36).substring(2, 15);
        const currentJobId = activeJobIdRef.current;

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
      if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;

      setLoadingMessage('Retrieving all tracks from the provided playlist...');
			const playlistTracks = await getAllTracksInAPlaylist(playlistId);
      if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;

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
      if (activeJobIdRef.current !== currentJobId || abortedRef.current) return;
			setErrorMessages({
				...errorMessages,
        error: 'Error occured while extracting playlist. Try to login again',
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
			({ text, lastUsed }: { text: string; lastUsed: string }) => ({
				text,
				lastUsed: new Date(lastUsed),
			}),
		);
		if (message === 'success') setHistory(newHistory);
	};

	return (
    <SubmitButtionContainer
      handleSubmit={handleSubmit}
      onCancel={handleCancel}
      onRetry={cancelledPayload ? handleRetry : undefined}
    />
  );
};

export default SubmitButtion;
