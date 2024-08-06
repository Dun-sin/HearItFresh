/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		secretKey: process.env.SECRET_KEY,
	},
};

export default nextConfig;