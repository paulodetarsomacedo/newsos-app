// ============================================================
// VETRA — clusterEngine.ts
// Cluster Engine heurístico da aba Happening Now (SEM IA).
// Score composto (título + coreWords + entidades + termos canônicos
// + eventType + categoria + proximidade temporal), diversidade de
// fontes, temperatura, perspectivas e timeline heurísticas.
// Preserva o shape que a UI espera: clusterId, ai_title, ai_summary,
// representative_image, related_articles, keyEntities — campos novos
// são apenas aditivos.
// ============================================================

import * as stringSimilarity from 'string-similarity';
import { normalizeTerm, getCanonicalTerms, getDomainHints } from './semanticDictionary';
import { detectEventType } from './articleSummaryEngine';
import { countCoverage, formatCoverageLabel } from './editorialGroups';
import { extractEventCore, eventCompatibility, EventCore } from './eventCore';

// ------------------------------------------------------------
// Configuração (sobrepor via options se quiser)
// ------------------------------------------------------------
const DEFAULTS = {
  maxArticles: 200,
  clusterLimit: 5,
  scoreThreshold: 0.46,          // score composto mínimo p/ agrupar
  sameSourceThreshold: 0.68,     // mesma fonte precisa de evidência maior
  duplicateTitleSim: 0.92,       // mesma fonte + título quase idêntico = duplicata (não infla)
  maxPerSourceInCluster: 2,      // não inflar cluster com a mesma fonte
  weights: {
    titleSimilarity: 0.30,
    coreWordOverlap: 0.20,
    entityOverlap: 0.20,
    canonicalTermOverlap: 0.15,
    eventTypeMatch: 0.07,
    categoryMatch: 0.03,
    timeProximity: 0.05,
  },
  sourceWeights: {
    'G1': 3, 'CNN Brasil': 3, 'O Globo': 2.5, 'Band': 2, 'Estadão': 2,
    'Folha de S.Paulo': 2, 'Jovem Pan': 1.5, 'Metropoles': 1.5,
  } as Record<string, number>,
  imagePreferredSources: ['Extra', 'CNN Brasil', 'Band', 'O Globo', 'Veja', 'Jovem Pan', 'Metropoles', 'SBT News', 'Times Brasil', 'Estadao', 'Fox News', '180graus'],
  imageBlockedSources: ['ISTOÉ', 'ISTOÉ DINHEIRO', 'UOL Economia', 'Estadão E-Investidor', 'F5', 'UOL', 'Folha de S.Paulo', 'Investing', 'E-Investidor', 'UOL Noticias', 'Money Times', 'Estadão | As Últimas Notícias', 'G1', 'UOL NOTICIAS', 'Valor Investe', 'UOL ECONOMIA'],
};

export type ClusterEngineOptions = Partial<typeof DEFAULTS>;

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
const STOPWORDS = new Set(['a', 'o', 'e', 'de', 'do', 'da', 'das', 'dos', 'para', 'com', 'sem', 'um', 'uma', 'os', 'as', 'que', 'em', 'no', 'na', 'nos', 'nas', 'seu', 'sua', 'por', 'apos', 'ate', 'sobre', 'contra', 'entre', 'como', 'mais', 'menos', 'ja', 'nao', 'sim', 'ser', 'ter', 'diz', 'veja', 'saiba', 'confira', 'entenda', 'pode', 'deve', 'vai', 'foi', 'sao', 'esta', 'estao', 'hoje', 'nesta', 'neste']);

