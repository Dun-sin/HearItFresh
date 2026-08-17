'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '../context/authContext';

import { useTheme } from '../context/themeContext';

const Header = () => {
	const { isDarkMode, toggleDarkMode } = useTheme();
	const {
		isLoggedIn,

		user,

		logOut,
	} = useAuth();

	return (
		<section className={`flex items-center justify-between px-6 w-full`}>
			<section className='sm:flex flex-col hidden'>
				<Link href='/'>
					<h1 className={`font-bold mb-[-6px] text-fmd flex items-center`}>
						HearItFresh
						<Icon
							icon='material-symbols:music-note-rounded'
							width='20'
							height='20'
							inline={true}
						/>
					</h1>
				</Link>
				<p className={`text-fsm dark:text-gray text-dark`}>
					Discover Fresh Tracks that Fit Your Style
				</p>
			</section>

			<section className='flex items-center gap-2 sm:gap-5 '>
				{isLoggedIn && (
					<button
						className={`text-brand underline underline-offset-1 text-fsm sm:text-fbase`}
						onClick={logOut}>
						SignOut
					</button>
				)}
				<button
					className='text-xl cursor-pointer rounded-full bg-brand p-1 text-lightest'
					onClick={toggleDarkMode}>
					{isDarkMode ? (
						<Icon icon='ic:round-dark-mode' className='w-3 h-4 sm:w-6 sm:h-6' />
					) : (
						<Icon
							icon='ic:round-light-mode'
							className='w-3 h-4 sm:w-6 sm:h-6'
						/>
					)}
				</button>
				<a
					href='https://www.buymeacoffee.com/dunsinCodes'
					target='_blank'
					className={` border-brand border-2 h-8 w-28 text-fxs rounded-lg flex items-center justify-center cursor-pointer sm:w-40 font-semibold `}>
					Buy Me A Coffee
				</a>
				{isLoggedIn && user && (
					<div className='flex items-center gap-1'>
						<div className='sm:min-h-10 sm:min-w-10 min-h-7 min-w-7 relative rounded-lg overflow-hidden'>
							<Image
								src={user.profile_image_url}
								alt={`${user.display_name}'s Pic`}
								fill
							/>
						</div>
						<p className='opacity-75 text-fsm'>{user.display_name}</p>
					</div>
				)}
			</section>
		</section>
	);
};

export default Header;
