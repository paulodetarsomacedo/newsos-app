// ARQUIVO: supabase/functions/market-proxy/index.ts
// Vetra — proxy leve para cotações Yahoo Finance (endpoint v8/chart), server-side (sem CORS).
// Retorna o JSON bruto do Yahoo, para o cliente continuar lendo json.chart.result[0] igual antes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIMEOUT_MS = 8000;
const YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function withTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function fetchYahooChart(symbol: string, interval: string, range: string): Promise<any> {
  const path = `v8/finance/chart/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
  let lastError = "";
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`https://${host}/${path}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          "Accept": "application/json,text/plain,*/*",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        redirect: "follow",
        signal: withTimeoutSignal(TIMEOUT_MS),
      });
      if (!res.ok) { lastError = `HTTP ${res.status} (${host})`; continue; }
      const text = await res.text();
      return JSON.parse(text);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(lastError || "Falha ao consultar Yahoo Finance");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const symbol = String(body?.symbol ?? "").trim();
    if (!symbol) return jsonResponse({ error: "symbol required" }, 400);
    const interval = String(body?.interval ?? "15m").trim();
    const range = String(body?.range ?? "1d").trim();

    const json = await fetchYahooChart(symbol, interval, range);
    if (!json?.chart?.result?.[0]) return jsonResponse({ error: "Sem dados para o símbolo" }, 502);
    return jsonResponse(json, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no market-proxy";
    console.error("market-proxy error:", message);
    return jsonResponse({ error: message }, 502);
  }
});
