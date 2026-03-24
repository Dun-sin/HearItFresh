const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  images: {
    domains: ['i.scdn.co'],
  },
  experimental: {
    serverComponentsExternalPackages: [
      'genius-lyrics',
      'sharp',
      ...(!isProd ? ['onnxruntime-node', '@huggingface/transformers'] : []),
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@prisma/client'] = './app/generated/prisma'

    if (isProd) {
      config.resolve.alias['onnxruntime-node$'] = false
      config.resolve.alias['@huggingface/transformers$'] = false
    }

    return config
  },
};
export default nextConfig;