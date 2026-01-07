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

    // 1. Fetch simples com Headers de PC
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    let html = "";
    
    // 2. Correção de Codificação (Crucial para UOL/Folha)
    // Se não fizer isso, o Readability falha porque não entende os acentos
    if (contentType.includes("iso-8859-1") || contentType.includes("latin1")) {
      const decoder = new TextDecoder("iso-8859-1");
      html = decoder.decode(buffer);
    } else {
      const decoder = new TextDecoder("utf-8");
      html = decoder.decode(buffer);
    }

    // 3. Limpeza e Extração
    const doc = new DOMParser().parseFromString(html, "text/html");
    const reader = new Readability(doc).parse();

    // Se não extraiu nada ou extraiu muito pouco (bloqueio), lança erro para ativar o Fallback
    if (!reader || !reader.content || reader.content.length < 200) {
         throw new Error("Conteúdo insuficiente (Site Bloqueado ou Paywall)");
    }

    return new Response(JSON.stringify({ 
      reader: {
          title: reader.title,
          content: reader.content,
          textContent: reader.textContent, // Texto puro para a IA
          siteName: reader.siteName
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Retorna erro 500 para o App saber que deve mostrar o "Cartão Amarelo" (Resumo)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
});