const stripHtml = (s: any): string =>
  String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const toDateMs = (a: any): number => {
  const candidates = [a?.publishedAt, a?.rawDate, a?.historicalTimestamp, a?.published_at, a?.pubDate, a?.date];
  for (const c of candidates) {
    if (c == null) continue;
    const t = typeof c === 'number' ? c : new Date(c).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return Date.now();
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

// Overlap coefficient (inter / menor conjunto) com amortecimento:
// 1 termo compartilhado vale meio crédito; 2+ vale crédito cheio.
// Evita que jaccard dilua o sinal semântico quando os títulos são
// verbalizações diferentes do mesmo evento.
const semanticOverlap = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  if (inter === 0) return 0;
  const coeff = inter / Math.min(a.size, b.size);
  return coeff * (inter >= 2 ? 1 : 0.5);
};

const hasRealImageUrl = (url: any): boolean =>
  Boolean(url) && /\.(jpg|jpeg|png|webp)/i.test(String(url)) && !String(url).includes('ui-avatars.com');

const simpleHash = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

const SENSATIONAL_RX = /\b(veja|confira|saiba|entenda|choca|chocante|urgente|bomba|inacreditavel|imperdivel|voce nao vai acreditar)\b/;

// ------------------------------------------------------------
// normalizeArticleForCluster
// ------------------------------------------------------------
export interface NormalizedArticle {
  id: any;
  title: string;
  cleanTitle: string;
  source: string;
  sourceWeight: number;
  link: string;
  canonicalUrl: string | null;
  rawDate: any;
  publishedAt: any;
  ageMinutes: number;
  summary: string;
  snippet: string;
  img: any;
  logo: any;
  category: string;
  tags: string[];
  entities: string[];
  eventType: string;
  coreWords: string[];
  canonicalTerms: string[];
  fingerprint: string;
  _original: any;
  _coreSet: Set<string>;
  _entitySet: Set<string>;
  _canonSet: Set<string>;
  _timeMs: number;
  _eventCore: EventCore;   // (PEÇA 1) núcleo do evento: ator/ação/alvo
}

export const normalizeArticleForCluster = (
  article: any,
  sourceWeights: Record<string, number> = DEFAULTS.sourceWeights
): NormalizedArticle | null => {
  try {
    const title = stripHtml(article?.title || '');
    if (!title || title.length < 8) return null;

    const cleanTitle = normalizeTerm(article?.normalizedTitle || title);
    const summary = stripHtml(article?.summary || '');
    const timeMs = toDateMs(article);

    // coreWords: enriquecido > derivado do título
    let coreWords: string[] = Array.isArray(article?.coreWords) && article.coreWords.length > 0
      ? article.coreWords.map((w: any) => normalizeTerm(w)).filter(Boolean)
      : cleanTitle.split(' ').filter(w => w.length > 3 && !STOPWORDS.has(w));
    coreWords = Array.from(new Set(coreWords)).slice(0, 12);

    // entities: enriquecido > capitalizadas do título original
    let entities: string[] = Array.isArray(article?.entities) && article.entities.length > 0
      ? article.entities.map((e: any) => normalizeTerm(e)).filter(Boolean)
      : (title.match(/\b[A-ZÀ-Ú][a-zà-ú]{2,}\b|\b[A-Z]{2,}\b/g) || [])
          .map(e => normalizeTerm(e))
          .filter(e => e && !STOPWORDS.has(e));
    entities = Array.from(new Set(entities)).slice(0, 8);

    const canonicalTerms = getCanonicalTerms(`${title} ${summary.slice(0, 200)}`);
    const eventType = (article?.eventType && String(article.eventType)) || detectEventType(title);
    const category = normalizeTerm(article?.category || 'geral');

    return {
      id: article?.id,
      title,
      cleanTitle,
      source: String(article?.source || 'Fonte'),
      sourceWeight: sourceWeights[article?.source] || 1,
      link: article?.link || '',
      canonicalUrl: article?.canonicalUrl || article?.link || null,
      rawDate: article?.rawDate,
      publishedAt: article?.publishedAt || null,
      ageMinutes: Math.max(0, Math.round((Date.now() - timeMs) / 60000)),
      summary,
      snippet: summary.slice(0, 180),
      img: article?.img,
      logo: article?.logo,
      category,
      tags: Array.isArray(article?.keyphrases) ? article.keyphrases.filter(Boolean).slice(0, 6) : [],
      entities,
      eventType,
      coreWords,
      canonicalTerms,
      fingerprint: simpleHash(`${cleanTitle}|${article?.source || ''}`),
      _original: article,
      // Sets aumentados com termos canônicos: "moeda americana" e "dólar"
      // passam a compartilhar o mesmo token ('dolar') no overlap.
      _coreSet: new Set([...coreWords, ...canonicalTerms.map(t => normalizeTerm(t))]),
      _entitySet: new Set([...entities, ...canonicalTerms.map(t => normalizeTerm(t))]),
      _canonSet: new Set(canonicalTerms.map(t => normalizeTerm(t))),
      _timeMs: timeMs,
      _eventCore: extractEventCore(title, entities),
    };
  } catch {
    return null; // item malformado nunca derruba o pipeline
  }
};

// ------------------------------------------------------------
// Score composto entre dois artigos normalizados
// ---------------------------------------------------------------------------
// (PEÇA 4) JANELA DO CASO — o tempo é FILTRO, não tempero de 5%.
// Um caso tem duração. Duas matérias sobre "Lula" separadas por 3 dias
// provavelmente NÃO são o mesmo fato. A janela varia por tipo de evento:
// breaking dura horas; investigação, dias.
// ---------------------------------------------------------------------------
const CASE_WINDOW_HOURS: Record<string, number> = {
  accident: 12, security_operation: 12, conflict: 12, death: 24,
  sports_match: 8, market_move: 12,
  legal_decision: 48, dismissal: 48, appointment: 48, approval: 48,
  announcement: 36, launch: 72, crisis: 72, regulation: 72,
  investigation: 96,
  general: 36,
};

export const withinCaseWindow = (a: NormalizedArticle, b: NormalizedArticle): boolean => {
  const hoursApart = Math.abs(a._timeMs - b._timeMs) / 3600000;
  // Usa a janela MAIS LONGA entre os dois tipos (conservador: prefere agrupar
  // a fragmentar, desde que dentro de um horizonte plausível).
  const wa = CASE_WINDOW_HOURS[a.eventType] ?? CASE_WINDOW_HOURS.general;
  const wb = CASE_WINDOW_HOURS[b.eventType] ?? CASE_WINDOW_HOURS.general;
  return hoursApart <= Math.max(wa, wb);
};

// ---------------------------------------------------------------------------
// (PEÇA 3) PESOS POR DOMÍNIO
// Um peso único para todos os assuntos é grosseiro. Em MERCADO, o número é a
// identidade do fato ("dólar a R$ 6,10"); em POLÍTICA/JUSTIÇA, a entidade e a
// ação mandam; em ESPORTES, os times e o placar.
// ---------------------------------------------------------------------------
type WeightSet = typeof DEFAULTS.weights & { eventCore: number };

const DOMAIN_WEIGHTS: Record<string, WeightSet> = {
  mercado: {
    titleSimilarity: 0.16, coreWordOverlap: 0.14, entityOverlap: 0.12,
    canonicalTermOverlap: 0.12, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.09, eventCore: 0.30,   // núcleo carrega o número
  },
  politica: {
    titleSimilarity: 0.18, coreWordOverlap: 0.12, entityOverlap: 0.22,
    canonicalTermOverlap: 0.10, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.06, eventCore: 0.25,
  },
  justica: {
    titleSimilarity: 0.18, coreWordOverlap: 0.12, entityOverlap: 0.22,
    canonicalTermOverlap: 0.10, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.06, eventCore: 0.25,
  },
  esportes: {
    titleSimilarity: 0.16, coreWordOverlap: 0.12, entityOverlap: 0.22,
    canonicalTermOverlap: 0.08, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.13, eventCore: 0.22,   // jogo é datado: tempo pesa
  },
  seguranca: {
    titleSimilarity: 0.20, coreWordOverlap: 0.14, entityOverlap: 0.16,
    canonicalTermOverlap: 0.08, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.13, eventCore: 0.22,
  },
  geral: {
    titleSimilarity: 0.20, coreWordOverlap: 0.14, entityOverlap: 0.16,
    canonicalTermOverlap: 0.10, eventTypeMatch: 0.05, categoryMatch: 0.02,
    timeProximity: 0.08, eventCore: 0.25,
  },
};

const pickDomainWeights = (a: NormalizedArticle, b: NormalizedArticle): WeightSet => {
  const da = getDomainHints(a.title)[0];
  const db = getDomainHints(b.title)[0];
  const domain = (da && da === db) ? da : (da || db || 'geral');
  return DOMAIN_WEIGHTS[domain] || DOMAIN_WEIGHTS.geral;
};

// ------------------------------------------------------------
export const computePairScore = (
  a: NormalizedArticle,
  b: NormalizedArticle,
  weights = DEFAULTS.weights
): number => {
  // (PEÇA 1) NÚCLEO DO EVENTO — o portão.
  // Mede identidade de EVENTO (ator/ação/alvo), não parecença de palavras.
  // "Lula critica STF" e "STF critica Lula" têm as MESMAS palavras e núcleo
  // incompatível (papéis invertidos) → não agrupam.
  const coreCompat = eventCompatibility(a._eventCore, b._eventCore);
  if (coreCompat === 0) return 0;   // papéis invertidos: evento oposto

  const w = pickDomainWeights(a, b);   // (PEÇA 3) pesos por domínio

  const titleSim = stringSimilarity.compareTwoStrings(a.cleanTitle, b.cleanTitle);
  const coreOverlap = jaccard(a._coreSet, b._coreSet);
  const entityOverlap = semanticOverlap(a._entitySet, b._entitySet);
  const canonOverlap = semanticOverlap(a._canonSet, b._canonSet);
  const eventMatch = (a.eventType !== 'general' && a.eventType === b.eventType) ? 1 : 0;
  const catMatch = (a.category && a.category === b.category) ? 1 : 0;
  const diffMin = Math.abs(a._timeMs - b._timeMs) / 60000;
  const timeProx = diffMin <= 60 ? 1 : diffMin <= 240 ? 0.6 : diffMin <= 720 ? 0.3 : 0;

  const score = (
    titleSim * w.titleSimilarity +
    coreOverlap * w.coreWordOverlap +
    entityOverlap * w.entityOverlap +
    canonOverlap * w.canonicalTermOverlap +
    eventMatch * w.eventTypeMatch +
    catMatch * w.categoryMatch +
    timeProx * w.timeProximity +
    coreCompat * w.eventCore
  );

  // Núcleo fraco puxa o score para baixo mesmo com palavras parecidas —
  // é o que impede "mesmo assunto, outro fato" de agrupar.
  return coreCompat < 0.25 ? score * 0.6 : score;
};

// ---------------------------------------------------------------------------
// (PEÇA 7) CICLO DE VIDA DO CASO
// Um caso nasce, escala, satura e esfria — e às vezes ressurge (desdobramento:
// reação, investigação). O motor antigo só sabia "temperatura" por contagem de
// fontes. A fase dá contexto real — inclusive para a IA no próximo passo, que
// precisa saber se está olhando o FATO ou a REPERCUSSÃO.
// ---------------------------------------------------------------------------
export type CasePhase = 'emergindo' | 'escalando' | 'consolidado' | 'desdobrando' | 'esfriando';

const detectCasePhase = (items: NormalizedArticle[], groups: number): CasePhase => {
  const times = items.map(a => a._timeMs).sort((x, y) => x - y);
  const nowMs = Date.now();
  const newestMin = (nowMs - times[times.length - 1]) / 60000;
  const spanHours = Math.max(0.25, (times[times.length - 1] - times[0]) / 3600000);
  const velocity = groups / spanHours;   // grupos por hora

  // Silêncio longo seguido de nova onda = desdobramento (reação/investigação).
  let biggestGapH = 0;
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i] - times[i - 1]) / 3600000;
    if (gap > biggestGapH) biggestGapH = gap;
  }
  const hadPause = biggestGapH >= 6;
  const recentBurst = times.filter(t => (nowMs - t) / 60000 <= 120).length >= 2;

  if (newestMin > 360) return 'esfriando';                       // 6h sem nada novo
  if (hadPause && recentBurst) return 'desdobrando';             // ressurgiu
  if (groups <= 2 && newestMin <= 45) return 'emergindo';        // começando agora
  if (velocity >= 1.5 && newestMin <= 120) return 'escalando';   // entrando rápido
  if (groups >= 4) return 'consolidado';                         // todo mundo cobriu
  return 'emergindo';
};

