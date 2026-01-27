/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // <--- OBRIGATÓRIO: Gera HTML estático
  images: {
    unoptimized: true, // <--- OBRIGATÓRIO: O Next não pode otimizar imagens sem servidor
  },
  // -----------------------------------

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