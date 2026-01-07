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

    console.log(`\n--- Processando: ${url} ---`);
    
    let finalContent = "";
    let finalTitle = "";
    let extractedMethod = "failed";

    // 1. TENTATIVA DIRETA (Chrome Windows)
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000); // 4s timeout
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });
        clearTimeout(id);

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const contentType = response.headers.get("content-type") || "";
            let html = "";

            // Decodificação Inteligente (Salva o UOL e Folha)
            if (contentType.includes("iso-8859-1") || contentType.includes("latin1")) {
                const decoder = new TextDecoder("iso-8859-1");
                html = decoder.decode(buffer);
            } else {
                const decoder = new TextDecoder("utf-8");
                html = decoder.decode(buffer);
            }

            const doc = new DOMParser().parseFromString(html, "text/html");
            const reader = new Readability(doc).parse();

            // Só aceita se tiver texto substancial (> 500 chars)
            if (reader && reader.content && reader.textContent.length > 500) {
                finalContent = reader.content;
                finalTitle = reader.title;
                extractedMethod = "direct";
                console.log("✅ Sucesso Direto");
            }
        }
    } catch (e) {
        console.log("⚠️ Falha Direta:", e.message);
    }

    // 2. TENTATIVA BLINDADA (JINA AI) - Salva Investing, UOL Bloqueado, etc.
    if (!finalContent) {
        console.log("🔄 Tentando Jina AI...");
        try {
            const jinaUrl = `https://r.jina.ai/${url}`;
            const jinaRes = await fetch(jinaUrl, {
                headers: { 
                    'X-Return-Format': 'html',
                    'X-With-Images-Summary': 'true'
                }
            });

            if (jinaRes.ok) {
                const text = await jinaRes.text();
                // O Jina às vezes retorna erro em texto, filtramos isso
                if (text && text.length > 500 && !text.includes("Rate Limit")) {
                    finalContent = text;
                    extractedMethod = "jina";
                    console.log("✅ Sucesso Jina");
                }
            }
        } catch (e) {
            console.log("❌ Falha Jina:", e.message);
        }
    }

    // SE TUDO FALHAR
    if (!finalContent) {
        throw new Error("Conteúdo não acessível (Bloqueio total)");
    }

    return new Response(JSON.stringify({ 
      reader: {
          title: finalTitle || "Artigo",
          content: finalContent,
          // Limpa tags para a IA usar depois
          textContent: finalContent.replace(/<[^>]*>?/gm, ' ').slice(0, 10000), 
          siteName: new URL(url).hostname
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Força o Frontend a usar o Resumo do RSS
    });
  }
});