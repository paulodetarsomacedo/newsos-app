// ============================================================
// VETRA — articleSummaryEngine.ts
// Resumo estruturado heurístico do GlassBrowser (SEM IA).
// Trabalha só com metadados do RSS + contexto lite quando existir.
// Nunca inventa fato: quando falta dado, admite incerteza.
// ============================================================

import { normalizeTerm, getCanonicalTerms, getDomainHints, displayCanonicalTerm } from './semanticDictionary';

// Forma de exibição de qualquer termo (canônico do dicionário OU entidade
// capitalizada do título). Siglas/exceções resolvidas pelo dicionário;
// o resto mantém a capitalização de origem quando já vem capitalizado.
const displayTerm = (term: any): string => {
  const raw = String(term ?? '').trim();
  if (!raw) return '';
  const disp = displayCanonicalTerm(raw);
  // Se displayCanonicalTerm só recapitalizou um termo já capitalizado no
  // original (entidade tipo "Donald Trump"), preserva o original.
  if (/[A-ZÀ-Ú]/.test(raw) && normalizeTerm(raw) === normalizeTerm(disp)) return raw;
  return disp;
};

// ============================================================
// ADAPTADORES DO FORMATO DO SERVIDOR (edge function)
// O servidor (buildItemContextFields) manda:
//   entities = { orgs[], names[], numbers[], money[], percents[], tickers[] }
//   eventType ∈ { morte, prisao, acidente, decisao_judicial, economia,
//                 politica, esporte, seguranca, clima, anuncio, outro }
//   money já vem extraído certo ("R$ 120 milhões") — usamos direto.
// ============================================================

// Lê entities seja como objeto {orgs,names,...} (formato do servidor) OU
// como array simples (compatibilidade). Retorna listas normalizadas.
interface ServerEntities {
  orgs: string[]; names: string[]; numbers: string[];
  money: string[]; percents: string[]; tickers: string[];
}
const readEntities = (raw: any): ServerEntities => {
  const empty: ServerEntities = { orgs: [], names: [], numbers: [], money: [], percents: [], tickers: [] };
  if (!raw) return empty;
  if (Array.isArray(raw)) {
    // formato antigo/simples: trata tudo como "names"
    return { ...empty, names: raw.filter(Boolean).map(String) };
  }
  if (typeof raw === 'object') {
    return {
      orgs: Array.isArray(raw.orgs) ? raw.orgs.filter(Boolean).map(String) : [],
      names: Array.isArray(raw.names) ? raw.names.filter(Boolean).map(String) : [],
      numbers: Array.isArray(raw.numbers) ? raw.numbers.filter(Boolean).map(String) : [],
      money: Array.isArray(raw.money) ? raw.money.filter(Boolean).map(String) : [],
      percents: Array.isArray(raw.percents) ? raw.percents.filter(Boolean).map(String) : [],
      tickers: Array.isArray(raw.tickers) ? raw.tickers.filter(Boolean).map(String) : [],
    };
  }
  return empty;
};

// Números prontos do servidor: money + percents, deduplicados e limpos.
// Substitui o extractor local bugado ("R$ 120 mil" / "US$ 71,").
const numbersFromEntities = (ent: ServerEntities): string[] => {
  const all = [...ent.money, ...ent.percents]
    .map(s => s.replace(/[.,;]+$/, '').trim())   // tira pontuação pendurada
    .filter(Boolean);
  return Array.from(new Set(all)).slice(0, 4);
};

// Tradução eventType do servidor → tipos internos (dos meus templates).
const SERVER_EVENT_MAP: Record<string, string> = {
  morte: 'death',
  prisao: 'security_operation',
  acidente: 'accident',
  decisao_judicial: 'legal_decision',
  economia: 'market_move',
  politica: 'announcement',   // política genérica: refinada pela detecção local se possível
  esporte: 'sports_match',
  seguranca: 'security_operation',
  clima: 'weather_event',
  anuncio: 'announcement',
  // "outro" NÃO entra aqui de propósito → dispara detecção local.
};

// Resolve o eventType final: usa o do servidor quando é específico;
// quando é "outro"/"politica"/vazio, tenta a detecção local (mais fina).
const resolveEventType = (serverType: any, localText: string): string => {
  const st = String(serverType || '').toLowerCase();
  const local = detectEventType(localText);
  // Se a detecção local achou algo específico, ela tem prioridade sobre
  // os tipos genéricos do servidor.
  if (local !== 'general') {
    // exceção: se servidor deu tipo forte e local concordou em espírito, mantém local
    return local;
  }
  if (st && st !== 'outro' && SERVER_EVENT_MAP[st]) return SERVER_EVENT_MAP[st];
  return 'general';
};

// ------------------------------------------------------------
// (FASE 1 — Camada 1) DETECÇÃO DE CONTENT_MODE
// Que tipo de MATÉRIA é (≠ event_type). Só modos de alta confiança;
// 'general' é fallback honesto, não derrota.
// ------------------------------------------------------------
const LISTICLE_TITLE_RX = /\b(\d+\s+(?:coisas|motivos|razoes|dicas|formas|maneiras|jeitos|lugares|filmes|series|livros|receitas|passos|curiosidades)|quem (?:e|sao|foi|foram)|veja (?:os|as|quais)|conheca|lista d|os \d+|as \d+|ranking|melhores|piores|saiba quais)\b/i;
const TUTORIAL_TITLE_RX = /\b(como (?:criar|fazer|usar|configurar|instalar|ativar|desativar|baixar|acessar|resolver|montar|escolher|declarar|emitir|cadastrar)|passo a passo|tutorial|aprenda a|guia (?:de|para|completo)|saiba como|veja como)\b/i;
const TUTORIAL_BODY_RX = /\b(neste (?:artigo|tutorial|guia)|mostraremos|vamos (?:mostrar|ensinar|ver)|toque em|clique em|selecione|va em|acesse (?:o menu|as configuracoes)|siga os passos|passo \d)\b/i;
const OBITUARY_RX = /\b(morre|morreu|morte de|falece|faleceu|obito|luto|aos \d+ anos)\b/i;

