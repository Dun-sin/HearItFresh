const nextConfig = {
  env: {
    secretKey: process.env.SECRET_KEY,
  },
  images: {
    domains: ['i.scdn.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['genius-lyrics', 'sharp'],
  },
  webpack: (config) => {
    config.resolve.alias['@prisma/client'] = './app/generated/prisma'
    config.resolve.alias['onnxruntime-node$'] = false
    config.resolve.alias['@huggingface/transformers$'] = false
    return config
  },
};

export default nextConfig;