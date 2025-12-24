const FEED_NEWS = []; // Limpo para evitar dados fantasmas



// ==========================================================
// FUNÇÕES DE INTELIGÊNCIA ARTIFICIAL (V3.1 - 4 TÓPICOS)
// ==========================================================

const cleanGeminiJSON = (text) => {
  if (!text) return "";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const parseAndNormalize = (text) => {
    try {
        const cleanText = cleanGeminiJSON(text);
        const json = JSON.parse(cleanText);
        if (Array.isArray(json)) {
            console.log("IA retornou Array, normalizando para Objeto...");
            return json[0];
        }
        return json;
    } catch (e) {
        console.error("Erro ao fazer parse do JSON:", e);
        return null;
    }
}



// --- FALLBACK (ATUALIZADO PARA 4 TÓPICOS) ---
const generateBriefingFallback = async (news, apiKey) => {
    console.log("Iniciando Fallback (Gemini 1.5)...");
    
    if (!news || news.length === 0) return null;
    
    const context = news.slice(0, 15).map(n => `- ${n.title}`).join('\n');
    
    const prompt = `
      Atue como editor de notícias. Resuma os fatos abaixo em um JSON estrito.
      
      NOTÍCIAS:
      ${context}
      
      SCHEMA JSON OBRIGATÓRIO (4 TÓPICOS):
      { 
        "vibe_emoji": "🔥", 
        "vibe_title": "Resumo Rápido", 
        "topics": [
          { "tag": "Geral", "summary": "Resumo conciso de 20 palavras." },
          { "tag": "Destaques", "summary": "Outros pontos relevantes." },
          { "tag": "Mercados", "summary": "Movimentações financeiras ou políticas." },
          { "tag": "Variedades", "summary": "Esportes, cultura ou tecnologia." }
        ] 
      }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });
        
        const data = await response.json();
        
        if (data.error) { return null; }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Vazio");
        
        return parseAndNormalize(text);
    } catch (e) {
        console.error("Erro fatal no sistema de Fallback:", e);
        return null;
    }
};

// --- FUNÇÃO DE IA: CLUSTERIZAÇÃO NARRATIVA (COM LIMITE DINÂMICO) ---
const generateSmartClustering = async (news, apiKey, limit = 300) => {
  // Verificação básica (Limite mínimo de 10 notícias para rodar)
  if (!news || news.length < 10 || !apiKey) return null;

  // AGORA O LIMITE É DINÂMICO (30 no início, 300 depois)
  const context = news.slice(0, limit).map(n => 
    `ID: ${n.id} | FONTE: ${n.source} | TÍTULO: ${n.title} | IMG: ${n.img || ''}`
  ).join('\n');

  const prompt = `
  Você é um Editor-Chefe de um App de Notícias Premium no Brasil.
  
  SUA MISSÃO CRÍTICA:
  Gerar EXATAMENTE 3 (TRÊS) cards para o carrossel "Contexto Global".
  
  HIERARQUIA DE SELEÇÃO:
  1. Tente agrupar eventos com múltiplas fontes.
  2. Se a lista de notícias for pequena, aceite eventos com menos fontes, mas GARANTA 3 TÓPICOS DISTINTOS.
  
  ESTRUTURA DO JSON (Para cada um dos 3 cards):
  - ai_title: Título em Português do Brasil. Curto e impactante (Máx 10 palavras).
  - representative_image: Copie a URL do campo 'IMG' de uma das notícias.
  - related_articles: Liste os IDs das notícias do cluster. Analise o sentimento ('positive', 'negative', 'neutral').

  DADOS BRUTOS (${limit} itens):
  ${context}

  RETORNE APENAS O ARRAY JSON COM OS 3 OBJETOS.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    const hydratedJson = json.map(cluster => {
        const hydratedArticles = cluster.related_articles
            .map(ref => {
                const originalArticle = news.find(n => n.id === ref.id);
                if (!originalArticle) return null;
                return { ...originalArticle, ai_sentiment: ref.sentiment }; 
            })
            .filter(Boolean);

        const uniqueArticles = [];
        const seenSources = new Set();
        hydratedArticles.forEach(art => {
            if (!seenSources.has(art.source)) {
                seenSources.add(art.source);
                uniqueArticles.push(art);
            }
        });

        return { ...cluster, related_articles: uniqueArticles };
    }).filter(c => c.related_articles.length > 0); 

    return Array.isArray(hydratedJson) ? hydratedJson : null;

  } catch (error) {
    console.error("Erro Smart Clustering:", error);
    return null;
  }
};

