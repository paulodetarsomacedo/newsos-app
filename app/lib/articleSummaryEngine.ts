// ============================================================
// VETRA — articleSummaryEngine.ts
// Resumo estruturado heurístico do GlassBrowser (SEM IA).
// Trabalha só com metadados do RSS + contexto lite quando existir.
// Nunca inventa fato: quando falta dado, admite incerteza.
// ============================================================

import { normalizeTerm, getCanonicalTerms, getDomainHints } from './semanticDictionary';

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
export interface SmartHeuristicSummary {
  quality: 'good' | 'medium' | 'weak';
  event_type: string;
  category: string;
  one_liner: string;
  what_happened: string;
  why_it_matters: string;
  likely_impact: string;
  what_to_watch: string;
  snippets: string[];
  confidence_note?: string;
  used_sources: {
    title: boolean;
    rssDescription: boolean;
    contextText: boolean;
    extractedText: boolean;
    clusterContext: boolean;
  };
}

// ------------------------------------------------------------
// Detecção de tipo de evento (padrões em texto normalizado)
// Ordem da lista = prioridade em caso de empate.
// ------------------------------------------------------------
const EVENT_PATTERNS: Array<{ type: string; patterns: RegExp[] }> = [
  { type: 'death', patterns: [/\bmorre\b/, /\bmorte\b/, /\bobito\b/, /\bfalece\b/, /\bfaleceu\b/, /\bmorreu\b/, /\bmortos?\b/] },
  { type: 'accident', patterns: [/\bacidente\b/, /\bcolisao\b/, /\bqueda de\b/, /\bdesabamento\b/, /\bincendio\b/, /\bcapota/, /\batropel/] },
  { type: 'security_operation', patterns: [/\boperacao policial\b/, /\bprisao\b/, /\bpreso\b/, /\bpresa\b/, /\bmandados?\b/, /\bapreensao\b/, /\bapreende\b/] },
  { type: 'investigation', patterns: [/\binvestiga\b/, /\bapura\b/, /\bmira\b/, /\boperacao\b/, /\bbusca e apreensao\b/, /\bdenuncia\b/, /\binquerito\b/] },
  { type: 'legal_decision', patterns: [/\bdecide\b/, /\bdecisao judicial\b/, /\bjulgamento\b/, /\bjulga\b/, /\bliminar\b/, /\bcondena\b/, /\babsolve\b/, /\bstf\b/, /\btribunal\b/, /\bstj\b/, /\bjustica\b/] },
  { type: 'regulation', patterns: [/\bregulamenta\b/, /\bregulacao\b/, /\bnorma\b/, /\bregras\b/, /\bmarco regulatorio\b/, /\bresolucao\b/] },
  { type: 'approval', patterns: [/\baprova\b/, /\baprovou\b/, /\bautoriza\b/, /\blibera\b/, /\bsanciona\b/, /\bsancionou\b/, /\baprovado\b/, /\baprovada\b/] },
  { type: 'market_move', patterns: [/\bsobe\b/, /\bcai\b/, /\brecua\b/, /\bavanca\b/, /\bdispara\b/, /\bdespenca\b/, /\bfecha em alta\b/, /\bfecha em queda\b/, /\bdesvaloriza\b/, /\bvaloriza\b/] },
  { type: 'weather_event', patterns: [/\bchuvas?\b/, /\btemporal\b/, /\bonda de calor\b/, /\bfrio\b/, /\balerta meteorologico\b/, /\bciclone\b/, /\bgeada\b/, /\bvendaval\b/] },
  { type: 'alert', patterns: [/\balerta\b/, /\brisco\b/, /\bsurto\b/, /\bemergencia\b/, /\bameaca\b/, /\bpreocupacao\b/, /\bepidemia\b/] },
  { type: 'study', patterns: [/\bestudo\b/, /\bpesquisa\b/, /\bcientistas\b/, /\blevantamento\b/, /\bdados mostram\b/, /\bpesquisadores\b/] },
  { type: 'conflict', patterns: [/\bconflito\b/, /\bataques?\b/, /\btensao\b/, /\bguerra\b/, /\bcrise\b/, /\bbombardeio\b/, /\bofensiva\b/, /\bmisseis?\b/] },
  { type: 'sports_absence', patterns: [/\bnao viaja\b/, /\bdesfalca\b/, /\bdesfalque\b/, /\blesao\b/, /\bfora d[eo]\b/, /\bduvida\b/, /\bcortado\b/, /\bvetado\b/] },
  { type: 'launch', patterns: [/\blancamento\b/, /\bestreia\b/, /\bapresenta novo\b/, /\bchega ao mercado\b/, /\blanca\b/, /\blancou\b/] },
  { type: 'announcement', patterns: [/\banuncia\b/, /\banunciou\b/, /\bapresenta\b/, /\bdivulga\b/, /\bconfirma\b/, /\brevela\b/] },
];

