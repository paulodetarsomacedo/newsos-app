// ARQUIVO: supabase/functions/collect-feeds/index.ts
// Vetra Recovery Engine — worker agregador forte para RSS/Atom + descoberta + scrape HTML leve.
// Objetivo: cada fonte cadastrada retorna status e, quando possível, itens úteis sem travar o app inteiro.

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
const ARTICLE_TIMEOUT_MS = 2200;
const DEFAULT_LIMIT = 42;
const MAX_LIMIT = 70;
const DEFAULT_CONCURRENCY = 6;
const MAX_OG_PER_SOURCE = 8;

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

type FetchResult = { finalUrl: string; contentType: string; text: string };
type FeedInput = { id?: string; name?: string; url: string; logo?: string; category?: string; type?: string };

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeString(value: unknown): string { return String(value ?? "").trim(); }
function normalizeUrl(input: string): string { const v = safeString(input); if (!v) throw new Error("URL is required"); return /^https?:\/\//i.test(v) ? v : `https://${v}`; }
function isHttpUrl(value: string | null | undefined): boolean { return /^https?:\/\//i.test(String(value ?? "")); }
function normalizeKey(value: unknown): string { return safeString(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function getHostname(value: string): string { try { return new URL(normalizeUrl(value)).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return safeString(value).replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "").toLowerCase(); } }

function withTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function decoderFor(label: string): TextDecoder { try { return new TextDecoder(label); } catch { return new TextDecoder("iso-8859-1"); } }
function textBadness(text: string): number { return ((text.match(/\uFFFD/g) || []).length * 5) + ((text.match(/Ã.|Â.|â€|â€“|â€œ|â€/g) || []).length); }
function decodeBuffer(buffer: ArrayBuffer, contentType = ""): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  const xmlEncoding = utf8.match(/<\?xml[^>]+encoding=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
  const metaCharset = utf8.match(/charset=["']?([a-zA-Z0-9_\-]+)["']?/i)?.[1]?.toLowerCase() || "";
  const headerCharset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || "";
  const charset = headerCharset || xmlEncoding || metaCharset;
  const latin = decoderFor("windows-1252").decode(buffer);
  if (/iso-8859-1|latin1|latin-1|windows-1252|cp1252/.test(charset)) return latin;
  if (textBadness(utf8) > 0 && textBadness(latin) < textBadness(utf8)) return latin;
  return utf8;
}

async function fetchText(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 VetraBot/1.0",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
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

function htmlDecode(input: string): string {
  return String(input || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function stripTags(input: string, max = 500): string {
  return htmlDecode(String(input || ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function repairXML(xml: string): string {
  return String(xml || "").replace(/^\uFEFF/, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(/&(?!(?:[a-zA-Z0-9]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});)/g, "&amp;");
}
function looksLikeXml(text: string, contentType = "", url = ""): boolean {
  const head = text.slice(0, 800).trim().toLowerCase(); const ct = contentType.toLowerCase();
  if (ct.includes("rss") || ct.includes("atom") || ct.includes("xml")) return true;
  if (/\.(rss|xml|atom)(\?|#|$)/i.test(url)) return true;
  return head.startsWith("<?xml") || head.includes("<rss") || head.includes("<feed") || head.includes("<rdf:rdf");
}
function absolutizeUrl(candidate: string | null | undefined, baseUrl: string): string | null {
  let clean = safeString(candidate).replace(/^["']+|["']+$/g, "").replace(/\s/g, "");
  if (!clean) return null;
  const lastHttps = clean.lastIndexOf("https://"); const lastHttp = clean.lastIndexOf("http://"); const lastAbs = Math.max(lastHttps, lastHttp);
  if (lastAbs > 0) clean = clean.slice(lastAbs);
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("http://")) return clean.replace(/^http:\/\//i, "https://");
  if (clean.startsWith("https://")) return clean;
  try { return new URL(clean, baseUrl).href; } catch { return null; }
}
function getFromMaybeArray(value: any): any { return Array.isArray(value) ? value[0] : value; }
function extractUrlFromField(field: any): string | null {
  const value = getFromMaybeArray(field); if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.url || value.href || value.$?.url || value.$?.href || null;
  return null;
}
function bestFromSrcset(srcset: string | null): string | null { if (!srcset) return null; const c = srcset.split(",").map(p => p.trim().split(/\s+/)[0]).filter(Boolean); return c[c.length - 1] || null; }

function extractImageFromJsonLd(html: string): string | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw); const list = Array.isArray(parsed) ? parsed : [parsed];
      const stack = [...list];
      while (stack.length) {
        const item = stack.shift(); if (!item || typeof item !== "object") continue;
        const image = item.image || item.thumbnailUrl || item.logo;
        if (typeof image === "string") return image;
        if (Array.isArray(image) && image[0]) return typeof image[0] === "string" ? image[0] : image[0]?.url;
        if (image?.url) return image.url;
        const graph = item["@graph"]; if (graph) stack.push(...(Array.isArray(graph) ? graph : [graph]));
      }
    } catch (_e) {}
  }
  return null;
}

function extractImageFromHtml(html: string): string | null {
  const content = htmlDecode(html || ""); if (!content) return null;
  const metaPatterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const pattern of metaPatterns) { const found = content.match(pattern)?.[1]; if (found) return found; }
  const jsonLd = extractImageFromJsonLd(content); if (jsonLd) return jsonLd;
  try {
    const doc = new DOMParser().parseFromString(content, "text/html");
    if (doc) {
      for (const source of doc.querySelectorAll("picture source, source")) {
        const src = bestFromSrcset(source.getAttribute("srcset") || source.getAttribute("data-srcset"));
        if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src)) return src;
      }
      for (const img of doc.querySelectorAll("img")) {
        const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src") || img.getAttribute("data-srcset") || bestFromSrcset(img.getAttribute("srcset")) || img.getAttribute("src");
        const width = Number(img.getAttribute("width") || 0); const height = Number(img.getAttribute("height") || 0);
        if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src) && (!width || width >= 96) && (!height || height >= 64)) return src;
      }
    }
  } catch (_e) {}
  return content.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/i)?.[0] || null;
}
function extractImageFromItem(item: any): string | null {
  const enclosure = getFromMaybeArray(item.enclosure);
  return extractUrlFromField(item.mediaContent) || extractUrlFromField(item.mediaThumbnail) || extractUrlFromField(item.itunesImage) ||
    (enclosure?.url && /image/i.test(enclosure?.type || enclosure?.url) ? enclosure.url : null) || extractUrlFromField(item.image) ||
    extractImageFromHtml(item.contentEncoded || item.content || item.description || item.summary || "");
}
async function fetchOgImage(url: string): Promise<string | null> {
  if (!isHttpUrl(url)) return null;
  try { const { text, finalUrl } = await fetchText(url, ARTICLE_TIMEOUT_MS); return absolutizeUrl(extractImageFromHtml(text.slice(0, 360000)), finalUrl || url); } catch { return null; }
}

const LOGO_OVERRIDES: Array<{ key: string; domains: string[]; logo: string }> = [
  { key: "jovem pan", domains: ["jovempan.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://jovempan.com.br&sz=128" },
  { key: "g1", domains: ["g1.globo.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://g1.globo.com&sz=128" },
  { key: "uol", domains: ["uol.com.br", "rss.uol.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://www.uol.com.br&sz=128" },
  { key: "sbt", domains: ["sbtnews.sbt.com.br", "sbt.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://sbtnews.sbt.com.br&sz=128" },
  { key: "r7", domains: ["r7.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://www.r7.com&sz=128" },
  { key: "istoe dinheiro", domains: ["istoedinheiro.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://istoedinheiro.com.br&sz=128" },
  { key: "istoe", domains: ["istoe.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://istoe.com.br&sz=128" },
  { key: "band", domains: ["band.uol.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://www.band.uol.com.br&sz=128" },
  { key: "180graus", domains: ["180graus.com", "180graus.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://180graus.com&sz=128" },
  { key: "piaui hoje", domains: ["piauihoje.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://piauihoje.com.br&sz=128" },
  { key: "valor investe", domains: ["valorinveste.globo.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://valorinveste.globo.com&sz=128" },
  { key: "exame", domains: ["exame.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://exame.com&sz=128" },
  { key: "gp1", domains: ["gp1.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://gp1.com.br&sz=128" },
  { key: "noticias ao minuto", domains: ["noticiasaominuto.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://noticiasaominuto.com.br&sz=128" },
  { key: "terra", domains: ["terra.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://terra.com.br&sz=128" },
  { key: "exame invest", domains: ["exame.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://exame.com&sz=128" },
];
function getDomainLogo(url: string, title = "Fonte"): string {
  const domain = getHostname(url);
  const key = normalizeKey(`${title} ${domain}`);
  const override = LOGO_OVERRIDES.find(o => o.domains.some(d => domain.includes(d)) || key.includes(o.key));
  if (override) return override.logo;
  return domain ? `https://www.google.com/s2/favicons?domain_url=https://${encodeURIComponent(domain)}&sz=128` : `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&bold=true`;
}
function extractFeedLogo(feed: any, baseUrl: string): string | null {
  const candidates = [extractUrlFromField(feed.image), extractUrlFromField(feed.itunesImage), extractUrlFromField(feed.mediaThumbnail), extractUrlFromField(feed.logo), extractUrlFromField(feed.icon)];
  for (const c of candidates) { const r = absolutizeUrl(c, feed.link || baseUrl); if (r && !r.includes("t0.gstatic.com")) return r; }
  return null;
}

function candidateUrlsForFeed(feed: FeedInput): string[] {
  const url = normalizeUrl(feed.url);
  const host = getHostname(url);
  const name = normalizeKey(feed.name || "");
  const list: string[] = [url];
  const add = (v: string) => { if (v && !list.includes(v)) list.push(v); };
  if (host.includes("uol.com.br") || name.includes("uol")) {
    if (name.includes("economia") || url.includes("economia")) add("https://rss.uol.com.br/feed/economia.xml");
    add("https://rss.uol.com.br/feed/noticias.xml");
    add("https://rss.uol.com.br/feed/ultimas.xml");
    add("https://noticias.uol.com.br/ultimas-noticias/rss.xml");
    add("https://economia.uol.com.br/ultimas-noticias/rss.xml");
  }
  if (host.includes("sbt") || name.includes("sbt")) {
    add("https://sbtnews.sbt.com.br/feed"); add("https://sbtnews.sbt.com.br/rss"); add("https://www.sbtnews.com.br/feed");
    add("https://sbtnews.sbt.com.br/noticias/feed"); add("https://sbtnews.sbt.com.br/ultimas-noticias/feed"); add("https://sbtnews.sbt.com.br/");
  }
  if (host.includes("r7.com") || name.includes("r7")) {
    add("https://noticias.r7.com/feed.xml"); add("https://noticias.r7.com/feed"); add("https://www.r7.com/rss.xml"); add("https://www.r7.com/");
  }
  if (host.includes("istoe") || name.includes("istoe")) {
    if (host.includes("istoedinheiro") || name.includes("dinheiro")) add("https://istoedinheiro.com.br/feed/");
    add("https://istoe.com.br/feed/"); add("https://istoedinheiro.com.br/"); add("https://istoe.com.br/");
  }
  if (host.includes("jovempan") || name.includes("jovem pan")) { add("https://jovempan.com.br/feed"); add("https://jovempan.com.br/noticias/feed"); add("https://jovempan.com.br/"); }
  if (host.includes("g1.globo.com") || name.includes("g1")) { add("https://g1.globo.com/rss/g1/"); add("https://g1.globo.com/rss/g1/brasil/"); add("https://g1.globo.com/"); }
  if (host.includes("band.uol") || name.includes("band")) { add("https://www.band.uol.com.br/rss.xml"); add("https://www.band.uol.com.br/"); }
  if (host) { add(`https://${host}/feed`); add(`https://${host}/feed/`); add(`https://${host}/rss`); add(`https://${host}/rss.xml`); }
  return list.slice(0, 14);
}

function discoverFeedsFromHtml(html: string, pageUrl: string): string[] {
  const discovered: string[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc) {
    for (const link of doc.querySelectorAll("link")) {
      const rel = (link.getAttribute("rel") || "").toLowerCase(); const type = (link.getAttribute("type") || "").toLowerCase(); const href = link.getAttribute("href") || "";
      if (rel.includes("alternate") && (type.includes("rss") || type.includes("atom") || type.includes("xml") || /rss|atom|feed/i.test(href))) {
        const resolved = absolutizeUrl(href, pageUrl); if (resolved && !discovered.includes(resolved)) discovered.push(resolved);
      }
    }
  }
  return discovered.slice(0, 12);
}

function localText(node: any, names: string[]): string {
  const wanted = names.map(n => n.toLowerCase());
  const children = Array.from(node?.children || []);
  for (const child of children) {
    const tag = String((child as any).tagName || (child as any).nodeName || "").toLowerCase();
    const local = String((child as any).localName || "").toLowerCase();
    if (wanted.includes(tag) || wanted.includes(local) || wanted.includes(tag.split(":").pop() || "")) return safeString((child as any).textContent);
  }
  return "";
}
function localAttr(node: any, names: string[], attr: string): string {
  const wanted = names.map(n => n.toLowerCase());
  const children = Array.from(node?.children || []);
  for (const child of children) {
    const tag = String((child as any).tagName || (child as any).nodeName || "").toLowerCase();
    const local = String((child as any).localName || "").toLowerCase();
    if (wanted.includes(tag) || wanted.includes(local) || wanted.includes(tag.split(":").pop() || "")) return safeString((child as any).getAttribute?.(attr));
  }
  return "";
}
function manualParseXml(xml: string, feedUrl: string, feedInput: FeedInput, limit: number) {
  const doc = new DOMParser().parseFromString(repairXML(xml), "text/xml"); if (!doc) return null;
  const parserError = doc.querySelector("parsererror"); if (parserError) return null;
  const channel = doc.querySelector("channel") || doc.querySelector("feed") || doc;
  const title = localText(channel, ["title"]) || feedInput.name || getHostname(feedUrl);
  const link = localText(channel, ["link"]) || localAttr(channel, ["link"], "href") || feedUrl;
  const logoRaw = localText(channel, ["url", "logo", "icon"]) || localAttr(channel, ["itunes:image", "image"], "href");
  const image = absolutizeUrl(logoRaw, link || feedUrl) || getDomainLogo(link || feedUrl, title);
  const nodes = Array.from(doc.querySelectorAll("item, entry")).slice(0, limit);
  const items = nodes.map((node: any, index) => {
    const itemTitle = stripTags(localText(node, ["title"]), 220);
    const linkNode = Array.from(node.children || []).find((child: any) => String(child.tagName || child.nodeName || "").toLowerCase() === "link");
    const itemLink = safeString((linkNode as any)?.getAttribute?.("href")) || localText(node, ["link", "guid", "id"]);
    const rawDesc = localText(node, ["description", "summary", "content:encoded", "content"]);
    const imageRaw = localAttr(node, ["media:thumbnail", "thumbnail", "media:content"], "url") || localAttr(node, ["itunes:image"], "href") || localText(node, ["image"]) || extractImageFromHtml(rawDesc);
    const itemImage = absolutizeUrl(imageRaw, itemLink || link || feedUrl) || image;
    return { id: itemLink || `${feedUrl}#${index}`, title: itemTitle, link: itemLink, pubDate: localText(node, ["pubDate", "published", "updated", "date"]), img: itemImage, description: stripTags(rawDesc, 500), contentEncoded: rawDesc, category: localText(node, ["category"]) };
  }).filter(item => item.title || item.link);
  return { title, link, feedUrl, image, isYoutube: /youtube\.com|youtu\.be/i.test(feedUrl), items };
}

async function resolveAndFetchFeed(feedInput: FeedInput): Promise<{ feedUrl: string; fetched: FetchResult }> {
  const tried = new Set<string>(); let lastHtml: FetchResult | null = null; let lastError: unknown = null;
  for (const candidate of candidateUrlsForFeed(feedInput)) {
    if (tried.has(candidate)) continue; tried.add(candidate);
    try {
      const fetched = await fetchText(candidate);
      if (looksLikeXml(fetched.text, fetched.contentType, fetched.finalUrl || candidate)) return { feedUrl: fetched.finalUrl || candidate, fetched };
      if (!lastHtml || fetched.text.length > lastHtml.text.length) lastHtml = fetched;
      for (const discovered of discoverFeedsFromHtml(fetched.text, fetched.finalUrl || candidate)) {
        if (tried.has(discovered)) continue; tried.add(discovered);
        try { const f2 = await fetchText(discovered); if (looksLikeXml(f2.text, f2.contentType, f2.finalUrl || discovered)) return { feedUrl: f2.finalUrl || discovered, fetched: f2 }; } catch (e) { lastError = e; }
      }
    } catch (e) { lastError = e; }
  }
  if (lastHtml) throw Object.assign(new Error("HTML_FALLBACK"), { htmlFallback: lastHtml });
  throw lastError instanceof Error ? lastError : new Error("Nenhum feed RSS/Atom encontrado");
}

function normalizeItem(item: any, index: number, parsed: any, feedUrl: string, feedLogo: string | null, isYoutube: boolean) {
  const link = safeString(item.link || item.guid || item.id || "");
  const videoId = safeString(item.videoId) || (link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/)?.[2] || null);
  const title = stripTags(item.title || item.name || item.description || `Item ${index + 1}`, 240);
  const rawDescription = item.contentEncoded || item.content || item.description || item.summary || item.mediaDescription || "";
  let img: string | null = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : extractImageFromItem(item);
  img = absolutizeUrl(img, link || parsed.link || feedUrl) || feedLogo;
  const enclosure = getFromMaybeArray(item.enclosure);
  let audioFile: string | null = null; if (enclosure?.url && /audio|mpeg|mp3|m4a|ogg/i.test(enclosure?.type || enclosure?.url)) audioFile = enclosure.url;
  const pubDate = item.pubDate || item.isoDate || item.published || item.updated || item.date || null;
  return { id: videoId || item.guid || item.id || link || `${feedUrl}#${index}`, title, link, pubDate, isoDate: item.isoDate || null, img, videoId, description: stripTags(rawDescription, 500), contentEncoded: item.contentEncoded || item.content || null, audioFile, category: Array.isArray(item.categories) ? item.categories[0] : (Array.isArray(item.category) ? item.category[0] : item.category || null), creator: item.creator || item.author || null, isYoutube: Boolean(videoId || isYoutube) };
}

function scrapeArticlesFromHtml(html: string, pageUrl: string, feedInput: FeedInput, limit: number) {
  const doc = new DOMParser().parseFromString(html, "text/html"); if (!doc) return [];
  const host = getHostname(pageUrl); const seen = new Set<string>(); const items: any[] = [];
  const bad = /assine|login|newsletter|publicidade|termos|politica-de-privacidade|cookies|facebook|twitter|instagram|youtube|whatsapp|podcast|ao-vivo|videos?$/i;
  for (const a of doc.querySelectorAll("a")) {
    if (items.length >= limit) break;
    const href = absolutizeUrl(a.getAttribute("href") || "", pageUrl); if (!href) continue;
    const h = getHostname(href); if (h && host && h !== host && !h.endsWith(`.${host}`) && !host.endsWith(`.${h}`)) continue;
    if (bad.test(href)) continue;
    const title = stripTags(a.textContent || "", 240);
    if (title.length < 32 || title.length > 230) continue;
    const key = normalizeKey(title).slice(0, 110); if (!key || seen.has(key)) continue; seen.add(key);
    items.push({ id: href, title, link: href, pubDate: null, img: null, description: title, contentEncoded: null, category: feedInput.category || null, scraped: true });
  }
  return items;
}

async function parseOneFeed(feedInput: FeedInput, options: { limit: number; enrichImages: boolean; mode: string }) {
  const feedId = safeString(feedInput.id || feedInput.url || feedInput.name);
  const startedAt = Date.now();
  let lastError = "Falha temporária";
  let parsedPayload: any = null;
  let htmlFallback: FetchResult | null = null;
  try {
    try {
      const { feedUrl, fetched } = await resolveAndFetchFeed(feedInput);
      const repaired = repairXML(fetched.text);
      let parsed: any = null;
      try { parsed = await parser.parseString(repaired); } catch (_rssError) { parsed = null; }
      if (parsed?.items?.length) {
        const isYoutube = /youtube\.com|youtu\.be/i.test(feedUrl) || /youtube\.com|youtu\.be/i.test(parsed.link || "");
        const feedLogo = extractFeedLogo(parsed, parsed.link || feedUrl) || getDomainLogo(parsed.link || feedUrl, parsed.title || feedInput.name || getHostname(feedUrl));
        const sourceItems = parsed.items.slice(0, options.limit);
        parsedPayload = { title: parsed.title || feedInput.name || getHostname(feedUrl), link: parsed.link || feedUrl, feedUrl, image: feedLogo, isYoutube, items: sourceItems.map((item: any, index: number) => normalizeItem(item, index, parsed, feedUrl, feedLogo, isYoutube)) };
      } else {
        const manual = manualParseXml(repaired, feedUrl, feedInput, options.limit);
        if (manual?.items?.length) parsedPayload = manual;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Falha no RSS";
      htmlFallback = (error as any)?.htmlFallback || null;
    }

    if (!parsedPayload?.items?.length) {
      const page = htmlFallback || await fetchText(candidateUrlsForFeed(feedInput).find(url => !/rss|feed|xml/i.test(url)) || normalizeUrl(feedInput.url), REQUEST_TIMEOUT_MS);
      const title = feedInput.name || getHostname(page.finalUrl);
      const image = extractImageFromHtml(page.text.slice(0, 360000)) || getDomainLogo(page.finalUrl, title);
      const scraped = scrapeArticlesFromHtml(page.text, page.finalUrl, feedInput, options.limit);
      parsedPayload = { title, link: page.finalUrl, feedUrl: page.finalUrl, image: absolutizeUrl(image, page.finalUrl) || getDomainLogo(page.finalUrl, title), isYoutube: false, items: scraped };
    }

    const feedLogo = parsedPayload.image || getDomainLogo(parsedPayload.link || parsedPayload.feedUrl || feedInput.url, parsedPayload.title || feedInput.name);
    let ogCount = 0;
    const finalItems = await Promise.all((parsedPayload.items || []).slice(0, options.limit).map(async (item: any) => {
      if (options.enrichImages && (!item.img || item.img === feedLogo || /favicon|s2\/favicons|ui-avatars/i.test(String(item.img))) && item.link && ogCount < MAX_OG_PER_SOURCE) {
        ogCount += 1;
        const og = await fetchOgImage(item.link);
        if (og) item.img = og;
      }
      if (!item.img) item.img = feedLogo;
      return item;
    }));

    return { feedId, inputUrl: feedInput.url, ok: finalItems.length > 0, status: finalItems.length > 0 ? "ok" : "empty", title: parsedPayload.title || feedInput.name || getHostname(feedInput.url), link: parsedPayload.link || parsedPayload.feedUrl || feedInput.url, feedUrl: parsedPayload.feedUrl || feedInput.url, image: feedLogo, isYoutube: !!parsedPayload.isYoutube, items: finalItems.filter((item: any) => item.title || item.link), error: finalItems.length ? undefined : lastError, elapsedMs: Date.now() - startedAt };
  } catch (error) {
    return { feedId, inputUrl: feedInput.url, ok: false, status: "error", title: feedInput.name || getHostname(feedInput.url), link: feedInput.url, feedUrl: feedInput.url, image: feedInput.logo || getDomainLogo(feedInput.url, feedInput.name || "Fonte"), isYoutube: false, items: [], error: error instanceof Error ? error.message : lastError, elapsedMs: Date.now() - startedAt };
  }
}

async function runPool<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
    while (cursor < items.length) { const i = cursor++; await worker(items[i], i); }
  });
  await Promise.allSettled(workers);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const inputUrl = safeString(body.url);
    if (!inputUrl) return jsonResponse({ error: "URL is required", items: [] }, 400);
    const limit = Math.max(1, Math.min(Number(body.limit || (body.brief ? 24 : DEFAULT_LIMIT)), MAX_LIMIT));
    const enrichImages = body.enrichImages !== false;
    const feedInput: FeedInput = {
      id: safeString(body.id || body.sourceId || inputUrl),
      name: safeString(body.sourceName || body.name || body.title || "Fonte"),
      url: inputUrl,
      logo: safeString(body.logo || ""),
      category: safeString(body.category || "Geral"),
      type: safeString(body.type || "rss"),
    };
    const source = await parseOneFeed(feedInput, { limit, enrichImages, mode: safeString(body.mode || "single") });
    return jsonResponse({
      title: source.title,
      description: null,
      link: source.link,
      feedUrl: source.feedUrl,
      image: source.image,
      logo: source.image,
      items: source.items || [],
      isYoutube: source.isYoutube,
      ok: source.ok,
      status: source.status,
      error: source.error,
      elapsedMs: source.elapsedMs,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido no parser", items: [], title: null, image: null, isYoutube: false }, 200);
  }
});