export const detectContentMode = (article: any, body: string, eventType?: string): ContentMode => {
  const title = normalizeTerm(article?.title || '');
  const bodyNorm = normalizeTerm(body || '');
  const et = String(eventType || '');

  // 1) tutorial: assinatura muito clara no título ou corpo
  if (TUTORIAL_TITLE_RX.test(title) || TUTORIAL_BODY_RX.test(bodyNorm)) return 'how_to';
  // 2) listicle/curiosidade
  if (LISTICLE_TITLE_RX.test(title)) return 'listicle_history';
  // 3) placar ao vivo (event_type já resolveu isso com alta precisão)
  if (et === 'sports_match') return 'sports_live';
  // 4) obituário/perfil
  if (et === 'death' || OBITUARY_RX.test(title)) return 'profile_obituary';
  // 5) jurídico / regulatório / tributário
  if (et === 'legal_decision' || et === 'regulation' || /\b(icms|tributari|imposto|receita federal|stf|stj|justica|liminar|processo|acao civil)\b/.test(title)) return 'policy_or_legal';
  // 6) mercado/indicadores
  if (et === 'market_move' || /\b(dolar|bolsa|ibovespa|selic|inflacao|ipca|juros|cambio|petroleo)\b/.test(title)) return 'market_update';
  // 7) evento factual com verbo de ação forte
  if (['dismissal', 'appointment', 'approval', 'announcement', 'accident', 'security_operation', 'conflict', 'launch', 'crisis'].includes(et)) return 'breaking_event';
  // fallback honesto
  return 'general';
};

// Ponte de compatibilidade: mantém a assinatura antiga usada no motor.
export type ContentType = 'news' | 'listicle' | 'tutorial' | 'opinion';
export const detectContentType = (article: any, body: string): ContentType => {
  const mode = detectContentMode(article, body);
  if (mode === 'how_to') return 'tutorial';
  if (mode === 'listicle_history') return 'listicle';
  return 'news';
};

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
  // ── FASE 1 (aditivo, retrocompatível) ─────────────────────
  // content_mode: que TIPO DE MATÉRIA o usuário está lendo (≠ event_type).
  content_mode?: ContentMode;
  // sections: caixas ADAPTATIVAS já prontas para render. O page.tsx
  // prefere isto quando presente; os campos fixos acima continuam
  // preenchidos para compatibilidade/fallback.
  sections?: SummarySection[];
}

// (FASE 1 — Camada 1) Que tipo de matéria é. Começamos com os modos de
// ALTA confiança + 'general' como fallback honesto. Modos frágeis
// (opinion/explainer/review) ficam para depois, com dados reais.
export type ContentMode =
  | 'breaking_event'   // notícia/evento factual
  | 'policy_or_legal'  // decisão judicial, regulação, tributário
  | 'market_update'    // mercado/indicadores
  | 'how_to'           // tutorial/passo a passo
  | 'listicle_history' // lista/curiosidade
  | 'sports_live'      // placar ao vivo
  | 'profile_obituary' // obituário/perfil
  | 'general';         // notícia comum sem assinatura clara

export interface SummarySection {
  key: string;         // id estável da seção
  label: string;       // título exibido
  text: string;        // conteúdo extraído
  iconKey: string;     // nome lógico do ícone (page.tsx mapeia p/ lucide)
  confidence: number;  // 0..1 — page.tsx pode ocultar < piso, mas já vem filtrado
}

// ------------------------------------------------------------
// Detecção de tipo de evento (padrões em texto normalizado)
// Ordem da lista = prioridade em caso de empate.
// ------------------------------------------------------------
const EVENT_PATTERNS: Array<{ type: string; patterns: RegExp[] }> = [
  { type: 'death', patterns: [/\bmorre\b/, /\bmorte\b/, /\bobito\b/, /\bfalece\b/, /\bfaleceu\b/, /\bmorreu\b/, /\bmortos?\b/, /\bvitimas? fatais?\b/] },
  { type: 'accident', patterns: [/\bacidente\b/, /\bcolisao\b/, /\bqueda de\b/, /\bdesabamento\b/, /\bincendio\b/, /\bcapota/, /\batropel/, /\bdescarril/, /\bnaufrag/] },
  { type: 'security_operation', patterns: [/\boperacao policial\b/, /\bprisao\b/, /\bpreso\b/, /\bpresa\b/, /\bmandados?\b/, /\bapreensao\b/, /\bapreende\b/, /\bdeflagr/, /\bmegaoperacao\b/] },
  { type: 'investigation', patterns: [/\binvestiga\b/, /\bapura\b/, /\bmira\b/, /\bbusca e apreensao\b/, /\bdenuncia\b/, /\binquerito\b/, /\bindiciad/, /\bdelacao\b/] },
  { type: 'legal_decision', patterns: [/\bdecide\b/, /\bdecisao judicial\b/, /\bjulgamento\b/, /\bjulga\b/, /\bliminar\b/, /\bcondena\b/, /\babsolve\b/, /\bstf\b/, /\btribunal\b/, /\bstj\b/, /\bnega recurso\b/, /\bhomologa\b/] },
  { type: 'regulation', patterns: [/\bregulamenta\b/, /\bregulacao\b/, /\bnorma\b/, /\bregras\b/, /\bmarco regulatorio\b/, /\bresolucao\b/, /\bpublica edital\b/, /\bdecreto\b/] },
  // (ITEM 6) demissão/nomeação/extinção de cargos e órgãos — cobre "Trump desmonta comissão".
  { type: 'dismissal', patterns: [/\bdemite\b/, /\bdemitiu\b/, /\bexonera\b/, /\bexonerou\b/, /\bdesmonta\b/, /\bdesmontou\b/, /\besvazia\b/, /\besvaziou\b/, /\bafasta\b/, /\bafastou\b/, /\bdestitui\b/, /\bextingue\b/, /\bextinguiu\b/, /\bdissolve\b/, /\bdissolveu\b/, /\bcai o\b/, /\bpede demissao\b/, /\brenuncia\b/] },
  { type: 'appointment', patterns: [/\bnomeia\b/, /\bnomeou\b/, /\bindica\b/, /\bindicou\b/, /\bempossa\b/, /\btoma posse\b/, /\bassume\b/, /\bassumiu\b/, /\bescolhe para\b/, /\bnovo ministro\b/, /\bnovo presidente d/] },
  { type: 'approval', patterns: [/\baprova\b/, /\baprovou\b/, /\bautoriza\b/, /\bautorizou\b/, /\blibera\b/, /\bliberou\b/, /\bsanciona\b/, /\bsancionou\b/, /\baprovado\b/, /\baprovada\b/, /\bval a\b/, /\bda aval\b/] },
  { type: 'market_move', patterns: [/\bsobe\b/, /\bcai\b/, /\brecua\b/, /\bavanca\b/, /\bdispara\b/, /\bdespenca\b/, /\bfecha em alta\b/, /\bfecha em queda\b/, /\bdesvaloriza\b/, /\bvaloriza\b/, /\bderrete\b/, /\bsalta\b/, /\btomba\b/, /\bbate recorde\b/, /\brenova maxima\b/] },
  { type: 'weather_event', patterns: [/\bchuvas?\b/, /\btemporal\b/, /\bonda de calor\b/, /\bfrio\b/, /\balerta meteorologico\b/, /\bciclone\b/, /\bgeada\b/, /\bvendaval\b/, /\bgranizo\b/, /\benchente\b/, /\balagament/] },
  { type: 'alert', patterns: [/\balerta\b/, /\brisco\b/, /\bsurto\b/, /\bemergencia\b/, /\bameaca\b/, /\bpreocupacao\b/, /\bepidemia\b/, /\bcolapso\b/] },
  { type: 'study', patterns: [/\bestudo\b/, /\bpesquisa\b/, /\bcientistas\b/, /\blevantamento\b/, /\bdados mostram\b/, /\bpesquisadores\b/, /\bcenso\b/, /\bmapeamento\b/] },
  { type: 'conflict', patterns: [/\bconflito\b/, /\bataques?\b/, /\btensao\b/, /\bguerra\b/, /\bbombardeio\b/, /\bofensiva\b/, /\bmisseis?\b/, /\binvasao\b/, /\bcessar-fogo\b/, /\bretaliacao\b/] },
  // (ITEM 6) placar / partida ao vivo — página de acompanhamento, tratada com honestidade.
  { type: 'sports_match', patterns: [/\bx\b.*\bsiga\b/, /\bao vivo\b/, /\btempo real\b/, /\bplacar\b/, /\bminuto a minuto\b/, /\bacompanhe\b.*\bjogo\b/, /\bescalacao\b/, /\bpre-jogo\b/, /\blance a lance\b/, /\b\d+\s?x\s?\d+\b/] },
  { type: 'sports_absence', patterns: [/\bnao viaja\b/, /\bdesfalca\b/, /\bdesfalque\b/, /\blesao\b/, /\bfora d[eo]\b/, /\bduvida\b/, /\bcortado\b/, /\bvetado\b/, /\bsuspenso\b/, /\bpoupado\b/] },
  { type: 'launch', patterns: [/\blancamento\b/, /\bestreia\b/, /\bapresenta novo\b/, /\bchega ao mercado\b/, /\blanca\b/, /\blancou\b/, /\brevela novo\b/] },
  { type: 'announcement', patterns: [/\banuncia\b/, /\banunciou\b/, /\bapresenta\b/, /\bdivulga\b/, /\bconfirma\b/, /\brevela\b/, /\bfirma acordo\b/, /\bfecha parceria\b/] },
  { type: 'crisis', patterns: [/\bcrise\b/, /\bcaos\b/, /\bescandalo\b/, /\bpolemica\b/, /\bapagao\b/, /\bfalencia\b/, /\brombo\b/] },
];

