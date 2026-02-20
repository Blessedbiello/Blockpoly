/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: "buffer/",
      };
    }
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });
    return config;
  },
  transpilePackages: [
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-wallets",
    "@solana/wallet-adapter-base",
  ],
};

export default nextConfig;
