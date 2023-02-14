import { test, expectTypeOf } from "vitest";
import { extractPlaylistId, getEveryAlbum, isValidPlaylistLink } from "../lib/utils";

test('extractPlaylistId', test => {
  test.expect(extractPlaylistId('https://open.spotify.com/playlist/37i9dQZF1DZ06evO45P0Eo')).toBe('37i9dQZF1DZ06evO45P0Eo')
})

test('isValidPlaylistLink', test => {
  test.expect(isValidPlaylistLink('https://open.spotify.com/playlist/37i9dQZF1DZ06evO45P0Eo')).toBe(true)
})

test('isValidPlaylistLink', test => {
  test.expect(isValidPlaylistLink('37i9dQZF1DZ06evO45P0Eo')).toBe(false)
})

test('getEveryAlbum should return an array of albums', async () => {
  const artists = ['bts', 'txt', 'enhypen']
  const albums = await getEveryAlbum(artists)

  expectTypeOf(albums).toBeArray()
})

test('getEveryAlbum should return unique albums', async (test) => {
  const artists = ['bts', 'txt', 'enhypen']
  const albums = await getEveryAlbum(artists)

  test.expect(new Set(albums)).toHaveLength(albums.length)
})