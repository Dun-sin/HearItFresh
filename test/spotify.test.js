import { expect, test, expectTypeOf } from "vitest";
import { getOneAlbumTrack } from "../lib/spotify";

test('getOneAlbumTrack should return a track from a given album', async () => {
  const album = '4utT7N3IehsJfbtUhNDaeF';
  const track = await getOneAlbumTrack(album);

  expectTypeOf(track).toBeString()
  expect(track).toMatch(/^spotify:track:/);
})