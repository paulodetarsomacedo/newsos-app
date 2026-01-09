import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { article, voiceKey, textKey } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. VERIFICA CACHE (Custo Zero)
    const filename = `audio-briefings/${article.id}.mp3`;
    const { data: existing } = await supabase.storage.from('media').createSignedUrl(filename, 3600);
    
    if (existing) {
      console.log("Áudio encontrado no cache.");
      return new Response(JSON.stringify({ audioUrl: existing.signedUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. GERA ROTEIRO COM GEMINI (Custo Zero - Tokens Grátis)
    console.log("Gerando roteiro...");
const prompt = `Aja como um âncora de jornal. Resuma esta notícia para áudio em pt-BR. NÃO use saudações, NÃO use introduções como "Nesta notícia". Vá direto aos fatos mais importantes. Máximo 150 palavras. TEXTO: ${article.summary} ${article.title}`;    
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${textKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const geminiData = await geminiRes.json();
    const script = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || article.title;

    // 3. GERA ÁUDIO COM GOOGLE TTS (Custo Zero até cota mensal)
    console.log("Sintetizando voz...");
    const ttsRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${voiceKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: script },
        voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B' }, // Voz Neural Masculina Premium
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    const ttsData = await ttsRes.json();
    if (!ttsData.audioContent) throw new Error("Falha no TTS Google");

    // 4. SALVA NO CACHE (Para o próximo usuário não gastar)
    // Converte base64 para ArrayBuffer para salvar
    const binaryString = atob(ttsData.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    await supabase.storage.from('media').upload(filename, bytes, { contentType: 'audio/mpeg' });
    const { data: newUrl } = await supabase.storage.from('media').createSignedUrl(filename, 3600);

    return new Response(JSON.stringify({ audioUrl: newUrl?.signedUrl }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});