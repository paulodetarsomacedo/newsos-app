// ARQUIVO: supabase/functions/parse-feed/index.ts
// Vetra — parser RSS/Atom robusto com descoberta de feeds, encoding BR, logos e timeout por etapa.

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Parser from "npm:rss-parser@3.13.0";
// @ts-ignore
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REQUEST_TIMEOUT_MS = 3500;
const OG_TIMEOUT_MS = 1000;
const MAX_ITEMS_DEFAULT = 30;
const MAX_ITEMS_BRIEF = 12;

const parser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  customFields: {
    feed: [
      ["image", "image"],
      ["itunes:image", "itunesImage"],
      ["media:thumbnail", "mediaThumbnail"],
      ["logo", "logo"],
      ["icon", "icon"],
      ["subtitle", "subtitle"],
    ],
    item: [
      ["yt:videoId", "videoId"],
      ["media:group", "mediaGroup"],
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["media:description", "mediaDescription"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
      ["content", "content"],
      ["description", "description"],
      ["summary", "summary"],
      ["image", "image"],
      ["itunes:image", "itunesImage"],
      ["dc:creator", "creator"],
      ["category", "category"],
    ],
  },
});

type FetchResult = {
  finalUrl: string;
  contentType: string;
  text: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeUrl(input: string): string {
  const value = safeString(input);
  if (!value) throw new Error("URL is required");
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function isHttpUrl(value: string | null | undefined): boolean {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function getHostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return value.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "");
  }
}

function withTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function decodeBuffer(buffer: ArrayBuffer, contentType = ""): string {
  const firstUtf8 = new TextDecoder("utf-8").decode(buffer);
  const xmlEncoding = firstUtf8.match(/<\?xml[^>]+encoding=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
  const metaCharset = firstUtf8.match(/charset=["']?([a-zA-Z0-9_\-]+)["']?/i)?.[1]?.toLowerCase() || "";
  const headerCharset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || "";
  const charset = headerCharset || xmlEncoding || metaCharset;

  if (charset.includes("iso-8859-1") || charset.includes("latin1") || charset.includes("latin-1") || charset.includes("windows-1252")) {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
  return firstUtf8;
}

async function fetchText(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 VetraBot/1.0",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
    cache: "no-store",
    redirect: "follow",
    signal: withTimeoutSignal(timeoutMs),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  const buffer = await response.arrayBuffer();
  return {
    finalUrl: response.url || url,
    contentType,
    text: decodeBuffer(buffer, contentType),
  };
}

async function fetchTextWithFallback(url: string): Promise<FetchResult> {
  try {
    return await fetchText(url);
  } catch (primaryError) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    try {
      const proxied = await fetchText(proxyUrl, 1800);
      return { ...proxied, finalUrl: url };
    } catch (_proxyError) {
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao carregar URL");
    }
  }
}

function looksLikeXml(text: string, contentType = "", url = ""): boolean {
  const head = text.slice(0, 600).trim().toLowerCase();
  const ct = contentType.toLowerCase();
  if (ct.includes("rss") || ct.includes("atom") || ct.includes("xml")) return true;
  if (/\.(rss|xml|atom)(\?|#|$)/i.test(url)) return true;
  return head.startsWith("<?xml") || head.includes("<rss") || head.includes("<feed") || head.includes("<rdf:rdf");
}

function repairXML(xml: string): string {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&(?!(?:[a-zA-Z0-9]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});)/g, "&amp;");
}

function absolutizeUrl(candidate: string | null | undefined, baseUrl: string): string | null {
  let clean = safeString(candidate)
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s/g, "");
  if (!clean) return null;

  const lastHttps = clean.lastIndexOf("https://");
  const lastHttp = clean.lastIndexOf("http://");
  const lastAbsolute = Math.max(lastHttps, lastHttp);
  if (lastAbsolute > 0) clean = clean.slice(lastAbsolute);

  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("http://")) return clean.replace(/^http:\/\//i, "https://");
  if (clean.startsWith("https://")) return clean;

  try {
    return new URL(clean, baseUrl).href;
  } catch {
    return null;
  }
}

function htmlDecode(input: string): string {
  return String(input || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripTags(input: string): string {
  return htmlDecode(String(input || ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFromMaybeArray(value: any): any {
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractUrlFromField(field: any): string | null {
  const value = getFromMaybeArray(field);
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.url || value.href || value.$?.url || value.$?.href || null;
  }
  return null;
}

function extractImageFromHtml(html: string): string | null {
  let content = htmlDecode(html || "");
  if (!content) return null;

  try {
    const doc = new DOMParser().parseFromString(content, "text/html");
    if (doc) {
      const images = doc.querySelectorAll("img");
      for (const img of images) {
        const src = img.getAttribute("data-src") ||
          img.getAttribute("data-original") ||
          img.getAttribute("data-lazy-src") ||
          img.getAttribute("src");
        if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src)) return src;
      }
    }
  } catch (_e) {}

  const match = content.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/i);
  return match?.[0] || null;
}

function extractImageFromItem(item: any): string | null {
  return extractUrlFromField(item.mediaContent) ||
    extractUrlFromField(item.mediaThumbnail) ||
    extractUrlFromField(item.itunesImage) ||
    (item.enclosure?.type?.startsWith?.("image") ? item.enclosure.url : null) ||
    extractUrlFromField(item.image) ||
    extractImageFromHtml(item.contentEncoded || item.content || item.description || item.summary || "");
}

async function fetchOgImage(url: string): Promise<string | null> {
  if (!isHttpUrl(url)) return null;
  try {
    const { text, finalUrl } = await fetchText(url, OG_TIMEOUT_MS);
    const html = text.slice(0, 220000);
    const metaPatterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    for (const pattern of metaPatterns) {
      const found = html.match(pattern)?.[1];
      const resolved = absolutizeUrl(found, finalUrl || url);
      if (resolved) return resolved;
    }
    return null;
  } catch (_e) {
    return null;
  }
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2]?.length === 11 ? match[2] : null;
}

function detectYoutubeChannelId(url: string): string | null {
  return url.match(/channel_id=([^&]+)/)?.[1] ||
    url.match(/\/channel\/([^/?#]+)/)?.[1] ||
    url.match(/user=([^&]+)/)?.[1] ||
    null;
}

async function fetchYoutubeChannelAvatar(channelId: string): Promise<string | null> {
  if (!channelId) return null;
  try {
    const url = /^UC/.test(channelId) ? `https://www.youtube.com/channel/${channelId}` : `https://www.youtube.com/user/${channelId}`;
    const { text } = await fetchText(url, OG_TIMEOUT_MS);
    return text.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() || null;
  } catch (_e) {
    return null;
  }
}

function getDomainLogo(url: string, title = "Fonte"): string {
  const domain = getHostname(url);
  if (domain) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&bold=true`;
}

function extractFeedLogo(feed: any, baseUrl: string): string | null {
  const candidates = [
    extractUrlFromField(feed.image),
    extractUrlFromField(feed.itunesImage),
    extractUrlFromField(feed.mediaThumbnail),
    extractUrlFromField(feed.logo),
    extractUrlFromField(feed.icon),
  ];

  for (const candidate of candidates) {
    const resolved = absolutizeUrl(candidate, feed.link || baseUrl);
    if (resolved) return resolved;
  }
  return null;
}

function discoverFeedsFromHtml(html: string, pageUrl: string): string[] {
  const discovered: string[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc) {
    const links = doc.querySelectorAll("link");
    for (const link of links) {
      const rel = (link.getAttribute("rel") || "").toLowerCase();
      const type = (link.getAttribute("type") || "").toLowerCase();
      const href = link.getAttribute("href") || "";
      const isFeed = rel.includes("alternate") && (
        type.includes("rss") || type.includes("atom") || type.includes("xml") || /rss|atom|feed/i.test(href)
      );
      if (isFeed) {
        const resolved = absolutizeUrl(href, pageUrl);
        if (resolved && !discovered.includes(resolved)) discovered.push(resolved);
      }
    }
  }

  const base = new URL(pageUrl);
  const heuristicPaths = ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml", "/index.xml"];
  for (const path of heuristicPaths) {
    const candidate = `${base.origin}${path}`;
    if (!discovered.includes(candidate)) discovered.push(candidate);
  }
  return discovered.slice(0, 10);
}

async function resolveFeedUrl(inputUrl: string, forceDiscover = false): Promise<{ feedUrl: string; fetched: FetchResult }> {
  const normalized = normalizeUrl(inputUrl);
  const first = await fetchTextWithFallback(normalized);

  if (!forceDiscover && looksLikeXml(first.text, first.contentType, first.finalUrl || normalized)) {
    return { feedUrl: first.finalUrl || normalized, fetched: first };
  }

  const candidates = discoverFeedsFromHtml(first.text, first.finalUrl || normalized);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const fetched = await fetchTextWithFallback(candidate);
      if (looksLikeXml(fetched.text, fetched.contentType, fetched.finalUrl || candidate)) {
        return { feedUrl: fetched.finalUrl || candidate, fetched };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!forceDiscover && looksLikeXml(first.text, first.contentType, normalized)) return { feedUrl: normalized, fetched: first };
  throw lastError instanceof Error ? lastError : new Error("Nenhum feed RSS/Atom encontrado nessa URL.");
}

function normalizeItem(item: any, index: number, feed: any, feedUrl: string, feedLogo: string | null, isYoutubeFeed: boolean) {
  const link = safeString(item.link || item.guid || item.id || "");
  const videoId = safeString(item.videoId) || extractYoutubeId(link) || null;
  const title = stripTags(item.title || item.name || item.description || `Item ${index + 1}`);
  const rawDescription = item.contentEncoded || item.content || item.description || item.summary || item.mediaDescription || "";
  const description = stripTags(rawDescription).slice(0, 500);

  let img: string | null = null;
  if (videoId) img = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  if (!img) img = extractImageFromItem(item);
  img = absolutizeUrl(img, link || feed.link || feedUrl) || feedLogo;

  let audioFile: string | null = null;
  const enclosure = item.enclosure || null;
  if (enclosure?.url && /audio|mpeg|mp3|m4a|ogg/i.test(enclosure?.type || enclosure?.url)) audioFile = enclosure.url;
  if (!audioFile && /\.(mp3|m4a|ogg|aac)(\?|#|$)/i.test(link)) audioFile = link;

  const pubDate = item.pubDate || item.isoDate || item.published || item.updated || item.date || null;

  return {
    id: videoId || item.guid || item.id || link || `${feedUrl}#${index}`,
    title,
    link,
    pubDate,
    isoDate: item.isoDate || null,
    img,
    videoId,
    description,
    contentEncoded: item.contentEncoded || item.content || null,
    audioFile,
    category: Array.isArray(item.categories) ? item.categories[0] : (Array.isArray(item.category) ? item.category[0] : item.category || null),
    creator: item.creator || item.author || null,
    isYoutube: Boolean(videoId || isYoutubeFeed),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const inputUrl = safeString(body.url);
    const forceDiscover = body.type === "discover" || body.discover === true;
    const brief = body.brief === true;
    if (!inputUrl) return jsonResponse({ error: "URL is required" }, 400);

    const { feedUrl, fetched } = await resolveFeedUrl(inputUrl, forceDiscover);
    const repairedXml = repairXML(fetched.text);
    const feed = await parser.parseString(repairedXml);

    const isYoutube = /youtube\.com|youtu\.be/i.test(feedUrl) || /youtube\.com|youtu\.be/i.test(feed.link || "");
    let feedLogo = extractFeedLogo(feed, feed.link || feedUrl);

    if (isYoutube && !feedLogo) {
      const channelId = detectYoutubeChannelId(feedUrl) || detectYoutubeChannelId(feed.link || "");
      if (channelId) feedLogo = await fetchYoutubeChannelAvatar(channelId);
    }
    if (!feedLogo) feedLogo = getDomainLogo(feed.link || feedUrl, feed.title || getHostname(feedUrl));

    const limit = brief ? MAX_ITEMS_BRIEF : MAX_ITEMS_DEFAULT;
    const sourceItems = Array.isArray(feed.items) ? feed.items.slice(0, limit) : [];

    const normalizedItems = await Promise.all(sourceItems.map(async (item, index) => {
      const normalized = normalizeItem(item, index, feed, feedUrl, feedLogo, isYoutube);
      if (!normalized.img && normalized.link && !brief) {
        normalized.img = await fetchOgImage(normalized.link);
      }
      if (!normalized.img) normalized.img = feedLogo;
      return normalized;
    }));

    return jsonResponse({
      title: feed.title || getHostname(feed.link || feedUrl),
      description: feed.description || feed.subtitle || null,
      link: feed.link || feedUrl,
      feedUrl,
      image: feedLogo,
      items: normalizedItems.filter(item => item.title || item.link),
      isYoutube,
      discovered: forceDiscover ? feedUrl : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no parser";
    console.error("parse-feed error:", message);
    return jsonResponse({ error: message, items: [], title: null, image: null, isYoutube: false }, 200);
  }
});
