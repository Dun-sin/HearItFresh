'use client';

import {
	extractPlaylistId,
	formatPlaylistTracks,
	getPlaylistTracks,
	isSpotifyPlaylistPermissionError,
	detectPlaylistProvider,
	extractYoutubePlaylistId,
	SPOTIFY_PUBLIC_PLAYLIST_ERROR,
} from '@/app/lib/helpers';

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import SubmitButtionContainer from './SubmitButtonContainer';
import ConnectYoutubePrompt from './ConnectYoutubePrompt';
import {
	addToUrl,
	consumeYoutubeConnectRedirect,
	savePendingPlaylistLink,
	takePendingPlaylistLink,
	type YoutubeGuestCredentials,
} from '@/app/lib/clientUtils';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/context/authContext';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useHistory } from '@/app/context/HistoryContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useOptions } from '@/app/context/optionsContext';
import { useSeedSongs } from '@/app/context/seedSongsContext';
import { useYoutubeChannel } from '@/app/context/youtubeChannelContext';
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
import type { ProviderName } from '@/app/lib/providers/types';
import type { SourcePlaylist } from '@/app/types';

const providerOfLink = (link: string): ProviderName =>
	link.includes('youtube.com') || link.includes('youtu.be')
		? 'youtube'
		: 'spotify';

