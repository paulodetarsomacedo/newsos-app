/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false, // DESATIVE ISSO (Causa conflitos em iframes)
  reloadOnOnline: true,
  swcMinify: false,
  disable: process.env.NODE_ENV === "development",
  
  // --- O SEGREDO ESTÁ AQUI: BLOQUEAR CACHE DO YOUTUBE ---
  workboxOptions: {
    disableDevLogs: true,
    // Impede o Service Worker de interceptar links do YouTube e Google
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/(www\.)?youtube\.com\/.*/i,
        handler: 'NetworkOnly', // Força a buscar SEMPRE na internet, nunca no cache
      },
      {
        urlPattern: /^https:\/\/(www\.)?youtube-nocookie\.com\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
      }
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = withPWA(nextConfig);