// ============================================================
// VETRA — clusterEngine.ts V3
// Clusterização heurística por CASO/EVENTO (sem IA).
// Evita o erro clássico de agrupar apenas por tema amplo usando:
// - entidades do servidor (objeto ou array)
// - termos canônicos
// - assinatura de ação/evento
// - janela temporal por tipo de evento
// - gate obrigatório de âncora
// - coesão média do cluster (evita efeito corrente/chaining)
// - diversidade por GRUPO EDITORIAL independente
// ============================================================

import * as stringSimilarity from 'string-similarity';
import { normalizeTerm, getCanonicalTerms, getDomainHints, displayCanonicalTerm } from './semanticDictionary';
import { detectEventType } from './articleSummaryEngine';
import { countCoverage, formatCoverageLabel } from './editorialGroups';

const DEFAULTS = {
  maxArticles: 220,
  clusterLimit: 5,
  scoreThreshold: 0.48,
  sameSourceThreshold: 0.72,
  cohesionFloor: 0.42,
  duplicateTitleSim: 0.92,
  maxPerSourceInCluster: 2,
  weights: {
    titleSimilarity: 0.24,
    coreWordOverlap: 0.16,
    entityOverlap: 0.20,
    canonicalTermOverlap: 0.13,
    actionOverlap: 0.09,
    eventTypeMatch: 0.08,
    categoryMatch: 0.03,
    timeProximity: 0.07,
  },
  sourceWeights: {
    'G1': 3, 'CNN Brasil': 3, 'O Globo': 2.5, 'Band': 2, 'Estadão': 2,
    'Folha de S.Paulo': 2, 'Jovem Pan': 1.5, 'Metropoles': 1.5,
  } as Record<string, number>,
  imagePreferredSources: ['Extra', 'CNN Brasil', 'Band', 'O Globo', 'Veja', 'Jovem Pan', 'Metropoles', 'SBT News', 'Times Brasil', 'Estadao', 'Fox News', '180graus'],
  imageBlockedSources: ['ISTOÉ', 'ISTOÉ DINHEIRO', 'UOL Economia', 'Estadão E-Investidor', 'F5', 'UOL', 'Folha de S.Paulo', 'Investing', 'E-Investidor', 'UOL Noticias', 'Money Times', 'Estadão | As Últimas Notícias', 'G1', 'UOL NOTICIAS', 'Valor Investe', 'UOL ECONOMIA'],
};

export type ClusterEngineOptions = Partial<typeof DEFAULTS>;

type PairFeatures = {
  titleSimilarity: number;
  coreWordOverlap: number;
  entityOverlap: number;
  canonicalTermOverlap: number;
  actionOverlap: number;
  eventTypeMatch: number;
  categoryMatch: number;
  timeProximity: number;
  timeDiffMinutes: number;
  sharedAnchorCount: number;
  passesGate: boolean;
};

const STOPWORDS = new Set([
  'a','o','e','de','do','da','das','dos','para','com','sem','um','uma','os','as','que','em','no','na','nos','nas',
  'seu','sua','por','apos','ate','sobre','contra','entre','como','mais','menos','ja','nao','sim','ser','ter','diz',
  'veja','saiba','confira','entenda','pode','deve','vai','foi','sao','esta','estao','hoje','nesta','neste','nova','novo',
  'segundo','afirma','afirmou','disse','revela','mostra','agora','ainda','tambem','caso','tema','noticia','materia',
]);

// Termos canônicos úteis para domínio, mas fracos demais para provar que é o MESMO caso.
const WEAK_ANCHORS = new Set([
  'presidente','governo federal','congresso','camara dos deputados','senado','eleicoes','juros','inflacao','mercado',
  'inteligencia artificial','rede social','medicamento','vacina','policia militar','policia federal','guerra','eua','china',
  'selecao brasileira','tecnico','lesao','chuva forte','onda de calor',
].map(normalizeTerm));

