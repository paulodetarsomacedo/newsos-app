export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0; +http://seusite.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store' 
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    // Pegamos os bytes brutos (ArrayBuffer) para ter controle total da decodificação
    const buffer = await response.arrayBuffer();
    
    // 1. Tenta decodificar como UTF-8 (Padrão mundial e da maioria dos feeds modernos)
    const decoderUtf8 = new TextDecoder('utf-8');
    let xml = decoderUtf8.decode(buffer);

    // 2. VERIFICAÇÃO DE SEGURANÇA (A Correção "Mágica")
    // O caractere \uFFFD () aparece quando o decodificador UTF-8 falha ao ler bytes Latin1/ISO.
    // Se encontrarmos isso no XML, significa que o site NÃO é UTF-8.
    if (xml.includes('\uFFFD')) {
        // Recarregamos o buffer usando Windows-1252 (que cobre ISO-8859-1 e acentos PT-BR)
        const decoderIso = new TextDecoder('windows-1252');
        xml = decoderIso.decode(buffer);
    }
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8', // Agora garantimos que sai como UTF-8 limpo
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: 'Erro no Proxy' }, { status: 500 });
  }
}