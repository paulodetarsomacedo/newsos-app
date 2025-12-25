import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.newsos.app', // (Seu ID)
  appName: 'NewsOS',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Adicione a permissão de navegação caso não tenha
    allowNavigation: ["*.youtube.com", "*.youtu.be"]
  },
  // --- A MÁGICA ESTÁ AQUI ---
  ios: {
    // Isso obriga o iPad a carregar sites como se fosse um iPhone
    preferredContentMode: 'mobile',
    
    // Configurações extras para evitar o erro de permissão
    contentInset: 'always',
    allowsLinkPreview: false
  }
};

export default config;