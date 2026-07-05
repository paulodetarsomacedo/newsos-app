import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIMEOUT_FULL_MS = 12000;
const TIMEOUT_LITE_MS = 5000;
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

function stripTags(html: string): string {
    return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = normalizeUrl(body.url);
    const mode = String(body.mode || "full").toLowerCase();
    
    const timeoutMs = mode === "lite" ? TIMEOUT_LITE_MS : TIMEOUT_FULL_MS;

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
      signal: withTimeoutSignal(timeoutMs),
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

    // ==========================================================
    // LITE MODE: Extração Rápida Sem Readability
    // ==========================================================
    if (mode === "lite") {
        const canonicalNode = doc.querySelector("link[rel='canonical']");
        const canonicalUrl = canonicalNode?.getAttribute("href") || response.url || targetUrl;

        const title = doc.querySelector("title")?.textContent || "";
        const metaDescription = doc.querySelector("meta[name='description'], meta[property='og:description']")?.getAttribute("content") || "";
        const ogDescription = doc.querySelector("meta[property='og:description']")?.getAttribute("content") || "";
        const image = doc.querySelector("meta[property='og:image']")?.getAttribute("content") || extractImageFromJsonLd(html) || "";
        
        let author = doc.querySelector("meta[name='author']")?.getAttribute("content") || "";
        let publishedTime = doc.querySelector("meta[property='article:published_time']")?.getAttribute("content") || "";
        let section = doc.querySelector("meta[property='article:section']")?.getAttribute("content") || "";
        let siteName = doc.querySelector("meta[property='og:site_name']")?.getAttribute("content") || "";

        let jsonLdDescription = "";
        const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const script of scripts) {
            try {
                const raw = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "").trim();
                const parsed = JSON.parse(raw);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of list) {
                    if (item.description) jsonLdDescription = item.description;
                    if (item.articleBody) jsonLdDescription = item.articleBody.substring(0, 500);
                    if (item.author?.name) author = item.author.name;
                    if (item.datePublished) publishedTime = item.datePublished;
                }
            } catch (e) {}
        }

        stripDangerousNodes(doc);

        const paragraphs = doc.querySelectorAll("p");
        let firstParagraph = "";
        const topParagraphs: string[] = [];
        
        let pCount = 0;
        for (const p of paragraphs) {
            const text = stripTags((p as any).textContent || "");
            if (text.length > 50) {
                if (!firstParagraph) firstParagraph = text;
                topParagraphs.push(text);
                pCount++;
                if (pCount >= 5) break; 
            }
        }

        const contextTextCandidates = [firstParagraph, jsonLdDescription, ogDescription, metaDescription];
        let contextText = "";
        for (const c of contextTextCandidates) {
            if (c && c.length > 50) {
                contextText = c.substring(0, 1200);
                break;
            }
        }

        let hash = 0;
        const strToHash = `${canonicalUrl}::${title}::${publishedTime}::${contextText.substring(0,50)}`;
        for (let i = 0; i < strToHash.length; i++) {
            hash = ((hash << 5) - hash) + strToHash.charCodeAt(i);
            hash = hash & hash;
        }
        const contentHash = Math.abs(hash).toString(16);

        return jsonResponse({
            finalUrl: response.url || targetUrl,
            mode: "lite",
            context: {
                canonicalUrl,
                title: stripTags(title),
                metaDescription,
                ogDescription,
                jsonLdDescription,
                firstParagraph,
                topParagraphs,
                contextText,
                contentHash,
                siteName,
                author,
                publishedTime,
                section,
                image
            }
        });
    }

    // ==========================================================
    // FULL MODE: Extração Completa com Readability (Padrão Antigo)
    // ==========================================================
    stripDangerousNodes(doc);
    const reader = new Readability(doc, { charThreshold: 300 }).parse();
    if (!reader || !reader.textContent) throw new Error("Readability não conseguiu extrair conteúdo principal");

    return jsonResponse({
      finalUrl: response.url || targetUrl,
      mode: "full",
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