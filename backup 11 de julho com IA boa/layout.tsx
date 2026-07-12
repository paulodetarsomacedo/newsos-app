import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Vetra',
  description: 'Sua central de inteligência.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // Isso ajuda a fundir o topo
    title: 'Vetra',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b1733',
  // 1. A SOLUÇÃO MÁGICA ESTÁ AQUI:
  viewportFit: 'cover', 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 2. Adicione h-full no html para garantir altura total
    <html lang="pt-BR" className="h-full">
      <body 
        className={`
          ${geistSans.variable} ${geistMono.variable}
          h-full w-full overflow-hidden antialiased
          
          /* 3. AQUI ESTÁ A CORREÇÃO DA FAIXA BRANCA: */
          /* Pintamos o fundo do "papel" (body) com a cor escura do app */
          bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100
          
          /* Evita o efeito elástico que revela o fundo branco */
          overscroll-none
        `}
      >
        {children}
      </body>
    </html>
  );
}