const ACTION_PATTERNS: Array<[string, RegExp]> = [
  ['morte', /\b(morre|morreu|morte|falece|faleceu|obito)\b/],
  ['prisao', /\b(prende|prendeu|preso|prisao|detencao|captura)\b/],
  ['investigacao', /\b(investiga|investigacao|apura|inquerito|denuncia|indicia)\b/],
  ['decisao', /\b(decide|decisao|julga|julgamento|liminar|condena|absolve)\b/],
  ['aprovacao', /\b(aprova|aprovou|autoriza|autorizou|sanciona|libera)\b/],
  ['anuncio', /\b(anuncia|anunciou|confirma|divulga|revela|apresenta)\b/],
  ['nomeacao', /\b(nomeia|nomeou|indica|indicou|empossa|assume)\b/],
  ['demissao', /\b(demite|demitiu|exonera|afasta|renuncia|extingue|dissolve)\b/],
  ['alta', /\b(sobe|subiu|avanca|dispara|salta|valoriza|alta)\b/],
  ['queda', /\b(cai|caiu|recua|despenca|tomba|desvaloriza|queda)\b/],
  ['ataque', /\b(ataca|ataque|bombardeio|ofensiva|invasao|retaliacao)\b/],
  ['acidente', /\b(acidente|colisao|queda|desabamento|incendio|atropelamento)\b/],
  ['lancamento', /\b(lanca|lancou|lancamento|estreia|chega ao mercado)\b/],
  ['votacao', /\b(vota|votacao|plenaria|plenário|turno|sessao)\b/],
  ['jogo', /\b(vence|venceu|derrota|empata|placar|gol|partida|jogo)\b/],
];

const EVENT_TYPE_MAP: Record<string, string> = {
  morte: 'death', prisao: 'security_operation', acidente: 'accident', decisao_judicial: 'legal_decision',
  economia: 'market_move', politica: 'announcement', esporte: 'sports_match', seguranca: 'security_operation',
  clima: 'weather_event', anuncio: 'announcement', outro: 'general',
};

const EVENT_WINDOWS_MINUTES: Record<string, number> = {
  sports_match: 12 * 60,
  market_move: 18 * 60,
  weather_event: 30 * 60,
  security_operation: 48 * 60,
  legal_decision: 72 * 60,
  investigation: 72 * 60,
  conflict: 72 * 60,
  death: 96 * 60,
  announcement: 48 * 60,
  general: 30 * 60,
};

const EVENT_IMPORTANCE: Record<string, number> = {
  conflict: 1.22,
  legal_decision: 1.16,
  security_operation: 1.14,
  crisis: 1.14,
  market_move: 1.10,
  weather_event: 1.08,
  death: 1.06,
  announcement: 1.02,
  general: 1,
};

const SENSATIONAL_RX = /\b(veja|confira|saiba|entenda|choca|chocante|urgente|bomba|inacreditavel|imperdivel|voce nao vai acreditar)\b/;

const stripHtml = (s: any): string =>
  String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const toDateMs = (a: any): number => {
  const candidates = [a?.publishedAt, a?.rawDate, a?.historicalTimestamp, a?.published_at, a?.pubDate, a?.date];
  for (const c of candidates) {
    if (c == null) continue;
    const t = typeof c === 'number' ? c : new Date(c).getTime();
    if (!Number.isNaN(t) && t > 0) return t;
  }
  return Date.now();
};

const normalizeEventType = (value: any, title: string): string => {
  const raw = normalizeTerm(value || '');
  const mapped = EVENT_TYPE_MAP[raw] || raw;
  if (mapped && mapped !== 'general' && mapped !== 'outro') return mapped;
  return detectEventType(title);
};

const normalizeUrl = (value: any): string => {
  try {
    const url = new URL(String(value || ''));
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(k => url.searchParams.delete(k));
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value || '').split('#')[0].replace(/\/$/, '');
  }
};

const simpleHash = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

const hasRealImageUrl = (url: any): boolean =>
  Boolean(url) && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(String(url)) && !String(url).includes('ui-avatars.com');

const intersectionCount = (a: Set<string>, b: Set<string>): number => {
  let count = 0;
  for (const item of a) if (b.has(item)) count += 1;
  return count;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  const inter = intersectionCount(a, b);
  return inter / (a.size + b.size - inter);
};

const overlapCoefficient = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  return intersectionCount(a, b) / Math.min(a.size, b.size);
};

const displayEntity = (value: string): string => {
  const canonical = displayCanonicalTerm(value);
  if (canonical && canonical !== normalizeTerm(canonical)) return canonical;
  return value.replace(/\b\w/g, m => m.toUpperCase());
};

const readServerEntities = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'object') {
    const all = [
      ...(Array.isArray(raw.names) ? raw.names : []),
      ...(Array.isArray(raw.orgs) ? raw.orgs : []),
      ...(Array.isArray(raw.tickers) ? raw.tickers : []),
    ];
    return all.map(String).filter(Boolean);
  }
  return [];
};

