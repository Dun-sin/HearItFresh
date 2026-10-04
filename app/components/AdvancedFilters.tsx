'use client';

import React, { ReactNode, useState } from 'react';
import { useOptions } from '@/app/context/optionsContext';
import {
	GENERAL_THEME_SLUGS,
	LOVE_THEME_SLUGS,
	THEME_LABELS,
	type ThemeFilterState,
	type ThemeSlug,
} from '@/app/lib/themes/slugs';
import { DEFAULT_PACE_MIX } from '@/app/lib/pace/mix';

const PACE_STEP = 10;

const Chevron = ({ open }: { open: boolean }) => (
	<svg
		aria-hidden='true'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.5'
		strokeLinecap='round'
		strokeLinejoin='round'
		className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}>
		<path d='m9 18 6-6-6-6' />
	</svg>
);

const Collapsible = ({
	title,
	count,
	className = 'text-fsm text-gray hover:text-brand',
	defaultOpen = false,
	children,
}: {
	title: string;
	count?: number;
	className?: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className='flex flex-col gap-2'>
			<button
				type='button'
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className={`flex items-center gap-2 w-fit transition-colors ${className}`}>
				<Chevron open={open} />
				<span>{title}</span>
				{count ? (
					<span className='rounded-full bg-brand text-lightest px-2 py-0.5 text-fxs'>
						{count}
					</span>
				) : null}
			</button>

			{open && children}
		</div>
	);
};

const ThemeToggle = ({ theme }: { theme: ThemeSlug }) => {
	const { themeFilters, setThemeFilter } = useOptions();
	const allowed = themeFilters[theme] !== 'restrict';

	return (
		<label
			title={
				allowed
					? `No preference on ${THEME_LABELS[theme].toLowerCase()}`
					: `Songs about ${THEME_LABELS[theme].toLowerCase()} are kept out`
			}
			className='flex items-center justify-between gap-3 cursor-pointer select-none'>
			<span
				className={`text-fsm truncate transition-colors ${
					allowed
						? 'text-darkest dark:text-lightest'
						: 'text-red-600 line-through'
				}`}>
				{THEME_LABELS[theme]}
			</span>

			<input
				type='checkbox'
				checked={allowed}
				onChange={(e) =>
					setThemeFilter(theme, e.target.checked ? 'neutral' : 'restrict')
				}
				className='sr-only peer'
			/>

			<span
				className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1 ${
					allowed ? 'bg-green-600' : 'bg-red-600'
				}`}>
				<span
					className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-lightest shadow-sm transition-transform ${
						allowed ? 'translate-x-4' : 'translate-x-0'
					}`}
				/>
			</span>
		</label>
	);
};

const ThemeGrid = ({ themes }: { themes: readonly ThemeSlug[] }) => (
	<div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pl-5'>
		{themes.map((theme) => (
			<ThemeToggle key={theme} theme={theme} />
		))}
	</div>
);

const ResetButton = ({
	onClick,
	children,
}: {
	onClick: () => void;
	children: ReactNode;
}) => (
	<button
		type='button'
		onClick={onClick}
		className='w-fit border-brand border-2 rounded px-3 py-1 text-fxs text-brand hover:bg-brand hover:text-lightest transition-all'>
		{children}
	</button>
);

const restrictedIn = (
	themes: readonly ThemeSlug[],
	filters: Record<string, ThemeFilterState | undefined>,
) => themes.filter((theme) => filters[theme] === 'restrict').length;

const PaceFilter = () => {
	const { paceMix, setPaceMix } = useOptions();
	const enabled = paceMix !== null;
	const fast = paceMix?.fast ?? DEFAULT_PACE_MIX.fast;

	return (
		<div className='flex flex-col gap-3 pl-5'>
			<label className='flex items-center justify-between gap-3 cursor-pointer select-none'>
				<span className='text-fsm text-darkest dark:text-lightest'>
					Set a fast / slow split
				</span>

				<input
					type='checkbox'
					checked={enabled}
					onChange={(e) => setPaceMix(e.target.checked ? DEFAULT_PACE_MIX : null)}
					className='sr-only peer'
				/>

				<span
					className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1 ${
						enabled ? 'bg-brand' : 'bg-gray'
					}`}>
					<span
						className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-lightest shadow-sm transition-transform ${
							enabled ? 'translate-x-4' : 'translate-x-0'
						}`}
					/>
				</span>
			</label>

			{enabled && (
				<>
					<input
						type='range'
						min={0}
						max={100}
						step={PACE_STEP}
						value={fast}
						onChange={(e) => setPaceMix({ fast: Number(e.target.value) })}
						aria-label='Share of fast songs'
						aria-valuetext={`${fast}% fast, ${100 - fast}% slow`}
						className='w-full accent-brand'
					/>

					<div className='flex justify-between text-fxs text-gray'>
						<span>{fast}% fast</span>
						<span>{100 - fast}% slow</span>
					</div>

					<p className='text-fxs text-amber-600 dark:text-amber-400'>
						Heads up: only songs we have pace data for can be used, and the
						playlist shrinks to keep this exact split, so you may get far
						fewer songs than usual.
					</p>
				</>
			)}
		</div>
	);
};

const AdvancedFilters = () => {
	const { themeFilters, resetThemeFilters, paceMix, setPaceMix } =
		useOptions();

	const restrictedCount = Object.keys(themeFilters).length;
	const activeCount = restrictedCount + (paceMix ? 1 : 0);

	const resetFilters = () => {
		resetThemeFilters();
		setPaceMix(null);
	};

	return (
		<Collapsible title='Advanced filters' count={activeCount}>
			<div className='flex flex-col gap-3 pl-5'>
				<Collapsible title='Themes' count={restrictedCount}>
					<div className='flex flex-col gap-3 pl-5'>
						<p className='text-fxs text-gray'>
							Everything is allowed by default. Switch a theme off to keep
							songs carrying it out entirely.
						</p>

						<Collapsible
							title='Love'
							count={restrictedIn(LOVE_THEME_SLUGS, themeFilters)}>
							<ThemeGrid themes={LOVE_THEME_SLUGS} />
						</Collapsible>

						<Collapsible
							title='Other themes'
							count={restrictedIn(GENERAL_THEME_SLUGS, themeFilters)}>
							<ThemeGrid themes={GENERAL_THEME_SLUGS} />
						</Collapsible>

						{restrictedCount > 0 && (
							<ResetButton onClick={resetThemeFilters}>Reset themes</ResetButton>
						)}
					</div>
				</Collapsible>

				<Collapsible title='Pace' count={paceMix ? 1 : 0}>
					<div className='flex flex-col gap-3'>
						<PaceFilter />

						{paceMix && (
							<div className='pl-5'>
								<ResetButton onClick={() => setPaceMix(null)}>
									Reset pace
								</ResetButton>
							</div>
						)}
					</div>
				</Collapsible>

				{restrictedCount > 0 && paceMix && (
					<ResetButton onClick={resetFilters}>Reset all filters</ResetButton>
				)}
			</div>
		</Collapsible>
	);
};

export default AdvancedFilters;
