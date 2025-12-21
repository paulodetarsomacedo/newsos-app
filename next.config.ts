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
        // BLOQUEIO TOTAL DE CACHE PARA YOUTUBE (Padrão e Mídia)
        urlPattern: /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|googlevideo\.com|ytimg\.ts)\/.*/i,
        handler: 'NetworkOnly', 
      },
      {
        // Cache apenas para fontes (melhora a velocidade)
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