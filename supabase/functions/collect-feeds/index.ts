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

const REQUEST_TIMEOUT_MS = 6800;
const ARTICLE_TIMEOUT_MS = 2800;
const DEFAULT_LIMIT = 42;
const MAX_LIMIT = 70;
const DEFAULT_CONCURRENCY = 6;
const MAX_OG_PER_SOURCE = 14;

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


const NOTICIAS_AO_MINUTO_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#ec1c24"/>
  <circle cx="64" cy="64" r="39" fill="white"/>
  <path d="M64 39a25 25 0 1 0 0 50 25 25 0 0 0 0-50Zm0 9a16 16 0 1 1 0 32 16 16 0 0 1 0-32Z" fill="#ec1c24"/>
  <path d="M62 51h8v20H51v-8h11V51Z" fill="#111827"/>
</svg>
`)}`;
const SBT_NEWS_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05a8ff"/><stop offset=".38" stop-color="#5b4dff"/><stop offset=".7" stop-color="#ff2d55"/><stop offset="1" stop-color="#ffcc00"/></linearGradient></defs>
  <rect width="128" height="128" rx="28" fill="#061231"/>
  <circle cx="64" cy="64" r="43" fill="url(#s)"/>
  <circle cx="64" cy="64" r="31" fill="#fff"/>
  <text x="64" y="73" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="28" fill="#071126">SBT</text>
</svg>
`)}`;
const UOL_BRASIL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#0066cc"/>
  <circle cx="42" cy="48" r="22" fill="#ffb000"/>
  <circle cx="50" cy="43" r="20" fill="#ff5a00" opacity=".86"/>
  <text x="64" y="86" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="36" fill="#fff">uol</text>
</svg>
`)}`;

