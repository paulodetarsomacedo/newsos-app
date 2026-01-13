import { GoogleAuth } from 'google-auth-library';

export default async function handler(request, response) {
    // CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { marketNews, apiKeyFromFrontend } = request.body;

        if (!marketNews || marketNews.length === 0) {
            throw new Error("Sem notícias financeiras para analisar.");
        }

        // Monta o contexto apenas com ID e Título para economizar tokens
        const context = marketNews.map(n => `ID: ${n.id} | TÍTULO: ${n.title}`).join('\n');

        const prompt = `
          Aja como um Analista Financeiro Sênior da Bloomberg. Analise as manchetes:
          ${context}

          TAREFAS:
          1. Sentimento Geral (Ex: "Otimista", "Cauteloso").
          2. Resumo Executivo (1 frase impactante).
          3. Movers (2 ou 3 ativos). Para cada um: ativo, tendência (up/down/neutral), motivo (curto), news_id.

          RETORNE APENAS JSON ESTRITO:
          {
            "market_status": "String",
            "summary": "String",
            "movers": [{ "asset": "", "trend": "", "reason": "", "news_id": "" }]
          }
        `;

        const requestBody = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
        };

        let geminiResponse;

        // LÓGICA HÍBRIDA (Prioriza Backend Seguro)
        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            console.log("Backend Market: Usando Conta de Serviço");
            const auth = new GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
            const accessToken = await auth.getAccessToken();
            const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
            
            // USANDO O MODELO CORRETO: 1.5-flash
            const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;

            geminiResponse = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
        } else if (apiKeyFromFrontend) {
            // Fallback (modelo corrigido para 1.5)
            const FALLBACK = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyFromFrontend}`;
            geminiResponse = await fetch(FALLBACK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
        } else {
            throw new Error("Credenciais não configuradas.");
        }

        if (!geminiResponse.ok) {
            const err = await geminiResponse.json();
            throw new Error(err.error?.message || "Erro na API Google");
        }

        const data = await geminiResponse.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Limpeza e Parse
        const cleanJson = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        
        response.status(200).json(cleanJson);

    } catch (error) {
        console.error("Erro API Market:", error);
        response.status(500).json({ error: error.message });
    }
}