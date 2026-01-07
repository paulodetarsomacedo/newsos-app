// ARQUIVO: supabase/functions/proxy-view/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error('URL required');

    console.log(`Limpando URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) throw new Error(`Site retornou erro: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    let html = "";
    
    // Decodificação para não quebrar acentos
    if (contentType.includes("iso-8859-1") || contentType.includes("latin1")) {
      html = new TextDecoder("iso-8859-1").decode(buffer);
    } else {
      html = new TextDecoder("utf-8").decode(buffer);
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Falha ao ler HTML");

    // --- A LIMPEZA PESADA COMEÇA AQUI ---
    // Removemos todo o lixo que causa os erros vermelhos no seu console
    const junkTags = ['script', 'style', 'iframe', 'noscript', 'nav', 'footer', 'header', 'aside', '.ads', '#ads'];
    junkTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });

    const reader = new Readability(doc).parse();

    // Se depois de limpar não sobrou nada (site bloqueado), joga erro
    if (!reader || !reader.content || reader.textContent.length < 200) {
         throw new Error("Conteúdo insuficiente após limpeza.");
    }

    // Retorna o HTML limpinho
    return new Response(JSON.stringify({ 
      reader: {
          title: reader.title,
          content: reader.content, // HTML limpo (sem scripts)
          textContent: reader.textContent, // Texto puro para a IA
          siteName: reader.siteName
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro Proxy:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Força o Frontend a usar o Fallback
    });
  }
});