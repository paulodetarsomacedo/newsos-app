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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store' 
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    // 1. Baixa os dados brutos (binário)
    const buffer = await response.arrayBuffer();
    
    // 2. Tenta decodificar como UTF-8 (Padrão moderno)
    let decoder = new TextDecoder('utf-8');
    let xml = decoder.decode(buffer);

    // 3. O DETECTOR DE ERRO:
    // O caractere  (código \uFFFD) só aparece quando o UTF-8 falha.
    // Se o texto tiver isso, significa que o site é antigo (UOL/Folha/etc).
    if (xml.includes('\uFFFD')) {
        // Recarrega o decodificador no padrão antigo (ISO-8859-1)
        decoder = new TextDecoder('iso-8859-1');
        xml = decoder.decode(buffer);
    }
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no Proxy' }, { status: 500 });
  }
}