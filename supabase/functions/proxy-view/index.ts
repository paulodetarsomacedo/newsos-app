// ARQUIVO: supabase/functions/proxy-view/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Tratamento de CORS (Para o app aceitar a resposta)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Buscando URL: ${url}`);

    // 2. A MÁSCARA (Headers de Navegador Real)
    // Isso engana o UOL e Investing achando que é um usuário real no Chrome
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // 3. CORREÇÃO DE CODIFICAÇÃO (Para UOL e sites antigos)
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    let html = "";
    
    // Tenta detectar charset iso-8859-1 (comum no Brasil antigo)
    if (contentType.includes("iso-8859-1") || contentType.includes("latin1")) {
      const decoder = new TextDecoder("iso-8859-1");
      html = decoder.decode(buffer);
    } else {
      // Padrão UTF-8
      const decoder = new TextDecoder("utf-8");
      html = decoder.decode(buffer);
    }

    // 4. EXTRAÇÃO INTELIGENTE (Mozilla Readability)
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc) {
        throw new Error("Falha ao fazer parse do HTML");
    }

    // Remove scripts e estilos antes de ler (limpeza)
    const scripts = doc.querySelectorAll('script, style, iframe, noscript');
    scripts.forEach((node) => node.remove());

    const reader = new Readability(doc).parse();

    if (!reader) {
         throw new Error("Readability não conseguiu extrair conteúdo");
    }

    // 5. Retorna o conteúdo limpo
    return new Response(JSON.stringify({ 
      html: html, // HTML Bruto (se precisar)
      reader: {
          title: reader.title,
          content: reader.content,
          textContent: reader.textContent,
          excerpt: reader.excerpt,
          siteName: reader.siteName
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro no proxy:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});