const extractFallbackEntities = (title: string): string[] =>
  (title.match(/\b[A-ZÀ-Ú][a-zà-ú]{2,}(?:\s+[A-ZÀ-Ú][a-zà-ú]{2,}){0,2}\b|\b[A-Z]{2,}\b/g) || [])
    .map(normalizeTerm)
    .filter(v => v.length > 2 && !STOPWORDS.has(v));

const extractActions = (text: string): string[] => {
  const normalized = ` ${normalizeTerm(text)} `;
  const found: string[] = [];
  for (const [label, rx] of ACTION_PATTERNS) if (rx.test(normalized)) found.push(label);
  return found;
};

const firstCleanSentence = (text: string, max = 190): string => {
  const clean = stripHtml(text);
  if (!clean) return '';
  const sentence = (clean.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9"])/)[0] || clean).trim();
  if (sentence.length <= max) return /[.!?…]$/.test(sentence) ? sentence : `${sentence}.`;
  const slice = sentence.slice(0, max);
  const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
  return `${(cut > max * 0.55 ? slice.slice(0, cut) : slice).trim()}…`;
};

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
  actions: string[];
  fingerprint: string;
  _original: any;
  _coreSet: Set<string>;
  _entitySet: Set<string>;
  _canonSet: Set<string>;
  _actionSet: Set<string>;
  _anchorSet: Set<string>;
  _timeMs: number;
}

export const normalizeArticleForCluster = (
  article: any,
  sourceWeights: Record<string, number> = DEFAULTS.sourceWeights,
): NormalizedArticle | null => {
  try {
    const title = stripHtml(article?.title || '');
    if (title.length < 8) return null;

    const cleanTitle = normalizeTerm(article?.normalizedTitle || title);
    const summary = stripHtml(article?.summary || article?.description || '');
    const timeMs = toDateMs(article);
    const source = String(article?.source || article?.channel || 'Fonte').trim();

    let coreWords = Array.isArray(article?.coreWords) && article.coreWords.length
      ? article.coreWords.map(normalizeTerm).filter(Boolean)
      : cleanTitle.split(' ').filter(w => w.length > 3 && !STOPWORDS.has(w));
    coreWords = Array.from(new Set(coreWords)).slice(0, 16);

    let entities = readServerEntities(article?.entities)
      .map(normalizeTerm)
      .filter(v => v.length > 2 && !STOPWORDS.has(v));
    if (!entities.length) entities = extractFallbackEntities(title);
    entities = Array.from(new Set(entities)).slice(0, 12);

    const canonicalTerms = Array.from(new Set(getCanonicalTerms(`${title} ${summary.slice(0, 350)}`).map(normalizeTerm)));
    const actions = Array.from(new Set(extractActions(`${title} ${summary.slice(0, 180)}`)));
    const eventType = normalizeEventType(article?.eventType, title);
    const category = normalizeTerm(article?.category || 'geral');
    const canonicalUrl = normalizeUrl(article?.canonicalUrl || article?.link || '');

    const strongCanon = canonicalTerms.filter(term => !WEAK_ANCHORS.has(term));
    const anchorSet = new Set([...entities, ...strongCanon]);

    return {
      id: article?.id ?? canonicalUrl ?? simpleHash(`${source}|${title}`),
      title,
      cleanTitle,
      source,
      sourceWeight: sourceWeights[source] || 1,
      link: article?.link || '',
      canonicalUrl: canonicalUrl || null,
      rawDate: article?.rawDate,
      publishedAt: article?.publishedAt || null,
      ageMinutes: Math.max(0, Math.round((Date.now() - timeMs) / 60000)),
      summary,
      snippet: summary.slice(0, 260),
      img: article?.img,
      logo: article?.logo,
      category,
      tags: Array.isArray(article?.keyphrases) ? article.keyphrases.filter(Boolean).slice(0, 8) : [],
      entities,
      eventType,
      coreWords,
      canonicalTerms,
      actions,
      fingerprint: simpleHash(`${canonicalUrl}|${cleanTitle}|${source}`),
      _original: article,
      _coreSet: new Set([...coreWords, ...canonicalTerms]),
      _entitySet: new Set(entities),
      _canonSet: new Set(canonicalTerms),
      _actionSet: new Set(actions),
      _anchorSet: anchorSet,
      _timeMs: timeMs,
    };
  } catch {
    return null;
  }
};

