'use client';

import React from 'react';
import type { ArtistModeStatus } from '@/app/lib/artistMode';

const plural = (count: number, word: string) =>
	`${count} ${word}${count === 1 ? '' : 's'}`;

const THEMES_PATH = (
	<span className='font-semibold'>Advanced filters → Themes</span>
);

const Message = ({
	status,
	artistName,
}: {
	status: ArtistModeStatus;
	artistName: string;
}) => {
	switch (status.kind) {
		case 'needsInput':
			if (status.hasSongs) {
				return (
					<p>
						Pick 5–10 seed songs above, or switch off a theme in {THEMES_PATH}{' '}
						to skip seeds.
					</p>
				);
			}
			return (
				<div className='flex flex-col gap-1'>
					<p>Shape your {artistName} playlist with either or both:</p>
					<ul className='flex flex-col gap-1 pl-4 list-disc'>
						<li>
							<span className='font-semibold'>Seed songs:</span> add a playlist
							link above and pick 5–10 songs. {artistName}&apos;s songs are
							ranked by how closely their lyrics match.
						</li>
						<li>
							<span className='font-semibold'>Themes:</span> switch off what you
							don&apos;t want in {THEMES_PATH}. Songs carrying those themes are
							left out.
						</li>
					</ul>
				</div>
			);
		case 'loadPlaylist':
			return (
				<p>
					Generate will load that playlist so you can pick 5–10 seed songs.
					{status.restrictedThemes > 0 &&
						' To skip seeds and use only your themes, clear the link.'}
				</p>
			);
		case 'needsSeeds':
			return (
				<p>
					Pick {plural(status.missing, 'more seed song')}.
					{status.restrictedThemes > 0 &&
						' Or use Clear selection to go with your themes only.'}
				</p>
			);
		case 'ready':
			if (status.seeds === 0) {
				return (
					<p>
						Ready: {artistName}&apos;s songs, leaving out{' '}
						{plural(status.restrictedThemes, 'theme')} you switched off. Add seed
						songs if you want them ranked by lyric match.
					</p>
				);
			}
			return (
				<p>
					Ready: {artistName}&apos;s songs ranked by lyric match to your{' '}
					{plural(status.seeds, 'seed')}
					{status.restrictedThemes > 0 &&
						`, leaving out ${plural(status.restrictedThemes, 'theme')}`}
					.
				</p>
			);
	}
};

const ArtistModeGuide = ({
	status,
	artistName,
}: {
	status: ArtistModeStatus;
	artistName: string;
}) => {
	const ready = status.kind === 'ready';

	return (
		<div
			role='status'
			aria-live='polite'
			className={`flex items-start gap-2 rounded border-2 px-3 py-2 text-fsm ${
				ready ? 'border-brand' : 'border-gray border-opacity-30'
			}`}>
			<span
				aria-hidden='true'
				className={`mt-0.5 shrink-0 text-fbase ${
					ready
						? 'icon-[uil--check-circle] text-brand'
						: 'icon-[uil--info-circle] text-gray'
				}`}
			/>
			<Message status={status} artistName={artistName} />
		</div>
	);
};

export default ArtistModeGuide;
