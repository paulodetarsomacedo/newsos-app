/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Desativa PWA em desenvolvimento
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  // Seus configs atuais (se tiver), senão deixe vazio
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);