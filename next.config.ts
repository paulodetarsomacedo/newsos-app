/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: false, // Desativado para evitar conflito com Iframes
  aggressiveFrontEndNavCaching: false, // Desativado para estabilidade no iOS
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // REMOVEMOS o runtimeCaching do YouTube. 
    // Deixamos o navegador gerenciar o YouTube fora do Service Worker.
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