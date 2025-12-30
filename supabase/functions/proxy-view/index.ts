// ARQUIVO: supabase/functions/proxy-view/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error('URL required');

    console.log(`Jina Fetching: ${url}`);

    // Usamos o Jina AI Reader com a opção de retornar HTML limpo.
    // Isso resolve codificação (ISO-8859-1 do UOL) e limpeza de anúncios.
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
            'X-Return-Format': 'html', // Pede HTML direto
            'X-Target-Selector': 'body', // Tenta focar no corpo
            'X-With-Images-Summary': 'true' // Tenta manter imagens
        }
    });

    if (!jinaResponse.ok) {
        throw new Error(`Jina Error: ${jinaResponse.status}`);
    }

    const htmlContent = await jinaResponse.text();

    // Validação básica: Se veio muito curto, é erro/bloqueio do Jina
    if (!htmlContent || htmlContent.length < 300) {
        throw new Error("Conteúdo retornado insuficiente.");
    }

    // Retornamos um objeto padronizado
    return new Response(JSON.stringify({ 
      reader: {
          title: "Artigo Processado", // O título o app já tem do RSS
          content: htmlContent, // O HTML limpo do Jina
          textContent: htmlContent.replace(/<[^>]*>?/gm, ''), // Texto puro para a IA
          siteName: new URL(url).hostname
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});