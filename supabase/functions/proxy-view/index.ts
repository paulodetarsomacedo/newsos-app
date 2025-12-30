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

    console.log(`\n--- Iniciando Extração: ${url} ---`);
    
    let finalContent = "";
    let finalTitle = "";
    let extractedMethod = "";

    // ==============================================================================
    // ESTRATÉGIA 1: ACESSO DIRETO (CHROME MASK) - Melhor para sites normais
    // ==============================================================================
    try {
        console.log("1. Tentando acesso direto (Chrome Mask)...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder("utf-8"); // Decodificação padrão
            const html = decoder.decode(buffer);
            
            const doc = new DOMParser().parseFromString(html, "text/html");
            if (doc) {
                const reader = new Readability(doc).parse();
                if (reader && reader.content && reader.content.length > 300) {
                    console.log("✅ Sucesso Direto!");
                    finalContent = reader.content;
                    finalTitle = reader.title;
                    extractedMethod = "direct";
                }
            }
        } else {
            console.log(`❌ Direto falhou: ${response.status}`);
        }
    } catch (err) {
        console.log("❌ Erro no acesso direto:", err.message);
    }

    // ==============================================================================
    // ESTRATÉGIA 2: JINA AI (BACKUP) - Para sites difíceis (UOL, Investing)
    // ==============================================================================
    if (!finalContent || finalContent.length < 300) {
        console.log("2. Tentando Jina AI...");
        try {
            const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
                headers: { 
                    'X-Return-Format': 'html',
                    'X-With-Images-Summary': 'true'
                }
            });
            
            if (jinaRes.ok) {
                const text = await jinaRes.text();
                // Verifica se não é mensagem de erro do Jina
                if (text && !text.includes("Rate Limit") && text.length > 300) {
                    console.log("✅ Sucesso Jina!");
                    finalContent = text;
                    finalTitle = "Artigo Processado";
                    extractedMethod = "jina";
                }
            }
        } catch (err) {
            console.log("❌ Erro Jina:", err.message);
        }
    }

    // ==============================================================================
    // RESPOSTA FINAL
    // ==============================================================================
    if (!finalContent || finalContent.length < 200) {
        throw new Error("Falha total na extração. Bloqueio severo.");
    }

    return new Response(JSON.stringify({ 
      source: extractedMethod,
      reader: {
          title: finalTitle || "Sem título",
          content: finalContent,
          textContent: finalContent.replace(/<[^>]*>?/gm, ' '),
          siteName: new URL(url).hostname
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Retorna 500 para o frontend ativar o Fallback RSS
    });
  }
});