export const detectEventType = (rawText: any): string => {
  const text = ` ${normalizeTerm(rawText)} `;
  if (!text.trim()) return 'general';
  let best = 'general';
  let bestScore = 0;
  for (const entry of EVENT_PATTERNS) {
    let score = 0;
    for (const rx of entry.patterns) if (rx.test(text)) score++;
    if (score > bestScore) { bestScore = score; best = entry.type; }
  }
  return best;
};

// ------------------------------------------------------------
// Utilidades de texto (honestas, sem invenção)
// ------------------------------------------------------------
const stripHtml = (s: any): string =>
  String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const splitSentences = (text: string): string[] => {
  if (!text) return [];
  return text
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ú0-9“"])/)
    .map(s => s.trim())
    .filter(s => s.length > 25);
};

const firstSentence = (text: string, max = 220): string => {
  const s = splitSentences(text);
  const out = s[0] || text.trim();
  return out.length > max ? out.slice(0, max - 1).trimEnd() + '…' : out;
};

const extractNumbers = (text: string): string[] => {
  const rx = /(?:R\$|US\$|\$|€)\s?[\d.,]+(?:\s?(?:mil|milhoes|milhões|milhao|milhão|bilhoes|bilhões|bilhao|bilhão|trilhoes|trilhões|tri))?|\b\d+(?:[.,]\d+)?\s?%|\b\d{1,3}(?:\.\d{3})+\b/g;
  return (text.match(rx) || []).slice(0, 4);
};

const extractCapitalizedEntities = (title: string): string[] => {
  const stop = new Set(['O', 'A', 'Os', 'As', 'De', 'Do', 'Da', 'Em', 'No', 'Na', 'Por', 'Com', 'Para', 'Após', 'Apos', 'E', 'Um', 'Uma', 'Veja', 'Como', 'Entenda', 'Saiba']);
  const matches = String(title || '').match(/\b[A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+)*\b|\b[A-Z]{2,}\b/g) || [];
  return matches.filter(m => !stop.has(m)).slice(0, 5);
};

