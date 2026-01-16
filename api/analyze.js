import { GoogleAuth } from 'google-auth-library';

export default async function handler(request, response) {
    // --- CORS PARA IPAD (CRUCIAL) ---
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { fullText, apiKeyFromFrontend } = request.body;

        if (!fullText) {
            throw new Error("Texto do artigo não fornecido.");
        }

        // --- O SUPER PROMPT VIVE AQUI AGORA (Segurança) ---
        const prompt = `
          Aja como um Analista de Inteligência Sênior. Analise o texto fornecido.
          
          GERE UM JSON ESTRITO COM ESTA ESTRUTURA EXATA (Tudo em PT-BR):
          {
            "summaries": {
              "executive": "Resumo formal, direto e jornalístico (3 parágrafos curtos e bem explicados).",
              "tldr": "Resumo em 1 única frase de impacto (Too Long Didn't Read).",
              "eli5": "Explicação didática como se fosse para uma criança de 5 anos (analogias).",
              "bullets": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3", "Ponto chave 4"]
            },
            "mindmap": {
                "center": "Tema Central (Max 3 palavras)",
                "nodes": ["Nó A", "Nó B", "Nó C", "Nó D"]
            },
            "contextualTerms": [
                {
                    "term": "Nó A (Nome exato do nó do mindmap)",
                    "context": "Definição do termo + Explique a importância específica dele NESTA notícia. SEJA DENSO E DETALHADO. NÃO use frases genéricas como 'Contexto geral'. Mínimo 25 palavras.",
                    "sentiment": "neutral", 
                    "evidence_quotes": ["Citação exata do texto onde o termo aparece."]
                },
                { "term": "Nó B", "context": "...", "sentiment": "positive", "evidence_quotes": ["..."] }
            ],
            "timeline": [
                { "time": "Passado (Causa Raiz)", "event": "O que causou o contexto geral desta notícia?" },
                { "time": "Recente (Gatilho)", "event": "Qual foi o evento específico que levou diretamente a esta matéria?" },
                { "time": "Hoje (Fato Principal)", "event": "Qual é o fato principal reportado na notícia de hoje?" }
            ],
            "future": {
              "optimistic": "Melhor cenário possível a longo prazo.",
              "pessimistic": "Pior cenário/Riscos envolvidos.",
              "probable": "O que realmente deve acontecer (análise realista)."
            }
          }
          
          TEXTO PARA ANÁLISE: 
          ${fullText.slice(0, 25000)}
        `;

        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            generationConfig: { response_mime_type: "application/json" }
        };

        let geminiResponse;

        // --- LÓGICA HÍBRIDA (Backend Seguro ou Fallback) ---
        if (process.env.GOOGLE_CREDENTIALS_JSON && process.env.GOOGLE_PROJECT_ID) {
            console.log("Backend: Usando Vertex AI (Conta de Serviço)");
            const serviceAccountJson = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
            const auth = new GoogleAuth({
                credentials: serviceAccountJson,
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
            const accessToken = await auth.getAccessToken();
            const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
            
            // Usando modelo estável
            const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;

            geminiResponse = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
        } else if (apiKeyFromFrontend) {
            console.log("Backend: Fallback para chave do frontend");
            const FALLBACK_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeyFromFrontend}`;
            geminiResponse = await fetch(FALLBACK_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody), 
            });
        } else {
            throw new Error("Credenciais não configuradas.");
        }

        if (!geminiResponse.ok) {
            const errData = await geminiResponse.json();
            throw new Error(errData.error?.message || "Erro na API do Google");
        }

        const data = await geminiResponse.json();
        let textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textRes) throw new Error("IA não retornou texto.");

        // Limpeza do JSON (Markdown) feita no servidor para garantir
        textRes = textRes.replace(/```json/g, '').replace(/```/g, '').trim();

        // Tenta fazer o parse aqui para garantir que enviamos um objeto válido
        const jsonFinal = JSON.parse(textRes);

        response.status(200).json(jsonFinal);

    } catch (error) {
        console.error("Erro Analyze:", error.message);
        response.status(500).json({ error: error.message });
    }
}