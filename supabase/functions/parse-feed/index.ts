// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Parser from "npm:rss-parser@3.13.0";
// @ts-ignore
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração do Parser
const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['yt:videoId', 'videoId'],
      ['media:group', 'mediaGroup'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['content', 'content'],
      ['description', 'description'],
      ['image', 'image'] // Suporte para GP1
    ],
  },
});

// --- FUNÇÃO 1: CORREÇÃO DE URL BLINDADA (AQUI ESTAVA O ERRO) ---
function fixImageUrl(url: string | null, siteUrl: string): string | null {
  if (!url) return null;
  
  // 1. Limpeza básica
  let clean = url.trim().replace(/^['"]+|['"]+$/g, '').replace(/\s/g, '');

  if (!clean) return null;

  // 2. CORREÇÃO "NUCLEAR": Encontra a última ocorrência de http/https
  // Se o link for "http://site.comhttps://site.com/img.jpg", isso pega o segundo http.
  // Se o link for normal "https://site.com/img.jpg", pega do início.
  const httpsIndex = clean.lastIndexOf('https://');
  const httpIndex = clean.lastIndexOf('http://');
  const maxIndex = Math.max(httpsIndex, httpIndex);

  if (maxIndex > -1) {
      // Corta tudo que estiver antes do último protocolo encontrado
      return clean.substring(maxIndex);
  }

  // 3. Resolve links que começam com // (protocol relative)
  if (clean.startsWith('//')) {
      return `https:${clean}`;
  }

  // 4. Resolve links relativos (ex: /uploads/foto.jpg)
  try {
      if (!siteUrl.startsWith('http')) siteUrl = `https://${siteUrl}`;
      return new URL(clean, siteUrl).href;
  } catch (e) {
      // Fallback final
      const cleanSite = siteUrl.replace(/\/$/, '');
      const cleanPath = clean.replace(/^\//, '');
      return `${cleanSite}/${cleanPath}`;
  }
}

// --- FUNÇÃO 2: EXTRATOR DE IMAGENS (COM DECODIFICAÇÃO DE HTML) ---
function extractImageFromItem(item: any): string | null {
    // 1. Tenta tags padrões de RSS/Media
    if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
    if (item.mediaContent?.url) return item.mediaContent.url;
    if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
    if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;
    if (item.enclosure?.url && item.enclosure?.type?.startsWith('image')) return item.enclosure.url;

    // 2. Tag image direta
    if (item.image) {
        if (typeof item.image === 'string' && item.image.startsWith('http')) return item.image;
        if (item.image.url) return item.image.url;
    }

    // 3. Preparação do Conteúdo HTML
    let htmlContent = item.contentEncoded || item.content || item.description || "";
    if (!htmlContent) return null;

    // Decodifica HTML Entities
    if (htmlContent.includes('&lt;')) {
        htmlContent = htmlContent
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    }

    // A. Busca com DOM Parser (Mais preciso)
    try {
        const doc = new DOMParser().parseFromString(htmlContent, "text/html");
        if (doc) {
            const images = doc.querySelectorAll('img');
            for (const img of images) {
                // Tenta pegar a imagem real em atributos de Lazy Load primeiro
                const src = img.getAttribute('data-src') || 
                            img.getAttribute('data-original') || 
                            img.getAttribute('data-url') || 
                            img.getAttribute('src');

                // Filtros de qualidade e EXTENSÃO (Aqui bloqueamos woff/ttf se aparecerem por engano)
                if (src && src.startsWith('http') && 
                    !src.includes('pixel') && !src.includes('gif') && !src.includes('emoji') &&
                    !src.endsWith('.woff') && !src.endsWith('.ttf') && !src.endsWith('.css')) {
                    return src;
                }
            }
        }
    } catch (e) {}

    // B. Busca com Regex (Força Bruta)
    // Procura links http que terminem OBRIGATORIAMENTE em extensões de imagem
    const match = htmlContent.match(/(https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp))/i);
    if (match && match[1]) return match[1];

    return null;
}

// --- FUNÇÃO 3: SCRAPING LEVE (IMAGE HEALING) ---
async function fetchOgImage(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3500); // 3.5s timeout
        
        const res = await fetch(url, { 
            headers: { 
                // Finge ser Chrome para evitar bloqueio do Cidade Verde
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            },
            signal: controller.signal 
        });
        
        if (!res.ok) return null;
        const html = await res.text();
        
        const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// --- OUTROS ---
function extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
function repairXML(xml: string): string { return xml.replace(/&(?!(?:[a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});)/gi, '&amp;'); }

// --- HANDLER PRINCIPAL ---

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    // 1. Baixa o Feed
    let xmlText = "";
    try {
        const res = await fetch(url, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; NewsReader/1.0)' }
        });
        xmlText = await res.text();
    } catch(e) {
        // Fallback Proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        const json = await res.json();
        xmlText = json.contents;
    }

    // 2. Parse XML
    const feed = await parser.parseString(repairXML(xmlText));
    let isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

    let feedLogo = feed.image?.url;
    if (!isYoutube && !feedLogo) {
       try {
         const domain = new URL(feed.link || url).hostname;
         feedLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
       } catch(e) {}
    }

    // 3. Processa Itens em Paralelo
    const cleanItems = await Promise.all(feed.items.map(async (item, index) => {
      let videoId = item.videoId;
      if (!videoId && (item.link?.includes('youtube.com') || item.link?.includes('youtu.be'))) {
          videoId = extractYoutubeId(item.link);
      }

      let img = null;
      let origin = 'rss';
      let category = 'Geral';

      if (videoId) {
          origin = 'youtube';
          category = 'Vídeo';
          isYoutube = true;
          img = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`; 
      } else {
          // Tenta extrair do RSS/HTML
          img = extractImageFromItem(item); 
          
          // Se falhou, tenta ir na página original (Image Healing)
          if (!img && item.link) {
              img = await fetchOgImage(item.link);
          }

          // CORREÇÃO CRÍTICA AQUI:
          // A função fixImageUrl agora é segura contra duplicação
          img = fixImageUrl(img, feed.link || url);
      }

      return {
        id: videoId || item.guid || item.link || String(index),
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        summary: item.contentSnippet || "", 
        img: img,
        author: item.creator || feed.title, 
        origin: origin,
        category: category,
        videoId: videoId,
        enclosure: item.enclosure,
        audio: item.enclosure?.url 
      };
    }));

    return new Response(JSON.stringify({
      title: feed.title,
      image: feedLogo,
      items: cleanItems,
      isYoutube: isYoutube 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});