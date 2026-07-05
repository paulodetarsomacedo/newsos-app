// ARQUIVO: supabase/functions/parse-feed-legacy/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Parser from "https://esm.sh/rss-parser@3.13.0"

// --- CABEÇALHOS DE NAVEGADOR PARA "ENGANAR" O SERVIDOR ---
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
};

const parser = new Parser({
  timeout: 8000, // Aumentado para lidar com servidores mais lentos
  headers: BROWSER_HEADERS,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL is required')
    console.log(`Fetching feed: ${url}`)

    let feed;
    try {
        // Tenta com o parser primeiro, que é mais robusto
        feed = await parser.parseURL(url);
    } catch (e) {
        console.warn("rss-parser failed, falling back to manual fetch...");
        
        // --- FALLBACK MANUAL (MAIS CONTROLE) ---
        const response = await fetch(url, {
            headers: BROWSER_HEADERS,
            redirect: 'follow' // OBRIGATÓRIO para seguir redirecionamentos
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        feed = await parser.parseString(xmlText);
    }

    // Normaliza a resposta (mantido igual)
    const items = feed.items.slice(0, 20).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      content: item.content || item.contentSnippet || "",
      summary: item.contentSnippet || item.content || "",
      // ... outras propriedades
    }));

    return new Response(JSON.stringify({
      title: feed.title,
      items: items
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})