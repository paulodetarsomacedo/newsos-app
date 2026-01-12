// Importa a biblioteca de autenticação do Google. 
// A Vercel a instalará automaticamente ao encontrar este 'import'.
import { GoogleAuth } from 'google-auth-library';

// Handler da Vercel: todo request para /api/chat vai executar esta função
export default async function handler(request, response) {
    // Apenas permite requisições do tipo POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. Extrai os dados enviados pelo frontend
        const { chatHistory, articleText, apiKeyFromFrontend } = request.body;

        // Validação básica para garantir que os dados necessários foram enviados
        if (!chatHistory || !articleText) {
            throw new Error("Dados insuficientes para a IA. 'chatHistory' e 'articleText' são necessários.");
        }

        // 2. Monta o prompt (a lógica permanece a mesma, agora no backend)
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

        // 3. Prepara o corpo da requisição para o Gemini (formato correto com 'role')
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
        };
        
        let geminiResponse;

        // ===================================================================
        // LÓGICA DE DECISÃO: QUAL MÉTODO DE AUTENTICAÇÃO USAR?
        // ===================================================================

        if (process.env.GOOGLE_CREDENTIALS_JSON && process.env.GOOGLE_PROJECT_ID) {
            // --- MÉTODO 1 (PREFERENCIAL): Autenticação Segura via Conta de Serviço ---
            console.log("Executando com autenticação do backend (Conta de Serviço).");

            const serviceAccountJson = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
            const auth = new GoogleAuth({
                credentials: serviceAccountJson,
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
            const accessToken = await auth.getAccessToken();

            const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
            const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash-preview-0514:generateContent`;

            geminiResponse = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            
        } else if (apiKeyFromFrontend) {
            // --- MÉTODO 2 (FALLBACK): Usa a chave fornecida pelo frontend ---
            console.warn("AVISO: Executando com chave de API do frontend. As credenciais do backend não estão configuradas.");
            
            // ATENÇÃO: Este endpoint é diferente do da Vertex AI.
            const FALLBACK_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeyFromFrontend}`;
            
            geminiResponse = await fetch(FALLBACK_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody), 
            });
        } else {
            // Se nenhuma credencial estiver disponível, retorna um erro claro.
            throw new Error("Nenhuma credencial de API configurada. Configure as variáveis de ambiente no backend ou forneça uma chave de API a partir do frontend.");
        }
        
        // ===================================================================
        // FIM DA LÓGICA DE DECISÃO
        // ===================================================================

        const data = await geminiResponse.json();

        // Tratamento de erro unificado
        if (!geminiResponse.ok) {
            console.error("Erro da API do Gemini:", data);
            throw new Error(data.error?.message || `Erro na chamada para a API do Gemini (Status: ${geminiResponse.status})`);
        }
        
        // Extrai a resposta e envia para o frontend
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "A IA não retornou uma resposta válida.";
        
        response.status(200).json({ text: aiResponseText });

    } catch (error) {
        // Captura qualquer erro no processo e envia uma resposta de erro para o frontend
        console.error("Erro geral na função da API:", error.message);
        response.status(500).json({ error: error.message });
    }
}