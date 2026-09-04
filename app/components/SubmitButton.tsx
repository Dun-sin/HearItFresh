'use client';

import {
	extractPlaylistId,
	getPlaylistTracks,
	isSpotifyPlaylistPermissionError,
	isValidPlaylistLink,
	SPOTIFY_PUBLIC_PLAYLIST_ERROR,
} from '@/app/lib/helpers';

import React, { useRef, useState, useEffect } from 'react';
import SubmitButtionContainer from './SubmitButtonContainer';
import { addToUrl } from '@/app/lib/clientUtils';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/context/authContext';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useHistory } from '@/app/context/HistoryContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useOptions } from '@/app/context/optionsContext';
import { useSeedSongs } from '@/app/context/seedSongsContext';
import {
  clearGuestGeneration,
	clearPendingGeneration,
	patchGuestGeneration,
	patchPendingGeneration,
	readGuestGeneration,
	readPendingGeneration,
	saveGuestGeneration,
	savePendingGeneration,
} from '@/app/lib/pendingGeneration';
import useGenerationCountdown from '@/app/hooks/useGenerationCountdown';

const SubmitButton = () => {
	const { setLoading } = useLoading();
	const {
		setErrorMessages,
		errorMessages,
		buttonClick,
		setButtonClicked,
		setPlayListData,
		playListData,
	} = useGeneralState();
	const { user, isLoggedIn, isGuest: isGuestSession, isAuthHydrated, continueAsGuest } =
		useAuth();
	const { setLoadingMessage } = useLoading();
	const { spotifyPlaylist } = useInput();
	const { setHistory } = useHistory();
	const { isNotPopularArtists, isDifferentTypesOfArtists, selectedArtist } =
		useOptions();

	const {
		extractedSongs,
		setExtractedSongs,
		selectedSeedIds,
		extractedArtists,
		setExtractedArtists,
		clearSeeds,
	} = useSeedSongs();

	const isGuest = !user?.user_id;
	const failedMessage = isGuest
		? "We couldn't create your playlist. Please sign in and try again."
		: "We couldn't create your playlist. Please try again.";

	// Refs for in-flight Inngest job management
	const abortedRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const activeRunIdRef = useRef<string | null>(null);
	const activeGeneratedPlaylistIdRef = useRef<string | null>(null);
	const activeEventIdRef = useRef<string | null>(null);
	const inngestStartedRef = useRef(false);
	const cancellationIdRef = useRef<string | null>(null);
	const resumedFromStorageRef = useRef(false);
	const restoredGuestResultRef = useRef(false);

	// Terminal state flags
	const [failed, setFailed] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Countdown anchor — null whenever no generation is in flight
	const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
		null,
	);
	const [generationArtistName, setGenerationArtistName] = useState<
		string | null
	>(null);
	const { exhausted } = useGenerationCountdown(generationStartedAt);

	const endGeneration = () => {
		clearPendingGeneration();
		setGenerationStartedAt(null);
		setGenerationArtistName(null);
	};

	const handleReset = () => {
		abortedRef.current = true;
		activeRunIdRef.current = null;
		activeGeneratedPlaylistIdRef.current = null;
		activeEventIdRef.current = null;
		cancellationIdRef.current = null;
		setFailed(false);
		setErrorMessage(null);
		setLoading(false);
		setButtonClicked(false);
		setLoadingMessage(null);
		clearSeeds();
		endGeneration();
	};

	useEffect(() => {
		if (resumedFromStorageRef.current) return;

		const record = readPendingGeneration();
		if (!record) return;

		resumedFromStorageRef.current = true;

		// A resumable guest run is proof of a guest session — don't let the
		// login overlay cover it if the flag was lost.
		if (!record.userId && !isLoggedIn) continueAsGuest();

		abortedRef.current = false;
		inngestStartedRef.current = true;
		activeGeneratedPlaylistIdRef.current = record.generatedPlaylistId;
		activeEventIdRef.current = record.eventId;
		activeRunIdRef.current = record.runId;
		cancellationIdRef.current = record.cancellationId;

		setButtonClicked(true);
		setLoading(true);
		setGenerationStartedAt(record.startedAt);
		setGenerationArtistName(record.artistName ?? null);

		pollForCompletion({ userId: record.userId }, 0)
			.catch((err) => {
				if (abortedRef.current) return;
				console.log('[resumePendingGeneration] Error:', err?.message);
				setFailed(true);
				setErrorMessage(failedMessage);
			})
			.finally(() => {
				setLoading(false);
				setButtonClicked(false);
				setLoadingMessage(null);
				endGeneration();
			});
	}, []);

	useEffect(() => {
		if (!exhausted) return;

		// Stop polling only — the Inngest run may still land in history, so we
		// deliberately don't cancel it.
		abortedRef.current = true;
		setFailed(true);
		setErrorMessage(
			isGuest ? "This one's taking far longer than it should. Feel free to start a new one": "This one's taking far longer than it should. It may still finish in the background. check your history in a bit, or start a fresh one."
		);
		setLoading(false);
		setButtonClicked(false);
		setLoadingMessage(null);
		endGeneration();
	}, [exhausted]);

	useEffect(() => {
		if (!user?.user_id) return;
		if (resumedFromStorageRef.current) return;

		const userId = user.user_id;

		async function checkPendingGeneration() {
			const response = await fetch('/api/playlist/reconcile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId }),
			});

			const data = await response.json();

			if (data.active?.generatedPlaylistId) {
				await pollPendingGeneration(data.active.generatedPlaylistId);
				return;
			}

			const completed = data.updated?.find(
				(item: any) =>
					item.status === 'Completed' && item.output?.link && item.output?.name,
			);

			if (completed) {
				createSpotifyPlaylist(completed.output.link, completed.output.name);
			}

			if (data.updated?.length) {
				await refreshHistory();
			}
		}

		checkPendingGeneration();
	}, [user?.user_id]);

	// Guests have no history, so their last result is restored from the stored
	// run identity — good until Inngest ages the run out.
	useEffect(() => {
		if (!isAuthHydrated || !isGuestSession || user?.user_id) return;
		if (resumedFromStorageRef.current) return;
		if (restoredGuestResultRef.current) return;
		if (playListData.link) return;

		const record = readGuestGeneration();
		if (!record) return;

		restoredGuestResultRef.current = true;

		if (record.link && record.name) {
			setPlayListData({ link: record.link, name: record.name });
			addToUrl('link', record.link.split('/').at(-1) as string);
			return;
		}

		if (!record.runId && !record.eventId) return;

		(async () => {
			const params = new URLSearchParams();
			if (record.runId) params.set('runId', record.runId);
			else if (record.eventId) params.set('eventId', record.eventId);

			try {
				const res = await fetch(`/api/playlist/status?${params.toString()}`);
				if (!res.ok) return;

				const data = await res.json();

				if (data.status === 'Completed' && data.output?.link && data.output?.name) {
					patchGuestGeneration({
						link: data.output.link,
						name: data.output.name,
						runId: data.runId ?? record.runId,
					});
					setPlayListData({ link: data.output.link, name: data.output.name });
					addToUrl('link', data.output.link.split('/').at(-1) as string);
					toast.info('Showing the last playlist we made for you.');
					return;
				}

				if (data.status === 'Failed' || data.status === 'Cancelled') {
					clearGuestGeneration();
				}
			} catch (error) {
				console.log('[restoreGuestGeneration] Error:', error);
			}
		})();
	}, [isAuthHydrated, isGuestSession, user?.user_id, playListData.link]);

	const refreshHistory = async () => {
		if (!user?.user_id) return;

		const response = await fetch(`/api/users/${user.user_id}/history`);
		const data = await response.json();
		const history =
			data.message?.map(
				({
					text,
					lastUsed,
					kind,
					sourcePlaylist,
					generatedPlaylists,
				}: {
					text: string;
					lastUsed: string;
					kind?: 'artist' | 'playlist';
					sourcePlaylist?: { id: string; name: string };
					generatedPlaylists?: any[];
				}) => ({
					text,
					lastUsed: new Date(lastUsed),
					kind,
					sourcePlaylist,
					generatedPlaylists,
				}),
			) ?? [];
		setHistory(history);
	};

	const pollPendingGeneration = async (generatedPlaylistId: string) => {
		if (abortedRef.current) return;

		setLoading(true);
		setButtonClicked(true);
		setGenerationStartedAt((current) => current ?? Date.now());

		const response = await fetch('/api/playlist/reconcile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: user?.user_id ?? '',
				generatedPlaylistId,
			}),
		});

		const data = await response.json();

		const currentStatus = data.status ?? data.active?.status;

		if (
			currentStatus === 'Running' ||
			currentStatus === 'Scheduled' ||
			currentStatus === 'Pending'
		) {
			setTimeout(() => pollPendingGeneration(generatedPlaylistId), 10000);
			return;
		}
		const completedPlaylist = data.updated?.find(
			(item: any) =>
				item.status === 'Completed' && item.output?.link && item.output?.name,
		);

		if (completedPlaylist?.output?.link && completedPlaylist?.output?.name) {
			addToUrl(
				'link',
				completedPlaylist.output.link.split('/').at(-1) as string,
			);
			setPlayListData({
				link: completedPlaylist.output.link,
				name: completedPlaylist.output.name,
			});
			await refreshHistory();
		}

		setLoading(false);
		setButtonClicked(false);
		setLoadingMessage(null);
		endGeneration();
	};

	const handleSeedPlaylistGeneration = async () => {
		if (buttonClick === true) return;

		const seedCount = selectedSeedIds.size;
		// Strictly enforce selecting between 5 and 10 seed songs.
		if (seedCount < 5 || seedCount > 10) {
			toast.error('Please select between 5 and 10 seed songs.');
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
		activeEventIdRef.current = null;
		cancellationIdRef.current = crypto.randomUUID();

		const startedAt = Date.now();
		setButtonClicked(true);
		setLoading(true);
		setGenerationStartedAt(startedAt);
		setGenerationArtistName(selectedArtist?.name ?? null);
		setFailed(false);
		setErrorMessage(null);

		try {
			const selectedSongsData = extractedSongs.filter((s: any) =>
				selectedSeedIds.has(s.id),
			);

			if (process.env.NODE_ENV === 'production') {
			// Inngest path
			inngestStartedRef.current = true;
			const payload = {
				seeds: selectedSongsData,
				artistNames: extractedArtists,
				options: {
					isNotPopular: isNotPopularArtists,
					isDifferent: isDifferentTypesOfArtists,
				},
				artistId: selectedArtist?.id,
				artistName: selectedArtist?.name,
				artistImage: selectedArtist?.image,
				userId: user?.user_id,
				sourcePlaylistId: spotifyPlaylist.current?.value
					? extractPlaylistId(spotifyPlaylist.current.value)
					: undefined,
				cancellationId: cancellationIdRef.current,
			};
			const result = await fetch('/api/playlist/generate', {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			console.log('[handleSeedPlaylistGeneration] Starting polling...');
			const { generatedPlaylistId, eventId, mode } = await result.json();
			console.log(
				'[handleSeedPlaylistGeneration] Got generatedPlaylistId, starting polling...',
			);
			activeGeneratedPlaylistIdRef.current = generatedPlaylistId ?? null;
			activeEventIdRef.current = mode === 'guest' ? eventId : null;

			savePendingGeneration({
				generatedPlaylistId: activeGeneratedPlaylistIdRef.current,
				eventId: activeEventIdRef.current,
				runId: null,
				cancellationId: cancellationIdRef.current,
				userId: user?.user_id ?? null,
				startedAt,
				artistName: selectedArtist?.name,
			});

			if (isGuest) {
				saveGuestGeneration({
					runId: null,
					eventId: activeEventIdRef.current,
					startedAt,
				});
			}

			await pollForCompletion(payload, 0);


			} else {
				inngestStartedRef.current = false;
				abortControllerRef.current = new AbortController();
				activeGeneratedPlaylistIdRef.current = Math.random()
					.toString(36)
					.substring(2, 15);
				const currentPlaylistId = activeGeneratedPlaylistIdRef.current;

				const result = await fetch('/api/playlist/dev-generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						seeds: selectedSongsData,
						artistNames: extractedArtists,
						options: {
							isNotPopular: isNotPopularArtists,
							isDifferent: isDifferentTypesOfArtists,
						},
						artistId: selectedArtist?.id,
						artistName: selectedArtist?.name,
						userId: user?.user_id,
					}),
					signal: abortControllerRef.current.signal,
				});

				if (
					activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
					abortedRef.current
				)
					return;

				const resultData = await result.json();

				if (
					resultData.error ||
					!resultData.tracks ||
					resultData.tracks.length === 0
				) {
					throw new Error(resultData.error || 'Failed to generate tracks');
				}

				const playlistName = selectedArtist
					? `Songs from ${selectedArtist.name} you might like from @hearitfresh.favour.dev`
					: 'HearItFresh - Lyrics Inspired @hearitfresh.favour.dev';

				setGenerationStartedAt(null);
				setLoadingMessage('Creating your new playlist on Spotify...');
				const playlistInfo = await createPlayList(
					playlistName,
					'Created by HearItFresh',
				);
				if (
					activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
					abortedRef.current
				)
					return;

				if ('isError' in playlistInfo) throw new Error(playlistInfo.err);

				const { id, link, name } = playlistInfo;
				const playListID = id.substring('spotify:playlist:'.length);

				setLoadingMessage('Adding the tracks to your Spotify playlist...');
				await addTracksToPlayList(resultData.tracks, playListID);
				if (
					activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
					abortedRef.current
				)
					return;
				createSpotifyPlaylist(link, name);
			}
		} catch (err: any) {
			// Swallow errors that occurred after a user-initiated cancel
			if (abortedRef.current) return;
			console.log({ err });
			console.log('[handleSeedPlaylistGeneration] Error:', err.message);
			setErrorMessages({
				...errorMessages,
				error:
					'Error occurred while generating playlist: feel free to retry. A playlist might have been generated, please refresh and check the history section.',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
			setLoadingMessage(null);
			abortControllerRef.current = null;
			endGeneration();
		}
	};

	const pollForCompletion = async (
		payload: Record<string, any>,
		unexpectedRetries = 0,
	): Promise<void> => {
		const MAX_UNEXPECTED_RETRIES = 10;

		if (abortedRef.current) return;

		const generatedPlaylistId = activeGeneratedPlaylistIdRef.current;
		const eventId = activeEventIdRef.current;
		console.log(
			'[pollForCompletion] Polling for generatedPlaylistId/runId/eventId:',
			generatedPlaylistId,
			activeRunIdRef.current,
			eventId,
		);

		const params = new URLSearchParams();

		if (payload.userId && activeGeneratedPlaylistIdRef.current) {
			params.set('generatedPlaylistId', activeGeneratedPlaylistIdRef.current);
			params.set('userId', payload.userId);
		} else if (activeRunIdRef.current) {
			params.set('runId', activeRunIdRef.current);
		} else if (activeEventIdRef.current) {
			params.set('eventId', activeEventIdRef.current);
		}

		const res = await fetch(`/api/playlist/status?${params.toString()}`);

		if (abortedRef.current) return;

		if (!res.ok) {
			await new Promise((r) => setTimeout(r, 5000));
			await pollForCompletion(payload, unexpectedRetries + 1);
			return;
		}

		let data: any;
		try {
			data = await res.json();
		} catch {
			if (unexpectedRetries >= MAX_UNEXPECTED_RETRIES) {
				throw new Error(
					'Polling stopped after repeatedly receiving an invalid status response',
				);
			}
			console.warn(
				'[pollForCompletion] Invalid status body — retrying in 5s...',
				`(attempt ${unexpectedRetries + 1}/${MAX_UNEXPECTED_RETRIES})`,
			);
			await new Promise((r) => setTimeout(r, 5000));
			if (!abortedRef.current) {
				await pollForCompletion(payload, unexpectedRetries + 1);
			}
			return;
		}

		if (abortedRef.current) return;

		console.log('[pollForCompletion] Status:', data.status, data);

		if (!payload.userId && data.runId) {
			activeRunIdRef.current = data.runId;
			activeEventIdRef.current = null;
			patchPendingGeneration({ runId: data.runId, eventId: null });
			patchGuestGeneration({ runId: data.runId });
		}

		if (data.status === 'Completed') {
			console.log('[pollForCompletion] Completed!');
			const playlist = data.output;
			if (playlist?.link && playlist?.name) {
				await createSpotifyPlaylist(playlist.link, playlist.name);
				return;
			}
			setFailed(true);
			setErrorMessage(failedMessage);
			endGeneration();
			clearGuestGeneration();
			throw new Error(failedMessage);
		} else if (data.status === 'Failed') {
			console.log('[pollForCompletion] Failed!');
			setFailed(true);
			setErrorMessage(failedMessage);
			endGeneration();
			clearGuestGeneration();
			throw new Error(failedMessage);
		} else if (data.status === 'Cancelled') {
			console.warn('[pollForCompletion] Inngest reported job as Cancelled.');
			setFailed(true);
			setErrorMessage('Generation was cancelled');
			endGeneration();
			clearGuestGeneration();
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
		endGeneration();
		const generatedPlaylistId = activeGeneratedPlaylistIdRef.current;
		const cancellationId = cancellationIdRef.current;
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;
		activeRunIdRef.current = null;
		activeGeneratedPlaylistIdRef.current = null;
		activeEventIdRef.current = null;

		clearGuestGeneration();

		if (cancellationId && inngestStartedRef.current) {
			try {
				await fetch('/api/playlist/cancel', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cancellationId, generatedPlaylistId }),
				});
			} catch (e) {
				console.warn('[handleCancel] Failed to cancel Inngest run:', e);
			}
		}
		cancellationIdRef.current = null;
		setFailed(false);
		setErrorMessage(null);
		toast.info('Generation cancelled.');
	};

	const createSpotifyPlaylist = async (link: string, name: string) => {
		addToUrl('link', link.split('/').at(-1) as string);
		setPlayListData({ link, name });
		clearSeeds();
		endGeneration();
		toast.success('Playlist Created');

		if (!user?.user_id) {
			patchGuestGeneration({ link, name });
			toast.warning(
				'Add this playlist to your Spotify library now, or you may lose access to it later.',
				{
					autoClose: 100000,
					bodyStyle: {
						color: 'red',
					},
				},
			);
		}
	};

	async function handleIfItsAPlaylistLink(link: string) {
		// Reset abort flag — this is a fresh user-initiated operation
		abortedRef.current = false;
		inngestStartedRef.current = false;
		activeGeneratedPlaylistIdRef.current = Math.random()
			.toString(36)
			.substring(2, 15);
		const currentPlaylistId = activeGeneratedPlaylistIdRef.current;

		if (!isValidPlaylistLink(link)) {
			setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
			setLoading(false);
			return;
		}

		setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

		try {
			setLoadingMessage(
				'Connecting to Spotify to extract your playlist details...',
			);
			const playlistId = extractPlaylistId(link);

			setLoadingMessage('Retrieving all tracks from the provided playlist...');
			const playlistData = await getPlaylistTracks(playlistId, true);
			if (
				activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
				abortedRef.current
			)
				return;
			const playlistTracks = playlistData.tracks;
			const sourcePlaylist = playlistData.playlist ?? {
				id: playlistId,
				name: playlistId,
			};

			await addHistoryToDB(playlistId, sourcePlaylist);
			if (
				activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
				abortedRef.current
			)
				return;

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
			if (
				activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
				abortedRef.current
			)
				return;
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
	};

	const addHistoryToDB = async (
		text: string,
		sourcePlaylist?: { id: string; name: string },
	) => {
		if (!user?.user_id) {
			return { message: 'skipped', history: [] };
		}

		const userId = user.user_id;
		await fetch(`/api/users/${userId}/history`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ artists: text, sourcePlaylist }),
		});

		await refreshHistory();
		return { message: 'success', history: [] };
	};

	// when a playlist has been uploaded and fewer than 5 songs
	// are selected (0-4), the button should be disabled and greyed out.
	// 5+ seeds reverts to the normal green generate button.
	const isLowSeedCount = extractedSongs.length > 0 && selectedSeedIds.size < 5;

	const btnClass = isLowSeedCount ? 'bg-gray-400 text-lightest' : undefined;

	return (
		<SubmitButtionContainer
			handleSubmit={handleSubmit}
			onCancel={handleCancel}
			onReset={handleReset}
			failed={failed}
			errorMessage={errorMessage}
			canRetry={extractedSongs.length > 0 && selectedSeedIds.size >= 5}
			btnClass={btnClass}
			disabled={isLowSeedCount}
			startedAt={generationStartedAt}
			artistName={generationArtistName}
		/>
	);
};

export default SubmitButton;
