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

const FILTER_STATES: { value: ThemeFilterState; label: string }[] = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' },
];

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
	const current = themeFilters[theme] ?? 'yes';

	return (
		<div className='flex items-center justify-between gap-3'>
			<span className='text-fsm text-darkest dark:text-lightest truncate'>
				{THEME_LABELS[theme]}
			</span>

			<fieldset className='flex shrink-0 rounded overflow-hidden border-2 border-brand'>
				<legend className='sr-only'>Include {THEME_LABELS[theme]} songs</legend>
				{FILTER_STATES.map(({ value, label }) => (
					<label
						key={value}
						className={`cursor-pointer select-none px-2 py-0.5 text-fxs transition-colors ${
							current === value
								? 'bg-brand text-lightest'
								: 'text-brand hover:bg-brand hover:bg-opacity-10'
						}`}>
						<input
							type='radio'
							name={`theme-${theme}`}
							value={value}
							checked={current === value}
							onChange={() => setThemeFilter(theme, value)}
							className='sr-only'
						/>
						{label}
					</label>
				))}
			</fieldset>
		</div>
	);
};

const ThemeGrid = ({ themes }: { themes: readonly ThemeSlug[] }) => (
	<div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pl-5'>
		{themes.map((theme) => (
			<ThemeToggle key={theme} theme={theme} />
		))}
	</div>
);

const excludedIn = (
	themes: readonly ThemeSlug[],
	filters: Record<string, ThemeFilterState | undefined>,
) => themes.filter((theme) => filters[theme] === 'no').length;

const AdvancedFilters = () => {
	const { themeFilters, resetThemeFilters } = useOptions();

	const excludedCount = Object.keys(themeFilters).length;

	return (
		<Collapsible title='Advanced filters' count={excludedCount}>
			<div className='flex flex-col gap-3 pl-5'>
				<p className='text-fxs text-gray'>
					Pick No to keep songs with that theme out of your playlist.
				</p>

				<Collapsible
					title='Love'
					count={excludedIn(LOVE_THEME_SLUGS, themeFilters)}>
					<ThemeGrid themes={LOVE_THEME_SLUGS} />
				</Collapsible>

				<Collapsible
					title='Other themes'
					count={excludedIn(GENERAL_THEME_SLUGS, themeFilters)}>
					<ThemeGrid themes={GENERAL_THEME_SLUGS} />
				</Collapsible>

				{excludedCount > 0 && (
					<button
						type='button'
						onClick={resetThemeFilters}
						className='w-fit border-brand border-2 rounded px-3 py-1 text-fxs text-brand hover:bg-brand hover:text-lightest transition-all'>
						Reset filters
					</button>
				)}
			</div>
		</Collapsible>
	);
};

export default AdvancedFilters;
