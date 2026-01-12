// arquivo: api/chat.js

// Tenta importar a biblioteca de autenticação. Se não estiver no package.json,
// a Vercel a instalará se encontrar este import.
import { GoogleAuth } from 'google-auth-library';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { chatHistory, articleText } = request.body;
        if (!chatHistory || !articleText) {
            throw new Error("Dados insuficientes para a IA. 'chatHistory' e 'articleText' são necessários.");
        }

        // --- AUTENTICAÇÃO SEGURA ---
        const serviceAccountJson = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        const auth = new GoogleAuth({
            credentials: serviceAccountJson,
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        const accessToken = await auth.getAccessToken();

        // --- CHAMADA PARA A VERTEX AI ---
        const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
        const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash-preview-0514:generateContent`;
        
        const userQuestion = chatHistory.findLast(m => m.from === 'user')?.text || "";
        const formattedHistory = chatHistory.map(m => `${m.from === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n');
        const prompt = `
          Você é um Assistente de Pesquisa especialista e amigável, conversando dentro de uma interface de chat.

          CONTEXTO PRINCIPAL (A notícia que o usuário está lendo):
          ---
          ${articleText.slice(0, 4000)}
          ---
          
          HISTÓRICO DA CONVERSA ATÉ AGORA:
          ---
          ${formattedHistory}
          ---

          SUA TAREFA:
          Continue a conversa respondendo à última pergunta do "Usuário" de forma natural e conversacional, como se estivesse em um chat.
          - Utilize o CONTEXTO PRINCIPAL para responder sobre fatos da notícia.
          - Mantenha as respostas curtas e diretas (1-3 frases).
          - AJA COMO UMA PESSOA, NÃO COMO UM ROBÔ. Seja prestativo.
          - Não repita a pergunta. Apenas dê a resposta.
        `;
        
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
        };

        const geminiResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Erro da API do Gemini:", data);
            throw new Error(data.error?.message || "Erro na chamada para a API do Gemini");
        }
        
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta.";

        response.status(200).json({ text: aiResponseText });

    } catch (error) {
        console.error("Erro no proxy da Vercel:", error.message);
        response.status(500).json({ error: error.message });
    }
}