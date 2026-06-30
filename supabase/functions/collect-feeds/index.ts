// ARQUIVO: supabase/functions/collect-feeds/index.ts
// Vetra — worker agregador opcional para coleta em lote.
// Uso recomendado: deploy na Supabase Edge Functions. O front continua tendo fallback por fonte.

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

const REQUEST_TIMEOUT_MS = 5200;
const OG_TIMEOUT_MS = 1300;
const DEFAULT_LIMIT = 32;
const MAX_LIMIT = 60;
const DEFAULT_CONCURRENCY = 5;

const parser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  customFields: {
    feed: [["image", "image"], ["itunes:image", "itunesImage"], ["logo", "logo"], ["icon", "icon"]],
    item: [
      ["yt:videoId", "videoId"],
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

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
}

function safeString(value: unknown): string { return String(value ?? "").trim(); }
function normalizeUrl(input: string): string { const v = safeString(input); if (!v) throw new Error("URL is required"); return /^https?:\/\//i.test(v) ? v : `https://${v}`; }
function isHttpUrl(value: string | null | undefined): boolean { return /^https?:\/\//i.test(String(value ?? "")); }
function getHostname(value: string): string { try { return new URL(value).hostname.replace(/^www\./i, ""); } catch { return value.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, ""); } }
function htmlDecode(input: string): string { return String(input || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&"); }
function stripTags(input: string): string { return htmlDecode(String(input || "")).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

function withTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function decoderFor(label: string): TextDecoder { try { return new TextDecoder(label); } catch { return new TextDecoder("iso-8859-1"); } }
function textBadness(text: string): number { return ((text.match(/\uFFFD/g) || []).length * 4) + ((text.match(/Ã.|Â.|â€|â€“|â€œ|â€/g) || []).length); }
function decodeBuffer(buffer: ArrayBuffer, contentType = ""): string {
  const firstUtf8 = new TextDecoder("utf-8").decode(buffer);
  const xmlEncoding = firstUtf8.match(/<\?xml[^>]+encoding=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
  const metaCharset = firstUtf8.match(/charset=["']?([a-zA-Z0-9_\-]+)["']?/i)?.[1]?.toLowerCase() || "";
  const headerCharset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || "";
  const charset = headerCharset || xmlEncoding || metaCharset;
  const latinCandidate = decoderFor("windows-1252").decode(buffer);
  if (/iso-8859-1|latin1|latin-1|windows-1252|cp1252/.test(charset)) return latinCandidate;
  if (textBadness(firstUtf8) > 0 && textBadness(latinCandidate) < textBadness(firstUtf8)) return latinCandidate;
  return firstUtf8;
}

async function fetchText(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
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
  return { finalUrl: response.url || url, contentType, text: decodeBuffer(buffer, contentType) };
}

function looksLikeXml(text: string, contentType = "", url = ""): boolean {
  const head = text.slice(0, 600).trim().toLowerCase();
  const ct = contentType.toLowerCase();
  if (ct.includes("rss") || ct.includes("atom") || ct.includes("xml")) return true;
  if (/\.(rss|xml|atom)(\?|#|$)/i.test(url)) return true;
  return head.startsWith("<?xml") || head.includes("<rss") || head.includes("<feed") || head.includes("<rdf:rdf");
}

function repairXML(xml: string): string { return String(xml || "").replace(/^\uFEFF/, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(/&(?!(?:[a-zA-Z0-9]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});)/g, "&amp;"); }
function absolutizeUrl(candidate: string | null | undefined, baseUrl: string): string | null { let clean = safeString(candidate).replace(/^["']+|["']+$/g, "").replace(/\s/g, ""); if (!clean) return null; const lh = clean.lastIndexOf("https://"); const lhttp = clean.lastIndexOf("http://"); const la = Math.max(lh, lhttp); if (la > 0) clean = clean.slice(la); if (clean.startsWith("//")) return `https:${clean}`; if (clean.startsWith("http://")) return clean.replace(/^http:\/\//i, "https://"); if (clean.startsWith("https://")) return clean; try { return new URL(clean, baseUrl).href; } catch { return null; } }
function getFromMaybeArray(value: any): any { return Array.isArray(value) ? value[0] : value; }
function extractUrlFromField(field: any): string | null { const value = getFromMaybeArray(field); if (!value) return null; if (typeof value === "string") return value; if (typeof value === "object") return value.url || value.href || value.$?.url || value.$?.href || null; return null; }
function bestFromSrcset(srcset: string | null): string | null { if (!srcset) return null; const candidates = srcset.split(",").map(p => p.trim().split(/\s+/)[0]).filter(Boolean); return candidates[candidates.length - 1] || null; }

function extractImageFromJsonLd(html: string): string | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw); const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        const image = item?.image || item?.thumbnailUrl || item?.logo;
        if (typeof image === "string") return image;
        if (Array.isArray(image) && image[0]) return typeof image[0] === "string" ? image[0] : image[0]?.url;
        if (image?.url) return image.url;
        const graph = item?.["@graph"];
        if (graph) for (const node of (Array.isArray(graph) ? graph : [graph])) {
          const img = node?.image || node?.thumbnailUrl;
          if (typeof img === "string") return img;
          if (Array.isArray(img) && img[0]) return typeof img[0] === "string" ? img[0] : img[0]?.url;
          if (img?.url) return img.url;
        }
      }
    } catch {}
  }
  return null;
}

function extractImageFromHtml(html: string): string | null {
  const content = htmlDecode(html || ""); if (!content) return null;
  const metaPatterns = [/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i];
  for (const pattern of metaPatterns) { const found = content.match(pattern)?.[1]; if (found) return found; }
  const jsonLd = extractImageFromJsonLd(content); if (jsonLd) return jsonLd;
  try {
    const doc = new DOMParser().parseFromString(content, "text/html");
    if (doc) {
      for (const source of doc.querySelectorAll("picture source, source")) { const src = bestFromSrcset(source.getAttribute("srcset") || source.getAttribute("data-srcset")); if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src)) return src; }
      for (const img of doc.querySelectorAll("img")) { const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src") || bestFromSrcset(img.getAttribute("srcset")) || img.getAttribute("src"); if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src)) return src; }
    }
  } catch {}
  return content.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/i)?.[0] || null;
}

function extractImageFromItem(item: any): string | null { return extractUrlFromField(item.mediaContent) || extractUrlFromField(item.mediaThumbnail) || extractUrlFromField(item.itunesImage) || (item.enclosure?.type?.startsWith?.("image") ? item.enclosure.url : null) || extractUrlFromField(item.image) || extractImageFromHtml(item.contentEncoded || item.content || item.description || item.summary || ""); }
async function fetchOgImage(url: string): Promise<string | null> { if (!isHttpUrl(url)) return null; try { const { text, finalUrl } = await fetchText(url, OG_TIMEOUT_MS); return absolutizeUrl(extractImageFromHtml(text.slice(0, 260000)), finalUrl || url); } catch { return null; } }
function getDomainLogo(url: string, title = "Fonte"): string { const domain = getHostname(url); return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&bold=true`; }
function extractFeedLogo(feed: any, baseUrl: string): string | null { const candidates = [extractUrlFromField(feed.image), extractUrlFromField(feed.itunesImage), extractUrlFromField(feed.logo), extractUrlFromField(feed.icon)]; for (const c of candidates) { const r = absolutizeUrl(c, feed.link || baseUrl); if (r) return r; } return null; }

function discoverFeedsFromHtml(html: string, pageUrl: string): string[] {
  const discovered: string[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc) for (const link of doc.querySelectorAll("link")) {
    const rel = (link.getAttribute("rel") || "").toLowerCase(); const type = (link.getAttribute("type") || "").toLowerCase(); const href = link.getAttribute("href") || "";
    if (rel.includes("alternate") && (type.includes("rss") || type.includes("atom") || type.includes("xml") || /rss|atom|feed/i.test(href))) { const resolved = absolutizeUrl(href, pageUrl); if (resolved && !discovered.includes(resolved)) discovered.push(resolved); }
  }
  const base = new URL(pageUrl); for (const path of ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml", "/index.xml"]) { const c = `${base.origin}${path}`; if (!discovered.includes(c)) discovered.push(c); }
  return discovered.slice(0, 10);
}

async function resolveFeedUrl(inputUrl: string) {
  const normalized = normalizeUrl(inputUrl);
  const first = await fetchText(normalized);
  if (looksLikeXml(first.text, first.contentType, first.finalUrl || normalized)) return { feedUrl: first.finalUrl || normalized, fetched: first };
  let lastError: unknown = null;
  for (const candidate of discoverFeedsFromHtml(first.text, first.finalUrl || normalized)) {
    try { const fetched = await fetchText(candidate); if (looksLikeXml(fetched.text, fetched.contentType, fetched.finalUrl || candidate)) return { feedUrl: fetched.finalUrl || candidate, fetched }; } catch (e) { lastError = e; }
  }
  throw lastError instanceof Error ? lastError : new Error("Nenhum feed encontrado");
}

function extractYoutubeId(url: string): string | null { const match = String(url || "").match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/); return match && match[2]?.length === 11 ? match[2] : null; }
function normalizeItem(item: any, index: number, feed: any, feedUrl: string, feedLogo: string | null, isYoutube: boolean, enrichImages: boolean) {
  const link = safeString(item.link || item.guid || item.id || ""); const videoId = safeString(item.videoId) || extractYoutubeId(link) || null; const title = stripTags(item.title || item.name || item.description || `Item ${index + 1}`); const rawDescription = item.contentEncoded || item.content || item.description || item.summary || item.mediaDescription || ""; const description = stripTags(rawDescription).slice(0, 500);
  let img: string | null = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : extractImageFromItem(item); img = absolutizeUrl(img, link || feed.link || feedUrl) || feedLogo;
  const enclosure = item.enclosure || null; let audioFile: string | null = null; if (enclosure?.url && /audio|mpeg|mp3|m4a|ogg/i.test(enclosure?.type || enclosure?.url)) audioFile = enclosure.url; if (!audioFile && /\.(mp3|m4a|ogg|aac)(\?|#|$)/i.test(link)) audioFile = link;
  const pubDate = item.pubDate || item.isoDate || item.published || item.updated || item.date || null;
  return { id: videoId || item.guid || item.id || link || `${feedUrl}#${index}`, title, link, pubDate, isoDate: item.isoDate || null, img, videoId, description, contentEncoded: item.contentEncoded || item.content || null, audioFile, category: Array.isArray(item.categories) ? item.categories[0] : (Array.isArray(item.category) ? item.category[0] : item.category || null), creator: item.creator || item.author || null, isYoutube: Boolean(videoId || isYoutube), _needsOg: enrichImages && (!img || img === feedLogo) && isHttpUrl(link) };
}

async function parseOneFeed(feedInput: any, options: { limit: number; enrichImages: boolean }) {
  const feedId = safeString(feedInput.id || feedInput.url || feedInput.name);
  const startedAt = Date.now();
  try {
    const { feedUrl, fetched } = await resolveFeedUrl(feedInput.url);
    const parsed = await parser.parseString(repairXML(fetched.text));
    const isYoutube = /youtube\.com|youtu\.be/i.test(feedUrl) || /youtube\.com|youtu\.be/i.test(parsed.link || "");
    let feedLogo = extractFeedLogo(parsed, parsed.link || feedUrl) || getDomainLogo(parsed.link || feedUrl, parsed.title || getHostname(feedUrl));
    const sourceItems = Array.isArray(parsed.items) ? parsed.items.slice(0, options.limit) : [];
    const items = await Promise.all(sourceItems.map(async (item, index) => {
      const normalized = normalizeItem(item, index, parsed, feedUrl, feedLogo, isYoutube, options.enrichImages);
      if (normalized._needsOg) normalized.img = await fetchOgImage(normalized.link);
      delete normalized._needsOg;
      if (!normalized.img) normalized.img = feedLogo;
      return normalized;
    }));
    return { feedId, ok: true, status: "ok", title: parsed.title || feedInput.name || getHostname(parsed.link || feedUrl), link: parsed.link || feedUrl, feedUrl, image: feedLogo, isYoutube, items: items.filter(item => item.title || item.link), elapsedMs: Date.now() - startedAt };
  } catch (error) {
    return { feedId, ok: false, status: "error", title: feedInput.name || null, image: feedInput.logo || null, isYoutube: false, items: [], error: error instanceof Error ? error.message : "Falha temporária", elapsedMs: Date.now() - startedAt };
  }
}

async function runPool<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0; const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => { while (cursor < items.length) { const i = cursor++; await worker(items[i], i); } }); await Promise.allSettled(workers);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const feeds = Array.isArray(body.feeds) ? body.feeds.filter((feed: any) => safeString(feed?.url)) : [];
    if (!feeds.length) return jsonResponse({ error: "feeds[] is required", sources: [], articles: [] }, 400);
    const limit = Math.max(1, Math.min(Number(body.limit || DEFAULT_LIMIT), MAX_LIMIT));
    const concurrency = Math.max(1, Math.min(Number(body.concurrency || DEFAULT_CONCURRENCY), 8));
    const enrichImages = body.enrichImages === true;
    const startedAt = Date.now();
    const sources: any[] = [];
    await runPool(feeds, concurrency, async (feed) => { sources.push(await parseOneFeed(feed, { limit, enrichImages })); });
    const articles = sources.flatMap(source => (source.items || []).map((item: any) => ({ ...item, feedId: source.feedId, sourceTitle: source.title, sourceLogo: source.image, sourceLink: source.link, sourceStatus: source.status })));
    return jsonResponse({ ok: true, sources, articles, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido", sources: [], articles: [] }, 200);
  }
});
