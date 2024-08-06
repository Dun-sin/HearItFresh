'use client';

import { useAuth } from '../context/authContext';

const ConnectSpotify = ({ authUrl }: { authUrl: string }) => {
	const { isAuthInProgress, isLoggedIn } = useAuth();

	return (
		!isLoggedIn && (
			<div className='absolute w-full h-full flex items-center justify-center bg-gray bg-opacity-80 flex-col'>
				<p className={`text-flg md:text-fmd font-bold`}>
					{isAuthInProgress
						? 'Connecting your spotify'
						: 'Please login to connect your spotify and use this tool'}
				</p>
				{!isAuthInProgress && (
					<a
						href={authUrl}
						className='px-4 py-2 bg-brand rounded-md text-lightest'>
						Connect Your Spotify
					</a>
				)}
			</div>
		)
	);
};

export default ConnectSpotify;