const LOGO_OVERRIDES: Array<{ key: string; domains: string[]; logo: string }> = [
  { key: "jovem pan", domains: ["jovempan.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://jovempan.com.br&sz=128" },
  { key: "g1", domains: ["g1.globo.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://g1.globo.com&sz=128" },
  { key: "uol", domains: ["uol.com.br", "rss.uol.com.br"], logo: UOL_BRASIL_LOGO },
  { key: "sbt", domains: ["sbtnews.sbt.com.br", "sbt.com.br"], logo: SBT_NEWS_LOGO },
  { key: "r7", domains: ["r7.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://www.r7.com&sz=128" },
  { key: "istoe dinheiro", domains: ["istoedinheiro.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://istoedinheiro.com.br&sz=128" },
  { key: "istoe", domains: ["istoe.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://istoe.com.br&sz=128" },
  { key: "band", domains: ["band.uol.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://www.band.uol.com.br&sz=128" },
  { key: "180graus", domains: ["180graus.com", "180graus.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://180graus.com&sz=128" },
  { key: "piaui hoje", domains: ["piauihoje.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://piauihoje.com.br&sz=128" },
  { key: "valor investe", domains: ["valorinveste.globo.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://valorinveste.globo.com&sz=128" },
  { key: "exame", domains: ["exame.com"], logo: "https://www.google.com/s2/favicons?domain_url=https://exame.com&sz=128" },
  { key: "gp1", domains: ["gp1.com.br"], logo: "https://www.google.com/s2/favicons?domain_url=https://gp1.com.br&sz=128" },
  { key: "noticias ao minuto", domains: ["noticiasaominuto.com.br"], logo: NOTICIAS_AO_MINUTO_LOGO },
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
    // UOL mudou/oscila bastante os endpoints RSS. As páginas HTML abaixo são fallback oficial
    // para garantir conteúdo quando o XML vier vazio, bloqueado ou com charset quebrado.
    if (name.includes("economia") || url.includes("economia")) add("https://rss.uol.com.br/feed/economia.xml");
    add("https://rss.uol.com.br/feed/noticias.xml");
    add("https://rss.uol.com.br/feed/ultimas.xml");
    add("https://noticias.uol.com.br/ultimas-noticias/rss.xml");
    add("https://economia.uol.com.br/ultimas-noticias/rss.xml");
    add("https://noticias.uol.com.br/ultimas/");
    add("https://economia.uol.com.br/ultimas-noticias/");
  }
  if (host.includes("sbt") || name.includes("sbt")) {
    add("https://sbtnews.sbt.com.br/noticias");
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
  if (host.includes("g1.globo.com") || name.includes("g1")) {
    add("https://g1.globo.com/rss/g1/");
    add("https://g1.globo.com/rss/g1/brasil/");
    add("https://g1.globo.com/");
  }
  if (host.includes("fiis.com.br") || name.includes("fiis")) { add("https://fiis.com.br/noticias/feed/"); add("https://fiis.com.br/feed/"); add("https://fiis.com.br/noticias/"); }
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


function cleanArticleTitleForSource(title: string, source = '', url = ''): string {
  let clean = stripTags(title || '', 260);
  const key = normalizeKey(`${source} ${url}`);
  if (key.includes('sbt')) {
    const areas = ['brasil','politica','política','economia','mundo','saude','saúde','esportes','justica','justiça','policia','polícia','tecnologia','cultura','eleicoes','eleições','comprova','colunistas','ultimas noticias','últimas notícias','noticias','notícias','sbt news'];
    let changed = true;
    while (changed) {
      const before = clean;
      for (const area of areas) {
        const re = new RegExp(`^${area.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*(?:[-–—:|•›»]+|\\s{2,})\\s*`, 'i');
        clean = clean.replace(re, '').trim();
      }
      changed = before !== clean;
    }
  }
  return clean.replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
}


// ============================================================================
// VETRA CONTEXT ENRICHMENT — aditivo e retrocompatível.
// NÃO toca em fontes/URLs/descoberta/worker. Só computa "ficha compacta" do que já existe.
// ============================================================================
const CONTEXT_TEXT_MAX = 1200;
const CONTEXT_TEXT_MIN_FULLISH = 320;
const PT_STOPWORDS = new Set("a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre e ou mas que se ao aos pelo pela pelos pelas num numa dum duma este esta estes estas esse essa esses essas aquele aquela isso isto aquilo seu sua seus suas meu minha nosso nossa como quando onde qual quais quem cujo cuja mais menos muito muita muitos muitas ja nao sim foi ser sao era eram tem ter ha haver apos ate".split(/\s+/));
const TITLE_NOISE = /\b(ao vivo|veja|video|entenda|assista|confira|urgente|imagens|fotos|em tempo real|minuto a minuto|integra|opiniao|analise|resumo|antes e depois)\b/gi;

function stripAccents(s: any) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function cleanRssDescription(raw: any, max = 900) { return stripTags(raw || "", max); }

function buildContextText(parts: any) {
  const seen: string[] = [];
  const pushClean = (t: any) => {
    const clean = stripTags(String(t || ""), CONTEXT_TEXT_MAX);
    if (clean && clean.length >= 24 && !seen.some(s => s.slice(0, 60) === clean.slice(0, 60))) seen.push(clean);
  };
  pushClean(parts.rssDescription); pushClean(parts.jsonLdDescription); pushClean(parts.ogDescription);
  pushClean(parts.metaDescription); pushClean(parts.firstParagraph);
  let out = seen.join(" ").replace(/\s+/g, " ").trim();
  if (out.length > CONTEXT_TEXT_MAX) out = out.slice(0, CONTEXT_TEXT_MAX).replace(/\s+\S*$/, "").trim();
  return out;
}

function detectEventType(text: any) {
  const t = " " + stripAccents(String(text || "")).toLowerCase() + " ";
  const rules: Array<[string, RegExp]> = [
    ["morte", /\b(morre|morreu|morte|faleceu|obito|vitima fatal|mortos?)\b/],
    ["prisao", /\b(preso|presa|prisao|detido|detida|capturad|apreendid)\b/],
    ["acidente", /\b(acidente|colisao|capotou|atropel|descarril)\b/],
    ["decisao_judicial", /\b(stf|stj|tj|justica|juiz|liminar|sentenca|condenad|absolvi|habeas)\b/],
    ["economia", /\b(dolar|inflacao|selic|ipca|pib|bolsa|ibovespa|juros|mercado)\b/],
    ["politica", /\b(presidente|ministro|congresso|senado|camara|governo|eleic|votac|deputad|prefeit)\b/],
    ["esporte", /\b(gol|jogo|partida|campeonato|placar|venceu|derrota|classific)\b/],
    ["seguranca", /\b(tiroteio|operacao|homicidio|assalto|roubo|trafico|apreensao)\b/],
    ["clima", /\b(chuva|tempestade|enchente|temporal|seca|onda de calor|frente fria|alagament)\b/],
    ["anuncio", /\b(anuncia|lanca|lancamento|apresenta|revela|confirma|divulga)\b/],
  ];
  for (const [name, re] of rules) if (re.test(t)) return name;
  return "outro";
}

function extractEntities(text: any) {
  const src = String(text || "");
  const out: any = { orgs: [], names: [], numbers: [], money: [], percents: [], tickers: [] };
  const push = (arr: string[], v: any) => { const s = String(v || "").trim().replace(/[.,;]+$/, ""); if (s && !arr.includes(s) && arr.length < 12) arr.push(s); };
  (src.match(/\b\d{1,3}(?:[.,]\d+)?\s?%/g) || []).forEach(v => push(out.percents, v.replace(/\s+/g, "")));
  (src.match(/\bR\$\s?\d[\d.,]*(?:\s?(?:mil|milh\w+|bilh\w+|trilh\w+))?/gi) || []).forEach(v => push(out.money, v.replace(/\s+/g, " ").trim()));
  (src.match(/\b(?:US\$|€|£)\s?\d[\d.,]*/g) || []).forEach(v => push(out.money, v.replace(/\s+/g, "")));
  (src.match(/\b[A-Z]{4}\d{1,2}\b/g) || []).forEach(v => push(out.tickers, v));
  (src.match(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b/g) || []).forEach(v => push(out.numbers, v));
  (src.match(/\b(?:STF|STJ|TSE|TCU|TJ|MPF|PRF|INSS|IBGE|Copom|Anvisa|Ibama|Petrobras|Bradesco|Nubank|B3|Selic|Ibovespa)\b/g) || []).forEach(v => push(out.orgs, v));
  const capSeq = src.match(/\b(?:[A-ZÀ-Ý][a-zà-ÿ]{2,}\s+){1,4}[A-ZÀ-Ý][a-zà-ÿ]{2,}\b/g) || [];
  capSeq.forEach(v => { const words = v.trim().split(/\s+/); if (words.length >= 2 && words.length <= 5) push(out.names, v.trim()); });
  return out;
}

function extractKeyphrases(text: any, max = 10) {
  const words = stripAccents(String(text || "")).toLowerCase()
    .replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9\s-]/gi, " ")
    .split(/\s+/).filter(w => w.length >= 4 && !PT_STOPWORDS.has(w) && !/^\d+$/.test(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, max).map(e => e[0]);
}

function normalizeTitleAndCoreWords(title: any) {
  const noiseRemoved = String(title || "").replace(TITLE_NOISE, " ");
  const normalizedTitle = stripAccents(noiseRemoved).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const coreWords = normalizedTitle.split(/\s+/).filter(w => w.length >= 3 && !PT_STOPWORDS.has(w));
  return { normalizedTitle, coreWords };
}

function stableHash(str: any) {
  let h1 = 0x811c9dc5, h2 = 0x1000193 >>> 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 ^= c; h1 = Math.imul(h1, 0x01000193); h2 = Math.imul(h2 ^ c, 0x85ebca6b); }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}
function makeContentHash(item: any) {
  const canonical = String(item.canonicalUrl || item.link || "").split(/[?#]/)[0];
  const basis = [canonical, String(item.title || ""), String(item.publishedAt || item.pubDate || ""), String(item.contextText || "").slice(0, 200)].join("|");
  return "v1_" + stableHash(basis);
}

function firstMatch(re: RegExp, s: any) { const m = String(s || "").match(re); return m ? m[1] : ""; }

// Extrator HTML-lite (usado só pelo enriquecimento opcional; não roda por padrão).
function extractLiteArticleContext(html: any, finalUrl: any) {
  const head = String(html || "").slice(0, 300000);
  const canonicalRaw = firstMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, head)
    || firstMatch(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i, head)
    || firstMatch(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, head);
  const canonicalUrl = absolutizeUrl(canonicalRaw, finalUrl) || finalUrl;
  const metaDescription = htmlDecode(firstMatch(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, head) || firstMatch(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, head));
  const ogDescription = htmlDecode(firstMatch(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i, head) || firstMatch(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i, head));
  const section = htmlDecode(firstMatch(/<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']*)["']/i, head));
  const author = htmlDecode(firstMatch(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']*)["']/i, head) || firstMatch(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']*)["']/i, head));
  const publishedTime = firstMatch(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']*)["']/i, head) || firstMatch(/<time[^>]+datetime=["']([^"']+)["']/i, head);
  const image = absolutizeUrl(extractImageFromHtml(head), finalUrl) || null;
  let jsonLdDescription = ""; let firstParagraph = "";
  try {
    const scripts = head.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const script of scripts) {
      const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "").trim();
      try {
        const parsed = JSON.parse(raw); const list = Array.isArray(parsed) ? parsed : [parsed]; const stack = [...list];
        while (stack.length) {
          const node: any = stack.shift(); if (!node || typeof node !== "object") continue;
          const desc = node.description || node.articleBody || node.abstract;
          if (typeof desc === "string" && desc.length > jsonLdDescription.length) jsonLdDescription = desc;
          const graph = node["@graph"]; if (graph) stack.push(...(Array.isArray(graph) ? graph : [graph]));
        }
      } catch (_e) {}
      if (jsonLdDescription) break;
    }
  } catch (_e) {}
  try {
    const doc: any = new DOMParser().parseFromString(head, "text/html");
    if (doc) {
      const container = doc.querySelector("article") || doc.querySelector("main") || doc.body || doc;
      for (const p of Array.from(container?.querySelectorAll?.("p") || [])) {
        const t = getNodeText(p);
        if (t && t.length >= 80) { firstParagraph = t.slice(0, CONTEXT_TEXT_MAX); break; }
      }
    }
  } catch (_e) {}
  return { canonicalUrl, metaDescription: stripTags(metaDescription, 900), ogDescription: stripTags(ogDescription, 900), jsonLdDescription: stripTags(jsonLdDescription, CONTEXT_TEXT_MAX), firstParagraph: stripTags(firstParagraph, CONTEXT_TEXT_MAX), section, author, publishedTime, image };
}

// Combina RSS (+ lite opcional) na ficha final. É o que o normalizeItem chama.
function buildItemContextFields(item: any, rawDescription: any, lite?: any) {
  const rssDescription = cleanRssDescription(rawDescription, 900);
  const l = lite || {};
  const contextText = buildContextText({ rssDescription, metaDescription: l.metaDescription, ogDescription: l.ogDescription, jsonLdDescription: l.jsonLdDescription, firstParagraph: l.firstParagraph });
  let contextLevel: string;
  const hasLite = !!(l.metaDescription || l.ogDescription || l.jsonLdDescription || l.firstParagraph);
  if (rssDescription && rssDescription.length >= CONTEXT_TEXT_MIN_FULLISH) contextLevel = "rss_fullish";
  else if (hasLite && contextText.length >= 120) contextLevel = "html_lite";
  else if (rssDescription && rssDescription.length >= 40) contextLevel = "rss_summary";
  else contextLevel = "title_only";
  const basisText = `${item.title || ""} ${contextText}`;
  const { normalizedTitle, coreWords } = normalizeTitleAndCoreWords(item.title || "");
  const canonicalUrl = (l.canonicalUrl && isHttpUrl(l.canonicalUrl)) ? l.canonicalUrl : (item.link || null);
  const publishedAt = item.isoDate || item.pubDate || l.publishedTime || null;
  const fields: any = { canonicalUrl, publishedAt, rssDescription, metaDescription: l.metaDescription || null, ogDescription: l.ogDescription || null, jsonLdDescription: l.jsonLdDescription || null, firstParagraph: l.firstParagraph || null, contextText, contextLevel, entities: extractEntities(basisText), keyphrases: extractKeyphrases(basisText), eventType: detectEventType(basisText), normalizedTitle, coreWords };
  fields.contentHash = makeContentHash({ canonicalUrl, link: item.link, title: item.title, publishedAt, contextText });
  return fields;
}

// ============================================================================
// VETRA HTML-LITE ENRICHMENT — OPCIONAL e DEFAULT OFF.
// Só roda com { enrichContext: true } (ou { allowProxy: true }) no body.
// Nunca derruba a fonte; se falhar, item mantém rss_summary/title_only.
// ============================================================================
const MAX_CONTEXT_PER_SOURCE = 10;      // teto de artigos com HTML-lite por fonte (não mexe no MAX_OG_PER_SOURCE)
const CONTEXT_LITE_TIMEOUT_MS = 2200;   // timeout curto por artigo (dentro de 1500–2500ms)
const CONTEXT_LITE_CONCURRENCY = 3;     // concorrência baixa
const BOILERPLATE_RE = /(pol[ií]tica de privacidade|uso de cookies|aceitar cookies|este site (utiliza|usa) cookies|ao usar nosso site|leia mais or aceitar|termos de uso|consentimento|gerenciar cookies|cookie policy|privacy policy|terms of service)/i;
const JUNK_URL_RE = /(politica[-_]?de[-_]?privacidade|privacidade|termos[-_]?de[-_]?uso|\/termos\b|cookies?|consent|conhecaopovo)/i;
function liteLooksBoilerplate(lite: any) {
  const probe = `${lite.metaDescription || ""} ${lite.ogDescription || ""} ${lite.jsonLdDescription || ""} ${String(lite.firstParagraph || "").slice(0, 200)}`;
  return BOILERPLATE_RE.test(probe) || JUNK_URL_RE.test(String(lite.canonicalUrl || ""));
}

async function fetchLiteContextForUrl(url: string) {
  if (!isHttpUrl(url)) return null;
  try {
    const { text, finalUrl } = await fetchText(url, CONTEXT_LITE_TIMEOUT_MS);
    return extractLiteArticleContext(String(text || "").slice(0, 300000), finalUrl || url);
  } catch { return null; }
}

async function enrichItemsLite(items: any[], options: { enrichContext?: boolean }) {
  if (!options || options.enrichContext !== true || !Array.isArray(items) || !items.length) return items;
  // elegíveis: contexto pobre + link http, NÃO raspado e sem cara de página utilitária.
  const eligible = items.filter((it: any) =>
    it && it.link && isHttpUrl(it.link) && !it.scraped && !JUNK_URL_RE.test(it.link) &&
    (it.contextLevel === "title_only" || it.contextLevel === "rss_summary")
  ).slice(0, MAX_CONTEXT_PER_SOURCE);
  if (!eligible.length) return items;
  await runPool(eligible, CONTEXT_LITE_CONCURRENCY, async (it: any) => {
    try {
      const lite = await fetchLiteContextForUrl(it.link);
      if (!lite || liteLooksBoilerplate(lite)) return;   // descarta cookies/privacidade
      const fresh = buildItemContextFields(it, it.rssDescription || it.description || "", lite);
      const gotBetter = fresh.contextLevel === "html_lite" ||
        (fresh.contextText && fresh.contextText.length > String(it.contextText || "").length);
      if (gotBetter) Object.assign(it, fresh);
    } catch { /* mantém o item como estava (rss_summary/title_only) */ }
  });
  return items;
}


function normalizeItem(item: any, index: number, parsed: any, feedUrl: string, feedLogo: string | null, isYoutube: boolean) {
  const link = safeString(item.link || item.guid || item.id || "");
  const videoId = safeString(item.videoId) || (link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/)?.[2] || null);
  const title = cleanArticleTitleForSource(item.title || item.name || item.description || `Item ${index + 1}`, parsed?.title || feedUrl, feedUrl);
  const rawDescription = item.contentEncoded || item.content || item.description || item.summary || item.mediaDescription || "";
  let img: string | null = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : extractImageFromItem(item);
  img = absolutizeUrl(img, link || parsed.link || feedUrl) || feedLogo;
  const enclosure = getFromMaybeArray(item.enclosure);
  let audioFile: string | null = null; if (enclosure?.url && /audio|mpeg|mp3|m4a|ogg/i.test(enclosure?.type || enclosure?.url)) audioFile = enclosure.url;
  const pubDate = item.pubDate || item.isoDate || item.published || item.updated || item.date || null;
  const __item = { id: videoId || item.guid || item.id || link || `${feedUrl}#${index}`, title, link, pubDate, isoDate: item.isoDate || null, img, videoId, description: stripTags(rawDescription, 500), contentEncoded: item.contentEncoded || item.content || null, audioFile, category: Array.isArray(item.categories) ? item.categories[0] : (Array.isArray(item.category) ? item.category[0] : item.category || null), creator: item.creator || item.author || null, isYoutube: Boolean(videoId || isYoutube) };
  return { ...__item, ...buildItemContextFields(__item, rawDescription) };
}

function getNodeText(node: any): string { return safeString(node?.textContent || '').replace(/\s+/g, ' ').trim(); }
function getNodeAttr(node: any, names: string[]): string {
  for (const name of names) {
    const value = safeString(node?.getAttribute?.(name));
    if (value) return value;
  }
  return '';
}
function findWithinContext(anchor: any, selectors: string[]): any {
  let current: any = anchor;
  for (let depth = 0; depth < 5 && current; depth++) {
    for (const selector of selectors) {
      try {
        const found = current.querySelector?.(selector);
        if (found) return found;
      } catch (_e) {}
    }
    current = current.parentElement;
  }
  return null;
}
function findImageNearAnchor(anchor: any, baseUrl: string): string | null {
  let current: any = anchor;
  for (let depth = 0; depth < 5 && current; depth++) {
    try {
      const img = current.querySelector?.('img');
      if (img) {
        const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || bestFromSrcset(img.getAttribute('data-srcset')) || bestFromSrcset(img.getAttribute('srcset')) || img.getAttribute('src');
        const fixed = absolutizeUrl(src, baseUrl);
        if (fixed && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(fixed)) return fixed;
      }
      const source = current.querySelector?.('picture source, source');
      if (source) {
        const src = bestFromSrcset(source.getAttribute('srcset') || source.getAttribute('data-srcset'));
        const fixed = absolutizeUrl(src, baseUrl);
        if (fixed) return fixed;
      }
    } catch (_e) {}
    current = current.parentElement;
  }
  return null;
}
function cleanScrapedTitle(rawTitle: string, feedInput: FeedInput, href: string, pageUrl: string): string {
  let title = cleanArticleTitleForSource(rawTitle || '', feedInput.name || getHostname(pageUrl), href || pageUrl);
  title = title
    .replace(/^image:\s*/i, '')
    .replace(/^imagem:\s*/i, '')
    .replace(/^(agências?|agencia|cotidiano|economia|política|politica|mundo|brasil|justiça|justica|saúde|saude|tn online|folha)\s+/i, (m) => {
      return title.replace(m, '').trim().length > 28 ? '' : m;
    })
    .replace(/\b\d{2}\/\d{2}\/\d{4}\s+\d{1,2}h\d{2}\b.*$/i, '')
    .replace(/\bhá\s+\d+\s+(minutos?|horas?|dias?)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title;
}
function scrapeArticlesFromHtml(html: string, pageUrl: string, feedInput: FeedInput, limit: number) {
  const doc = new DOMParser().parseFromString(html, "text/html"); if (!doc) return [];
  const host = getHostname(pageUrl); const sourceKey = normalizeKey(`${feedInput.name || ''} ${pageUrl}`);
  const seen = new Set<string>(); const items: any[] = [];
  const bad = /assine|login|newsletter|publicidade|termos|politica-de-privacidade|politicadeprivacidade|conhecaopovo|cookies|facebook|twitter|instagram|youtube|whatsapp|podcast|ao-vivo|videos?$|webstories|newsletter/i;
  const allowedCrossHostForUol = (hrefHost: string) => {
    if (!sourceKey.includes('uol') && !host.includes('uol.com.br')) return false;
    return hrefHost.includes('uol.com.br') || hrefHost.includes('folha.uol.com.br') || hrefHost.includes('tnonline.uol.com.br');
  };
  const isSbt = sourceKey.includes('sbt') || host.includes('sbt');
  const isUol = sourceKey.includes('uol') || host.includes('uol.com.br');

  for (const a of doc.querySelectorAll("a")) {
    if (items.length >= limit) break;
    const href = absolutizeUrl(a.getAttribute("href") || "", pageUrl); if (!href) continue;
    const h = getHostname(href);
    if (h && host && h !== host && !h.endsWith(`.${host}`) && !host.endsWith(`.${h}`) && !allowedCrossHostForUol(h)) continue;
    if (bad.test(href)) continue;

    const titleNode = findWithinContext(a, ['h1','h2','h3','h4','[class*=title]','[class*=headline]','[data-testid*=title]']);
    const imgNode = findWithinContext(a, ['img']);
    const attrTitle = getNodeAttr(a, ['aria-label','title']) || getNodeAttr(imgNode, ['alt','title']);
    const nodeTitle = getNodeText(titleNode);
    const ownText = getNodeText(a);
    let title = cleanScrapedTitle(nodeTitle || attrTitle || ownText, feedInput, href, pageUrl);
    // NOVO: se o título veio truncado (card com reticências), recupera a versão completa já presente no card
    if (/(\.{3}|…)\s*$/.test(title)) {
      const fuller = [attrTitle, getNodeText(findWithinContext(a, ['p','[class*=summary]','[class*=description]','[class*=excerpt]'])), ownText]
        .map((t) => cleanScrapedTitle(t, feedInput, href, pageUrl))
        .filter((t) => t && !/(\.{3}|…)\s*$/.test(t) && t.length >= title.length);
      if (fuller.length) title = fuller[0];
    }

    if (isSbt && (!title || title.length < 28)) {
      const contextTitle = getNodeText(findWithinContext(a, ['h3','h2','h4'])) || attrTitle || ownText;
      title = cleanScrapedTitle(contextTitle, feedInput, href, pageUrl);
    }

    if (title.length < 32 || title.length > 240) continue;
    const key = normalizeKey(title).slice(0, 120); if (!key || seen.has(key)) continue;
    if (/^(editorias?|últimas notícias|ultimas noticias|notícias|noticias|ver tudo|ver mais)$/i.test(title)) continue;
    seen.add(key);

    const img = findImageNearAnchor(a, pageUrl);
    const summaryNode = findWithinContext(a, ['p','[class*=summary]','[class*=description]','[class*=excerpt]']);
    const summaryRaw = getNodeText(summaryNode);
    const description = summaryRaw && normalizeKey(summaryRaw) !== normalizeKey(title) ? stripTags(summaryRaw, 420) : title;

    items.push({
      id: href,
      title,
      link: href,
      pubDate: null,
      img,
      description,
      contentEncoded: null,
      category: feedInput.category || null,
      scraped: true,
      scrapeSource: isUol ? 'uol-html' : isSbt ? 'sbt-html' : 'html',
    });
  }
  return items;
}

function preferredScrapeUrlsForFeed(feedInput: FeedInput): string[] {
  const url = normalizeUrl(feedInput.url);
  const host = getHostname(url);
  const name = normalizeKey(feedInput.name || '');
  const list: string[] = [];
  const add = (v: string) => { if (v && !list.includes(v)) list.push(v); };
  if (host.includes('sbt') || name.includes('sbt')) add('https://sbtnews.sbt.com.br/noticias');
  if (host.includes('uol.com.br') || name.includes('uol')) {
    if (name.includes('economia') || url.includes('economia')) add('https://economia.uol.com.br/ultimas-noticias/');
    add('https://noticias.uol.com.br/ultimas/');
  }
  if (host.includes('g1.globo.com') || name.includes('g1')) add('https://g1.globo.com/');
  if (host.includes('fiis.com.br') || name.includes('fiis')) add('https://fiis.com.br/noticias/');
  const originalLooksPage = !/rss|feed|xml|atom/i.test(url);
  if (originalLooksPage) add(url);
  for (const candidate of candidateUrlsForFeed(feedInput)) if (!/rss|feed|xml|atom/i.test(candidate)) add(candidate);
  return list.slice(0, 8);
}

async function buildHtmlFallbackPayload(feedInput: FeedInput, htmlFallback: FetchResult | null, limit: number) {
  const tried = new Set<string>();
  const htmlCandidates: FetchResult[] = [];
  const preferred = preferredScrapeUrlsForFeed(feedInput);
  if (htmlFallback?.text) htmlCandidates.push(htmlFallback);
  for (const url of preferred) {
    if (tried.has(url)) continue;
    tried.add(url);
    try {
      if (htmlFallback?.finalUrl) {
        const htmlPath = new URL(htmlFallback.finalUrl).pathname.replace(/\/$/, '');
        const candidatePath = new URL(url).pathname.replace(/\/$/, '');
        if (getHostname(htmlFallback.finalUrl) === getHostname(url) && htmlPath === candidatePath) continue;
      }
    } catch (_e) {}
    try { htmlCandidates.push(await fetchText(url, REQUEST_TIMEOUT_MS)); } catch (_e) {}
  }

  for (const page of htmlCandidates) {
    const title = feedInput.name || getHostname(page.finalUrl);
    const image = extractImageFromHtml(page.text.slice(0, 420000)) || getDomainLogo(page.finalUrl, title);
    const scraped = scrapeArticlesFromHtml(page.text, page.finalUrl, feedInput, limit);
    if (scraped.length) {
      return { title, link: page.finalUrl, feedUrl: page.finalUrl, image: absolutizeUrl(image, page.finalUrl) || getDomainLogo(page.finalUrl, title), isYoutube: false, items: scraped };
    }
  }

  const fallbackUrl = preferred[0] || normalizeUrl(feedInput.url);
  return { title: feedInput.name || getHostname(fallbackUrl), link: fallbackUrl, feedUrl: fallbackUrl, image: getDomainLogo(fallbackUrl, feedInput.name || 'Fonte'), isYoutube: false, items: [] };
}

async function parseOneFeed(feedInput: FeedInput, options: { limit: number; enrichImages: boolean; mode: string; enrichContext?: boolean }) {
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
      parsedPayload = await buildHtmlFallbackPayload(feedInput, htmlFallback, options.limit);
    }

    const feedLogo = parsedPayload.image || getDomainLogo(parsedPayload.link || parsedPayload.feedUrl || feedInput.url, parsedPayload.title || feedInput.name);
    const sourceIdentity = normalizeKey(`${parsedPayload.title || ''} ${parsedPayload.link || ''} ${parsedPayload.feedUrl || ''} ${feedInput.name || ''} ${feedInput.url || ''}`);
    const imageEnrichLimit = sourceIdentity.includes('g1') || sourceIdentity.includes('globo') || sourceIdentity.includes('sbt') || sourceIdentity.includes('uol')
      ? Math.min(options.limit, 34)
      : MAX_OG_PER_SOURCE;
    let ogCount = 0;
    const finalItems = await Promise.all((parsedPayload.items || []).slice(0, options.limit).map(async (item: any) => {
      const imageLooksLikeLogo = !item.img || item.img === feedLogo || /favicon|s2\/favicons|ui-avatars|logo|sprite|placeholder/i.test(String(item.img));
      if (options.enrichImages && imageLooksLikeLogo && item.link && ogCount < imageEnrichLimit) {
        ogCount += 1;
        const og = await fetchOgImage(item.link);
        if (og) item.img = og;
      }
if (!item.img) item.img = feedLogo;
      // Backfill da ficha p/ itens que não passaram pelo normalizeItem (manualParseXml / scrape HTML)
      if (!item.contextLevel) Object.assign(item, buildItemContextFields(item, item.contentEncoded || item.description || item.rssDescription || ""));
      return item;
    }));

    // Enriquecimento HTML-lite opcional (default OFF; só com enrichContext=true).
    await enrichItemsLite(finalItems, { enrichContext: options.enrichContext === true });

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
    const feeds = Array.isArray(body.feeds) ? body.feeds.filter((feed: any) => safeString(feed?.url)) : [];
    if (!feeds.length) return jsonResponse({ ok: false, error: "feeds[] is required", sources: [], articles: [] }, 400);
    const limit = Math.max(1, Math.min(Number(body.limit || DEFAULT_LIMIT), MAX_LIMIT));
    const concurrency = Math.max(1, Math.min(Number(body.concurrency || DEFAULT_CONCURRENCY), 10));
    const enrichImages = body.enrichImages !== false;
    const enrichContext = body.enrichContext === true || body.allowProxy === true;
    const mode = safeString(body.mode || "background");
    const startedAt = Date.now();
    const sources: any[] = new Array(feeds.length);
   await runPool(feeds, concurrency, async (feed: any, index: number) => { sources[index] = await parseOneFeed(feed, { limit, enrichImages, mode, enrichContext }); });
    const articles = sources.flatMap(source => (source.items || []).map((item: any) => ({ ...item, feedId: source.feedId, sourceTitle: source.title, sourceLogo: source.image, sourceLink: source.link, sourceStatus: source.status })));
    return jsonResponse({ ok: true, sources, articles, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido", sources: [], articles: [] }, 200);
  }
});
