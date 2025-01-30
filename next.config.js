// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    // If you're on Next 13+, you can use remotePatterns
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'raw.githubusercontent.com',
          port: '',
          pathname: '/**'
        }
      ]
    }
  };
  
  module.exports = nextConfig;
  