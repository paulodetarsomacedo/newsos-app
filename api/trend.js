// /pages/api/trend.js

import { GoogleAuth } from 'google-auth-library';

export default async function handler(request, response) {
    // Bloco de CORS (essencial para funcionar no App e na Web)
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    try {
        // 1. Extrai os dados do frontend (agora esperamos 'news')
        const { news, apiKeyFromFrontend } = request.body;

        if (!news || news.length === 0) {
            throw new Error("Sem notícias para analisar no Trend Radar.");
        }

        // 2. Monta o contexto e o prompt (lógica copiada do seu frontend)
        const context = news.slice(0, 40).map((n, index) =>
            `${index}|${n.title}|${n.summary ? n.summary.slice(0, 60) : ''}`
        ).join('\n');

        const prompt = `
          Identifique 6 Tópicos quentes. Retorne JSON:
          [ { "topic": "Nome", "score": 1-10, "hex": "#hex", "summary": "Fato..." } ]
          DADOS:
          ${context}
        `;

        const requestBody = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
        };

        let geminiResponse;

        // 3. Lógica Híbrida de Autenticação (idêntica à da API /market)
        if (process.env.GOOGLE_CREDENTIALS_JSON && process.env.GOOGLE_PROJECT_ID) {
            console.log("Backend Trend Radar: Usando Conta de Serviço (Produção)");
            const auth = new GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
            const accessToken = await auth.getAccessToken();
            const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
            const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;

            geminiResponse = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
        } else if (apiKeyFromFrontend) {
            console.warn("Backend Trend Radar: Usando chave do frontend (Fallback)");
            const FALLBACK = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyFromFrontend}`;
            geminiResponse = await fetch(FALLBACK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
        } else {
            throw new Error("Credenciais de API não configuradas no backend.");
        }

        if (!geminiResponse.ok) {
            const err = await geminiResponse.json();
            throw new Error(err.error?.message || "Erro na API do Google");
        }

        const data = await geminiResponse.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
             throw new Error("A IA não retornou uma resposta de texto.");
        }

        const cleanJson = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        // 4. Envia a resposta limpa de volta para o frontend
        response.status(200).json(cleanJson);

    } catch (error) {
        console.error("Erro na API Trend Radar:", error);
        response.status(500).json({ error: error.message });
    }
}