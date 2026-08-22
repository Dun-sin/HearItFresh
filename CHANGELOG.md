# [1.37.0](https://github.com/Dun-sin/HearItFresh/compare/v1.36.0...v1.37.0) (2026-08-22)


### Features

* optimize artist lookup by reusing Spotify IDs for non-popular artists ([5dda0b5](https://github.com/Dun-sin/HearItFresh/commit/5dda0b5336490aef4020eb9d17d00413e188b828))

# [1.36.0](https://github.com/Dun-sin/HearItFresh/compare/v1.35.0...v1.36.0) (2026-08-22)


### Features

* **spotify:** implement pagination for playlist track fetching ([2f89019](https://github.com/Dun-sin/HearItFresh/commit/2f8901944e27c042cb54ab1f6e3674b4ec06ed06))

# [1.35.0](https://github.com/Dun-sin/HearItFresh/compare/v1.34.0...v1.35.0) (2026-08-22)


### Features

* display dynamic option tags for completed playlists ([a753c12](https://github.com/Dun-sin/HearItFresh/commit/a753c128f6acc475c85087e7089f7851c8c9e1d2))
* handle completed playlist generation in SubmitButton ([509effb](https://github.com/Dun-sin/HearItFresh/commit/509effb51166fe2a1c57b11680820ae3d5dc287d))
* implement guest mode for playlist generation with run-based status polling ([c32c620](https://github.com/Dun-sin/HearItFresh/commit/c32c620c2f4dbc4b30fbfd156e88297feb1a27cd))

# [1.34.0](https://github.com/Dun-sin/HearItFresh/compare/v1.33.0...v1.34.0) (2026-08-20)


### Features

* **spotify:** improve track deduplication with normalized metadata matching ([0977421](https://github.com/Dun-sin/HearItFresh/commit/097742164f40165d1ec09bc1b9b6625e0b89d82b))

# [1.33.0](https://github.com/Dun-sin/HearItFresh/compare/v1.32.0...v1.33.0) (2026-08-20)


### Features

* optimize seed playlist generation and similarity scoring ([d835997](https://github.com/Dun-sin/HearItFresh/commit/d8359970f1291215a1c345ec2a478c8d49160350))

# [1.32.0](https://github.com/Dun-sin/HearItFresh/compare/v1.31.1...v1.32.0) (2026-08-20)


### Features

* **HistoryCard:** enhance seed track display with horizontal scroll carousel ([e28ac97](https://github.com/Dun-sin/HearItFresh/commit/e28ac9781c72f03d3ff0360c6c75aaa31032c144))

## [1.31.1](https://github.com/Dun-sin/HearItFresh/compare/v1.31.0...v1.31.1) (2026-08-19)


### Bug Fixes

* **api:** use NextRequest and force dynamic rendering for artist search ([9b88345](https://github.com/Dun-sin/HearItFresh/commit/9b883456e9f72a488e6dc7ae8f6e5630df8f8a47))

# [1.31.0](https://github.com/Dun-sin/HearItFresh/compare/v1.30.0...v1.31.0) (2026-08-19)


### Features

* add artist search functionality with autocomplete input ([a1fecc6](https://github.com/Dun-sin/HearItFresh/commit/a1fecc6a9c0195d6b78300c5e126b5c1faa33c89))
* add artist to playlist generation and history display ([6e622b5](https://github.com/Dun-sin/HearItFresh/commit/6e622b5d5e08316e8cc70f843d62ad4741ac4bcf))
* add artist-based playlist generation support ([35b8cae](https://github.com/Dun-sin/HearItFresh/commit/35b8cae44a71e205fde92a8ebb48bec7180729a8))
* add specific artist option and improve seed selection UX ([f16e649](https://github.com/Dun-sin/HearItFresh/commit/f16e64959bf526101b03a529634dea17b5f66bb4))
* **DiscoverTracks:** adjust seed song selection range and improve UI formatting ([f41e8b0](https://github.com/Dun-sin/HearItFresh/commit/f41e8b0a1eb87ba3207ba7a012436687b21dbed2))
* **history:** redesign HistoryCard with improved playlist display and sorting ([5d2555a](https://github.com/Dun-sin/HearItFresh/commit/5d2555a2160c404a60029098766d5975ba70e7c5))

# [1.30.0](https://github.com/Dun-sin/HearItFresh/compare/v1.29.0...v1.30.0) (2026-08-13)


### Features

* **generateSeedPlaylist:** prioritize seed artists for related artist lookup ([1ee0a9b](https://github.com/Dun-sin/HearItFresh/commit/1ee0a9b0e2493c57b2188bcf07ea11dfd4b00cfa))

# [1.29.0](https://github.com/Dun-sin/HearItFresh/compare/v1.28.1...v1.29.0) (2026-08-11)


### Features

* allow more artist diversity ([f57798a](https://github.com/Dun-sin/HearItFresh/commit/f57798a10a2251c233febb147fd474396daaf022))
* improve duplicate detection for tracks and albums ([715eb45](https://github.com/Dun-sin/HearItFresh/commit/715eb458e8df376ad661f254695865c5abdcb2c0))

## [1.28.1](https://github.com/Dun-sin/HearItFresh/compare/v1.28.0...v1.28.1) (2026-08-05)


### Bug Fixes

* optimize song embedding retrieval and add Spotify API retry logic ([753e5df](https://github.com/Dun-sin/HearItFresh/commit/753e5dfc740496c57e2e68bd9e56052e473312a5))

# [1.28.0](https://github.com/Dun-sin/HearItFresh/compare/v1.27.0...v1.28.0) (2026-07-18)


### Features

* enhance playlist discovery UX with lyrics matching clarification ([#51](https://github.com/Dun-sin/HearItFresh/issues/51)) ([d2e88d0](https://github.com/Dun-sin/HearItFresh/commit/d2e88d051192d36bef75275c89ac09d85c1fac43))

# [1.27.0](https://github.com/Dun-sin/HearItFresh/compare/v1.26.0...v1.27.0) (2026-07-16)


### Features

* improve recommendation system by processing the full lyrics to get the whole context of a song ([#50](https://github.com/Dun-sin/HearItFresh/issues/50)) ([39d298b](https://github.com/Dun-sin/HearItFresh/commit/39d298b2511adb1590124135b5a97920a6859020))

# [1.26.0](https://github.com/Dun-sin/HearItFresh/compare/v1.25.0...v1.26.0) (2026-06-28)


### Features

* change lyrics provider ([#45](https://github.com/Dun-sin/HearItFresh/issues/45)) ([3c042b0](https://github.com/Dun-sin/HearItFresh/commit/3c042b06c3db3de6160657655b6b44b2a08a2a82))

# [1.25.0](https://github.com/Dun-sin/HearItFresh/compare/v1.24.0...v1.25.0) (2026-06-28)


### Features

* add retry system ([#44](https://github.com/Dun-sin/HearItFresh/issues/44)) ([0158f44](https://github.com/Dun-sin/HearItFresh/commit/0158f440e2bb178e4bf2bca167168aeb4753ea2d))

# [1.24.0](https://github.com/Dun-sin/HearItFresh/compare/v1.23.0...v1.24.0) (2026-06-26)


### Features

* remove spotify auth dependency ([#43](https://github.com/Dun-sin/HearItFresh/issues/43)) ([6937c73](https://github.com/Dun-sin/HearItFresh/commit/6937c7346ec4a8aaa2936ac1315400a2ad9dfa35))

# [1.23.0](https://github.com/Dun-sin/HearItFresh/compare/v1.22.0...v1.23.0) (2026-06-16)


### Features

* add a cancel and retry option ([c207b86](https://github.com/Dun-sin/HearItFresh/commit/c207b8614da82b534b461876349e196538025bd6))

# [1.22.0](https://github.com/Dun-sin/HearItFresh/compare/v1.21.2...v1.22.0) (2026-03-26)


### Features

* add better loading messages ([d9a9b21](https://github.com/Dun-sin/HearItFresh/commit/d9a9b21d3dd9f9262439514a8c314f9dd3bc3bd4))

## [1.21.2](https://github.com/Dun-sin/HearItFresh/compare/v1.21.1...v1.21.2) (2026-03-26)


### Bug Fixes

* logging out when user doesn't exist when fetching history ([a56d3a6](https://github.com/Dun-sin/HearItFresh/commit/a56d3a63fa4abd81ef36b76fd1626660ef9d4f25))

## [1.21.1](https://github.com/Dun-sin/HearItFresh/compare/v1.21.0...v1.21.1) (2026-03-24)


### Bug Fixes

* refresh token not working ([259af84](https://github.com/Dun-sin/HearItFresh/commit/259af84917d90ac75088bbd9ab4b33ba87b38bbb))

# [1.21.0](https://github.com/Dun-sin/HearItFresh/compare/v1.20.0...v1.21.0) (2026-03-23)


### Features

* increase artist pool ([55bce45](https://github.com/Dun-sin/HearItFresh/commit/55bce4562f6fe4119c549585b902d6f3bbbf3b44))

# [1.20.0](https://github.com/Dun-sin/HearItFresh/compare/v1.19.0...v1.20.0) (2026-03-23)


### Features

* increase the number of artist we use ([59dac9f](https://github.com/Dun-sin/HearItFresh/commit/59dac9f983aa6d23136ce0d1e740827f8853121a))

# [1.19.0](https://github.com/Dun-sin/HearItFresh/compare/v1.18.0...v1.19.0) (2026-03-23)


### Features

* increase the lyrics block we extract for better lyric matching ([6d32765](https://github.com/Dun-sin/HearItFresh/commit/6d32765183c61a46c63368caadaad99fe99d1e77))

# [1.18.0](https://github.com/Dun-sin/HearItFresh/compare/v1.17.0...v1.18.0) (2026-03-23)


### Features

* remove clean lyrics function because we use a different service for lyrics ([2fdfcab](https://github.com/Dun-sin/HearItFresh/commit/2fdfcab7931bef994ef675c5b24cbcf496332d48))

# [1.17.0](https://github.com/Dun-sin/HearItFresh/compare/v1.16.0...v1.17.0) (2026-03-23)


### Features

* increase song pool increase threshold and add a cutoff ([ac0ec3c](https://github.com/Dun-sin/HearItFresh/commit/ac0ec3cf55dec721e57e2172cfb054bb8c3a1bac))

# [1.16.0](https://github.com/Dun-sin/HearItFresh/compare/v1.15.0...v1.16.0) (2026-03-19)


### Features

* change algorithm to sort the somgs based on the threshold met ([4645855](https://github.com/Dun-sin/HearItFresh/commit/4645855942e73aa5e9511c58055407371da11a01))

# [1.15.0](https://github.com/Dun-sin/HearItFresh/compare/v1.14.0...v1.15.0) (2026-03-18)


### Features

* reduce filter threshold ([ba122c9](https://github.com/Dun-sin/HearItFresh/commit/ba122c9e3a55a371a984312a24b6a6d359cb473f))

# [1.14.0](https://github.com/Dun-sin/HearItFresh/compare/v1.13.0...v1.14.0) (2026-03-18)


### Features

* change recommendation song algorithm ([#42](https://github.com/Dun-sin/HearItFresh/issues/42)) ([22c6114](https://github.com/Dun-sin/HearItFresh/commit/22c61143bcd13bf9ffa7993e3c5aa6ce00f06f27))

# [1.13.0](https://github.com/Dun-sin/HearItFresh/compare/v1.12.0...v1.13.0) (2026-03-14)


### Features

* use lyrics.ovh instead of genius ([d797342](https://github.com/Dun-sin/HearItFresh/commit/d7973427dae2d69279931207845716fb8ab23cb7))

# 1.0.0 (2026-03-14)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* polling stopping for unexpected status result ([0fb247a](https://github.com/Dun-sin/HearItFresh/commit/0fb247af61db4aae0fcac74c87e269bd21721eaf))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add inngest and make recommendations be more random and not use AI ([#41](https://github.com/Dun-sin/HearItFresh/issues/41)) ([c7d9f1b](https://github.com/Dun-sin/HearItFresh/commit/c7d9f1b9ff1d8600c664f7b783152ab2c155e1af))
* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add theme lyrics song matching ([#40](https://github.com/Dun-sin/HearItFresh/issues/40)) ([47afdd5](https://github.com/Dun-sin/HearItFresh/commit/47afdd5389984528fd10e287fee811c0f052f783))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* increase polling time ([f23e1dd](https://github.com/Dun-sin/HearItFresh/commit/f23e1ddc99d0b6150d171f4aa3ba5fa59cf1139d))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2026-03-14)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* polling stopping for unexpected status result ([0fb247a](https://github.com/Dun-sin/HearItFresh/commit/0fb247af61db4aae0fcac74c87e269bd21721eaf))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add inngest and make recommendations be more random and not use AI ([#41](https://github.com/Dun-sin/HearItFresh/issues/41)) ([c7d9f1b](https://github.com/Dun-sin/HearItFresh/commit/c7d9f1b9ff1d8600c664f7b783152ab2c155e1af))
* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add theme lyrics song matching ([#40](https://github.com/Dun-sin/HearItFresh/issues/40)) ([47afdd5](https://github.com/Dun-sin/HearItFresh/commit/47afdd5389984528fd10e287fee811c0f052f783))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* increase polling time ([f23e1dd](https://github.com/Dun-sin/HearItFresh/commit/f23e1ddc99d0b6150d171f4aa3ba5fa59cf1139d))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2026-03-14)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* polling stopping for unexpected status result ([0fb247a](https://github.com/Dun-sin/HearItFresh/commit/0fb247af61db4aae0fcac74c87e269bd21721eaf))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add inngest and make recommendations be more random and not use AI ([#41](https://github.com/Dun-sin/HearItFresh/issues/41)) ([c7d9f1b](https://github.com/Dun-sin/HearItFresh/commit/c7d9f1b9ff1d8600c664f7b783152ab2c155e1af))
* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add theme lyrics song matching ([#40](https://github.com/Dun-sin/HearItFresh/issues/40)) ([47afdd5](https://github.com/Dun-sin/HearItFresh/commit/47afdd5389984528fd10e287fee811c0f052f783))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2026-03-06)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add inngest and make recommendations be more random and not use AI ([#41](https://github.com/Dun-sin/HearItFresh/issues/41)) ([c7d9f1b](https://github.com/Dun-sin/HearItFresh/commit/c7d9f1b9ff1d8600c664f7b783152ab2c155e1af))
* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add theme lyrics song matching ([#40](https://github.com/Dun-sin/HearItFresh/issues/40)) ([47afdd5](https://github.com/Dun-sin/HearItFresh/commit/47afdd5389984528fd10e287fee811c0f052f783))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2026-03-05)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add theme lyrics song matching ([#40](https://github.com/Dun-sin/HearItFresh/issues/40)) ([47afdd5](https://github.com/Dun-sin/HearItFresh/commit/47afdd5389984528fd10e287fee811c0f052f783))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2025-11-03)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* auth not properly working because of a race condition ([0ac1ce6](https://github.com/Dun-sin/HearItFresh/commit/0ac1ce665a8aa82553b7f7d245896bfee9a41353))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2025-10-04)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* change gemini model to 2.0-flash ([4705c13](https://github.com/Dun-sin/HearItFresh/commit/4705c13d0f3aef43b605e4b2109bd05f63c484c8))
* copy playlist not working ([791a09c](https://github.com/Dun-sin/HearItFresh/commit/791a09cad022db3079841f2ed29846486e670e70))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* Spotify Creation of Playlist bug ([#39](https://github.com/Dun-sin/HearItFresh/issues/39)) ([219abb9](https://github.com/Dun-sin/HearItFresh/commit/219abb9d4b5f73e0ff25501bdb1ebb5193782575)), closes [#38](https://github.com/Dun-sin/HearItFresh/issues/38)
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* set the type automatically depending the history clicked ([89be700](https://github.com/Dun-sin/HearItFresh/commit/89be700e34bf55ac026d15fdcb7ec9997064a0da))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* add checker if window in undefined ([5640ee3](https://github.com/Dun-sin/HearItFresh/commit/5640ee3dad8a0c8f75d8210443170beff50a63c6))
* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* move addToURL to client side code ([c5a71dd](https://github.com/Dun-sin/HearItFresh/commit/c5a71dd2b5a747e593188b1ccca88e64abdd20d9))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add toast when playlist is created ([8d08750](https://github.com/Dun-sin/HearItFresh/commit/8d0875008a07362937941ea78b5d16eda7b1a942))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* loading icon not showing on time ([049d964](https://github.com/Dun-sin/HearItFresh/commit/049d964de247c526c11138832eabf5b0028d48b7))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* use function for full spotify link and make result container fill parent ([e87a638](https://github.com/Dun-sin/HearItFresh/commit/e87a6385a67cfd4ca7e0cbfed7bd042ceed0f69f))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-10-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* add user history ([#21](https://github.com/Dun-sin/HearItFresh/issues/21)) ([f9ac918](https://github.com/Dun-sin/HearItFresh/commit/f9ac91893b3bd46976ddf1a32475e5a8bd52792c))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-09-03)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* add link to url ([#20](https://github.com/Dun-sin/HearItFresh/issues/20)) ([1d9eece](https://github.com/Dun-sin/HearItFresh/commit/1d9eeceba27e2876fb46ed8a593a5851d29123f9))
* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-08-23)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))
* users can edit their generated playlist  ([#19](https://github.com/Dun-sin/HearItFresh/issues/19)) ([eb0724c](https://github.com/Dun-sin/HearItFresh/commit/eb0724c9169c1a41afab28402a5fea850660c528)), closes [#15](https://github.com/Dun-sin/HearItFresh/issues/15)


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-08-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-08-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))
* **package.json:** remove semantic-release branch specification ([6aace31](https://github.com/Dun-sin/HearItFresh/commit/6aace31a85f451e4503951ab7fdc34d22b53216e))


### Features

* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))


### BREAKING CHANGES

* **package.json:** semantic release
* trigger breaking change

# 1.0.0 (2024-08-06)


### Bug Fixes

* **app/page.tsx:** change component name to a capital letter ([693bef2](https://github.com/Dun-sin/HearItFresh/commit/693bef25f06aa26d2f0700fade337c3da3da00ea))
* **spotifyauthwrapper:** add suspense ([41af803](https://github.com/Dun-sin/HearItFresh/commit/41af803caab25ba38e4f9732fb42616da0754104))


### chore

* change pnpm run dev to pnpm dev ([0dcfaf5](https://github.com/Dun-sin/HearItFresh/commit/0dcfaf5d31965582a61838af0f5bc133a0e5af2a))


### Features

* **authUrl:** pass authurl to connectspotify ([51dfeb2](https://github.com/Dun-sin/HearItFresh/commit/51dfeb2e6eac8ca81b175420a7064e188e391862))
* finish conversion to next.js ([45daf33](https://github.com/Dun-sin/HearItFresh/commit/45daf336cf8913e0da9326db20bbf3b0fd476bce))
* introduce breaking change API ([ccf5ce7](https://github.com/Dun-sin/HearItFresh/commit/ccf5ce781bb1599251bf73e8507f02cb1da266c0))


### BREAKING CHANGES

* trigger breaking change
