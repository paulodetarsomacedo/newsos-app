// ARQUIVO: supabase/functions/proxy-view/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Readability } from "npm:@mozilla/readability@0.5.0"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cabeçalhos para simular um navegador real
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error("URL is required")

    // Sites que OBRIGATORIAMENTE precisam do modo pesado (Puppeteer)
    const heavySites = ['investing.com', 'uol.com.br'];
    const needsPuppeteer = heavySites.some(site => url.includes(site));
    
    let htmlContent;
    let readerResult;

    if (needsPuppeteer) {
        // --- MODO PESADO (PUPPETEER) ---
        console.log(`Using Puppeteer for: ${url}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent(BROWSER_HEADERS['User-Agent']);
        // Aumenta timeout para páginas lentas
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        htmlContent = await page.content();
        await browser.close();
    } else {
        // --- MODO RÁPIDO (FETCH) ---
        console.log(`Using Fetch for: ${url}`);
        const response = await fetch(url, { headers: BROWSER_HEADERS });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        htmlContent = await response.text();
    }

    // Processamento com Readability (comum aos dois modos)
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    if (!doc) throw new Error("Failed to parse document");
    
    const reader = new Readability(doc);
    readerResult = reader.parse();

    // Se o resultado do modo rápido foi muito curto, tenta de novo com Puppeteer
    if (!needsPuppeteer && (!readerResult || readerResult.textContent.length < 500)) {
        console.log(`Short content, retrying with Puppeteer for: ${url}`);
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent(BROWSER_HEADERS['User-Agent']);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        htmlContent = await page.content();
        await browser.close();
        
        const finalDoc = new DOMParser().parseFromString(htmlContent, "text/html");
        readerResult = new Readability(finalDoc).parse();
    }
    
    return new Response(JSON.stringify({
      html: htmlContent,
      reader: readerResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Proxy-view Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})