// Escolha determinística de template (evita “flicker” a cada re-render)
const stableIndex = (seed: any, len: number): number => {
  const s = String(seed ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(1, len);
};

// ------------------------------------------------------------
// Frame heurístico: [ATOR] fez [AÇÃO] sobre [TEMA] -> [CONSEQUÊNCIA/GRUPO]
// ------------------------------------------------------------
export interface HeuristicFrame {
  actor: string | null;
  action: string | null;
  topic: string | null;
  affected: string | null;
  numbers: string[];
  phase: 'passado' | 'presente' | 'possivel' | 'indefinido';
}

const ACTION_VERBS = ['aprova', 'aprovou', 'autoriza', 'libera', 'sanciona', 'anuncia', 'anunciou', 'lanca', 'lancou', 'apresenta', 'divulga', 'confirma', 'investiga', 'apura', 'decide', 'condena', 'absolve', 'sobe', 'cai', 'recua', 'avanca', 'dispara', 'despenca', 'alerta', 'regulamenta', 'suspende', 'proibe', 'derruba', 'mantem', 'amplia', 'reduz', 'corta', 'eleva'];

export const extractHeuristicFrame = (article: any, fullText: string): HeuristicFrame => {
  const title = String(article?.title || '');
  const normTitle = normalizeTerm(title);

  // actor: entidades enriquecidas > capitalizadas do título
  const enriched = Array.isArray(article?.entities) ? article.entities.filter(Boolean) : [];
  const caps = extractCapitalizedEntities(title);
  const actor = (enriched[0] || caps[0] || null) as string | null;

  // action: primeiro verbo de ação conhecido presente no título
  let action: string | null = null;
  for (const v of ACTION_VERBS) {
    if (new RegExp(`\\b${v}\\b`).test(normTitle)) { action = v; break; }
  }

  // topic: termos canônicos > keyphrases > segunda entidade
  const canon = getCanonicalTerms(`${title} ${article?.summary || ''}`);
  const keyphrases = Array.isArray(article?.keyphrases) ? article.keyphrases.filter(Boolean) : [];
  const topic = (canon[0] || keyphrases[0] || caps[1] || null) as string | null;

  const affected = (canon[1] || keyphrases[1] || enriched[1] || null) as string | null;
  const numbers = extractNumbers(`${title} ${fullText || ''}`.slice(0, 1200));

  let phase: HeuristicFrame['phase'] = 'indefinido';
  if (/\b(pode|deve|podera|devera|vai|ira)\b/.test(normTitle)) phase = 'possivel';
  else if (action && /(ou|iu)$/.test(action)) phase = 'passado';
  else if (action) phase = 'presente';

  return { actor, action, topic, affected, numbers, phase };
};

// ------------------------------------------------------------
// Templates por eventType (+ overrides por categoria)
// Vários por chave — escolha determinística por artigo.
// ------------------------------------------------------------
type TplMap = Record<string, string[]>;

const IMPACT_TPL: TplMap = {
  'approval|saude': [
    'A decisão pode ampliar acesso, prescrição e movimentar o mercado regulado.',
    'A aprovação tende a mexer com pacientes, prescritores e a cadeia regulada do setor.',
  ],
  'alert|saude': [
    'O alerta importa porque pode antecipar pressão sobre a rede de atendimento e exigir resposta preventiva.',
    'Se o cenário se confirmar, a tendência é aumento de demanda por atendimento e medidas preventivas.',
  ],
  'market_move|economia': [
    'O movimento pode alterar expectativas de investidores e afetar decisões de curto prazo.',
    'A oscilação tende a recalibrar apostas do mercado sobre juros, câmbio e alocação de risco.',
  ],
  sports_absence: [
    'A ausência pode afetar escalação, estratégia e expectativa da torcida.',
    'O desfalque tende a forçar ajustes táticos e mexer com o planejamento do jogo.',
  ],
  launch: [
    'A novidade pode influenciar adoção, competição e expectativa de consumidores.',
    'O lançamento tende a pressionar concorrentes e testar o apetite do público.',
  ],
  approval: [
    'A aprovação abre caminho para efeitos práticos que dependem da implementação.',
    'Com o aval formal, o próximo movimento tende a ser regulamentação e execução.',
  ],
  announcement: [
    'O anúncio pode redefinir expectativas de quem acompanha o tema de perto.',
    'Se confirmado nos detalhes, o anúncio tende a gerar desdobramentos práticos em seguida.',
  ],
  investigation: [
    'A apuração pode gerar novas fases, delações ou medidas judiciais nos próximos dias.',
    'Investigações desse tipo costumam produzir desdobramentos jurídicos e políticos.',
  ],
  market_move: [
    'O movimento pode influenciar preços, contratos e decisões de curto prazo.',
    'A variação tende a repercutir em expectativas e posições de investidores.',
  ],
  alert: [
    'O alerta pode antecipar medidas preventivas e mudanças de comportamento.',
    'Se o risco se materializar, a resposta tende a exigir ação coordenada.',
  ],
  study: [
    'Os achados podem embasar decisões, políticas e novas pesquisas sobre o tema.',
    'O estudo tende a alimentar o debate técnico e influenciar recomendações.',
  ],
  conflict: [
    'A escalada pode afetar civis, negociações diplomáticas e mercados sensíveis ao risco.',
    'O agravamento tende a pressionar respostas diplomáticas e humanitárias.',
  ],
  regulation: [
    'As novas regras podem mudar custos, prazos e obrigações de quem atua no setor.',
    'A regulamentação tende a redesenhar a operação do mercado afetado.',
  ],
  legal_decision: [
    'A decisão pode criar precedente e afetar casos semelhantes.',
    'O entendimento tende a orientar instâncias inferiores e disputas em andamento.',
  ],
  accident: [
    'O caso pode gerar investigação sobre causas e revisão de protocolos de segurança.',
    'Ocorrências assim costumam provocar apuração de responsabilidades.',
  ],
  death: [
    'A perda repercute entre pessoas próximas e no meio em que a pessoa atuava.',
    'O falecimento tende a gerar homenagens e balanços da trajetória.',
  ],
  weather_event: [
    'O quadro pode afetar deslocamentos, serviços e exigir atenção da população local.',
    'A condição do tempo tende a impactar rotina, trânsito e serviços públicos.',
  ],
  security_operation: [
    'A ação pode desdobrar em novas prisões, denúncias e fases da operação.',
    'Operações assim costumam gerar desdobramentos judiciais nos dias seguintes.',
  ],
  general: [
    'Os desdobramentos dependem de confirmações e novos detalhes da cobertura.',
    'O efeito prático ainda depende de mais informações das próximas horas.',
  ],
};

const WATCH_TPL: TplMap = {
  approval: ['Regulamentação, prazos de implementação e reação do setor afetado.'],
  announcement: ['Detalhamento oficial, datas e confirmação prática do que foi anunciado.'],
  investigation: ['Novas fases da apuração, manifestações da defesa e eventuais medidas judiciais.'],
  legal_decision: ['Recursos, prazo de cumprimento e efeito sobre casos semelhantes.'],
  regulation: ['Publicação do texto final, prazos de adequação e resposta do mercado.'],
  market_move: ['Próximos pregões, indicadores da semana e sinalizações de política monetária.'],
  alert: ['Atualizações oficiais, evolução dos números e medidas de resposta.'],
  study: ['Revisão por pares, replicação dos dados e posicionamento de autoridades.'],
  conflict: ['Movimentações no terreno, negociações e reação da comunidade internacional.'],
  sports_absence: ['Boletim médico, escalação confirmada e desempenho do substituto.'],
  launch: ['Disponibilidade, preço final e primeiras avaliações de quem testou.'],
  accident: ['Balanço oficial de vítimas, causas apuradas e responsabilizações.'],
  death: ['Informações oficiais da família e repercussão no meio em que atuava.'],
  weather_event: ['Novos boletins meteorológicos e orientações da Defesa Civil.'],
  security_operation: ['Novas fases da operação, decisões judiciais e identificação dos alvos.'],
  general: ['Atualizações das próximas horas e confirmação por outras fontes.'],
};

const pickTpl = (map: TplMap, eventType: string, category: string, seed: any): string => {
  const catNorm = normalizeTerm(category).split(' ')[0]; // 'saude', 'economia'...
  const key = `${eventType}|${catNorm}`;
  const list = map[key] || map[eventType] || map.general;
  return list[stableIndex(seed, list.length)];
};

// ------------------------------------------------------------
// Snippets: melhores frases do texto disponível (sem inventar)
// ------------------------------------------------------------
const pickSnippets = (fullText: string, frame: HeuristicFrame, title: string): string[] => {
  const sentences = splitSentences(fullText).filter(s => s.length >= 60 && s.length <= 260);
  if (sentences.length === 0) return [];
  const normTitleWords = new Set(normalizeTerm(title).split(' ').filter(w => w.length > 3));
  const scored = sentences.map(s => {
    const norm = normalizeTerm(s);
    let score = 0;
    if (frame.actor && norm.includes(normalizeTerm(frame.actor))) score += 3;
    if (frame.topic && norm.includes(normalizeTerm(frame.topic))) score += 2;
    if (/\d/.test(s)) score += 2;
    let overlap = 0;
    for (const w of norm.split(' ')) if (normTitleWords.has(w)) overlap++;
    score += Math.min(3, overlap * 0.5);
    if (/(clique|leia mais|assine|newsletter|publicidade|cookies)/i.test(s)) score -= 10;
    return { s, score };
  });
  return scored
    .filter(x => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(x => x.s);
};

// ------------------------------------------------------------
// MOTOR PRINCIPAL
// ------------------------------------------------------------
export const generateSmartHeuristicSummary = (
  article: any,
  extractedText?: string
): SmartHeuristicSummary => {
  const title = stripHtml(article?.title || '');
  const rssDescription = stripHtml(article?.summary || article?.description || '');
  const contextText = stripHtml(article?.contextText || '');
  const cleanExtracted = stripHtml(extractedText || '');
  const category = String(article?.category || 'Geral');
  const source = String(article?.source || 'a fonte');

  const used_sources = {
    title: Boolean(title),
    rssDescription: rssDescription.length > 40,
    contextText: contextText.length > 80,
    extractedText: cleanExtracted.length > 200,
    clusterContext: false,
  };

  // Melhor corpo de texto disponível (prioridade: extraído > contexto lite > RSS)
  const bestBody = used_sources.extractedText ? cleanExtracted
    : used_sources.contextText ? contextText
    : rssDescription;

  // eventType: enriquecido > detecção local
  const event_type = (article?.eventType && String(article.eventType)) ||
    detectEventType(`${title}. ${bestBody.slice(0, 400)}`);

  const frame = extractHeuristicFrame(article, bestBody);
  const seed = article?.id || title;

  // --- quality ---
  let quality: SmartHeuristicSummary['quality'] = 'weak';
  if (used_sources.extractedText || (used_sources.contextText && contextText.length > 300)) quality = 'good';
  else if (used_sources.contextText || used_sources.rssDescription) quality = 'medium';

  // --- one_liner ---
  let one_liner: string;
  if (used_sources.rssDescription || used_sources.contextText) {
    one_liner = firstSentence(rssDescription || contextText, 200);
  } else {
    one_liner = title;
  }

  // --- what_happened ---
  let what_happened: string;
  if (used_sources.contextText || used_sources.extractedText) {
    const body = used_sources.extractedText ? cleanExtracted : contextText;
    const sents = splitSentences(body).slice(0, 2);
    what_happened = sents.join(' ') || firstSentence(body, 300);
  } else if (used_sources.rssDescription) {
    what_happened = firstSentence(rssDescription, 300);
    if (frame.numbers.length > 0 && !what_happened.match(/\d/)) {
      what_happened += ` A manchete menciona ${frame.numbers[0]}.`;
    }
  } else {
    // Só título: linguagem honesta, sem inventar
    const lead = (frame.actor && frame.action)
      ? `A manchete indica que ${frame.actor} ${frame.action}${frame.topic ? `, com foco em ${frame.topic}` : ''}.`
      : `A manchete indica movimentação${frame.topic ? ` envolvendo ${frame.topic}` : ' sobre o tema em destaque'}.`;
    what_happened = `${lead} Ainda há pouco contexto extraído do RSS de ${source}, então os detalhes dependem da leitura completa.`;
  }

  // --- why_it_matters ---
  const domains = getDomainHints(`${title} ${bestBody.slice(0, 300)}`);
  const domainLabel: Record<string, string> = {
    mercado: 'investidores e para o ambiente econômico',
    politica: 'o cenário político e as próximas decisões públicas',
    justica: 'o andamento de processos e o entendimento jurídico',
    tecnologia: 'usuários, empresas e a disputa do setor de tecnologia',
    saude: 'pacientes, profissionais e a rede de saúde',
    seguranca: 'a segurança pública e as investigações em curso',
    esportes: 'o desempenho da equipe e a disputa da temporada',
    internacional: 'o cenário geopolítico e suas repercussões',
    clima: 'a rotina e a segurança de quem vive na região afetada',
  };
  const audience = domainLabel[domains[0]] || 'quem acompanha o tema';
  const whyParts: string[] = [];
  if (frame.topic || frame.actor) {
    whyParts.push(`O assunto toca diretamente ${audience}${frame.topic ? `, com foco em ${frame.topic}` : ''}.`);
  } else {
    whyParts.push(`O tema é relevante para ${audience}.`);
  }
  if (frame.numbers.length > 0) whyParts.push(`Os números citados (${frame.numbers.slice(0, 2).join(', ')}) ajudam a dimensionar o caso.`);
  const why_it_matters = whyParts.join(' ');

  // --- likely_impact / what_to_watch (templates variáveis) ---
  let likely_impact = pickTpl(IMPACT_TPL, event_type, category, seed);
  if (frame.phase === 'possivel') {
    likely_impact = `Por ora é um cenário em aberto. ${likely_impact}`;
  }
  const what_to_watch = pickTpl(WATCH_TPL, event_type, category, `${seed}-w`);

  // --- snippets ---
  const snippetSource = used_sources.extractedText ? cleanExtracted : (used_sources.contextText ? contextText : '');
  const snippets = snippetSource ? pickSnippets(snippetSource, frame, title) : [];

  // --- confidence_note ---
  let confidence_note: string | undefined;
  if (quality === 'weak') {
    confidence_note = 'O resumo é preliminar porque o RSS trouxe pouco conteúdo. A leitura completa pode revelar detalhes importantes.';
  } else if (quality === 'medium') {
    confidence_note = 'Resumo baseado na descrição da fonte; alguns desdobramentos podem não estar cobertos.';
  }

  return {
    quality,
    event_type,
    category,
    one_liner,
    what_happened,
    why_it_matters,
    likely_impact,
    what_to_watch,
    snippets,
    confidence_note,
    used_sources,
  };
};
