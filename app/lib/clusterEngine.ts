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
    };
  } catch {
    return null; // item malformado nunca derruba o pipeline
  }
};

// ------------------------------------------------------------
// Score composto entre dois artigos normalizados
// ------------------------------------------------------------
export const computePairScore = (
  a: NormalizedArticle,
  b: NormalizedArticle,
  weights = DEFAULTS.weights
): number => {
  const titleSim = stringSimilarity.compareTwoStrings(a.cleanTitle, b.cleanTitle);
  const coreOverlap = jaccard(a._coreSet, b._coreSet);
  const entityOverlap = semanticOverlap(a._entitySet, b._entitySet);
  const canonOverlap = semanticOverlap(a._canonSet, b._canonSet);
  const eventMatch = (a.eventType !== 'general' && a.eventType === b.eventType) ? 1 : 0;
  const catMatch = (a.category && a.category === b.category) ? 1 : 0;
  const diffMin = Math.abs(a._timeMs - b._timeMs) / 60000;
  const timeProx = diffMin <= 60 ? 1 : diffMin <= 240 ? 0.6 : diffMin <= 720 ? 0.3 : 0;

  return (
    titleSim * weights.titleSimilarity +
    coreOverlap * weights.coreWordOverlap +
    entityOverlap * weights.entityOverlap +
    canonOverlap * weights.canonicalTermOverlap +
    eventMatch * weights.eventTypeMatch +
    catMatch * weights.categoryMatch +
    timeProx * weights.timeProximity
  );
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

  // 2) Agrupamento greedy com score composto
  const used = new Set<any>();
  const potential: Array<{ items: NormalizedArticle[]; perSource: Map<string, number> }> = [];

  for (let i = 0; i < normalized.length; i++) {
    const seedArt = normalized[i];
    if (used.has(seedArt.id)) continue;
    const items = [seedArt];
    const perSource = new Map<string, number>([[seedArt.source, 1]]);
    used.add(seedArt.id);

    // (C1) Varre repetidamente até o cluster estabilizar: um candidato rejeitado
    // quando o cluster era pequeno pode passar depois que ele cresce (o max-linkage
    // ganha novos membros para comparar). Sem isso, a ordem do feed definia o
    // resultado — e matérias do mesmo caso ficavam de fora.
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = i + 1; j < normalized.length; j++) {
        const cand = normalized[j];
        if (used.has(cand.id)) continue;

        // MAX-LINKAGE: compara com o membro MAIS PRÓXIMO do cluster, não só a semente.
        let score = -Infinity;
        let bestMember = seedArt;
        for (const member of items) {
          const s = computePairScore(member, cand, cfg.weights);
          if (s > score) { score = s; bestMember = member; }
        }
        const sameSource = perSource.has(cand.source);

        if (sameSource) {
          const titleSim = stringSimilarity.compareTwoStrings(bestMember.cleanTitle, cand.cleanTitle);
          if (titleSim >= cfg.duplicateTitleSim) { used.add(cand.id); continue; } // duplicata: consome, não infla
          if ((perSource.get(cand.source) || 0) >= cfg.maxPerSourceInCluster) continue;
          if (score < cfg.sameSourceThreshold) continue;
        } else if (score < cfg.scoreThreshold) {
          continue;
        }

        items.push(cand);
        perSource.set(cand.source, (perSource.get(cand.source) || 0) + 1);
        used.add(cand.id);
        grew = true;   // cluster cresceu → revarre, pode atrair mais
      }
    }

    if (items.length > 1) potential.push({ items, perSource });
  }

  if (potential.length === 0) return [];

  // 3) Ranking de clusters: diversidade de fontes > tamanho bruto
  const scored = potential.map(c => {
    const sources = new Set(c.items.map(a => a.source));
    let sourceImpact = 0;
    sources.forEach(s => { sourceImpact += (cfg.sourceWeights[s] || 1); });
    const hasGoodImage = c.items.some(a => hasRealImageUrl(a.img) && !cfg.imageBlockedSources.includes(a.source));
    const newest = Math.min(...c.items.map(a => a.ageMinutes));
    const recencyBoost = newest <= 60 ? 1.4 : newest <= 180 ? 1.15 : 1;
    const impactScore = c.items.length * sourceImpact * Math.pow(sources.size, 1.4) * (hasGoodImage ? 1.15 : 1) * recencyBoost;
    return { ...c, impactScore, sourceCount: sources.size };
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

    // (C1) Contagem HONESTA: separa publicações, veículos e GRUPOS editoriais
    // independentes. G1 + O Globo + Valor = 3 veículos, mas 1 grupo — não são
    // três confirmações independentes.
    const coverage = countCoverage(cluster.items.map(a => ({ source: a.source })));

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
      coverage,                       // ← publications / outlets / groups / byGroup
      coverage_label: formatCoverageLabel(coverage),
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
