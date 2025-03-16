/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Expose environment variables to the browser
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Enable static optimization for faster builds
  swcMinify: true,
  // Configure image domains if needed
  images: {
    domains: [],
  },
}

module.exports = nextConfig
