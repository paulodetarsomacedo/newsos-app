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
      ['image', 'image']
    ],
  },
});

function fixImageUrl(url: string | null, siteUrl: string): string | null {
  if (!url) return null;
  
  let clean = url.trim().replace(/^['"]+|['"]+$/g, '').replace(/\s/g, '');
  if (!clean) return null;

  // CORREÇÃO: Trata URLs quebradas (Ex: http://site.comhttps://site.com)
  const httpsIndex = clean.lastIndexOf('https://');
  const httpIndex = clean.lastIndexOf('http://');
  const maxIndex = Math.max(httpsIndex, httpIndex);

  if (maxIndex > -1) {
      // Pega apenas a parte final da URL
      clean = clean.substring(maxIndex);
  }

  // Garante HTTPS
  if (clean.startsWith('//')) {
      return `https:${clean}`;
  } else if (clean.startsWith('http://')) {
      return clean.replace('http://', 'https://');
  }

  // Lógica original de resolver links relativos
  try {
      if (!siteUrl.startsWith('http')) siteUrl = `https://${siteUrl}`;
      return new URL(clean, siteUrl).href;
  } catch (e) {
      const cleanSite = siteUrl.replace(/\/$/, '');
      const cleanPath = clean.replace(/^\//, '');
      return `${cleanSite}/${cleanPath}`;
  }
}

function extractImageFromItem(item: any): string | null {
    if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
    if (item.mediaContent?.url) return item.mediaContent.url;
    if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
    if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;
    if (item.enclosure?.url && item.enclosure?.type?.startsWith('image')) return item.enclosure.url;

    // Confiando na tag <image> simples que Portal O Dia/Portal AZ usam
    if (item.image) {
        if (typeof item.image === 'string' && item.image.startsWith('http')) return item.image;
        if (item.image.url) return item.image.url;
    }

    let htmlContent = item.contentEncoded || item.content || item.description || "";
    if (!htmlContent) return null;

    if (htmlContent.includes('&lt;')) {
        htmlContent = htmlContent
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    }

    try {
        const doc = new DOMParser().parseFromString(htmlContent, "text/html");
        if (doc) {
            const images = doc.querySelectorAll('img');
            for (const img of images) {
                const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src');
                if (src && src.startsWith('http') && !src.includes('pixel') && !src.includes('gif') && !src.endsWith('.woff')) {
                    return src;
                }
            }
        }
    } catch (e) {}

    const match = htmlContent.match(/(https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp))/i);
    if (match && match[1]) return match[1];

    return null;
}

async function fetchOgImage(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3500);
        
        // Uso de User-Agent real para evitar bloqueios de meta tags
        const res = await fetch(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36)' },
            signal: controller.signal 
        });
        
        if (!res.ok) return null;
        const html = await res.text();
        
        const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

function extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
function repairXML(xml: string): string { return xml.replace(/&(?!(?:[a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});)/gi, '&amp;'); }

// --- COLE ESTA FUNÇÃO AUXILIAR ---
async function fetchYoutubeChannelAvatar(channelId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/channel/${channelId}`;
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}


// --- SUBSITUA A PARTIR DAQUI (LINHA 110 APROX.) ATÉ O FIM DO ARQUIVO ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let xmlText = "";
    let isSuccess = false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos limite

        const res = await fetch(url, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        // --- MOTOR DE DETECÇÃO DE ENCODING ---
        const buffer = await res.arrayBuffer();
        let decoder = new TextDecoder("utf-8");
        let tempText = decoder.decode(buffer);
        
        // Se o XML declarar explicitamente codificação Latin-1/ISO/Windows-1252, decodifica novamente com o formato correto
        if (
            tempText.includes('encoding="ISO-8859-1"') || 
            tempText.includes('encoding="iso-8859-1"') || 
            tempText.includes('encoding="windows-1252"') ||
            tempText.includes('encoding="Windows-1252"')
        ) {
            console.log(`[Encoding] Detectado ISO-8859-1 para ${url}. Re-decodificando...`);
            decoder = new TextDecoder("iso-8859-1");
            xmlText = decoder.decode(buffer);
        } else {
            xmlText = tempText;
        }
        
        isSuccess = true;
    } catch(e) {
        console.warn(`Fetch primário falhou para ${url}: ${e.message}. Tentando Proxy...`);
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        
        if (res.ok) {
            const json = await res.json();
            xmlText = json.contents;
            isSuccess = true;
        }
    }
    
    if (!isSuccess) throw new Error("Falha ao carregar XML: Bloqueado pelo site ou URL inválida.");

    const feed = await parser.parseString(repairXML(xmlText));
    let isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

   let feedLogo = feed.image?.url;
    
    // Se for YouTube, busca o avatar oficial via raspagem em nível de servidor (evitando bloqueios no navegador)
    if (isYoutube) {
       const channelId = url.match(/channel_id=([^&]+)/)?.[1] || url.match(/user=([^&]+)/)?.[1];
       if (channelId) {
          const scrapedAvatar = await fetchYoutubeChannelAvatar(channelId);
          if (scrapedAvatar) feedLogo = scrapedAvatar;
       }
    }
    if (!isYoutube && !feedLogo) {
       try {
         const domain = new URL(feed.link || url).hostname;
         feedLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
       } catch(e) {}
    }

    // --- PROTEÇÃO CONTRA ESTOURO DE MEMÓRIA ---
    // Limita estritamente o processamento de imagens e tags para no máximo 30 itens
    const MAX_ITEMS = 30;
    const itemsToProcess = feed.items.slice(0, MAX_ITEMS);

    const cleanItems = await Promise.all(itemsToProcess.map(async (item, index) => {
      let videoId = item.videoId || extractYoutubeId(item.link);
      let img = null;

      if (videoId) {
          isYoutube = true;
          img = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`; 
      } else {
          img = extractImageFromItem(item); 
          if (!img && item.link) {
              img = await fetchOgImage(item.link);
          }
          img = fixImageUrl(img, feed.link || url);
      }

      return {
        id: videoId || item.guid || item.link || String(index),
        title: item.title,
        link: item.link,
pubDate: item.pubDate || item.isoDate || null,
        img: img,
        videoId: videoId,
        description: item.description, 
        contentEncoded: item.contentEncoded, 
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