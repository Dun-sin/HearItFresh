import type { Config } from 'tailwindcss';
import { addDynamicIconSelectors } from '@iconify/tailwind';

const config: Config = {
	darkMode: 'selector',
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				brand: '#008080',
				darkest: '#000A07',
				dark: '#001911',
				medium: '#1A664F',
				gray: '#798683',
				lightest: '#FAFFFD',
			},
			fontSize: {
				fxs: 'var(--step--2)',
				fsm: 'var(--step--1)',
				fbase: 'var(--step-0)',
				fmd: 'var(--step-1)',
				flg: 'var(--step-2)',
				fxl: 'var(--step-3)',
				f2xl: 'var(--step-4)',
				f3xl: 'var(--step-5)',
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms'),
		addDynamicIconSelectors(),
	],
};
export default config;
