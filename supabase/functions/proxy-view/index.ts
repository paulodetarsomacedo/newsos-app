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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { url } = await req.json().catch(() => ({}));
    const targetUrl = normalizeUrl(url);

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
      signal: withTimeoutSignal(TIMEOUT_MS),
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