const computePairFeatures = (a: NormalizedArticle, b: NormalizedArticle): PairFeatures => {
  const titleSimilarity = stringSimilarity.compareTwoStrings(a.cleanTitle, b.cleanTitle);
  const coreWordOverlap = jaccard(a._coreSet, b._coreSet);
  const entityOverlap = overlapCoefficient(a._entitySet, b._entitySet);
  const canonicalTermOverlap = overlapCoefficient(a._canonSet, b._canonSet);
  const actionOverlap = overlapCoefficient(a._actionSet, b._actionSet);
  const eventTypeMatch = a.eventType !== 'general' && a.eventType === b.eventType ? 1 : 0;
  const categoryMatch = a.category && a.category === b.category ? 1 : 0;
  const timeDiffMinutes = Math.abs(a._timeMs - b._timeMs) / 60000;
  const allowedWindow = Math.max(EVENT_WINDOWS_MINUTES[a.eventType] || EVENT_WINDOWS_MINUTES.general, EVENT_WINDOWS_MINUTES[b.eventType] || EVENT_WINDOWS_MINUTES.general);
  const timeProximity = timeDiffMinutes <= 60 ? 1 : timeDiffMinutes <= 240 ? 0.75 : timeDiffMinutes <= 720 ? 0.45 : timeDiffMinutes <= allowedWindow ? 0.2 : 0;
  const sharedAnchorCount = intersectionCount(a._anchorSet, b._anchorSet);

  const conflictingSpecificEvents = a.eventType !== 'general' && b.eventType !== 'general' && a.eventType !== b.eventType;
  const hasStrongSemanticBridge = sharedAnchorCount >= 1 || entityOverlap >= 0.5 || canonicalTermOverlap >= 0.5;
  const hasLexicalBridge = titleSimilarity >= 0.48 || coreWordOverlap >= 0.28;
  const hasActionBridge = eventTypeMatch === 1 || actionOverlap >= 0.5;
  const outsideWindow = timeDiffMinutes > allowedWindow;

  let passesGate = true;
  if (!hasStrongSemanticBridge && !hasLexicalBridge) passesGate = false;
  if (conflictingSpecificEvents && titleSimilarity < 0.68 && sharedAnchorCount < 2) passesGate = false;
  if (outsideWindow && titleSimilarity < 0.78) passesGate = false;
  if (!hasActionBridge && titleSimilarity < 0.62 && sharedAnchorCount < 2) passesGate = false;
  // Mesma entidade em notícias diferentes não basta: exige ação/título/contexto compartilhado.
  if (sharedAnchorCount === 1 && titleSimilarity < 0.36 && coreWordOverlap < 0.18 && actionOverlap === 0) passesGate = false;

  return {
    titleSimilarity,
    coreWordOverlap,
    entityOverlap,
    canonicalTermOverlap,
    actionOverlap,
    eventTypeMatch,
    categoryMatch,
    timeProximity,
    timeDiffMinutes,
    sharedAnchorCount,
    passesGate,
  };
};

export const computePairScore = (
  a: NormalizedArticle,
  b: NormalizedArticle,
  weights = DEFAULTS.weights,
): number => {
  const f = computePairFeatures(a, b);
  if (!f.passesGate) return 0;
  return (
    f.titleSimilarity * weights.titleSimilarity +
    f.coreWordOverlap * weights.coreWordOverlap +
    f.entityOverlap * weights.entityOverlap +
    f.canonicalTermOverlap * weights.canonicalTermOverlap +
    f.actionOverlap * weights.actionOverlap +
    f.eventTypeMatch * weights.eventTypeMatch +
    f.categoryMatch * weights.categoryMatch +
    f.timeProximity * weights.timeProximity
  );
};

type WorkingCluster = {
  items: NormalizedArticle[];
  perSource: Map<string, number>;
};

