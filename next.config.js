const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.solscan.io',
      },
    ],
  },
  // Enable standalone output for Docker deployments
  output: 'standalone',
  // Optimize for production
  poweredByHeader: false,
  compress: true,
};

module.exports = withBundleAnalyzer(nextConfig);