// ------------------------------------------------------------
// Título representativo: centralidade + clareza + peso editorial
// ------------------------------------------------------------
const pickRepresentative = (items: NormalizedArticle[]): NormalizedArticle => {
  let best = items[0];
  let bestScore = -Infinity;
  for (const a of items) {
    let centrality = 0;
    for (const b of items) {
      if (a.id !== b.id) centrality += stringSimilarity.compareTwoStrings(a.cleanTitle, b.cleanTitle);
    }
    let score = centrality;
    score += a.sourceWeight * 0.5;                                   // peso editorial
    if (a.title.length >= 40 && a.title.length <= 110) score += 0.6; // clareza
    if (a.entities.length > 0) score += 0.4;                          // entidade principal presente
    if (SENSATIONAL_RX.test(a.cleanTitle)) score -= 1.2;              // menor sensacionalismo
    if (a.cleanTitle.includes('?')) score -= 0.4;
    if (hasRealImageUrl(a.img)) score += 0.3;                         // boa imagem quando aplicável
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return best;
};

// ------------------------------------------------------------
// Temperatura do cluster
// ------------------------------------------------------------
const computeTemperature = (items: NormalizedArticle[], sourceCount: number): string => {
  const newest = Math.min(...items.map(i => i.ageMinutes));
  const windowMin = Math.max(...items.map(i => i._timeMs)) - Math.min(...items.map(i => i._timeMs));
  const windowMinutes = Math.round(windowMin / 60000);
  if (sourceCount >= 4 && newest <= 90 && windowMinutes <= 240) return 'fervendo';
  if (sourceCount >= 3 || (sourceCount >= 2 && newest <= 180)) return 'em alta';
  return 'observando';
};

// ------------------------------------------------------------
// Perspectivas heurísticas por fonte (ângulo por domínio do título)
// ------------------------------------------------------------
const ANGLE_LABEL: Record<string, string> = {
  mercado: 'mercado',
  politica: 'político',
  justica: 'jurídico',
  saude: 'saúde pública',
  tecnologia: 'tecnologia/produto',
  seguranca: 'segurança',
  internacional: 'internacional',
  esportes: 'esportes',
  clima: 'clima',
};

const buildPerspectives = (items: NormalizedArticle[]) => {
  const seen = new Set<string>();
  const out: Array<{ source: string; angle: string; title: string }> = [];
  for (const a of items) {
    if (seen.has(a.source)) continue;
    seen.add(a.source);
    const domains = getDomainHints(a.title);
    const angle = ANGLE_LABEL[domains[0]] || ANGLE_LABEL[a.category] || 'cobertura geral';
    out.push({ source: a.source, angle, title: a.title });
    if (out.length >= 6) break;
  }
  return out;
};

// ------------------------------------------------------------
// Timeline heurística
// ------------------------------------------------------------
const buildTimeline = (items: NormalizedArticle[]) => {
  const sorted = [...items].sort((a, b) => a._timeMs - b._timeMs);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const events: Array<{ at: string; label: string }> = [];
  if (first) events.push({ at: new Date(first._timeMs).toISOString(), label: `Primeira fonte detectada: ${first.source}` });
  const midSources = Array.from(new Set(sorted.slice(1, -1).map(a => a.source))).slice(0, 3);
  if (midSources.length > 0) events.push({ at: new Date(sorted[1]._timeMs).toISOString(), label: `Novas fontes entraram: ${midSources.join(', ')}` });
  if (last && last !== first) events.push({ at: new Date(last._timeMs).toISOString(), label: `Atualização mais recente: ${last.source}` });
  return events;
};

// ------------------------------------------------------------
// Resumo heurístico do cluster
// ------------------------------------------------------------
const buildClusterSummary = (items: NormalizedArticle[], rep: NormalizedArticle, sourceCount: number): string => {
  // sourceCount aqui = número de GRUPOS editoriais independentes (não veículos).
  const windowMs = Math.max(...items.map(i => i._timeMs)) - Math.min(...items.map(i => i._timeMs));
  const windowMinutes = Math.max(1, Math.round(windowMs / 60000));
  const windowLabel = windowMinutes < 60
    ? `nos últimos ${windowMinutes} minutos`
    : `nas últimas ${Math.round(windowMinutes / 60)} hora${windowMinutes >= 120 ? 's' : ''}`;

  // Termos em comum (canônicos > entidades) presentes em 2+ artigos
  const counts: Record<string, number> = {};
  for (const a of items) {
    for (const t of new Set([...a.canonicalTerms.map(normalizeTerm), ...a.entities])) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  const common = Object.keys(counts)
    .filter(t => counts[t] >= 2 && t.length > 2)
    .sort((x, y) => counts[y] - counts[x])
    .slice(0, 3);

  // (C1) O resumo do card NÃO despeja termos normalizados ("stf, apreensao,
  // vorcaro" — minúsculos, sem acento, ilegíveis). Usa a frase real da matéria
  // representativa + a contagem honesta de veículos/grupos.
  const first = (rep.snippet || rep.title || '').trim();
  const lead = firstCleanSentence(first, 180);

  const base = `${sourceCount} ${sourceCount > 1 ? 'veículos cobrem' : 'veículo cobre'} o caso ${windowLabel}.`;
  return lead ? `${lead} ${base}` : base;
};

// Primeira frase limpa, cortada em fronteira de palavra.
const firstCleanSentence = (text: string, max = 180): string => {
  const t = String(text || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const sentences = t.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9"])/);
  let out = (sentences[0] || t).trim();
  if (out.length > max) {
    const slice = out.slice(0, max);
    const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
    out = (cut > max * 0.5 ? slice.slice(0, cut) : slice).trim() + '…';
  }
  if (!/[.!?…]$/.test(out)) out += '.';
  return out;
};

// ------------------------------------------------------------
// MOTOR PRINCIPAL — generateSmartHeuristicClusters
// ------------------------------------------------------------
export const generateSmartHeuristicClusters = (articles: any[], options: ClusterEngineOptions = {}) => {
  const cfg = { ...DEFAULTS, ...options, weights: { ...DEFAULTS.weights, ...(options as any).weights } };
  if (!Array.isArray(articles) || articles.length < 5) return [];

  // 1) Normalização blindada (item ruim é descartado, nunca trava)
  const normalized: NormalizedArticle[] = [];
  for (const raw of articles.slice(0, cfg.maxArticles)) {
    const n = normalizeArticleForCluster(raw, cfg.sourceWeights);
    if (n) normalized.push(n);
  }
  if (normalized.length < 5) return [];

  // ==========================================================================
  // 2) AGRUPAMENTO AGLOMERATIVO COM FUSÃO
  // Substitui o greedy antigo (que dependia da ORDEM do feed: o primeiro
  // cluster formado "roubava" artigos e nada nunca se fundia depois).
  // Agora: cada artigo começa sozinho; unimos repetidamente o par de clusters
  // MAIS SIMILAR enquanto passar do limiar. Determinístico e independente
  // da ordem de chegada.
  // ==========================================================================

  // Similaridade entre CLUSTERS: híbrido average + max.
  // - AVERAGE sozinho é conservador demais: uma matéria de título atípico
  //   ("Caso Master: PF alega risco de fuga...") tem média baixa contra o
  //   cluster e fica de fora, mesmo sendo do mesmo caso.
  // - MAX sozinho encadeia clusters distintos (basta um par parecido).
  // Solução: média, mas com piso — se o MELHOR par é claramente forte, o
  // vínculo vale, ainda que os demais títulos sejam verbalizados diferente.
  const clusterSim = (A: NormalizedArticle[], B: NormalizedArticle[]): number => {
    let sum = 0, n = 0, best = 0;
    for (const a of A) {
      for (const b of B) {
        // JANELA TEMPORAL como FILTRO DURO (peça 4): fora da janela do caso,
        // não é o mesmo fato — por mais parecidas que as palavras sejam.
        if (!withinCaseWindow(a, b)) return -1;
        const s = computePairScore(a, b, cfg.weights);
        sum += s;
        if (s > best) best = s;
        n++;
      }
    }
    if (n === 0) return 0;
    const avg = sum / n;
    // O melhor par tem peso, mas não domina (evita encadeamento espúrio).
    return Math.max(avg, best * 0.82);
  };

  // Cada artigo começa como seu próprio cluster.
  let groups: NormalizedArticle[][] = normalized.map(a => [a]);

  // Duplicatas exatas da MESMA fonte são consumidas antes (não inflam nada).
  const dupOf = new Set<any>();
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i], b = normalized[j];
      if (dupOf.has(b.id) || a.source !== b.source) continue;
      if (stringSimilarity.compareTwoStrings(a.cleanTitle, b.cleanTitle) >= cfg.duplicateTitleSim) {
        dupOf.add(b.id);
      }
    }
  }
  groups = groups.filter(g => !dupOf.has(g[0].id));

  // Fusão iterativa: une sempre o par mais similar acima do limiar.
  // (peça 5) SEM limite por fonte: um veículo que cobre bem o caso com 5
  // matérias não deve ter 3 descartadas — isso PERDE cobertura, o oposto
  // do que queremos. A diversidade é medida por GRUPOS editoriais, não
  // jogando matéria fora.
  let merged = true;
  while (merged && groups.length > 1) {
    merged = false;
    let bestI = -1, bestJ = -1, bestScore = cfg.scoreThreshold;

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const s = clusterSim(groups[i], groups[j]);
        if (s > bestScore) { bestScore = s; bestI = i; bestJ = j; }
      }
    }

    if (bestI >= 0) {
      groups[bestI] = [...groups[bestI], ...groups[bestJ]];
      groups.splice(bestJ, 1);
      merged = true;
    }
  }

  const potential = groups
    .filter(items => items.length > 1)
    .map(items => {
      const perSource = new Map<string, number>();
      for (const a of items) perSource.set(a.source, (perSource.get(a.source) || 0) + 1);
      return { items, perSource };
    });

  if (potential.length === 0) return [];

  // ==========================================================================
  // 3) RANKING — (PEÇA 6) por IMPORTÂNCIA, não por volume.
  // O antigo era: itens × pesoFontes × fontes^1.4 × imagem × recência — ou seja,
  // premiava QUANTIDADE de cobertura. Uma notícia coberta por 8 veículos fracos
  // ganhava de uma exclusiva do Estadão.
  // Agora o sinal central é ESCALADA (velocidade de adesão) e INDEPENDÊNCIA
  // (grupos editoriais distintos, não veículos do mesmo dono).
  // ==========================================================================
  const scored = potential.map(c => {
    const sources = new Set(c.items.map(a => a.source));
    let sourceImpact = 0;
    sources.forEach(s => { sourceImpact += (cfg.sourceWeights[s] || 1); });

    // Independência real: G1 + O Globo + Valor = 1 grupo, não 3 confirmações.
    const cov = countCoverage(c.items.map(a => ({ source: a.source })));
    const independence = Math.pow(Math.max(1, cov.groups), 1.35);

    // ESCALADA: quantos GRUPOS entraram por hora desde a primeira publicação.
    // 5 fontes em 20 min >> 8 fontes em 6 h. Este é o sinal de "quente" de
    // verdade — os timestamps estavam parados no motor antigo.
    const times = c.items.map(a => a._timeMs);
    const firstMs = Math.min(...times);
    const lastMs = Math.max(...times);
    const spanHours = Math.max(0.25, (lastMs - firstMs) / 3600000);
    const velocity = cov.groups / spanHours;                 // grupos por hora
    const escalation = 1 + Math.min(2.5, velocity * 0.8);    // 1.0 … 3.5

    const hasGoodImage = c.items.some(a => hasRealImageUrl(a.img) && !cfg.imageBlockedSources.includes(a.source));
    const newest = Math.min(...c.items.map(a => a.ageMinutes));
    const recencyBoost = newest <= 60 ? 1.4 : newest <= 180 ? 1.15 : newest <= 720 ? 1 : 0.75;
    const quality = (hasGoodImage ? 1.15 : 1) * (c.items.some(a => a.summary.length > 80) ? 1.05 : 1);

    const impactScore = escalation * independence * sourceImpact * recencyBoost * quality;

    return { ...c, impactScore, sourceCount: sources.size, _coverage: cov, _velocity: velocity, _firstMs: firstMs, _lastMs: lastMs };
  });

  const top = scored.sort((a, b) => b.impactScore - a.impactScore).slice(0, cfg.clusterLimit);

  // 4) Montagem final (shape compatível com a UI atual + campos novos)
  return top.map(cluster => {
    const rep = pickRepresentative(cluster.items);

    const preferred = new Set(cfg.imagePreferredSources);
    const blocked = new Set(cfg.imageBlockedSources);
    const imageCandidates = cluster.items.filter(a => !blocked.has(a.source) && hasRealImageUrl(a.img));
    const repImage = imageCandidates.find(a => preferred.has(a.source)) || imageCandidates[0] || rep;

    const sortedItems = [...cluster.items].sort((a, b) => b._timeMs - a._timeMs);
    const relatedArticles = sortedItems.map(a => a._original);

    // keyEntities: entidades/termos mais frequentes (compatível com UI atual)
    const entityCounts: Record<string, number> = {};
    for (const a of cluster.items) for (const e of a.entities) entityCounts[e] = (entityCounts[e] || 0) + 1;
    const keyEntities = Object.keys(entityCounts).sort((x, y) => entityCounts[y] - entityCounts[x]).slice(0, 3);

    const firstSeenMs = Math.min(...cluster.items.map(a => a._timeMs));
    const lastSeenMs = Math.max(...cluster.items.map(a => a._timeMs));

    // topic_words: coreWords compartilhadas
    const wordCounts: Record<string, number> = {};
    for (const a of cluster.items) for (const w of a._coreSet) wordCounts[w] = (wordCounts[w] || 0) + 1;
    const topicWords = Object.keys(wordCounts).filter(w => wordCounts[w] >= 2).sort((x, y) => wordCounts[y] - wordCounts[x]).slice(0, 6);

    const topSnippets = cluster.items.map(a => a.snippet).filter(s => s && s.length > 50).slice(0, 3);

    const eventCounts: Record<string, number> = {};
    for (const a of cluster.items) eventCounts[a.eventType] = (eventCounts[a.eventType] || 0) + 1;
    const dominantEvent = Object.keys(eventCounts).sort((x, y) => eventCounts[y] - eventCounts[x])[0] || 'general';

    const confidence = Math.min(1, (cluster.sourceCount / 4) * 0.6 + Math.min(1, cluster.items.length / 6) * 0.4);

    // Contagem HONESTA: publicações ≠ veículos ≠ grupos independentes.
    const coverage = cluster._coverage || countCoverage(cluster.items.map(a => ({ source: a.source })));
    const phase = detectCasePhase(cluster.items, coverage.groups);

    return {
      // --- shape esperado pela UI atual (inalterado) ---
      clusterId: `smart-${simpleHash(sortedItems.map(a => a.fingerprint).join('|'))}`,
      ai_title: rep.title,
      ai_summary: buildClusterSummary(cluster.items, rep, coverage.groups),
      representative_image: repImage.img,
      related_articles: relatedArticles,
      keyEntities,
      // --- campos novos (aditivos) ---
      event_type: dominantEvent,
      category: rep.category,
      temperature: computeTemperature(cluster.items, cluster.sourceCount),
      confidence: Number(confidence.toFixed(2)),
      source_count: cluster.sourceCount,
      coverage,                                        // publications/outlets/groups/byGroup
      coverage_label: formatCoverageLabel(coverage),
      phase,                                           // (PEÇA 7) ciclo de vida
      velocity: Number((cluster._velocity || 0).toFixed(2)),  // grupos/hora (escalada)
      topic_words: topicWords,
      entities: keyEntities,
      top_snippets: topSnippets,
      perspectives_heuristic: buildPerspectives(cluster.items),
      timeline_heuristic: buildTimeline(cluster.items),
      first_seen: new Date(firstSeenMs).toISOString(),
      last_seen: new Date(lastSeenMs).toISOString(),
      time_window_minutes: Math.max(1, Math.round((lastSeenMs - firstSeenMs) / 60000)),
    };
  });
};
