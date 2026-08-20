/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "bcryptjs", "jsonwebtoken"],
  },
  allowedDevOrigins: [
    "*.apps.whop.com",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
};

module.exports = nextConfig;
