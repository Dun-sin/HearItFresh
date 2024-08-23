/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		secretKey: process.env.SECRET_KEY,
	},
	images: {
		domains: ['i.scdn.co'],
	},
};

export default nextConfig;
