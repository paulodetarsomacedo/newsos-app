import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Isso faz o site achar que é um usuário real no Chrome, não um robô
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store' // Garante que pegamos a notícia mais fresca
    });

    const xml = await response.text();
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*', // Resolve CORS para o iPad
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor de resgate' }, { status: 500 });
  }
}