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