// --- FUNÇÃO DE IA: SMART DIGEST (COM RASTREABILIDADE) ---
const generateBriefing = async (news, apiKey) => {
  if (!news || news.length === 0) return null;
  if (!apiKey) {
      alert("API Key não configurada! Vá em Ajustes > Inteligência IA.");
      return null;
  }

  // Preparamos o contexto com ID para a IA saber o que referenciar
  const context = news.slice(0, 40).map(n => {
      const cleanSummary = n.summary ? n.summary.replace(/<[^>]*>?/gm, '').slice(0, 300) : "Sem detalhes.";
      return `ID: ${n.id} | [FONTE: ${n.source}] TÍTULO: ${n.title} | CONTEXTO: ${cleanSummary}`;
  }).join('\n\n');

  const prompt = `
  Você é o Editor-Chefe de uma newsletter premium (estilo Morning Brew).
  
  SUA MISSÃO:
  Ler as notícias fornecidas abaixo, identificar os 4 (QUATRO) maiores temas do momento e escrever resumos EXPLICATIVOS, fluídos e concatenados.
  
  REGRAS EDITORIAIS:
  1. CONTEXTUALIZE: Não apenas repita o título. Explique o "porquê".
  2. AGRUPE: Junte notícias parecidas no mesmo tópico.
  3. TOM DE VOZ: Profissional, direto, mas conversacional.
  4. TAMANHO: O campo "summary" deve ter entre 40 a 55 palavras.

  REGRAS OBRIGATÓRIAS:
  1. Identifique quais notícias (pelos IDs) compõem cada tópico.
  2. O resumo deve explicar o "porquê" do fato ser importante.
  3. JSON Estrito.

  MATÉRIA PRIMA:
  ${context}

  RETORNE APENAS ESTE JSON:
  {
    "vibe_emoji": "Um único emoji que defina o humor global",
    "vibe_title": "Uma manchete de capa impactante (3 a 6 palavras)",
    "topics": [
      { 
        "tag": "Categoria (Ex: Política, Tech)", 
        "summary": "Texto explicativo rico (30-40 palavras)...",
        "source_ids": ["id_da_noticia_1", "id_da_noticia_2"] 
      }
    ]
  }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();

    if (data.error) {
        console.warn(`Erro IA: ${data.error.message}`);
        return await generateBriefingFallback(news, apiKey); // Mantém seu fallback existente
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return await generateBriefingFallback(news, apiKey);

    const finalData = parseAndNormalize(text);
    
    if (!finalData || !finalData.topics) return await generateBriefingFallback(news, apiKey);

    // --- HIDRATAÇÃO: Cruzar IDs com as notícias reais ---
    finalData.topics = finalData.topics.map(topic => {
        const relatedArticles = topic.source_ids
            ? topic.source_ids.map(id => news.find(n => n.id === id)).filter(Boolean)
            : [];
        return { ...topic, articles: relatedArticles };
    });

    return finalData;

  } catch (error) {
    console.warn("Erro fatal SmartDigest:", error);
    return await generateBriefingFallback(news, apiKey);
  }
};



// --- FUNÇÃO TREND RADAR (V4 - SINGLE FACT FOCUS) ---
const generateTrendRadar = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  // Enviamos Título + Snippet para a IA ter contexto
  const context = news.slice(0, 40).map(n => `- ${n.title} (${n.summary ? n.summary.slice(0, 80) : ''})`).join('\n');

  const prompt = `
  Analise estas manchetes. Agrupe por temas e identifique os 6 Tópicos mais quentes.
  
  Para cada tópico, siga esta lógica OBRIGATÓRIA:
  1. Identifique a notícia "Capitânia" (a mais importante/impactante daquele grupo).
  2. Esqueça as outras notícias menores do grupo. Foco total na Capitânia.
  3. Escreva um resumo de 2 a 3 linhas explicando ESSE FATO específico.
  
  Gere este JSON:
  - "topic": Nome curto do tema (Ex: "Mercosul", "SpaceX").
  - "score": 1 a 10.
  - "hex": Cor hexadecimal.
  - "summary": O texto explicando o fato principal.
  
  EXEMPLO DE SUMMARY (O que eu quero):
  "Lula endurece discurso e exige que União Europeia retire taxas ambientais para fechar o acordo ainda hoje."
  
  EXEMPLO DO QUE NÃO FAZER (Genérico):
  "Discussões sobre taxas e clima continuam no bloco econômico."

  DADOS:
  ${context}

  RETORNE APENAS A LISTA JSON:
  [ { "topic": "...", "score": 9, "hex": "#...", "summary": "..." } ]
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return null;
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);

    if (Array.isArray(json)) return json;
    const possibleArray = Object.values(json).find(val => Array.isArray(val));
    if (possibleArray) return possibleArray;

    return []; 

  } catch (error) {
    console.warn("Erro Trend Radar:", error);
    return []; 
  }
};

