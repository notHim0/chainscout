/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC instead of Babel
  
  webpack: (config, { isServer }) => {
    // Fixes for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }

    // Handle ESM packages
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },
  
  // Transpile problematic packages
  transpilePackages: ['@pushprotocol/restapi', '@pushprotocol/socket'],
  
  // Experimental features for ESM support
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig