/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**'
      }
    ]
  },
  transpilePackages: ['@metaplex-foundation/mpl-token-metadata'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      };
      // Optionally, you can alias the module to false:
      config.resolve.alias['@solana/zk-sdk'] = false;
    }
    return config;
  }
};

module.exports = nextConfig;