// --- FUNÇÃO DE IA: ANÁLISE DE MERCADO (COM FOCO EM DÓLAR/BOVESPA) ---
const generateMarketAnalysis = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  // Filtra notícias de mercado com mais abrangência
  const marketNews = news.filter(n => 
      n.category === 'Economia' || 
      n.category === 'Finanças' || 
      n.category === 'Mercados' ||
      n.category === 'Tech' ||
      n.title.toLowerCase().includes('dólar') ||
      n.title.toLowerCase().includes('ibovespa') ||
      n.title.toLowerCase().includes('bolsa') ||
      n.title.toLowerCase().includes('bitcoin') ||
      n.title.toLowerCase().includes('juros')
  ).slice(0, 35);

  if (marketNews.length === 0) return null;

  const context = marketNews.map(n => `FONTE: ${n.source} | TÍTULO: ${n.title}`).join('\n');
  
  // Detecta hora (Brasília aproximada pelo client)
  const currentHour = new Date().getHours();
  // Lógica simples: Fechado antes das 9h ou depois das 18h
  const isLikelyClosed = currentHour >= 18 || currentHour < 9; 

  const prompt = `
  Atue como um Analista de Mercado Sênior (ex: Bloomberg/Valor).
  Hora atual: ${currentHour}h. Status provável: ${isLikelyClosed ? "FECHADO" : "ABERTO"}.

  MANCHETES:
  ${context}

  TAREFAS OBRIGATÓRIAS:
  1. Calcule o "Market Score" (0=Pânico, 100=Euforia).
  2. Resumo Executivo (2 frases) para o corpo principal.
  3. "Movers": Identifique 4 ativos principais. Tente incluir Dólar e Ibovespa se houver menção.
  4. RODAPÉ TIPO TICKER (Bottom Summary):
     - Se FECHADO: Crie um texto de 3 linhas. A primeira linha DEVE conter o fechamento do Ibovespa e Dólar (ex: "Ibovespa -0.5% (126k) | Dólar +0.2% (5.10)"). As outras linhas resumem os destaques.
     - Se ABERTO: Resuma a tendência atual e a perspectiva de fechamento. Cite Dólar e Bolsa.

  RETORNE APENAS JSON ESTRITO:
  {
    "market_score": 60,
    "market_status": "Cautela",
    "summary": "Texto do resumo principal...",
    "market_state": "${isLikelyClosed ? 'CLOSED' : 'OPEN'}",
    "trend_direction": "bullish" | "bearish" | "neutral",
    "bottom_summary": "Linha 1: Ibovespa e Dólar...\\nLinha 2: Destaque corporativo...\\nLinha 3: Cenário macro...",
    "movers": [
      { "asset": "Dólar", "trend": "up", "change_label": "+0.5%", "news_id": "...", "reason": "Motivo curto" },
      { "asset": "IBOV", "trend": "down", "change_label": "-1.0%", "news_id": "...", "reason": "Realização de lucros" }
    ]
  }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    
    // Hidratação dos links
    if (json.movers) {
        json.movers = json.movers.map(mover => {
            const article = news.find(n => n.id === mover.news_id);
            return { ...mover, article }; // Pode ser null se a IA alucinar ID
        }); 
        // Mantemos mesmo sem artigo para mostrar o dado visual, mas sem clique se falhar
    }

    return json;

  } catch (error) {
    console.error("Erro Market Analysis:", error);
    return null;
  }
};


// --- WIDGET: SMART DIGEST (COM ÁUDIO NATIVO E FONTES EXPANSÍVEIS) ---
const SmartDigestWidget = ({ newsData, apiKey, isDarkMode, refreshTrigger, openArticle }) => {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle'); 
  
  // Estado para controlar qual tópico está expandido (Accordion)
  const [expandedIndex, setExpandedIndex] = useState(null);
  
  // Estado para o Áudio
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  useEffect(() => {
    if (refreshTrigger > 0) {
        setDigest(null);
        setStatus('idle');
        cancelSpeech(); // Para o áudio se recarregar
    }
  }, [refreshTrigger]);

  // Garante que o áudio pare se o componente desmontar
  useEffect(() => {
      return () => cancelSpeech();
  }, []);

  const handleGenerate = async () => {
    if (!apiKey) {
        alert("Configure sua API Key nas configurações primeiro.");
        return;
    }
    setStatus('loading');
    await new Promise(r => setTimeout(r, 800));

    const result = await generateBriefing(newsData, apiKey);
    
    if (result) {
        setDigest(result);
        setStatus('success');
    } else {
        setStatus('error');
    }
  };

  // --- LÓGICA DE ÁUDIO NATIVO (TTS) ---
  const cancelSpeech = () => {
      if (synthRef.current) {
          synthRef.current.cancel();
          setIsSpeaking(false);
      }
  };

  const handlePlayBriefing = () => {
      if (!synthRef.current || !digest) return;

      if (isSpeaking) {
          cancelSpeech();
          return;
      }

      setIsSpeaking(true);

      // Monta o texto para leitura fluida
      const intro = `Resumo do News O S. ${digest.vibe_title}.`;
      const content = digest.topics.map(t => `${t.tag}. ${t.summary}`).join('. Próximo: ');
      const finalText = `${intro} ${content}. Fim do resumo.`;

      const utterance = new SpeechSynthesisUtterance(finalText);
      utterance.lang = 'pt-BR'; // Força português
      utterance.rate = 1.1; // Um pouco mais dinâmico
      utterance.pitch = 1;

      // Evento quando termina de falar
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
  };

  const toggleExpand = (index) => {
      setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Estilo 3D das tags (Mantido da sua versão anterior)
  const getTag3DStyle = (index) => {
      const base3D = "shadow-[0_2px_5px_-1px_rgba(0,0,0,0.2)] border-t border-b";
      if (isDarkMode) {
          const styles = [
              `bg-gradient-to-b from-blue-500/20 to-blue-600/10 text-blue-200 border-t-blue-400/30 border-b-blue-900/50 ${base3D}`,
              `bg-gradient-to-b from-orange-500/20 to-orange-600/10 text-orange-200 border-t-orange-400/30 border-b-orange-900/50 ${base3D}`,
              `bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 text-emerald-200 border-t-emerald-400/30 border-b-emerald-900/50 ${base3D}`,
              `bg-gradient-to-b from-purple-500/20 to-purple-600/10 text-purple-200 border-t-purple-400/30 border-b-purple-900/50 ${base3D}`,
          ];
          return styles[index % styles.length];
      } else {
          const styles = [
              `bg-gradient-to-b from-blue-50 to-blue-100/50 text-blue-700 border-t-white border-b-blue-200 ${base3D}`,
              `bg-gradient-to-b from-orange-50 to-orange-100/50 text-orange-700 border-t-white border-b-orange-200 ${base3D}`,
              `bg-gradient-to-b from-emerald-50 to-emerald-100/50 text-emerald-700 border-t-white border-b-emerald-200 ${base3D}`,
              `bg-gradient-to-b from-purple-50 to-purple-100/50 text-purple-700 border-t-white border-b-purple-200 ${base3D}`,
          ];
          return styles[index % styles.length];
      }
  };

  // --- RENDERIZAÇÃO ---

  if (status === 'idle') {
    return (
      <div className="px-1 mb-6">
        <div className={`relative overflow-hidden rounded-[2rem] p-8 border transition-all shadow-lg ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                 <Sparkles size={24} className="text-white animate-pulse" />
              </div>
              <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>O que está acontecendo?</h2>
              <p className={`text-sm mb-6 max-w-[260px] leading-relaxed opacity-70 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Deixe a IA ler {newsData?.length || 0} manchetes e explicar o mundo para você em segundos.
              </p>
              <button onClick={handleGenerate} className={`group relative px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest overflow-hidden shadow-xl active:scale-95 transition-all ${isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center gap-2 relative z-10"><Zap size={14} fill="currentColor"/> Gerar Smart Digest</span>
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="px-1 mb-6">
        <div className={`h-[350px] rounded-[2rem] flex flex-col items-center justify-center border relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mb-6" />
           <div className="text-center space-y-1 relative z-10">
               <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Processando Fatos...</p>
               <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Lendo Fontes • Analisando Viés</p>
           </div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !digest) {
      return (
        <div className="px-1 mb-6">
            <div className="p-6 rounded-[2rem] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
                <p className="text-red-500 font-bold text-sm mb-2">A IA falhou ao processar.</p>
                <button onClick={handleGenerate} className="text-xs font-bold underline decoration-red-500 underline-offset-4 opacity-80 hover:opacity-100">Tentar Novamente</button>
            </div>
        </div>
      );
  }

  return (
    <div className="px-1 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className={`
        relative p-6 rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all
        ${isDarkMode 
            ? 'bg-zinc-950 border-white/10' 
            : 'bg-white border-white/40 shadow-indigo-500/10'}
      `}>
         
         {/* CAMADA DE AURA */}
         <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] opacity-20 animate-pulse ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-300'}`} />
         <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-20 animate-pulse delay-1000 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-300'}`} />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light pointer-events-none"></div>
         <div className="absolute inset-0 backdrop-blur-[1px]" />

         {/* CONTEÚDO */}
         <div className="relative z-10">
             
             {/* Cabeçalho com Botão de Áudio */}
             <div className="flex flex-col items-center text-center mb-8 pt-2">
                <div className="text-5xl mb-3 animate-bounce drop-shadow-xl select-none grayscale-0">
                    {digest.vibe_emoji}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-1">
                    Vibe do Momento
                </span>
                <h2 className={`text-2xl md:text-3xl font-black leading-tight max-w-sm mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {digest.vibe_title}
                </h2>
                
                {/* BOTÃO DE AUDIO BRIEFING (TTS Nativo) */}
                <button 
                    onClick={handlePlayBriefing}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95
                        ${isSpeaking 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                            : (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200')}
                    `}
                >
                    {isSpeaking ? (
                        <> <Pause size={12} fill="currentColor" /> Parar Briefing </>
                    ) : (
                        <> <Play size={12} fill="currentColor" /> Ouvir Resumo </>
                    )}
                </button>
             </div>

             {/* GRID DE TÓPICOS (ACORDEÃO) */}
             <div className="grid grid-cols-1 gap-4">
                {digest.topics?.map((topic, i) => {
                    const isExpanded = expandedIndex === i;
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => toggleExpand(i)}
                            className={`
                                group relative p-5 rounded-3xl transition-all duration-300 backdrop-blur-md cursor-pointer
                                ${isDarkMode 
                                    ? 'bg-zinc-900/60 border-t border-l border-white/10 border-b border-r border-black/40' 
                                    : 'bg-white/70 border-t border-l border-white border-b border-r border-zinc-200/60'}
                                ${isExpanded ? 'ring-2 ring-purple-500/30 scale-[1.02] z-20' : 'hover:scale-[1.01]'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl backdrop-blur-sm ${getTag3DStyle(i)}`}>
                                    {topic.tag}
                                </span>
                                
                                <div className={`flex items-center gap-2`}>
                                    {/* Indicador de Quantidade de Fontes */}
                                    {topic.articles && topic.articles.length > 0 && (
                                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-wide">
                                            {topic.articles.length} {topic.articles.length === 1 ? 'Fonte' : 'Fontes'}
                                        </span>
                                    )}
                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} opacity-50`}>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                            
                            <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                                {topic.summary}
                            </p>

                            {/* ÁREA EXPANDIDA (FONTES ORIGINAIS) */}
                            <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="min-h-0">
                                    <div className={`h-px w-full mb-3 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Baseado em:</p>
                                    
                                    <div className="space-y-2">
                                        {topic.articles && topic.articles.length > 0 ? (
                                            topic.articles.map((article, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); openArticle(article); }}
                                                    className={`
                                                        flex items-center gap-3 p-2 rounded-xl border transition-colors hover:scale-[1.01] active:scale-95
                                                        ${isDarkMode ? 'bg-black/20 border-white/5 hover:bg-white/5' : 'bg-white/50 border-black/5 hover:bg-white'}
                                                    `}
                                                >
                                                    <img 
                                                        src={article.logo} 
                                                        className="w-6 h-6 rounded-lg object-cover" 
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className={`text-[9px] font-bold uppercase mb-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                            {article.source}
                                                        </div>
                                                        <div className={`text-xs font-bold leading-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                            {article.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] opacity-50 italic pl-1">
                                                Fontes não identificadas diretamente.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })}
             </div>

             {/* Rodapé */}
             <div className="mt-6 flex justify-between items-center px-2">
                <div className="flex items-center gap-1.5 opacity-40">
                    <BrainCircuit size={12} />
                    <span className="text-[10px] font-mono tracking-wide">Gemini 2.0 Flash</span>
                </div>
                <button 
                    onClick={handleGenerate} 
                    className={`p-2 rounded-full transition-all active:rotate-180 backdrop-blur-md border border-transparent hover:border-current ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-indigo-600 hover:bg-white/50'}`}
                    title="Regerar análise"
                >
                    <RefreshCw size={16}/>
                </button>
             </div>
         </div>
      </div>
    </div>
  );
};


