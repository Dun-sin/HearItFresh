/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    secretKey: process.env.SECRET_KEY,
  },
  images: {
    domains: ['i.scdn.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['genius-lyrics', 'sharp', 'onnxruntime-node', '@huggingface/transformers'],

  },
  webpack: (config) => {
    config.resolve.alias['@prisma/client'] = './app/generated/prisma'
    config.resolve.alias['onnxruntime-node$'] = false
    return config
  },
};

export default nextConfig;