// Tipos que exigem tratamento honesto específico no "O que aconteceu?".
export const SPECIAL_LIVE_TYPES = new Set(['sports_match']);

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

// ------------------------------------------------------------
// (ITEM 1) sanitizeExtractedText — higieniza o texto do proxy-lite.
// O proxy-lite entrega texto colado de menus, timestamps, créditos de
// foto e editoria grudada. Aqui removemos esse ruído ANTES de qualquer
// uso, para nenhum container receber lixo de navegação.
// ------------------------------------------------------------

// Blocos de navegação/boilerplate que aparecem colados no início.
const NAV_BOILERPLATE_RX = /\b(menu|minha band|tudo em um so lugar|pagina inicial|programas|jogos de hoje|assine|cadastre-se|newsletter|todos os campeonatos|topicos relacionados|leia mais|leia tambem|veja tambem|compartilhe|publicidade|continua apos|siga o [a-z]+ no|acesse o|baixe o app)\b/gi;

// Créditos de foto/agência. Cobre três formatos:
//  "Al Drago/Getty Images", "Foto: Reuters", "Divulgação".
// A alternância com barra vem primeiro (mais específica) para pegar o
// nome do fotógrafo colado à agência.
const AGENCIES = 'getty images|getty|reuters|afp|ap photo|agencia brasil|ebc|divulgacao|reproducao|arquivo pessoal|shutterstock|folhapress|estadao conteudo|montagem';
const PHOTO_CREDIT_RX = new RegExp(
  // Nome Próprio (1-3 palavras) "/" Agência  →  "Al Drago/Getty Images"
  `(?:[A-ZÀ-Ú][a-zà-ú]+\\s*){1,3}\\/\\s*(?:${AGENCIES})\\b` +
  // ou  "Foto:/Crédito: Agência"
  `|(?:foto|credito|imagem)\\s*[:\\-]?\\s*(?:${AGENCIES})\\b` +
  // ou  a agência sozinha
  `|\\b(?:${AGENCIES})\\b`,
  'gi'
);

// Timestamps e marcações de atualização.
const TIMESTAMP_RX = /\b\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*[•·-]?\s*\d{1,2}[:h]\d{2})?\b|\batualizad[oa]\s+(?:em|h[aá])?\s*[\d/:\sh]*|\b\d{1,2}[:h]\d{2}\b/gi;

// Editoria colada no começo ("Mundo", "Esportes", "Economia" grudado).
const LEADING_EDITORIA_RX = /^(mundo|brasil|economia|esportes|politica|tecnologia|saude|cultura|internacional|opiniao|colunas)\s*/i;

// Marcas com CamelCase legítimo que NÃO devem ser quebradas pelo decolar.
// (o bug "iPhone" -> "i Phone" veio daqui)
const BRAND_GUARD: Array<[RegExp, string]> = [
  [/\bi\s?phone/gi, 'iPhone'], [/\bi\s?pad/gi, 'iPad'], [/\bi\s?os\b/gi, 'iOS'],
  [/\bi\s?mac/gi, 'iMac'], [/\bi\s?cloud/gi, 'iCloud'], [/\bmac\s?os/gi, 'macOS'],
  [/\byou\s?tube/gi, 'YouTube'], [/\bwhats\s?app/gi, 'WhatsApp'],
  [/\btik\s?tok/gi, 'TikTok'], [/\blinked\s?in/gi, 'LinkedIn'],
  [/\bair\s?pods/gi, 'AirPods'], [/\bpower\s?point/gi, 'PowerPoint'],
  [/\bchat\s?gpt/gi, 'ChatGPT'], [/\bopen\s?ai/gi, 'OpenAI'],
];

const restoreBrands = (t: string): string => {
  let out = t;
  for (const [rx, canonical] of BRAND_GUARD) out = out.replace(rx, canonical);
  return out;
};

// Quebra junções coladas. Só insere espaço (NÃO ponto), para não criar
// pontuação sintética que engane o gate de qualidade.
// Marcas legítimas são preservadas via restoreBrands (antes e depois).
const decolar = (t: string): string => {
  const protectedText = restoreBrands(t);
  const split = protectedText
    .replace(/([a-zà-ú])([A-ZÀ-Ú])/g, '$1 $2')       // minúscula→MAIÚSCULA: "acessoBand" -> "acesso Band"
    .replace(/([a-zà-úA-ZÀ-Ú])(\d)/g, '$1 $2')       // letra→dígito: "americano10" -> "americano 10"
    .replace(/(\d)([A-ZÀ-Úa-zà-ú])/g, '$1 $2')       // dígito→letra: "01Estatísticas" -> "01 Estatísticas"
    .replace(/\s+/g, ' ')
    .trim();
  return restoreBrands(split); // reconstrói marcas que o split possa ter separado
};

