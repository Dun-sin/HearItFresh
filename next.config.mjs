/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    secretKey: process.env.SECRET_KEY,
  },
  images: {
    domains: ['i.scdn.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['genius-lyrics', 'onnxruntime-node', '@huggingface/transformers'],

  },
  webpack: (config) => {
    config.resolve.alias['@prisma/client'] = './app/generated/prisma';
    return config;
  },
};

export default nextConfig;