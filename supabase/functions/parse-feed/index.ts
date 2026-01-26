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

  const httpsIndex = clean.lastIndexOf('https://');
  const httpIndex = clean.lastIndexOf('http://');
  const maxIndex = Math.max(httpsIndex, httpIndex);

  if (maxIndex > -1) {
      return clean.substring(maxIndex);
  }

  if (clean.startsWith('//')) {
      return `https:${clean}`;
  }

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
        
        const res = await fetch(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
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

function extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
function repairXML(xml: string): string { return xml.replace(/&(?!(?:[a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});)/gi, '&amp;'); }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let xmlText = "";
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        xmlText = await res.text();
    } catch(e) {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        const json = await res.json();
        xmlText = json.contents;
    }

    const feed = await parser.parseString(repairXML(xmlText));
    let isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

    let feedLogo = feed.image?.url;
    if (!isYoutube && !feedLogo) {
       try {
         const domain = new URL(feed.link || url).hostname;
         feedLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
       } catch(e) {}
    }

    const cleanItems = await Promise.all(feed.items.map(async (item, index) => {
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

      // ==========================================================
      // === A MUDANÇA ESTÁ AQUI: OBJETO DE RETORNO ENXUTO ===
      // ==========================================================
      return {
        id: videoId || item.guid || item.link || String(index),
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        // CAMPO 'summary' E 'enclosure' REMOVIDOS PARA ECONOMIZAR EGRESS
        img: img,
        author: item.creator || feed.title, 
        videoId: videoId
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