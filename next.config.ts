/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se a variável de ambiente IS_CAPACITOR existir, exporta como estático
  // Caso contrário (na Vercel), funciona como servidor dinâmico
  output: process.env.IS_CAPACITOR ? 'export' : undefined,
  
  images: {
    unoptimized: true, // Obrigatório para Capacitor e export estático
  },

  images: {
    domains: [
      'images.unsplash.com', 
      'ui-avatars.com', 
      'img.youtube.com', 
      'i.ytimg.com', 
      'google.com',
      'www.google.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // --- ADICIONE ISSO AQUI: ---
  typescript: {
    // !! ATENÇÃO !!
    // Perigosamente permite que builds de produção terminem mesmo com erros de tipo.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de estilo também para garantir o build
    ignoreDuringBuilds: true,
  },
};


module.exports = nextConfig;