/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-4951180469144594abaab94c53f99a18.r2.dev',
      },
    ],
  },
}

export default nextConfig;