// --- WIDGET: CONTEXTO GLOBAL (PROGRESSIVE LOADING - 30 -> 300) ---
const WhileYouWereAwayWidget = ({ news, openArticle, isDarkMode, apiKey, clusters, setClusters }) => {
  const [loading, setLoading] = useState(false); // Loading Inicial (Tela vazia)
  const [isUpgrading, setIsUpgrading] = useState(false); // Loading Secundário (Aprimorando)
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  
  // Controle de estados da execução
  const hasStartedRef = useRef(false);

  // Função Mestra de Execução
  const runAISequence = async () => {
      if (!apiKey || !news || news.length < 10) return;

      // --- FASE 1: RÁPIDA (30 Notícias) ---
      setLoading(true);
      // Chama a função com limite 30 (Resposta em ~1.5s)
      const quickResult = await generateSmartClustering(news, apiKey, 30);
      
      if (quickResult && quickResult.length > 0) {
          setClusters(quickResult);
      }
      setLoading(false);

      // --- FASE 2: PROFUNDA (300 Notícias) ---
      // Só inicia a fase 2 se tivermos notícias suficientes para valer a pena
      if (news.length > 50) {
          setIsUpgrading(true); // Ativa o texto animado
          
          // Delay técnico para dar respiro à API e permitir que o usuário veja o primeiro resultado
          await new Promise(r => setTimeout(r, 2000)); 

          // Chama a função com limite 300 (Pode demorar ~4-6s)
          const deepResult = await generateSmartClustering(news, apiKey, 300);

          if (deepResult && deepResult.length > 0) {
              setClusters(deepResult); // Substitui suavemente
          }
          setIsUpgrading(false); // Desliga o texto animado
      }
  };

  // --- EFEITO: DISPARO ÚNICO ---
  useEffect(() => {
      // Dispara apenas se tiver notícias, clusters vazio e nunca tiver rodado antes
      if (news && news.length > 10 && (!clusters || clusters.length === 0) && !hasStartedRef.current) {
          hasStartedRef.current = true;
          runAISequence();
      }
  }, [news, apiKey, clusters]); 

  // Função Manual (Botão Atualizar) - Roda direto a completa
  const handleManualRefresh = async () => {
      if (!apiKey) return alert("Configure a API Key.");
      setLoading(true);
      setClusters(null);
      const result = await generateSmartClustering(news, apiKey, 300);
      if (result) setClusters(result);
      else alert("Falha ao atualizar.");
      setLoading(false);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== activeIndex) setActiveIndex(newIndex);
    }
  };

  const getSentimentGlow = (sentiment) => {
      if (sentiment === 'positive') return 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]'; 
      if (sentiment === 'negative') return 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';    
      return 'border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'; 
  };
  
  // --- RENDERIZAÇÃO: LOADING INICIAL (SKELETON) ---
  if (loading || (!clusters && news && news.length > 0 && !hasStartedRef.current)) {
      return (
        <div className="relative w-full px-2 animate-in fade-in duration-500">
            <div className="relative z-10 flex items-center gap-3 mb-5 px-4 opacity-50">
                <div className={`p-2 rounded-xl bg-zinc-200 dark:bg-white/5`}><Layers size={18} /></div>
                <div className="h-4 w-32 bg-zinc-200 dark:bg-white/5 rounded-full" />
            </div>
            <div className={`h-[480px] rounded-[2.5rem] w-full relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-zinc-200 border border-zinc-300'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 w-full animate-[shimmer_1.5s_infinite]" />
            </div>
        </div>
      );
  }

  // Se falhou tudo
  if (!clusters || clusters.length === 0) return null;

  // --- RENDERIZAÇÃO: CONTEÚDO FINAL ---
  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative w-full">
            
            {/* Header Inteligente */}
            <div className="relative z-10 flex items-center justify-between mb-5 px-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shadow-lg ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-indigo-600 shadow-indigo-200'}`}>
                        {isUpgrading ? <Loader2 size={18} className="animate-spin text-purple-400" /> : <Layers size={18} />}
                    </div>
                    
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 leading-none">
                            Contexto Global
                        </h3>
                        
                        {/* TEXTO ANIMADO DE UPGRADE */}
                        {isUpgrading && (
                            <span className="text-[10px] font-bold text-purple-500 animate-pulse mt-1 tracking-wider uppercase">
                                Analisando 300 fontes em tempo real...
                            </span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleManualRefresh}
                    disabled={isUpgrading}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 border backdrop-blur-md
                        ${isUpgrading ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                        ${isDarkMode 
                            ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' 
                            : 'border-black/5 bg-black/5 text-zinc-600 hover:text-black hover:bg-black/10'}
                    `}
                >
                    <RefreshCw size={12} />
                    <span>Atualizar</span>
                </button>
            </div>

            {/* Scroll Horizontal */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 px-2"
            >
                {clusters.map((cluster, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 snap-center p-2">
                        <div className={`
                            group relative h-[480px] w-full rounded-[2.5rem] overflow-hidden cursor-default 
                            transition-all duration-500 hover:scale-[1.01]
                            shadow-2xl shadow-black/40 border border-white/10
                        `}>
                            <img 
                                src={cluster.representative_image} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                                alt="" 
                                onError={(e) => { e.target.style.display = 'none'; }} 
                            />
                            <div className={`absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900 to-purple-900`} /> 
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                            <div className="absolute top-6 left-6">
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
                                   <Globe size={14} className="text-blue-400" />
                                   <span className="text-white text-[10px] font-black uppercase tracking-[0.15em]">
                                       {cluster.related_articles.length} Fontes
                                   </span>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end">
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl tracking-tight">
                                   {cluster.ai_title}
                                </h2>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                   {cluster.related_articles.map(article => (
                                       <button
                                           key={article.id}
                                           onClick={() => openArticle(article)}
                                           className={`
                                               relative w-12 h-12 rounded-full p-[2px] transition-all duration-300 
                                               hover:scale-125 hover:z-10 bg-black/40 backdrop-blur-sm border-2
                                               ${getSentimentGlow(article.ai_sentiment)}
                                           `}
                                           title={`${article.source}: ${article.title}`}
                                       >
                                           <img src={article.logo} className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'} />
                                       </button>
                                   ))}
                                </div>

                                <div className="mt-4 flex items-center gap-2 opacity-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                                        {isUpgrading ? 'Aprimorando dados...' : 'Análise de Viés em Tempo Real'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Paginação */}
            {clusters.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                  {clusters.map((_, idx) => (
                      <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${activeIndex === idx ? 'bg-indigo-500 w-8' : 'bg-zinc-300 dark:bg-zinc-700 w-2'}`} />
                  ))}
              </div>
            )}
        </div>
    </div>
  );
};




