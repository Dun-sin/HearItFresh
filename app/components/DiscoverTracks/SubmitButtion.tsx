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

import React from 'react';
import SubmitButtionContainer from '../SubmitButtonContainer';
import { addToUrl } from '@/app/lib/clientUtils';
import { addUserHistory } from '@/app/lib/db';
import { fetchSimilarArtistsFromAI } from '@/app/lib/utils';
import { generateSeedPlaylist } from '@/app/lib/generateSeedPlaylist';
import spotifyApi from '@/app/lib/spotifyApi';
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
  const { user, logOut, accessToken } = useAuth();
	const { setLoadingMessage } = useLoading();
	const { artistName, artistArray, spotifyPlaylist, setArtistArray } =
		useInput();
	const { setHistory } = useHistory();
	const { isNotPopularArtists, isDifferentTypesOfArtists } = useOptions();

  const { extractedSongs, setExtractedSongs, selectedSeedIds, extractedArtists, setExtractedArtists, clearSeeds } = useSeedSongs();

  const handleSeedPlaylistGeneration = async () => {
    if (buttonClick === true) return;

    const seedCount = selectedSeedIds.size;
    if (seedCount > 0 && (seedCount < 5 || seedCount > 15)) {
      toast.error('Please select either 0 seeds (skip lyrics) or between 5 to 15 seeds.');
      return;
    }

    setButtonClicked(true);
    setLoading(true);

    try {
      setLoadingMessage('Generating playlist based on your seeds...');
      console.log('[handleSeedPlaylistGeneration] Starting...');
      const selectedSongsData = extractedSongs.filter((s: any) => selectedSeedIds.has(s.id));


      // Try context token, then localStorage singleton, then encrypted localStorage
      let tokenValue = accessToken || spotifyApi.getAccessToken();
      if (!tokenValue) {
        tokenValue = localStorage.getItem('access_token') ?? undefined;
      }

      console.log('SubmitButtion - Spotify Access Token:', tokenValue ? 'FOUND (starts with ' + tokenValue.substring(0, 10) + '...)' : 'MISSING');
      if (process.env.NODE_ENV === 'production') {
        // Inngest path
        const result = await fetch('/api/playlist/generate', {
          method: 'POST',
          body: JSON.stringify({
            seeds: selectedSongsData,
            artistNames: extractedArtists,
            options: { isNotPopular: isNotPopularArtists, isDifferent: isDifferentTypesOfArtists },
            accessToken: tokenValue,
            userId: user?.user_id,
          })
        })
        console.log('[handleSeedPlaylistGeneration] Got eventId, starting polling...');
        const { eventId } = await result.json()
        await pollForCompletion(eventId)
      } else {

        const result = await generateSeedPlaylist(
          selectedSongsData,
          extractedArtists,
          { isNotPopular: isNotPopularArtists, isDifferent: isDifferentTypesOfArtists },
          tokenValue ?? undefined,
          user?.user_id,
        );

        if (result.error || !result.tracks || result.tracks.length === 0) {
          throw new Error(result.error || 'Failed to generate tracks');
        }
        const seedCount = selectedSeedIds.size
      const playlistName = seedCount > 0
        ? 'HearItFresh - Lyrics Inspired'
        : 'HearItFresh - Similar to Playlist'

        setLoadingMessage('Creating The Playlist')
        const playlistInfo = await createPlayList(playlistName, 'Created by HearItFresh')
        if ('isError' in playlistInfo) throw new Error(playlistInfo.err)

        const { id, link, name } = playlistInfo
        const playListID = id.substring('spotify:playlist:'.length)

        setLoadingMessage('Adding The Tracks To The Playlist')
        await addTracksToPlayList(result.tracks, playListID)
        createSpotifyPlaylist(link, name)
      }
    } catch (err: any) {
      console.log('[handleSeedPlaylistGeneration] Error:', err);
      setErrorMessages({
        ...errorMessages,
        error: 'Error occurred while generating playlist: ' + (err.message || ''),
      });
      console.log(err);
    } finally {
      setLoading(false);
      setButtonClicked(false);
      setLoadingMessage(null);
    }
  };

  const pollForCompletion = async (eventId: string, unexpectedRetries = 0) => {
    const MAX_UNEXPECTED_RETRIES = 10
    console.log('[pollForCompletion] Starting poll for eventId:', eventId);
    const res = await fetch(`/api/playlist/status?eventId=${eventId}`)
    const data = await res.json()
    console.log('[pollForCompletion] Status:', data.status, data);

    if (data.status === 'Completed') {
      console.log('[pollForCompletion] Completed!');
      const { link, name } = data.output

      await createSpotifyPlaylist(link, name)

    } else if (data.status === 'Failed') {
      console.log('[pollForCompletion] Failed!');
      throw new Error('Playlist generation failed')
    } else if (data.status === 'Running' || data.status === "Scheduled") {
      console.log('[pollForCompletion] Still processing, polling again in 10s...');
      await new Promise(resolve => setTimeout(resolve, 10000))
      await pollForCompletion(eventId, 0)
    } else {
      if (unexpectedRetries >= MAX_UNEXPECTED_RETRIES) {
        throw new Error(`Polling stopped after ${MAX_UNEXPECTED_RETRIES} unexpected status responses: ${data.status}`)
      }
      console.warn('[pollForCompletion] Unexpected status:', data.status, `— retrying in 10s... (attempt ${unexpectedRetries + 1}/${MAX_UNEXPECTED_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 10000))
      await pollForCompletion(eventId, unexpectedRetries + 1)
    }
  }

  const createSpotifyPlaylist = async (link: string, name: string) => {
    addToUrl('link', link.split('/').at(-1) as string)
    setPlayListData({ link, name })
    setArtistArray([])
    clearSeeds()
    toast.success('Playlist Created')
  }

  const getSimilarArtists = async (artists: string[]) => {
    if (buttonClick === true) {
      setLoading(false);
      return;
    }
    setButtonClicked(true);

    try {
      setLoadingMessage(`Getting the list of new artists`);

      const finalList = await fetchSimilarArtistsFromAI(artists, {
        isNotPopular: isNotPopularArtists,
        isDifferent: isDifferentTypesOfArtists
      });

			setLoadingMessage(`Getting the albums of each artist`);
			const albums = await getEveryAlbum(finalList);

			setLoadingMessage('Getting All Tracks');
      const tracks = await getAllTracks(albums as string[], 1) as string[];

			setLoadingMessage('Creating The PlayList');
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

			setLoadingMessage('Adding The Tracks To The Playlist');

			if (tracks === null) throw new Error('Track is empty');
			addTracksToPlayList(tracks, playListID)
				.then(() => {
					addToUrl('link', link.split('/').at(-1) as string);
					setPlayListData({ link, name });
				})
				.catch((err) => {
					return err;
				});

			setLoadingMessage('Done');
			setArtistArray([]);
			toast.success('Playlist Created');
		} catch (err) {
			setErrorMessages({
				...errorMessages,
				error: 'Error occured while generating a playlist. Try to login again',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
			setLoadingMessage(null);
		}
	};

	async function handleIfItsAPlaylistLink(link: string) {
		if (!isValidPlaylistLink(link)) {
			setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
			setLoading(false);
			return;
		}

		setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

		try {
			setLoadingMessage(`Extracting Playlist Link`);
			const playlistId = extractPlaylistId(link);

			await addHistoryToDB(playlistId);

			setLoadingMessage(`Getting All Tracks In The Playlist`);
			const playlistTracks = await getAllTracksInAPlaylist(playlistId);

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
	return <SubmitButtionContainer handleSubmit={handleSubmit} />;
};

export default SubmitButtion;
