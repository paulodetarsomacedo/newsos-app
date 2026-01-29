/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração condicional para o Capacitor
  output: process.env.IS_CAPACITOR ? 'export' : undefined,

  // Configuração para ignorar a pasta /api no build estático
  experimental: {
    exclude: process.env.IS_CAPACITOR ? ['/api/**'] : [],
  },

  // UM ÚNICO BLOCO 'images' com tudo dentro
  images: {
    unoptimized: true, // Necessário para Capacitor
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite qualquer hostname, mais flexível que 'domains'
      },
    ],
  },

  // Ignorar erros de TypeScript e ESLint durante o build (mantido)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;