const clusterFit = (cluster: WorkingCluster, candidate: NormalizedArticle, cfg: any) => {
  const scores = cluster.items
    .map(member => ({ member, score: computePairScore(member, candidate, cfg.weights), features: computePairFeatures(member, candidate) }))
    .filter(row => row.features.passesGate)
    .sort((a, b) => b.score - a.score);

  if (!scores.length) return { ok: false, fit: 0 };
  const best = scores[0];
  const top = scores.slice(0, Math.min(3, scores.length));
  const meanTop = top.reduce((sum, row) => sum + row.score, 0) / top.length;
  const sameSource = cluster.perSource.has(candidate.source);
  const threshold = sameSource ? cfg.sameSourceThreshold : cfg.scoreThreshold;
  const sourceCount = cluster.perSource.get(candidate.source) || 0;

  if (sameSource && sourceCount >= cfg.maxPerSourceInCluster) return { ok: false, fit: 0 };
  if (sameSource && best.features.titleSimilarity >= cfg.duplicateTitleSim) return { ok: false, fit: 0, duplicate: true };
  if (best.score < threshold) return { ok: false, fit: best.score };
  if (cluster.items.length >= 2 && meanTop < cfg.cohesionFloor) return { ok: false, fit: meanTop };

  // Quanto maior o cluster, maior a exigência de confirmação por mais de um membro.
  if (cluster.items.length >= 4 && top.length >= 2 && top[1].score < cfg.cohesionFloor * 0.9) {
    return { ok: false, fit: top[1].score };
  }

  const fit = best.score * 0.65 + meanTop * 0.35;
  return { ok: true, fit };
};

const computeClusterCohesion = (items: NormalizedArticle[], weights: any): number => {
  if (items.length < 2) return 0;
  const scores: number[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const score = computePairScore(items[i], items[j], weights);
      if (score > 0) scores.push(score);
    }
  }
  if (!scores.length) return 0;
  scores.sort((a, b) => b - a);
  // Mediana + média dos melhores links: pune correntes fracas sem exigir títulos idênticos.
  const median = scores[Math.floor(scores.length / 2)];
  const topMean = scores.slice(0, Math.min(items.length, scores.length)).reduce((s, v) => s + v, 0) / Math.min(items.length, scores.length);
  return median * 0.55 + topMean * 0.45;
};

const pickRepresentative = (items: NormalizedArticle[], weights: any): NormalizedArticle => {
  let best = items[0];
  let bestScore = -Infinity;
  for (const article of items) {
    const pairScores = items.filter(x => x !== article).map(x => computePairScore(article, x, weights));
    const centrality = pairScores.length ? pairScores.reduce((s, v) => s + v, 0) / pairScores.length : 0;
    let score = centrality * 5 + article.sourceWeight * 0.28;
    if (article.title.length >= 38 && article.title.length <= 115) score += 0.65;
    if (article.entities.length) score += 0.25;
    if (article.actions.length) score += 0.18;
    if (SENSATIONAL_RX.test(article.cleanTitle)) score -= 1.1;
    if (article.cleanTitle.includes('?')) score -= 0.35;
    if (hasRealImageUrl(article.img)) score += 0.18;
    if (score > bestScore) { bestScore = score; best = article; }
  }
  return best;
};

const buildPerspectives = (items: NormalizedArticle[]) => {
  const seen = new Set<string>();
  const labels: Record<string, string> = {
    mercado: 'mercado e impacto econômico', politica: 'processo político', justica: 'ângulo jurídico', saude: 'saúde pública',
    tecnologia: 'tecnologia e produto', seguranca: 'segurança e investigação', internacional: 'repercussão internacional',
    esportes: 'desempenho esportivo', clima: 'efeitos meteorológicos',
  };
  return items
    .filter(item => {
      if (seen.has(item.source)) return false;
      seen.add(item.source);
      return true;
    })
    .slice(0, 6)
    .map(item => {
      const hint = getDomainHints(`${item.title} ${item.summary.slice(0, 120)}`)[0];
      return { source: item.source, angle: labels[hint] || 'núcleo factual', title: item.title };
    });
};

const buildTimeline = (items: NormalizedArticle[]) => {
  const sorted = [...items].sort((a, b) => a._timeMs - b._timeMs);
  if (!sorted.length) return [];
  const selected: NormalizedArticle[] = [sorted[0]];
  for (const item of sorted.slice(1, -1)) {
    const previous = selected[selected.length - 1];
    const novelty = 1 - stringSimilarity.compareTwoStrings(previous.cleanTitle, item.cleanTitle);
    if (novelty >= 0.28 || item.eventType !== previous.eventType) selected.push(item);
    if (selected.length >= 4) break;
  }
  const last = sorted[sorted.length - 1];
  if (last && selected[selected.length - 1] !== last) selected.push(last);
  return selected.slice(0, 5).map(item => ({
    at: new Date(item._timeMs).toISOString(),
    label: item.title,
    source: item.source,
    summary: firstCleanSentence(item.summary, 130),
  }));
};

