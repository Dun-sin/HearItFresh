'use client';

import React from 'react';
import { useOptions } from '@/app/context/optionsContext';

const CURRENT_YEAR = new Date().getFullYear();

const toYear = (value: string) => {
	const year = Number.parseInt(value, 10);
	return Number.isNaN(year) ? null : year;
};

const YearInput = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number | null | undefined;
	onChange: (year: number | null) => void;
}) => (
	<input
		type='number'
		inputMode='numeric'
		min={1900}
		max={CURRENT_YEAR}
		placeholder={label}
		aria-label={`Release year ${label.toLowerCase()}`}
		value={value ?? ''}
		onChange={(e) => onChange(toYear(e.target.value))}
		className='w-24 rounded border border-gray border-opacity-50 bg-transparent px-2 py-1 text-fsm text-darkest dark:text-lightest focus:border-brand focus:ring-brand'
	/>
);

const YearFilter = () => {
	const { yearRange, setYearRange } = useOptions();
	const { from, to } = yearRange;
	const reversed = from != null && to != null && from > to;

	return (
		<div className='flex flex-col gap-1'>
			<div className='flex flex-wrap items-center gap-2 text-fsm'>
				<span className='text-gray'>Release year</span>
				<YearInput
					label='From'
					value={from}
					onChange={(year) => setYearRange({ ...yearRange, from: year })}
				/>
				<span className='text-gray'>to</span>
				<YearInput
					label='To'
					value={to}
					onChange={(year) => setYearRange({ ...yearRange, to: year })}
				/>
				{(from != null || to != null) && (
					<button
						type='button'
						onClick={() => setYearRange({})}
						className='text-fxs text-gray hover:text-brand transition-colors'>
						Clear
					</button>
				)}
			</div>

			{reversed && (
				<p className='text-fxs text-amber-600 dark:text-amber-400'>
					&quot;From&quot; is after &quot;To&quot;, so the years will be
					swapped.
				</p>
			)}
		</div>
	);
};

export default YearFilter;
