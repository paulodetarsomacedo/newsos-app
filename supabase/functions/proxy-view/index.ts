// ARQUIVO: supabase/functions/proxy-view/index.ts
// Vetra — proxy de leitura completa com headers de navegador, timeout, charset BR e Readability.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_500_000;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeUrl(input: string): string {
  const value = String(input || "").trim();
  if (!value) throw new Error("URL required");
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function withTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function decodeBuffer(buffer: ArrayBuffer, contentType = ""): string {
  const firstUtf8 = new TextDecoder("utf-8").decode(buffer);
  const headerCharset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || "";
  const metaCharset = firstUtf8.match(/<meta[^>]+charset=["']?([^"'>\s]+)/i)?.[1]?.toLowerCase() ||
    firstUtf8.match(/<meta[^>]+content=["'][^"']*charset=([^"';\s]+)/i)?.[1]?.toLowerCase() || "";
  const charset = headerCharset || metaCharset;

  if (charset.includes("iso-8859-1") || charset.includes("latin1") || charset.includes("latin-1") || charset.includes("windows-1252")) {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
  return firstUtf8;
}

function stripDangerousNodes(doc: any): void {
  const nodes = doc.querySelectorAll("script, style, iframe, noscript, svg, canvas, form, nav, footer, aside");
  nodes.forEach((node: any) => node.remove());
}

// --- Vetra proxy-view LITE: contexto curto sem Readability (aditivo) ---
const LITE_CONTEXT_MAX = 1400;
function liteStripTags(input: any, max = 1400) {
  return String(input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
    .replace(/\s+/g, " ").trim().slice(0, max);
}
function liteFirstMatch(re: RegExp, s: any) { const m = String(s || "").match(re); return m ? m[1] : ""; }
function liteAbsolutize(candidate: any, base: any) {
  const c = String(candidate || "").trim(); if (!c) return null;
  if (/^https?:\/\//i.test(c)) return c;
  if (c.startsWith("//")) return "https:" + c;
  try { return new URL(c, base).href; } catch { return null; }
}
function liteStableHash(str: any) {
  let h1 = 0x811c9dc5, h2 = 0x1000193 >>> 0; const s = String(str || "");
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 ^= c; h1 = Math.imul(h1, 0x01000193); h2 = Math.imul(h2 ^ c, 0x85ebca6b); }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}
function extractLiteContext(html: any, doc: any, finalUrl: any) {
  const head = String(html || "").slice(0, 300000);
  const canonicalRaw = liteFirstMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, head)
    || liteFirstMatch(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, head);
  const canonicalUrl = liteAbsolutize(canonicalRaw, finalUrl) || finalUrl;
  const title = liteStripTags(liteFirstMatch(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i, head) || liteFirstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, head), 300);
  const metaDescription = liteStripTags(liteFirstMatch(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, head) || liteFirstMatch(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, head), 900);
  const ogDescription = liteStripTags(liteFirstMatch(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i, head), 900);
  const section = liteStripTags(liteFirstMatch(/<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']*)["']/i, head), 120);
  const author = liteStripTags(liteFirstMatch(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']*)["']/i, head) || liteFirstMatch(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']*)["']/i, head), 160);
  const publishedTime = liteFirstMatch(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']*)["']/i, head) || liteFirstMatch(/<time[^>]+datetime=["']([^"']+)["']/i, head);
  const siteName = liteStripTags(liteFirstMatch(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i, head), 120);
  const image = liteAbsolutize(liteFirstMatch(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i, head) || liteFirstMatch(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i, head), finalUrl);
  let jsonLdDescription = "";
  const scripts = head.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw); const list = Array.isArray(parsed) ? parsed : [parsed]; const stack = [...list];
      while (stack.length) { const node: any = stack.shift(); if (!node || typeof node !== "object") continue;
        const desc = node.description || node.articleBody || node.abstract;
        if (typeof desc === "string" && desc.length > jsonLdDescription.length) jsonLdDescription = desc;
        const graph = node["@graph"]; if (graph) stack.push(...(Array.isArray(graph) ? graph : [graph])); }
    } catch (_e) {}
    if (jsonLdDescription) break;
  }
  jsonLdDescription = liteStripTags(jsonLdDescription, LITE_CONTEXT_MAX);
  const topParagraphs: string[] = []; let firstParagraph = "";
  try {
    const container = doc.querySelector("article") || doc.querySelector("main") || doc.body || doc;
    for (const p of Array.from(container?.querySelectorAll?.("p") || [])) {
      const t = liteStripTags((p as any).textContent, 600);
      if (t && t.length >= 60) { if (!firstParagraph) firstParagraph = t; if (topParagraphs.length < 6) topParagraphs.push(t); }
      if (topParagraphs.length >= 6) break;
    }
  } catch (_e) {}
  const parts = [jsonLdDescription, ogDescription, metaDescription, firstParagraph].filter(Boolean);
  let contextText = "";
  for (const part of parts) { if (contextText.length >= LITE_CONTEXT_MAX) break; if (!contextText.includes(part.slice(0, 60))) contextText += (contextText ? " " : "") + part; }
  contextText = contextText.slice(0, LITE_CONTEXT_MAX).replace(/\s+\S*$/, "").trim();
  const contentHash = "v1_" + liteStableHash([String(canonicalUrl).split(/[?#]/)[0], title, publishedTime, contextText.slice(0, 200)].join("|"));
  return { canonicalUrl, title, metaDescription, ogDescription, jsonLdDescription, firstParagraph, topParagraphs, contextText, contentHash, siteName, author, publishedTime, section, image };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { url, mode } = await req.json().catch(() => ({}));
    const targetUrl = normalizeUrl(url);
    const liteMode = String(mode || "").toLowerCase() === "lite";

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 VetraReader/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: withTimeoutSignal(liteMode ? Math.min(TIMEOUT_MS, 6000) : TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_HTML_BYTES) throw new Error("Página grande demais para extração segura.");

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) throw new Error("Página grande demais para extração segura.");

    const contentType = response.headers.get("content-type") || "";
    const html = decodeBuffer(buffer, contentType);
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Falha ao fazer parse do HTML");

    if (liteMode) {
      const context = extractLiteContext(html, doc, response.url || targetUrl);
      return jsonResponse({ finalUrl: response.url || targetUrl, mode: "lite", context });
    }

    stripDangerousNodes(doc);
    const reader = new Readability(doc, { charThreshold: 300 }).parse();
    if (!reader || !reader.textContent) throw new Error("Readability não conseguiu extrair conteúdo principal");

    return jsonResponse({
      finalUrl: response.url || targetUrl,
      reader: {
        title: reader.title,
        content: reader.content,
        textContent: reader.textContent,
        excerpt: reader.excerpt,
        siteName: reader.siteName,
        length: reader.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no proxy";
    console.error("proxy-view error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