export const sanitizeExtractedText = (raw: any): string => {
  let t = stripHtml(raw);
  if (!t) return '';
  t = decolar(t);
  t = t.replace(PHOTO_CREDIT_RX, ' ');
  t = t.replace(TIMESTAMP_RX, ' ');
  t = t.replace(NAV_BOILERPLATE_RX, ' ');
  t = t.replace(LEADING_EDITORIA_RX, '');
  // Remove sequências longas de Capitalizadas sem verbo nem pontuação
  // (assinatura típica de menu: "Fórmula Indy Fórmula 1 Band Motor …").
  t = t.replace(/(?:\b[A-ZÀ-Ú][a-zà-ú]+\b[ ]){6,}/g, m => (/[.!?]/.test(m) ? m : ' '));
  // Remove blocos duplicados literais (menus costumam repetir o mesmo trecho).
  t = dedupeChunks(t);
  // Limpa resíduos órfãos de remoções (barras/vírgulas soltas, ex.: "Al Drago/ O").
  t = t
    .replace(/\s+[/,;]\s*(?=[A-ZÀ-Ú])/g, '. ')  // "americano, Al Drago/ O" -> "americano. O"
    .replace(/\s+[/,;]\s+/g, ' ')
    .replace(/\.\s*\./g, '.');
  return t.replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
};

// Remove trechos longos que se repetem (assinatura de menu/rodapé duplicado).
const dedupeChunks = (t: string): string => {
  const seen = new Set<string>();
  const parts = t.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  for (const p of parts) {
    const key = normalizeTerm(p).slice(0, 60);
    if (key.length > 20 && seen.has(key)) continue;
    if (key.length > 20) seen.add(key);
    out.push(p);
  }
  return out.join(' ');
};

// ------------------------------------------------------------
// (ITEM 2) scoreBodyQuality — comprimento NÃO é qualidade.
// Mede se o corpo parece prosa jornalística real. Reprovado, o motor
// rebaixa para a descrição do RSS e admite incerteza (nunca diz
// "contexto amplo" em cima de lixo).
// ------------------------------------------------------------
const PT_STOPWORDS_SAMPLE = new Set(['a', 'o', 'de', 'da', 'do', 'que', 'e', 'em', 'para', 'com', 'os', 'as', 'no', 'na', 'um', 'uma', 'por', 'se', 'dos', 'das', 'ao', 'aos', 'nas', 'nos']);

export interface BodyQuality {
  ok: boolean;
  score: number;              // 0..1
  reasons: string[];
}

export const scoreBodyQuality = (text: string): BodyQuality => {
  const t = String(text || '').trim();
  const reasons: string[] = [];
  if (t.length < 160) return { ok: false, score: 0, reasons: ['curto'] };

  const words = t.split(/\s+/);
  const wordCount = words.length;

  // 1) Densidade de pontuação de fim de frase (prosa real tem ~1 a cada 15-25 palavras).
  const sentenceEnders = (t.match(/[.!?…]/g) || []).length;
  const punctDensity = sentenceEnders / Math.max(1, wordCount / 20);
  const punctScore = Math.min(1, punctDensity);
  if (punctScore < 0.4) reasons.push('poucas frases pontuadas');

  // 2) Proporção de stopwords (prosa PT-BR real ~30-50%; menu/lista tem quase nenhuma).
  let stop = 0;
  for (const w of words) if (PT_STOPWORDS_SAMPLE.has(normalizeTerm(w))) stop++;
  const stopRatio = stop / Math.max(1, wordCount);
  const stopScore = stopRatio < 0.12 ? stopRatio / 0.12 : 1;
  if (stopRatio < 0.12) reasons.push('poucas palavras funcionais (parece lista/menu)');

  // 3) Palavras coladas/anômalas: tokens muito longos ou com maiúscula interna sobrando.
  const glued = words.filter(w => w.length > 24 || /[a-zà-ú][A-ZÀ-Ú]/.test(w)).length;
  const gluedRatio = glued / Math.max(1, wordCount);
  const gluedScore = 1 - Math.min(1, gluedRatio * 8);
  if (gluedRatio > 0.05) reasons.push('palavras coladas');

  // 4) Comprimento médio de frase plausível (nem 1 palavra, nem 200).
  const avgSentLen = wordCount / Math.max(1, sentenceEnders);
  const lenScore = (avgSentLen >= 6 && avgSentLen <= 45) ? 1 : 0.4;
  if (lenScore < 1) reasons.push('frases com tamanho atípico');

  // 5) Densidade verbal — prosa jornalística tem verbos conjugados;
  // menus e placares ("Escalação Mandante Visitante Placar ao vivo") não.
  let verbs = 0;
  for (const w of words) {
    const n = normalizeTerm(w);
    if (n.length < 4) continue;
    // terminações verbais comuns PT-BR (3ª pessoa, particípios, infinitivos, futuros)
    if (/(ou|ram|aram|eram|iram|ando|endo|indo|ado|ido|ada|ida|ava|iam|ará|erá|irá|am|em|ou|iu|eu)$/.test(n)) verbs++;
  }
  const verbRatio = verbs / Math.max(1, wordCount);
  const verbScore = verbRatio >= 0.06 ? 1 : verbRatio / 0.06;
  if (verbRatio < 0.06) reasons.push('poucos verbos (parece menu/placar)');

  const score = punctScore * 0.22 + stopScore * 0.24 + gluedScore * 0.2 + lenScore * 0.08 + verbScore * 0.26;
  return { ok: score >= 0.58, score: Number(score.toFixed(2)), reasons };
};

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

const ACTION_VERBS = ['aprova', 'aprovou', 'autoriza', 'autorizou', 'libera', 'liberou', 'sanciona', 'anuncia', 'anunciou', 'lanca', 'lancou', 'apresenta', 'divulga', 'divulgou', 'confirma', 'confirmou', 'investiga', 'apura', 'decide', 'decidiu', 'condena', 'condenou', 'absolve', 'sobe', 'cai', 'recua', 'avanca', 'dispara', 'despenca', 'alerta', 'regulamenta', 'suspende', 'suspendeu', 'proibe', 'proibiu', 'derruba', 'mantem', 'amplia', 'reduz', 'corta', 'eleva', 'demite', 'demitiu', 'exonera', 'exonerou', 'desmonta', 'desmontou', 'esvazia', 'esvaziou', 'afasta', 'nomeia', 'nomeou', 'indica', 'assume', 'assumiu', 'extingue', 'dissolve', 'veta', 'vetou', 'aprovou'];