// --- COMPONENTE TREND RADAR (V4 - ATUALIZAÇÃO ESTRITA: APENAS PUSH OU START) ---
const TrendRadar = ({ newsData, apiKey, isDarkMode, refreshTrigger }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  // TRAVAS LÓGICAS (IGUAL AO CONTEXTO GLOBAL)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const prevRefreshTrigger = useRef(refreshTrigger);

  const getHeatColor = (score) => {
      if (score >= 9) return '#ef4444'; 
      if (score >= 7) return '#f97316'; 
      if (score >= 5) return '#10b981'; 
      return '#3b82f6';                 
  };

  useEffect(() => {
    // 1. Validações Básicas
    if (!apiKey || !newsData || newsData.length === 0) return;

    // 2. Verifica se é um comando de Refresh do Usuário
    const isUserRefresh = refreshTrigger !== prevRefreshTrigger.current;

    // 3. A REGRA DE OURO:
    // Se JÁ carregou a primeira vez E NÃO foi um refresh do usuário... PARE.
    if (hasLoadedInitial && !isUserRefresh) {
        return;
    }

    // Atualiza referências
    prevRefreshTrigger.current = refreshTrigger;
    if (!hasLoadedInitial) setHasLoadedInitial(true);
    
    const loadTrends = async () => {
        setLoading(true);
        setActiveIndex(null);
        
        // Limpa visualmente apenas se for refresh manual
        if (isUserRefresh) setTrends(null);

        // Delay visual
        await new Promise(r => setTimeout(r, isUserRefresh ? 1000 : 600)); 
        
        const data = await generateTrendRadar(newsData, apiKey);
        
        if (data && Array.isArray(data)) {
            setTrends(data);
        }
        setLoading(false);
    };

    loadTrends();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsData, apiKey, refreshTrigger]);

  const handleToggle = (idx) => {
      setActiveIndex(activeIndex === idx ? null : idx);
  };

  // Pega o item ativo
  const activeItem = activeIndex !== null && trends ? trends[activeIndex] : null;

  if ((!trends || !Array.isArray(trends)) && !loading) return null;

  return (
    <div className="relative z-[50] mb-4 animate-in fade-in duration-1000 slide-in-from-right-8">
      
      <style>{`
        @keyframes shimmer-text {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
        .animate-shimmer-text {
            background-size: 200% auto;
            animation: shimmer-text 3s linear infinite;
        }
      `}</style>

      {/* --- CABEÇALHO --- */}
      <div className={`flex items-center justify-center gap-2 mb-3 transition-all duration-500 ${loading ? 'opacity-100 scale-105' : 'opacity-70 scale-100'}`}>
         <div className="relative">
            {loading ? (
                <>
                    <Activity size={14} className="text-orange-500 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30" />
                </>
            ) : (
                <Activity size={14} className="text-orange-500" />
            )}
         </div>

         {loading ? (
             <span className="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-200 to-orange-600 animate-shimmer-text">
                 Detecting Trends...
             </span>
         ) : (
             <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                 Trend Radar
             </span>
         )}
      </div>

      {loading ? (
         <div className="flex justify-center gap-4 overflow-hidden px-2 opacity-50 pb-8">
            {[1,2,3,4].map(i => (
                <div key={i} className={`h-9 w-24 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            ))}
         </div>
      ) : (
         <div className="flex flex-col w-full">
             
             {/* 1. LISTA DE PÍLULAS (Scroll Horizontal) */}
             <div className="flex justify-start md:justify-center items-start gap-3 overflow-x-auto scrollbar-hide px-4 pt-6 pb-2 snap-x relative z-20">
                {trends.map((item, idx) => {
                    const color = getHeatColor(item.score);
                    const isActive = activeIndex === idx;
                    const isExplosive = item.score >= 9;
                    const scale = isActive ? 'scale-105' : 'scale-100 hover:scale-105';

                    return (
                        <div key={idx} className="relative flex-shrink-0 snap-center flex flex-col items-center">
                            <button 
                                onClick={() => handleToggle(idx)}
                                className={`
                                    relative group cursor-pointer transition-all duration-300 ${scale} z-10
                                `}
                            >
                                <div 
                                    className="absolute inset-0 rounded-full blur-md opacity-50 animate-pulse"
                                    style={{ backgroundColor: color }}
                                />
                                <div 
                                    className={`
                                        relative px-5 py-2.5 rounded-full border flex items-center gap-2 shadow-sm backdrop-blur-md transition-colors
                                        ${isDarkMode ? 'bg-zinc-900/90 text-white' : 'bg-white/90 text-zinc-800'}
                                        ${isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : 'border'}
                                    `}
                                    style={{ 
                                        borderColor: isActive ? color : color, 
                                        boxShadow: `0 4px 15px ${color}30`,
                                        '--tw-ring-color': color 
                                    }}
                                >
                                    {isExplosive && <span className="text-[10px] animate-bounce">🔥</span>}
                                    <span className="text-xs font-bold whitespace-nowrap tracking-tight">{item.topic}</span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                </div>
                            </button>
                            
                            {isActive && (
                                <div 
                                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] animate-in fade-in zoom-in duration-300 z-30"
                                    style={{ borderBottomColor: color }}
                                />
                            )}
                        </div>
                    )
                })}
             </div>

             {/* 2. ÁREA DE DETALHES (O BALÃO CENTRAL) */}
             <div 
                className={`
                    relative w-full px-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden
                    ${activeItem ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}
                `}
             >
                {activeItem && (
                    <div 
                        className={`
                            w-full md:max-w-md mx-auto p-5 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col gap-2 animate-in slide-in-from-top-4 duration-500
                            ${isDarkMode ? 'bg-zinc-950/95 text-zinc-200' : 'bg-white/95 text-zinc-800'}
                        `}
                        style={{ 
                            borderColor: getHeatColor(activeItem.score), 
                            boxShadow: `0 10px 40px -10px ${getHeatColor(activeItem.score)}40` 
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-2 mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: getHeatColor(activeItem.score)}}/>
                                <span 
                                    className="text-[10px] font-black uppercase tracking-widest opacity-80"
                                    style={{ color: getHeatColor(activeItem.score) }}
                                >
                                    Nível de Impacto: {activeItem.score}/10
                                </span>
                            </div>
                            <div className="h-1.5 w-16 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out w-0 animate-[progress_1s_ease-out_forwards]" style={{ width: `${activeItem.score * 10}%`, backgroundColor: getHeatColor(activeItem.score), animationFillMode: 'forwards' }} />
                            </div>
                        </div>
                        
                        <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {activeItem.summary}
                        </p>
                    </div>
                )}
             </div>
         </div>
      )}
      <style jsx="true">{`@keyframes progress { from { width: 0%; } }`}</style>
    </div>
  );
};


// --- WIDGET: MARKET PULSE (VERSÃO COMPLETA: BARRA + CARDS + TICKER) ---
const MarketPulseWidget = ({ newsData, apiKey, isDarkMode, refreshTrigger, openArticle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const prevTrigger = useRef(refreshTrigger);

  useEffect(() => {
    if (!apiKey || !newsData || newsData.length === 0) return;
    
    const isUserRefresh = refreshTrigger !== prevTrigger.current;
    if (hasLoaded && !isUserRefresh) return;

    prevTrigger.current = refreshTrigger;
    
    const load = async () => {
        setLoading(true);
        if (isUserRefresh) setData(null);
        await new Promise(r => setTimeout(r, 1000)); 
        const result = await generateMarketAnalysis(newsData, apiKey);
        if (result) {
            setData(result);
            setHasLoaded(true);
        }
        setLoading(false);
    };
    load();
  }, [newsData, apiKey, refreshTrigger]);

  if (loading) {
      return (
          <div className="px-2 mb-6 animate-pulse">
              <div className={`h-[400px] rounded-[2rem] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}></div>
          </div>
      );
  }

  if (!data) return null;

  const getScoreColor = (score) => {
      if (score > 60) return 'text-emerald-500';
      if (score < 40) return 'text-rose-500';
      return 'text-yellow-500';
  };

  const getBarColor = (score) => {
      if (score > 60) return 'bg-emerald-500';
      if (score < 40) return 'bg-rose-500';
      return 'bg-yellow-500';
  };

  const getTrendColor = (trend) => {
      if (trend === 'bullish') return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      if (trend === 'bearish') return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
      return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]';
  };

  const getTrendIcon = (trend) => {
      if (trend === 'bullish') return <TrendingUp size={20} className="text-emerald-500" />;
      if (trend === 'bearish') return <TrendingDown size={20} className="text-rose-500" />;
      return <Minus size={20} className="text-yellow-500" />;
  };

  return (
    <div className="px-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className={`rounded-[2rem] border relative overflow-hidden transition-all hover:shadow-2xl ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-xl'}`}>
            
            {/* --- CORPO PRINCIPAL (RESUMO + BARRA + CARDS) --- */}
            <div className="p-6 pb-2 relative z-10">
                {/* Background Decorativo */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-transparent to-transparent opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${data.market_score > 50 ? 'from-emerald-500' : 'from-rose-500'}`} />

                {/* Header: Score e Status */}
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={16} className={getScoreColor(data.market_score)} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Market Pulse</span>
                        </div>
                        <h2 className={`text-2xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {data.market_status}
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className={`text-3xl font-black ${getScoreColor(data.market_score)}`}>{data.market_score}</span>
                        <span className="text-[10px] font-bold opacity-50 block">/100</span>
                    </div>
                </div>

                {/* --- A BARRA DO TERMÔMETRO (RESTAURADA) --- */}
                <div className={`w-full h-2 rounded-full mb-5 overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-zinc-100'}`}>
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${getBarColor(data.market_score)}`} 
                        style={{ width: `${data.market_score}%` }} 
                    />
                </div>

                {/* Resumo */}
                <p className={`text-sm font-medium leading-relaxed mb-6 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {data.summary}
                </p>

                {/* --- GRID DE MOVERS (RESTAURADO) --- */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {data.movers?.map((mover, idx) => (
                        <button 
                            key={idx}
                            disabled={!mover.article}
                            onClick={() => mover.article && openArticle(mover.article)}
                            className={`
                                text-left p-3 rounded-2xl border transition-all 
                                ${mover.article ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : 'cursor-default opacity-80'}
                                ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-xs font-black truncate pr-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{mover.asset}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${mover.trend === 'up' ? 'bg-emerald-500/20 text-emerald-500' : (mover.trend === 'down' ? 'bg-rose-500/20 text-rose-500' : 'bg-yellow-500/20 text-yellow-500')}`}>
                                    {mover.change_label || (mover.trend === 'up' ? 'Alta' : 'Baixa')}
                                </span>
                            </div>
                            <p className={`text-[9px] leading-tight line-clamp-2 opacity-70 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {mover.reason}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- ÁREA DO TICKER FINANCEIRO (NOVA) --- */}
            <div className={`relative border-t p-5 flex gap-4 items-start ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                
                {/* Indicador Visual Futurista */}
                <div className="flex-shrink-0 flex flex-col items-center justify-start pt-1 gap-1 w-8">
                    <div className={`w-2.5 h-2.5 rounded-full mb-1 animate-pulse ${getTrendColor(data.trend_direction)}`} />
                    {getTrendIcon(data.trend_direction)}
                </div>

                {/* Texto do Ticker */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${data.market_state === 'CLOSED' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {data.market_state === 'CLOSED' ? 'Mercado Encerrado' : 'Pregão Ao Vivo'}
                        </span>
                        <span className="text-[9px] font-mono opacity-40">
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    <div className={`text-xs font-mono leading-relaxed whitespace-pre-line ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {data.bottom_summary}
                    </div>
                </div>

                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
            </div>

        </div>
    </div>
  );
};