const SubmitButton = () => {
	const { setLoading } = useLoading();
	const {
		setErrorMessages,
		errorMessages,
		buttonClick,
		setButtonClicked,
		playListData,
		setPlayListData,
		provider,
		setProvider,
	} = useGeneralState();
	const {
		user,
		isLoggedIn,
		isGuest: isGuestSession,
		isAuthHydrated,
		continueAsGuest,
		youtubeGuestCredentials,
		setYoutubeGuestCredentials,
	} = useAuth();
	const { setLoadingMessage } = useLoading();
	const { spotifyPlaylist } = useInput();
	const { setHistory } = useHistory();
	const {
		isNotPopularArtists,
		isDifferentTypesOfArtists,
		selectedArtist,
		setSelectedArtist,
		themeFilters,
	} = useOptions();

	const {
		extractedSongs,
		setExtractedSongs,
		selectedSeedIds,
		extractedArtists,
		setExtractedArtists,
		clearSeeds,
	} = useSeedSongs();

	const isGuest = !user?.user_id;
	const failedMessage = "We couldn't create your playlist. Please try again.";

	const abortedRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const activeRunIdRef = useRef<string | null>(null);
	const activeGeneratedPlaylistIdRef = useRef<string | null>(null);
	const activeEventIdRef = useRef<string | null>(null);
	const inngestStartedRef = useRef(false);
	const cancellationIdRef = useRef<string | null>(null);
	const resumedFromStorageRef = useRef(false);
	const restoredGuestResultRef = useRef(false);
	const youtubeGuestCredentialsRef = useRef<YoutubeGuestCredentials | null>(
		youtubeGuestCredentials,
	);
	youtubeGuestCredentialsRef.current = youtubeGuestCredentials;
	const connectPromptResolveRef = useRef<((proceed: boolean) => void) | null>(
		null,
	);

	// Terminal state flags
	const [failed, setFailed] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showConnectPrompt, setShowConnectPrompt] = useState(false);
	const { ensureYoutubeChannel, openChannelPrompt } = useYoutubeChannel();
	const [linkAwaitingUser, setLinkAwaitingUser] = useState<string | null>(null);

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
		const result = consumeYoutubeConnectRedirect();
		if (!result) return;

		if (result.status !== 'connected') {
			console.error('[YouTube connect] failed:', result.reason);
			setErrorMessages({
				...errorMessages,
				error: `YouTube connection failed${result.reason ? `: ${result.reason}` : ''}. Please try again.`,
			});
			return;
		}

		const pendingLink = takePendingPlaylistLink();
		if (pendingLink && spotifyPlaylist.current) {
			spotifyPlaylist.current.value = pendingLink;
		}

		if (result.guestCredentials) {
			youtubeGuestCredentialsRef.current = result.guestCredentials;
			setYoutubeGuestCredentials(result.guestCredentials);
		}

		if (!result.hasChannel) {
			openChannelPrompt();
			return;
		}

		// signed-in connection: `user` isn't restored yet on mount, so resume once it is
		if (!result.guestCredentials) {
			if (pendingLink) setLinkAwaitingUser(pendingLink);
			return;
		}

		if (pendingLink) {
			setLoading(true);
			handleIfItsAPlaylistLink(pendingLink);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!linkAwaitingUser || !user?.user_id) return;

		const link = linkAwaitingUser;
		setLinkAwaitingUser(null);
		setLoading(true);
		handleIfItsAPlaylistLink(link);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [linkAwaitingUser, user?.user_id]);

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
			isGuest
				? "This one's taking far longer than it should. Feel free to start a new one"
				: "This one's taking far longer than it should. It may still finish in the background. check your history in a bit, or start a fresh one.",
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
			const { data } = await axios.post('/api/playlist/reconcile', { userId });

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

		checkPendingGeneration().catch((err) =>
			console.error('[checkPendingGeneration] Error:', err),
		);
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
			setPlayListData({
				link: record.link,
				name: record.name,
				provider: providerOfLink(record.link),
			});
			addToUrl('link', record.link.split('/').at(-1) as string);
			return;
		}

		if (!record.runId && !record.eventId) return;

		(async () => {
			const params = new URLSearchParams();
			if (record.runId) params.set('runId', record.runId);
			else if (record.eventId) params.set('eventId', record.eventId);

			try {
				const { data } = await axios.get('/api/playlist/status', { params });

				if (
					data.status === 'Completed' &&
					data.output?.link &&
					data.output?.name
				) {
					patchGuestGeneration({
						link: data.output.link,
						name: data.output.name,
						runId: data.runId ?? record.runId,
					});
					setPlayListData({
						link: data.output.link,
						name: data.output.name,
						provider: providerOfLink(data.output.link),
					});
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

		try {
			const { data } = await axios.get(`/api/users/${user.user_id}/history`);
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
						sourcePlaylist?: SourcePlaylist;
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
		} catch (err) {
			console.error('[refreshHistory] Error:', err);
		}
	};

	const pollPendingGeneration = async (generatedPlaylistId: string) => {
		if (abortedRef.current) return;

		setLoading(true);
		setButtonClicked(true);
		setGenerationStartedAt((current) => current ?? Date.now());

		try {
			const { data } = await axios.post('/api/playlist/reconcile', {
				userId: user?.user_id ?? '',
				generatedPlaylistId,
			});

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
					provider: providerOfLink(completedPlaylist.output.link),
				});
				await refreshHistory();
			}
		} catch (err) {
			console.error('[pollPendingGeneration] Error:', err);
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

		setFailed(false);
		setErrorMessage(null);
		setErrorMessages({ ...errorMessages, error: null });

		setButtonClicked(true);
		setLoading(true);

		if (provider === 'youtube' && !(await ensureYoutubeChannel())) {
			setButtonClicked(false);
			setLoading(false);
			return;
		}

		const startedAt = Date.now();
		setGenerationStartedAt(startedAt);
		setGenerationArtistName(selectedArtist?.name ?? null);

		try {
			const selectedSongsData = extractedSongs.filter((s: any) =>
				selectedSeedIds.has(s.id),
			);

			if (process.env.NODE_ENV === 'production') {
				// Inngest path
				inngestStartedRef.current = true;
				const rawLink = spotifyPlaylist.current?.value ?? '';
				const sourcePlaylistId = rawLink
					? provider === 'youtube'
						? extractYoutubePlaylistId(rawLink)
						: extractPlaylistId(rawLink)
					: undefined;

				const payload = {
					seeds: selectedSongsData,
					artistNames: extractedArtists,
					options: {
						isNotPopular: isNotPopularArtists,
						isDifferent: isDifferentTypesOfArtists,
						themeFilters,
					},
					artistId: selectedArtist?.id,
					artistName: selectedArtist?.name,
					artistImage: selectedArtist?.image,
					userId: user?.user_id,
					youtubeGuestCredentials:
						!user?.user_id && provider === 'youtube'
							? youtubeGuestCredentialsRef.current
							: undefined,
					provider,
					sourcePlaylistId,
					cancellationId: cancellationIdRef.current,
				};
				const { data: generateData } = await axios.post(
					'/api/playlist/generate',
					payload,
				);
				console.log('[handleSeedPlaylistGeneration] Starting polling...');
				const { generatedPlaylistId, eventId, mode } = generateData;
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

				const { data: resultData } = await axios.post(
					'/api/playlist/dev-generate',
					{
						seeds: selectedSongsData,
						artistNames: extractedArtists,
						options: {
							isNotPopular: isNotPopularArtists,
							isDifferent: isDifferentTypesOfArtists,
							themeFilters,
						},
						artistId: selectedArtist?.id,
						artistName: selectedArtist?.name,
						userId: user?.user_id,
						provider,
					},
					{ signal: abortControllerRef.current.signal },
				);

				if (
					activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
					abortedRef.current
				)
					return;

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
				setLoadingMessage(
					`Creating your new playlist on ${provider === 'youtube' ? 'YouTube Music' : 'Spotify'}...`,
				);
				const { data: createData } = await axios.post(
					'/api/playlist/dev-create',
					{
						provider,
						tracks: resultData.tracks,
						playlistName,
						description: 'Created by HearItFresh',
						userId: user?.user_id,
					},
				);
				if (
					activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
					abortedRef.current
				)
					return;

				if (createData.error) {
					throw new Error(createData.error || 'Failed to create playlist');
				}

				createSpotifyPlaylist(createData.link, createData.name);
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

		let data: any;
		try {
			({ data } = await axios.get('/api/playlist/status', { params }));
		} catch (err) {
			if (!axios.isAxiosError(err) || !err.response) throw err;
			if (abortedRef.current) return;
			await new Promise((r) => setTimeout(r, 5000));
			await pollForCompletion(payload, unexpectedRetries + 1);
			return;
		}

		if (abortedRef.current) return;

		if (!data || typeof data !== 'object') {
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
				await axios.post('/api/playlist/cancel', {
					cancellationId,
					generatedPlaylistId,
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

	const handleConnectPromptConnect = () => {
		setShowConnectPrompt(false);
		const qs = user?.user_id
			? `?userId=${encodeURIComponent(user.user_id)}`
			: '';
		window.location.href = `/api/youtube/connect${qs}`;
	};

	const handleConnectPromptCancel = () => {
		setShowConnectPrompt(false);
		connectPromptResolveRef.current?.(false);
		connectPromptResolveRef.current = null;
	};

	const createSpotifyPlaylist = async (link: string, name: string) => {
		const derivedProvider = providerOfLink(link);
		addToUrl('link', link.split('/').at(-1) as string);
		setPlayListData({ link, name, provider: derivedProvider });
		clearSeeds();
		endGeneration();
		toast.success('Playlist Created');

		if (!user?.user_id) {
			patchGuestGeneration({ link, name });
			if (derivedProvider === 'spotify') {
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

		const detected = detectPlaylistProvider(link);

		if (detected.provider === 'unsupported') {
			setErrorMessages({
				...errorMessages,
				notCorrectSpotifyLink: false,
				error: `We don't support ${detected.label} playlists yet — try a Spotify or YouTube Music playlist link instead.`,
			});
			setLoading(false);
			return;
		}

		if (detected.provider === 'unknown') {
			setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
			setLoading(false);
			return;
		}

		setErrorMessages({
			...errorMessages,
			notCorrectSpotifyLink: false,
			error: null,
		});

		if (detected.provider === 'youtube') {
			const hasGuestCredentials =
				!user?.user_id && Boolean(youtubeGuestCredentialsRef.current);

			const alreadyConnected = hasGuestCredentials
				? true
				: user?.user_id
					? await axios
							.get('/api/youtube/status', {
								params: { userId: user.user_id },
							})
							.then(({ data }) => Boolean(data.connected))
							.catch(() => false)
					: false;

			if (!alreadyConnected) {
				savePendingPlaylistLink(link);
				const proceed = await new Promise<boolean>((resolve) => {
					connectPromptResolveRef.current = resolve;
					setShowConnectPrompt(true);
				});
				if (!proceed) {
					setLoading(false);
					return;
				}
			}

			if (!(await ensureYoutubeChannel())) {
				setLoading(false);
				return;
			}
		}

		// TODO: decouple source and landing platforms — let the source playlist come from any provider and let the user pick where the generated playlist lands (e.g. Spotify seeds → YouTube Music playlist)
		setProvider(detected.provider);
		// Artist search only resolves Spotify artist ids; a previously selected
		// artist won't work as a YouTube channel id (see Options.tsx's
		// artist-mode guard), so drop it once the detected provider is YouTube.
		if (detected.provider === 'youtube') setSelectedArtist(null);

		try {
			setLoadingMessage(
				`Connecting to ${detected.provider === 'youtube' ? 'YouTube' : 'Spotify'} to extract your playlist details...`,
			);
			const playlistId =
				detected.provider === 'youtube'
					? extractYoutubePlaylistId(link)
					: extractPlaylistId(link);

			setLoadingMessage('Retrieving all tracks from the provided playlist...');
			const playlistData = await getPlaylistTracks(
				playlistId,
				true,
				detected.provider,
				user?.user_id,
				!user?.user_id && detected.provider === 'youtube'
					? youtubeGuestCredentialsRef.current
					: undefined,
			);
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

			await addHistoryToDB(playlistId, {
				...sourcePlaylist,
				provider: detected.provider,
			});
			if (
				activeGeneratedPlaylistIdRef.current !== currentPlaylistId ||
				abortedRef.current
			)
				return;

			// Phase 1: Set extracted songs into context for the UI picker
			const { songs, artistNames } = formatPlaylistTracks(playlistTracks);

			setExtractedSongs(songs);
			setExtractedArtists(artistNames);
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
		sourcePlaylist?: { id: string; name: string; provider?: ProviderName },
	) => {
		if (!user?.user_id) {
			return { message: 'skipped', history: [] };
		}

		const userId = user.user_id;
		try {
			await axios.put(`/api/users/${userId}/history`, {
				artists: text,
				sourcePlaylist,
			});
		} catch (err) {
			console.error('[addHistoryToDB] Error:', err);
		}

		await refreshHistory();
		return { message: 'success', history: [] };
	};

	// when a playlist has been uploaded and fewer than 5 songs
	// are selected (0-4), the button should be disabled and greyed out.
	// 5+ seeds reverts to the normal green generate button.
	const isLowSeedCount = extractedSongs.length > 0 && selectedSeedIds.size < 5;

	const btnClass = isLowSeedCount ? 'bg-gray-400 text-lightest' : undefined;

	return (
		<>
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
			{showConnectPrompt && (
				<ConnectYoutubePrompt
					onConnect={handleConnectPromptConnect}
					onCancel={handleConnectPromptCancel}
				/>
			)}
		</>
	);
};

export default SubmitButton;