export const extractHeuristicFrame = (article: any, fullText: string): HeuristicFrame => {
  const title = String(article?.title || '');
  const normTitle = normalizeTerm(title);
  const ent = readEntities(article?.entities);
  const normTitleForKp = normTitle;
  const normBody = normalizeTerm(fullText || '');

  // Entidades do servidor que REALMENTE aparecem no título têm prioridade
  // como ator — é o sujeito da manchete, não um nome solto do corpo.
  const inTitle = (s: string) => normTitle.includes(normalizeTerm(s));
  const orgsInTitle = ent.orgs.filter(inTitle);
  const namesInTitle = ent.names.filter(inTitle);
  const caps = extractCapitalizedEntities(title);

  // actor: nome próprio no título > org no título > 1ª entidade > capitalizada.
  const actorRaw = namesInTitle[0] || orgsInTitle[0] || ent.names[0] || ent.orgs[0] || caps[0] || null;
  const actor = actorRaw ? displayTerm(actorRaw) : null;

  // action: primeiro verbo de ação conhecido presente no título
  let action: string | null = null;
  for (const v of ACTION_VERBS) {
    if (new RegExp(`\\b${v}\\b`).test(normTitle)) { action = v; break; }
  }

  // topic: o SUJEITO da história. Prioridade honesta:
  //  1) org/nome do título que NÃO seja o ator (o "sobre quem/o quê")
  //  2) termo canônico do dicionário que aparece no título
  //  3) keyphrase validada (no título ou recorrente no corpo)
  // Nunca um termo genérico solto do dicionário que não está no título.
  const canonAll = getCanonicalTerms(`${title} ${article?.summary || ''}`);
  const canonInTitle = canonAll.filter(inTitle);
  const rawKeyphrases = ent.names.length || ent.orgs.length
    ? [] // se já temos entidades boas, nem precisamos de keyphrase p/ tópico
    : (Array.isArray(article?.keyphrases) ? article.keyphrases.filter(Boolean) : []);
  const validKeyphrases = rawKeyphrases.filter((kp: any) => {
    const n = normalizeTerm(kp);
    if (!n || n.length < 4) return false;
    if (normTitleForKp.includes(n)) return true;
    return (normBody.split(n).length - 1) >= 2;
  });

  const actorNorm = actorRaw ? normalizeTerm(actorRaw) : '';
  const topicCandidates = [
    ...orgsInTitle, ...namesInTitle, ...canonInTitle,
  ].filter(t => normalizeTerm(t) !== actorNorm);
  const topicRaw = topicCandidates[0] || canonInTitle[0] || validKeyphrases[0] || caps[1] || null;
  // Só usa tópico se ele estiver no título (evita "foco em Meta/Condenação").
  const topic = (topicRaw && inTitle(topicRaw)) ? displayTerm(topicRaw)
    : (canonInTitle[0] ? displayTerm(canonInTitle[0]) : null);

  const affectedRaw = topicCandidates[1] || canonInTitle[1] || null;
  const affected = affectedRaw ? displayTerm(affectedRaw) : null;

  // numbers: usa money/percents já extraídos pelo servidor (corretos).
  const numbers = numbersFromEntities(ent);

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
  dismissal: [
    'A saída pode alterar o comando, a condução de políticas e o equilíbrio de forças envolvido.',
    'A mudança tende a repercutir na estrutura afetada e nas decisões que dependiam desse posto.',
  ],
  appointment: [
    'A nomeação pode redefinir prioridades, alianças e a direção da área assumida.',
    'A chegada ao cargo tende a sinalizar mudanças de rumo e novas ênfases.',
  ],
  crisis: [
    'A crise pode pressionar responsáveis, exigir respostas rápidas e gerar desdobramentos em cadeia.',
    'O agravamento tende a cobrar posicionamento e medidas de contenção.',
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
  dismissal: ['Quem assume o posto, a reação dos envolvidos e os efeitos práticos da mudança.'],
  appointment: ['Primeiras decisões, prioridades anunciadas e a reação ao nome escolhido.'],
  crisis: ['Medidas de resposta, responsabilização e evolução do quadro nas próximas horas.'],
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
// (ITEM 3) pickNarrativeSentences — monta o "O que aconteceu?" com
// frases REAIS bem pontuadas, com viés para o lead (início da matéria),
// penalizando boilerplate. Substitui o antigo slice(0,2) cego.
// ------------------------------------------------------------
const BOILERPLATE_SENT_RX = /\b(clique|leia mais|leia tambem|assine|newsletter|publicidade|cookies|siga o|baixe o app|compartilhe|topicos relacionados|menu|cadastre-se|aguardando atualizacao|proximo lance|tempo real|placar ao vivo)\b/i;

const pickNarrativeSentences = (
  body: string,
  frame: HeuristicFrame,
  title: string,
  count = 2,
  excludeSimilarTo?: string
): string[] => {
  const sentences = splitSentences(body).filter(s => s.length >= 40 && s.length <= 320);
  if (sentences.length === 0) return [];
  const normTitleWords = new Set(normalizeTerm(title).split(' ').filter(w => w.length > 3));
  const scored = sentences.map((s, idx) => {
    const norm = normalizeTerm(s);
    let score = 0;
    // Lead-bias: as primeiras frases da matéria valem mais.
    score += Math.max(0, 3 - idx * 0.5);
    if (frame.actor && norm.includes(normalizeTerm(frame.actor))) score += 2;
    if (frame.topic && norm.includes(normalizeTerm(frame.topic))) score += 1.5;
    if (/\d/.test(s)) score += 1;
    let overlap = 0;
    for (const w of norm.split(' ')) if (normTitleWords.has(w)) overlap++;
    score += Math.min(2, overlap * 0.4);
    if (BOILERPLATE_SENT_RX.test(s)) score -= 12;
    // Frase saudável tem verbo/pontuação e não é só maiúsculas.
    if (!/[a-zà-ú]/.test(s)) score -= 5;
    return { s, score, idx };
  });
  const excl = excludeSimilarTo ? normalizeTerm(excludeSimilarTo) : '';
  const chosen = scored
    .filter(x => x.score > 0)
    .filter(x => !excl || sentenceSimilarity(normalizeTerm(x.s), excl) < 0.6)
    .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
    .slice(0, count)
    // Reordena por posição original para leitura natural.
    .sort((a, b) => a.idx - b.idx)
    .map(x => x.s);
  return chosen;
};

// (ITEM 4) Similaridade leve entre frases (Jaccard de palavras) para
// deduplicar one_liner vs. what_happened sem dependência externa.
function sentenceSimilarity(a: string, b: string): number {
  const sa = new Set(a.split(/\s+/).filter(w => w.length > 3));
  const sb = new Set(b.split(/\s+/).filter(w => w.length > 3));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / Math.min(sa.size, sb.size);
}

// ------------------------------------------------------------
// (ITEM 5) Resumo para conteúdo que NÃO é notícia.
// Listicle e tutorial recebem perguntas apropriadas ao formato,
// não "Impacto provável / O que acompanhar" de hard news.
// ------------------------------------------------------------
interface NonNewsCtx {
  title: string; source: string; category: string; bestBody: string;
  hasBody: boolean; frame: HeuristicFrame; one_liner_seed: string; contextLevel?: any;
}

const buildNonNewsSummary = (kind: ContentType, ctx: NonNewsCtx): SmartHeuristicSummary => {
  const { title, source, category, bestBody, hasBody, frame } = ctx;
  const bodySents = splitSentences(bestBody);
  const lead = bodySents[0] ? firstSentence(bestBody, 220) : title;
  const topicLabel = frame.topic || frame.actor || 'o tema';

  if (kind === 'tutorial') {
    // Extrai passos, se houver, sem despejá-los crus.
    const stepCount = (bestBody.match(/\b(passo|toque em|clique em|selecione|va em|acesse)\b/gi) || []).length;
    const one_liner = `Guia prático${frame.topic ? ` sobre ${frame.topic}` : ''}: ${title}.`;
    const what_happened = hasBody
      ? `${source} publicou um passo a passo${frame.topic ? ` sobre ${frame.topic}` : ''}. ${lead}`
      : `${source} traz um tutorial${frame.topic ? ` sobre ${frame.topic}` : ''}. O passo a passo completo está no site.`;
    const sections = buildAdaptiveSections({
      mode: 'how_to', title, source, bodySents, frame, one_liner, what_happened,
      hasBody, contextLevel: ctx.contextLevel,
    });
    return {
      quality: hasBody ? 'good' : 'medium',
      event_type: 'tutorial',
      category,
      one_liner,
      what_happened,
      why_it_matters: `Conteúdo útil para quem quer aprender a fazer isso na prática${frame.topic ? `, envolvendo ${frame.topic}` : ''}.`,
      likely_impact: stepCount > 0
        ? `O guia descreve o procedimento em etapas${stepCount >= 3 ? ` (cerca de ${stepCount} passos)` : ''}.`
        : 'O conteúdo é instrutivo e voltado à aplicação prática.',
      what_to_watch: 'Requisitos, versões de app/sistema e diferenças entre plataformas.',
      snippets: [],
      confidence_note: hasBody
        ? 'Este é um tutorial — o passo a passo completo, com telas e detalhes, está no site.'
        : 'Tutorial com pouco texto no feed; abra no site para o passo a passo completo.',
      used_sources: { title: true, rssDescription: Boolean(ctx.one_liner_seed), contextText: hasBody, extractedText: false, clusterContext: false },
      content_mode: 'how_to',
      sections,
    };
  }

  // listicle
  const one_liner = lead;
  const what_happened = hasBody
    ? `${source} reuniu uma lista${frame.topic ? ` sobre ${frame.topic}` : ''}. ${bodySents.slice(0, 2).join(' ')}`.trim()
    : `${source} publicou uma lista${frame.topic ? ` sobre ${frame.topic}` : ''}. Os itens completos estão no site.`;
  const sections = buildAdaptiveSections({
    mode: 'listicle_history', title, source, bodySents, frame, one_liner, what_happened,
    hasBody, contextLevel: ctx.contextLevel,
  });
  return {
    quality: hasBody ? 'good' : 'medium',
    event_type: 'listicle',
    category,
    one_liner,
    what_happened,
    why_it_matters: `Conteúdo de leitura e curiosidade${frame.topic ? ` sobre ${topicLabel}` : ''}, feito para explorar item a item.`,
    likely_impact: 'É um conteúdo de contexto e entretenimento, sem desdobramento factual imediato.',
    what_to_watch: 'Vale abrir no site para ver a lista completa com todos os itens.',
    snippets: [],
    confidence_note: 'Esta é uma lista/matéria de curiosidade — o conteúdo completo, item a item, está no site.',
    used_sources: { title: true, rssDescription: Boolean(ctx.one_liner_seed), contextText: hasBody, extractedText: false, clusterContext: false },
    content_mode: 'listicle_history',
    sections,
  };
};

// ============================================================
// (FASE 1 — Camadas 5 e 6) SEÇÕES ADAPTATIVAS
// Monta as caixas conforme o content_mode. Cada seção só entra se
// tiver EVIDÊNCIA real no texto (confidence >= piso). O contextLevel
// do servidor limita quantas caixas faturar. Nunca preenche por
// preencher — melhor 2 caixas verdadeiras que 5 genéricas.
// ============================================================

// Quantas seções o nível de contexto honestamente permite.
const sectionsBudgetForContextLevel = (level: any, hasBody: boolean): number => {
  const l = String(level || '');
  if (l === 'html_lite' || l === 'rss_fullish') return 5;
  if (l === 'rss_summary') return hasBody ? 4 : 3;
  if (l === 'title_only') return 2;
  return hasBody ? 4 : 2;
};

// Detecta próximo passo EXPLÍCITO no corpo (não inventa).
const NEXT_STEP_RX = /\b(cabe recurso|sera (?:analisad|julgad|votad|divulgad|apreciad)|aguarda (?:decisao|julgamento|votacao)|previst[oa] para|comeca a valer|entra em vigor|passa a valer|proxima (?:audiencia|sessao|etapa|fase)|deve (?:ser|entrar|comecar)|a partir de \d)/i;
// Consequência explícita.
const CONSEQUENCE_RX = /\b(passa a|entra em vigor|tera efeito|afeta|implica|com isso|resultando em|o que (?:pode|deve) (?:gerar|causar))/i;
// Causa explícita.
const CAUSE_RX = /\b(porque|devido a|em razao de|motivad[oa] por|apos |por conta de|em decorrencia)/i;

const firstSentenceMatching = (sentences: string[], rx: RegExp): string | null => {
  for (const s of sentences) if (rx.test(normalizeTerm(s))) return s;
  return null;
};

const sec = (key: string, label: string, iconKey: string, text: string, confidence: number): SummarySection | null => {
  const t = String(text || '').trim();
  if (!t || t.length < 12) return null;
  return { key, label, iconKey, text: t, confidence };
};

interface SectionCtx {
  mode: ContentMode; title: string; source: string;
  bodySents: string[]; frame: HeuristicFrame;
  one_liner: string; what_happened: string;
  hasBody: boolean; contextLevel: any;
}

const buildAdaptiveSections = (ctx: SectionCtx): SummarySection[] => {
  const { mode, source, bodySents, frame, one_liner, what_happened, hasBody } = ctx;
  const out: (SummarySection | null)[] = [];
  const budget = sectionsBudgetForContextLevel(ctx.contextLevel, hasBody);

  // "Em resumo" — sempre a primeira, é o que temos de mais confiável.
  out.push(sec('resumo', 'Em resumo', 'zap', one_liner, 0.9));

  // Frase principal para as seções factuais: a 1ª frase do corpo que NÃO
  // seja praticamente igual ao one_liner (evita repetir o resumo).
  const normOne = normalizeTerm(one_liner);
  const factSents = bodySents.filter(s => sentenceSimilarity(normalizeTerm(s), normOne) < 0.6);
  const mainFact = factSents[0] || bodySents[0] || what_happened;

  if (mode === 'how_to') {
    out.push(sec('aprende', 'O que você aprende',
      frame.topic ? `Como lidar com ${frame.topic} na prática.` : `Um procedimento passo a passo.`,
      'target', 0.8));
    const steps = bodySents.filter(s => /\b(toque|clique|selecione|abra|acesse|escolha|confirme|va em)\b/i.test(normalizeTerm(s)));
    if (steps.length > 0) out.push(sec('passos', 'Passos principais', 'list', steps.slice(0, 2).join(' '), 0.85));
    else if (hasBody) out.push(sec('sobre', 'Como funciona', 'filetext', what_happened, 0.7));
    const onde = firstSentenceMatching(bodySents, /\b(disponivel|funciona (?:em|no)|web|android|ios|iphone|desktop|navegador)\b/i);
    if (onde) out.push(sec('onde', 'Onde funciona', 'globe', onde, 0.75));
  }

  else if (mode === 'listicle_history') {
    out.push(sec('sobre', 'Sobre o conteúdo',
      frame.topic ? `Uma lista/curiosidade sobre ${frame.topic}, publicada por ${source}.` : `Uma lista/matéria de curiosidade de ${source}.`,
      'list', 0.8));
    if (hasBody && bodySents[0]) out.push(sec('recorte', 'Recorte da lista', 'bookmark', bodySents.slice(0, 2).join(' '), 0.72));
    out.push(sec('site', 'Lista completa', 'externallink', 'A lista completa, item a item, está no site.', 0.9));
  }

  else if (mode === 'policy_or_legal') {
    
    out.push(sec('pedido', 'O que foi pedido/decidido', 'scale', mainFact, hasBody ? 0.85 : 0.6));
    const causa = firstSentenceMatching(bodySents, CAUSE_RX);
    if (causa && causa !== mainFact) out.push(sec('motivo', 'Motivo', 'filetext', causa, 0.75));
    const prox = firstSentenceMatching(bodySents, NEXT_STEP_RX);
    if (prox) out.push(sec('proximo', 'Próxima etapa', 'clock', prox, 0.8)); // SÓ se explícito
  }

  else if (mode === 'market_update') {
    
    out.push(sec('mov', 'O que mudou', 'trendingup', mainFact, hasBody ? 0.85 : 0.6));
    const causa = firstSentenceMatching(bodySents, CAUSE_RX);
    if (causa && causa !== mainFact) out.push(sec('motivo', 'Motivo', 'filetext', causa, 0.75));
    const prox = firstSentenceMatching(bodySents, NEXT_STEP_RX);
    if (prox && prox !== mainFact) out.push(sec('proximo', 'Próxima etapa', 'clock', prox, 0.78));
  }

  else if (mode === 'profile_obituary') {
    out.push(sec('quem', 'Quem foi', 'user', mainFact, hasBody ? 0.82 : 0.6));
    if (bodySents[1]) out.push(sec('legado', 'Trajetória', 'history', bodySents[1], 0.7));
  }

  else if (mode === 'sports_live') {
    // já tratado com honestidade no fluxo sports_match; aqui é redundância segura
    out.push(sec('live', 'Acompanhamento ao vivo', 'activity',
      'Cobertura em tempo real — placar, escalações e lances durante o jogo.', 0.75));
  }

  else {
    // breaking_event / general → frame factual, sem inventar impacto.
    
    out.push(sec('fatos', 'Fatos principais', 'filetext', mainFact, hasBody ? 0.85 : 0.55));
    const causa = firstSentenceMatching(bodySents, CAUSE_RX);
    if (causa && causa !== mainFact) out.push(sec('causa', 'Por quê', 'filetext', causa, 0.72));
    const cons = firstSentenceMatching(bodySents, CONSEQUENCE_RX);
    if (cons && cons !== mainFact) out.push(sec('mudou', 'O que muda', 'trendingup', cons, 0.75)); // SÓ se explícito
    const prox = firstSentenceMatching(bodySents, NEXT_STEP_RX);
    if (prox && prox !== mainFact) out.push(sec('proximo', 'Próximo marco', 'clock', prox, 0.78)); // SÓ se explícito
  }

  // Camada 6: filtra nulos, aplica piso de confiança e orçamento.
  const PISO = 0.6;
  const filtered = out.filter((s): s is SummarySection => s != null && s.confidence >= PISO);

  // Dedup por similaridade de texto (não repetir o mesmo conteúdo em 2 caixas).
  const deduped: SummarySection[] = [];
  for (const s of filtered) {
    const dup = deduped.some(d => sentenceSimilarity(normalizeTerm(d.text), normalizeTerm(s.text)) > 0.7);
    if (!dup) deduped.push(s);
  }

  // Garante piso mínimo: sempre pelo menos "Em resumo".
  const result = deduped.slice(0, budget);
  if (result.length === 0 && filtered.length > 0) return [filtered[0]];
  return result;
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
  // (ITEM 1) contextText e extractedText passam pelo saneador.
  const contextText = sanitizeExtractedText(article?.contextText || '');
  const cleanExtracted = sanitizeExtractedText(extractedText || '');
  const category = String(article?.category || 'Geral');
  const source = String(article?.source || 'a fonte');

  // (ITEM 2) Gate de qualidade: corpo longo mas ruim é REPROVADO e não
  // pode ser tratado como "contexto amplo".
  const extractedQuality = cleanExtracted.length > 200 ? scoreBodyQuality(cleanExtracted) : { ok: false, score: 0, reasons: ['ausente'] };
  const contextQuality = contextText.length > 80 ? scoreBodyQuality(contextText) : { ok: false, score: 0, reasons: ['ausente'] };
  const extractedUsable = cleanExtracted.length > 200 && extractedQuality.ok;
  const contextUsable = contextText.length > 80 && contextQuality.ok;

  const used_sources = {
    title: Boolean(title),
    rssDescription: rssDescription.length > 40,
    contextText: contextUsable,
    extractedText: extractedUsable,
    clusterContext: false,
  };

  // Melhor corpo de texto disponível (prioridade: extraído > contexto lite > RSS)
  // Só entram corpos que passaram no gate; caso contrário caímos no RSS.
  const bestBody = extractedUsable ? cleanExtracted
    : contextUsable ? contextText
    : rssDescription;

  // (ITEM 3) eventType: traduz o do servidor e cai na detecção local
  // quando vier "outro"/genérico. "sports_match" refinado abaixo.
  const event_type = resolveEventType(article?.eventType, `${title}. ${bestBody.slice(0, 400)}`);

  const frame = extractHeuristicFrame(article, bestBody);
  const seed = article?.id || title;

  // (ITEM 5) Tipo de conteúdo: nem tudo é notícia. Listicle e tutorial
  // recebem frame próprio, honesto, em vez de perguntas de notícia.
  const contentType = detectContentType(article, bestBody);
  if (contentType === 'listicle' || contentType === 'tutorial') {
    return buildNonNewsSummary(contentType, {
      title, source, category, bestBody,
      hasBody: extractedUsable || contextUsable,
      frame, one_liner_seed: rssDescription, contextLevel: article?.contextLevel,
    });
  }

  // (ITEM 6) Página de placar / partida ao vivo: não é notícia analisável.
  // Retorna resumo honesto e específico em vez de forçar templates.
  if (SPECIAL_LIVE_TYPES.has(event_type)) {
    const teams = title.match(/([A-ZÀ-Ú][\wà-ú]+)\s*x\s*([A-ZÀ-Ú][\wà-ú]+)/i);
    const matchLabel = teams ? `${teams[1]} x ${teams[2]}` : 'a partida';
    return {
      quality: 'medium',
      event_type,
      category,
      one_liner: `Página de acompanhamento ao vivo de ${matchLabel}.`,
      what_happened: `${source} mantém uma cobertura em tempo real de ${matchLabel}, com placar, escalações e lances atualizados durante o jogo.`,
      why_it_matters: 'Acompanhamento ao vivo é útil para quem quer seguir o andamento da partida em tempo real.',
      likely_impact: 'O resultado pode influenciar a classificação e o próximo confronto das equipes.',
      what_to_watch: 'Gols, cartões, substituições e o placar final ao término da partida.',
      snippets: [],
      confidence_note: 'Esta é uma página de placar ao vivo — o conteúdo muda durante o jogo. Abra no site para acompanhar em tempo real.',
      used_sources: { title: true, rssDescription: used_sources.rssDescription, contextText: false, extractedText: false, clusterContext: false },
      content_mode: 'sports_live',
      sections: [
        { key: 'live', label: 'Ao vivo', iconKey: 'activity', text: `${source} mantém cobertura em tempo real de ${matchLabel} — placar, escalações e lances durante o jogo.`, confidence: 0.8 },
        { key: 'site', label: 'Acompanhar', iconKey: 'externallink', text: 'Abra no site para ver o placar atualizado em tempo real.', confidence: 0.85 },
      ],
    };
  }

  // --- quality ---
  // "good" exige corpo aprovado no gate (não só longo).
  let quality: SmartHeuristicSummary['quality'] = 'weak';
  if (extractedUsable || (contextUsable && contextText.length > 300)) quality = 'good';
  else if (contextUsable || used_sources.rssDescription) quality = 'medium';

  // --- one_liner ---
  // Se a descrição do RSS está truncada (termina em "..."), prefere a
  // primeira frase COMPLETA do corpo aprovado — evita one_liner cortado em "que…".
  const rssTruncated = /(\.\.\.|…)\s*$/.test(rssDescription);
  let one_liner: string;
  if (used_sources.rssDescription && !rssTruncated) {
    one_liner = firstSentence(rssDescription, 200);
  } else if (extractedUsable || contextUsable) {
    one_liner = firstSentence(extractedUsable ? cleanExtracted : contextText, 200);
  } else if (used_sources.rssDescription) {
    one_liner = firstSentence(rssDescription, 200);
  } else {
    one_liner = title;
  }

  // --- what_happened ---
  // (ITEM 3) frases pontuadas reais com lead-bias, não slice cego.
  // (ITEM 4) exclui frases quase idênticas ao one_liner (sem duplicar).
  let what_happened: string;
  if (contextUsable || extractedUsable) {
    const body = extractedUsable ? cleanExtracted : contextText;
    const sents = pickNarrativeSentences(body, frame, title, 2, one_liner);
    what_happened = sents.join(' ');
    // Se a dedup esvaziou tudo (corpo curto = só o lead), usa a melhor frase disponível.
    if (!what_happened) {
      what_happened = pickNarrativeSentences(body, frame, title, 1).join(' ') || firstSentence(body, 300);
    }
  } else if (used_sources.rssDescription) {
    // Descrição do RSS: se o one_liner já a consumiu, complementa com números/frame.
    const rssSents = pickNarrativeSentences(rssDescription, frame, title, 2, one_liner);
    what_happened = rssSents.join(' ') || firstSentence(rssDescription, 300);
    if (sentenceSimilarity(normalizeTerm(what_happened), normalizeTerm(one_liner)) > 0.7) {
      // one_liner e what_happened seriam a mesma frase → torna what_happened honesto.
      what_happened = `A fonte ${source} traz esta informação principal; os demais detalhes dependem da leitura completa.`;
    }
    if (frame.numbers.length > 0 && !what_happened.match(/\d/)) {
      what_happened += ` A matéria menciona ${frame.numbers[0]}.`;
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
  const snippetSource = extractedUsable ? cleanExtracted : (contextUsable ? contextText : '');
  const snippets = snippetSource ? pickSnippets(snippetSource, frame, title) : [];

  // --- confidence_note ---
  // Detecta o caso "veio texto, mas era lixo" (proxy-lite sujo) para ser honesto.
  const hadRawButRejected = (cleanExtracted.length > 200 && !extractedQuality.ok) ||
    (contextText.length > 80 && !contextQuality.ok && !contextUsable);
  let confidence_note: string | undefined;
  if (quality === 'weak') {
    confidence_note = hadRawButRejected
      ? 'O conteúdo extraído da página veio incompleto ou com ruído de navegação, então este resumo se baseia sobretudo na manchete. A leitura no site traz o texto completo.'
      : 'O resumo é preliminar porque o RSS trouxe pouco conteúdo. A leitura completa pode revelar detalhes importantes.';
  } else if (quality === 'medium') {
    confidence_note = 'Resumo baseado na descrição da fonte; alguns desdobramentos podem não estar cobertos.';
  }

  // --- (FASE 1) content_mode + seções adaptativas ---
  const content_mode = detectContentMode(article, bestBody, event_type);
  const bodySents = splitSentences(extractedUsable ? cleanExtracted : (contextUsable ? contextText : rssDescription));
  const sections = buildAdaptiveSections({
    mode: content_mode, title, source, bodySents, frame,
    one_liner, what_happened,
    hasBody: extractedUsable || contextUsable,
    contextLevel: article?.contextLevel,
  });

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
    content_mode,
    sections,
  };
};