const computeTemperature = (items: NormalizedArticle[], independentGroups: number): string => {
  const newest = Math.min(...items.map(i => i.ageMinutes));
  const first = Math.min(...items.map(i => i._timeMs));
  const last = Math.max(...items.map(i => i._timeMs));
  const hours = Math.max(0.5, (last - first) / 3600000);
  const velocity = items.length / hours;
  if (independentGroups >= 4 && newest <= 90 && velocity >= 1.2) return 'fervendo';
  if (independentGroups >= 3 || (independentGroups >= 2 && newest <= 180)) return 'em alta';
  return 'observando';
};

const buildClusterSummary = (items: NormalizedArticle[], rep: NormalizedArticle, coverage: ReturnType<typeof countCoverage>): string => {
  const lead = firstCleanSentence(rep.snippet || rep.title, 180);
  const coverageText = `${coverage.groups} grupo${coverage.groups === 1 ? '' : 's'} editorial${coverage.groups === 1 ? '' : 'is'} independente${coverage.groups === 1 ? '' : 's'} acompanha${coverage.groups === 1 ? '' : 'm'} o caso.`;
  return lead ? `${lead} ${coverageText}` : coverageText;
};

export const generateSmartHeuristicClusters = (articles: any[], options: ClusterEngineOptions = {}) => {
  const cfg = {
    ...DEFAULTS,
    ...options,
    weights: { ...DEFAULTS.weights, ...((options as any).weights || {}) },
    sourceWeights: { ...DEFAULTS.sourceWeights, ...((options as any).sourceWeights || {}) },
  };
  if (!Array.isArray(articles) || articles.length < 5) return [];

  const normalized: NormalizedArticle[] = [];
  const seenUrls = new Set<string>();
  for (const raw of articles.slice(0, cfg.maxArticles)) {
    const item = normalizeArticleForCluster(raw, cfg.sourceWeights);
    if (!item) continue;
    const dedupeKey = item.canonicalUrl || `${item.source}|${item.cleanTitle}`;
    if (seenUrls.has(dedupeKey)) continue;
    seenUrls.add(dedupeKey);
    normalized.push(item);
  }
  if (normalized.length < 5) return [];

  // Fontes de maior peso e itens recentes ajudam como âncoras, mas cada candidato
  // escolhe o MELHOR cluster disponível; não fica preso ao primeiro seed.
  normalized.sort((a, b) => (b._timeMs - a._timeMs) || (b.sourceWeight - a.sourceWeight));
  const working: WorkingCluster[] = [];

  for (const candidate of normalized) {
    let bestIndex = -1;
    let bestFit = 0;
    let duplicateConsumed = false;

    for (let i = 0; i < working.length; i++) {
      const fit = clusterFit(working[i], candidate, cfg);
      if ((fit as any).duplicate) {
        duplicateConsumed = true;
        break;
      }
      if (fit.ok && fit.fit > bestFit) {
        bestFit = fit.fit;
        bestIndex = i;
      }
    }

    if (duplicateConsumed) continue;
    if (bestIndex >= 0) {
      working[bestIndex].items.push(candidate);
      working[bestIndex].perSource.set(candidate.source, (working[bestIndex].perSource.get(candidate.source) || 0) + 1);
    } else {
      working.push({ items: [candidate], perSource: new Map([[candidate.source, 1]]) });
    }
  }

  const potential = working.filter(cluster => cluster.items.length >= 2);
  if (!potential.length) return [];

  const scored = potential.map(cluster => {
    const coverage = countCoverage(cluster.items.map(item => ({ source: item.source })));
    const cohesion = computeClusterCohesion(cluster.items, cfg.weights);
    const newest = Math.min(...cluster.items.map(item => item.ageMinutes));
    const first = Math.min(...cluster.items.map(item => item._timeMs));
    const last = Math.max(...cluster.items.map(item => item._timeMs));
    const hours = Math.max(0.5, (last - first) / 3600000);
    const velocity = cluster.items.length / hours;
    const recency = newest <= 45 ? 1.32 : newest <= 120 ? 1.18 : newest <= 360 ? 1.06 : 0.92;
    const dominantEvents: Record<string, number> = {};
    cluster.items.forEach(item => { dominantEvents[item.eventType] = (dominantEvents[item.eventType] || 0) + 1; });
    const dominantEvent = Object.keys(dominantEvents).sort((a, b) => dominantEvents[b] - dominantEvents[a])[0] || 'general';
    const eventBoost = EVENT_IMPORTANCE[dominantEvent] || 1;
    const imageBoost = cluster.items.some(item => hasRealImageUrl(item.img)) ? 1.05 : 1;

    const impactScore =
      Math.pow(Math.max(1, coverage.groups), 1.85) *
      Math.pow(Math.max(1, coverage.outlets), 0.45) *
      Math.log2(cluster.items.length + 1) *
      Math.max(0.55, cohesion * 1.7) *
      Math.min(1.35, 1 + velocity * 0.08) *
      recency * eventBoost * imageBoost;

    return { ...cluster, coverage, cohesion, velocity, dominantEvent, impactScore };
  });

  const top = scored
    .filter(cluster => cluster.cohesion >= cfg.cohesionFloor * 0.82 || cluster.coverage.groups >= 3)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, cfg.clusterLimit);

  return top.map(cluster => {
    const rep = pickRepresentative(cluster.items, cfg.weights);
    const preferred = new Set(cfg.imagePreferredSources);
    const blocked = new Set(cfg.imageBlockedSources);
    const imageCandidates = cluster.items.filter(item => !blocked.has(item.source) && hasRealImageUrl(item.img));
    const repImage = imageCandidates.find(item => preferred.has(item.source)) || imageCandidates[0] || rep;
    const sortedItems = [...cluster.items].sort((a, b) => b._timeMs - a._timeMs);

    const entityCounts: Record<string, number> = {};
    cluster.items.forEach(item => item.entities.forEach(entity => { entityCounts[entity] = (entityCounts[entity] || 0) + 1; }));
    const keyEntities = Object.keys(entityCounts)
      .sort((a, b) => entityCounts[b] - entityCounts[a])
      .slice(0, 5)
      .map(displayEntity);

    const wordCounts: Record<string, number> = {};
    cluster.items.forEach(item => item._coreSet.forEach(word => { wordCounts[word] = (wordCounts[word] || 0) + 1; }));
    const topicWords = Object.keys(wordCounts)
      .filter(word => wordCounts[word] >= 2 && !STOPWORDS.has(word) && word.length > 2)
      .sort((a, b) => wordCounts[b] - wordCounts[a])
      .slice(0, 8);

    const firstSeenMs = Math.min(...cluster.items.map(item => item._timeMs));
    const lastSeenMs = Math.max(...cluster.items.map(item => item._timeMs));
    const confidence = Math.min(0.98,
      0.28 +
      Math.min(0.30, cluster.cohesion * 0.48) +
      Math.min(0.24, cluster.coverage.groups * 0.06) +
      Math.min(0.16, keyEntities.length * 0.035),
    );

    return {
      clusterId: `smart-v3-${simpleHash(sortedItems.map(item => item.fingerprint).join('|'))}`,
      ai_title: rep.title,
      ai_summary: buildClusterSummary(cluster.items, rep, cluster.coverage),
      representative_image: repImage.img,
      related_articles: sortedItems.map(item => item._original),
      keyEntities,
      event_type: cluster.dominantEvent,
      category: rep.category,
      temperature: computeTemperature(cluster.items, cluster.coverage.groups),
      confidence: Number(confidence.toFixed(2)),
      cohesion: Number(cluster.cohesion.toFixed(2)),
      velocity: Number(cluster.velocity.toFixed(2)),
      source_count: cluster.coverage.outlets,
      independent_group_count: cluster.coverage.groups,
      coverage: cluster.coverage,
      coverage_label: formatCoverageLabel(cluster.coverage),
      topic_words: topicWords,
      entities: keyEntities,
      top_snippets: cluster.items.map(item => item.snippet).filter(text => text.length > 50).slice(0, 4),
      perspectives_heuristic: buildPerspectives(cluster.items),
      timeline_heuristic: buildTimeline(cluster.items),
      first_seen: new Date(firstSeenMs).toISOString(),
      last_seen: new Date(lastSeenMs).toISOString(),
      time_window_minutes: Math.max(1, Math.round((lastSeenMs - firstSeenMs) / 60000)),
      case_signature: {
        event_type: cluster.dominantEvent,
        anchors: keyEntities.slice(0, 3),
        actions: Array.from(new Set(cluster.items.flatMap(item => item.actions))).slice(0, 4),
      },
    };
  });
};
