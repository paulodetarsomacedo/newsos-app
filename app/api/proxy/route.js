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

    const buffer = await response.arrayBuffer();
    
    let xml = "";
    
    // --- LÓGICA DE FORÇA BRUTA PARA UOL/FOLHA ---
    // Sites conhecidos por usar ISO-8859-1 (Latin1)
    const isLegacySite = targetUrl.includes('uol.com.br') || 
                         targetUrl.includes('folha.uol.com.br') || 
                         targetUrl.includes('noticias.uol');

    if (isLegacySite) {
        // Se for UOL, força ISO direto. Sem "tentar" UTF-8 antes.
        const decoder = new TextDecoder('iso-8859-1');
        xml = decoder.decode(buffer);
    } else {
        // Para os outros (G1, CNN, etc), tenta UTF-8
        const decoder = new TextDecoder('utf-8');
        xml = decoder.decode(buffer);

        // Fallback de segurança: se mesmo não sendo UOL aparecer o losango de erro
        if (xml.includes('\uFFFD')) {
            const legacyDecoder = new TextDecoder('iso-8859-1');
            xml = legacyDecoder.decode(buffer);
        }
    }
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8', // Entrega sempre UTF-8 limpo para o App
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no Proxy' }, { status: 500 });
  }
}