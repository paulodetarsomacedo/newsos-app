// supabase/functions/proxy-view/index.ts

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
    if (!url) throw new Error("URL is required");

    // 1. Baixa o HTML original
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);
    let html = await response.text();

    // 2. Prepara HTML para o Iframe (Modo Web)
    const baseTag = `<base href="${url}" target="_blank">`;
    let webHtml = html;
    if (webHtml.includes('<head>')) {
        webHtml = webHtml.replace('<head>', `<head>${baseTag}`);
    } else {
        webHtml = `${baseTag}${webHtml}`;
    }
    // Remove frame busters
    webHtml = webHtml.replace(/if\s*\(top\s*!==\s*self\)/gi, "if(false)");

    // 3. Processa Modo Leitura (Modo Safari/Reader)
    const doc = new DOMParser().parseFromString(html, "text/html");
    const reader = new Readability(doc).parse();

    return new Response(JSON.stringify({ 
        html: webHtml, // Para o Iframe
        reader: reader // Para o Modo Leitura (Conteúdo limpo)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});