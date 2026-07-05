// fetch-text-summary/index.ts
// Baseado no seu código proxy-view (para garantir a compatibilidade de ambiente)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- FUNÇÃO DE CORTE INTELIGENTE (16 LINHAS) ---
const sliceContentByLines = (text: string, maxLines: number = 16): string => {
    if (!text) return "";
    
    // 1. Divide em frases
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentLineCount = 0;
    let finalContent = [];
    
    // 2. Itera sobre as frases, estimando as linhas visuais (80 chars/linha)
    for (const sentence of sentences) {
        const estimatedLines = Math.ceil(sentence.length / 80);
        
        if (currentLineCount + estimatedLines > maxLines) {
            break; 
        }
        
        finalContent.push(sentence);
        currentLineCount += estimatedLines;
    }
    
    const final = finalContent.join(' ').trim();
    if (final.length < text.length && final.length > 0) {
        return final + '...';
    }
    return final;
};


// --- HANDLER PRINCIPAL (BASEADO NO SEU PROXY-VIEW) ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Fetch do Conteúdo Completo (Com Seus Headers Otimizados)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // 2. CORREÇÃO DE CODIFICAÇÃO (MANTIDO O PADRÃO ISO-8859-1)
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    let html = "";
    
    if (contentType.includes("iso-8859-1") || contentType.includes("latin1")) {
      const decoder = new TextDecoder("iso-8859-1");
      html = decoder.decode(buffer);
    } else {
      const decoder = new TextDecoder("utf-8");
      html = decoder.decode(buffer);
    }

    // 3. EXTRAÇÃO INTELIGENTE (Mozilla Readability)
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc) {
        throw new Error("Falha ao fazer parse do HTML");
    }
    
    // Limpeza de scripts e estilos antes de ler (MANTIDO)
    const scripts = doc.querySelectorAll('script, style, iframe, noscript');
    scripts.forEach((node) => node.remove());

    const reader = new Readability(doc).parse();

    if (!reader || !reader.textContent) {
         throw new Error("Readability não conseguiu extrair o texto principal");
    }

    // 4. CORTE OTIMIZADO DE TEXTO (A Nova Lógica)
    const optimizedText = sliceContentByLines(reader.textContent, 16);


    // 5. Retorna SOMENTE O TEXTO CORTADO (Egress Mínimo)
    return new Response(JSON.stringify({ 
      text: optimizedText, // <-- Apenas o texto cortado
      sourceTitle: reader.title,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro no fetch-text-summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});