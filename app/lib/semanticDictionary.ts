// ============================================================
// VETRA — semanticDictionary.ts
// Dicionário de equivalência semântica (sem IA).
// Arquitetura: canonical -> aliases[], agrupados por domínio.
// Escala para 1800+ equivalências: basta ampliar SEMANTIC_DICTIONARY
// (ou importar um seed externo e passar em registerDictionary()).
// ============================================================

export type SemanticDomain =
  | 'mercado' | 'politica' | 'justica' | 'tecnologia'
  | 'saude' | 'seguranca' | 'esportes' | 'internacional' | 'clima';

export type DomainDictionary = Record<string, string[]>;
export type SemanticDictionary = Partial<Record<SemanticDomain, DomainDictionary>>;

// ------------------------------------------------------------
// SEED inicial (robusto, mas propositalmente enxuto no código).
// Aliases em minúsculas SEM acento (a indexação normaliza tudo).
// ------------------------------------------------------------
export const SEMANTIC_DICTIONARY: SemanticDictionary = {
  mercado: {
    'dólar': ['moeda americana', 'usd', 'cambio', 'divisa americana', 'dolar comercial', 'dolar turismo'],
    'banco central': ['bc', 'copom', 'autoridade monetaria', 'bacen'],
    'selic': ['taxa basica de juros', 'juros basicos', 'taxa selic', 'juro basico'],
    'inflação': ['ipca', 'alta de precos', 'carestia', 'indice de precos', 'igp-m', 'inpc'],
    'ibovespa': ['ibov', 'bolsa brasileira', 'indice da bolsa', 'b3', 'bolsa de valores'],
    'juros': ['taxa de juros', 'custo do credito', 'aperto monetario', 'corte de juros'],
    'pib': ['produto interno bruto', 'atividade economica', 'crescimento economico'],
    'petrobras': ['petr4', 'estatal petroleira', 'petroleira brasileira'],
    'petróleo': ['brent', 'wti', 'barril', 'commodity energetica'],
    'fed': ['federal reserve', 'banco central americano', 'fomc', 'bc dos eua'],
    'bitcoin': ['btc', 'criptomoeda', 'cripto', 'moeda digital'],
    'imposto de renda': ['ir', 'irpf', 'declaracao do ir', 'leao'],
  },
  politica: {
    'presidente': ['chefe do executivo', 'planalto', 'presidencia da republica'],
    'congresso': ['parlamento', 'legislativo', 'congresso nacional'],
    'câmara dos deputados': ['camara', 'camara federal', 'deputados'],
    'senado': ['senado federal', 'senadores', 'casa alta'],
    'governo federal': ['uniao', 'executivo federal', 'gestao federal'],
    'eleições': ['pleito', 'urnas', 'corrida eleitoral', 'disputa eleitoral'],
    'reforma tributária': ['reforma dos impostos', 'novo sistema tributario'],
    'orçamento': ['peca orcamentaria', 'ploa', 'loa', 'verba publica'],
  },
  justica: {
    'stf': ['supremo tribunal federal', 'supremo', 'corte suprema'],
    'stj': ['superior tribunal de justica'],
    'tse': ['tribunal superior eleitoral', 'justica eleitoral'],
    'pgr': ['procuradoria-geral da republica', 'ministerio publico federal', 'mpf'],
    'liminar': ['decisao provisoria', 'medida cautelar', 'tutela de urgencia'],
    'condenação': ['sentenca condenatoria', 'pena', 'condenado'],
    'investigação': ['inquerito', 'apuracao', 'denuncia', 'operacao'],
    'habeas corpus': ['hc', 'pedido de liberdade'],
  },
  tecnologia: {
    'inteligência artificial': ['ia', 'ai', 'modelo de linguagem', 'chatgpt', 'llm', 'ia generativa'],
    'apple': ['iphone', 'fabricante do iphone', 'gigante de cupertino', 'ios'],
    'google': ['alphabet', 'android', 'buscador', 'gemini'],
    'meta': ['facebook', 'instagram', 'whatsapp', 'empresa de zuckerberg'],
    'microsoft': ['windows', 'copilot', 'gigante de redmond'],
    'rede social': ['redes sociais', 'plataforma digital', 'midia social'],
    'vazamento de dados': ['exposicao de dados', 'falha de seguranca', 'dados vazados'],
    'lançamento': ['estreia', 'novo produto', 'apresentacao', 'chega ao mercado'],
  },
  saude: {
    'anvisa': ['agencia reguladora de saude', 'agencia nacional de vigilancia sanitaria'],
    'sus': ['sistema unico de saude', 'rede publica de saude'],
    'vacina': ['imunizante', 'vacinacao', 'campanha de imunizacao', 'dose'],
    'dengue': ['aedes aegypti', 'arbovirose', 'epidemia de dengue'],
    'surto': ['epidemia', 'aumento de casos', 'emergencia sanitaria'],
    'medicamento': ['remedio', 'farmaco', 'tratamento', 'droga aprovada'],
    'ministério da saúde': ['pasta da saude', 'ms'],
    'covid': ['coronavirus', 'sars-cov-2', 'pandemia'],
  },
  seguranca: {
    'polícia federal': ['pf', 'federais'],
    'polícia militar': ['pm', 'policiamento ostensivo'],
    'operação policial': ['megaoperacao', 'acao policial', 'ofensiva policial'],
    'facção criminosa': ['crime organizado', 'faccao', 'organizacao criminosa', 'pcc', 'comando vermelho'],
    'prisão': ['detencao', 'captura', 'preso', 'mandado de prisao'],
    'apreensão': ['confisco', 'material apreendido', 'carga apreendida'],
    'homicídio': ['assassinato', 'morte violenta', 'latrocinio'],
  },
  esportes: {
    'seleção brasileira': ['selecao', 'amarelinha', 'time de tite', 'cbf'],
    'flamengo': ['mengao', 'rubro-negro carioca', 'fla'],
    'palmeiras': ['verdao', 'alviverde paulista'],
    'corinthians': ['timao', 'alvinegro paulista'],
    'libertadores': ['copa libertadores', 'glorias eternas', 'conmebol libertadores'],
    'brasileirão': ['campeonato brasileiro', 'serie a', 'brasileiro'],
    'champions league': ['liga dos campeoes', 'ucl', 'champions'],
    'lesão': ['desfalque', 'fora de combate', 'departamento medico', 'contusao'],
    'técnico': ['treinador', 'comandante', 'comissao tecnica'],
  },
  internacional: {
    'eua': ['estados unidos', 'washington', 'casa branca', 'governo americano'],
    'china': ['pequim', 'governo chines', 'gigante asiatico'],
    'rússia': ['moscou', 'kremlin', 'governo russo'],
    'ucrânia': ['kiev', 'governo ucraniano'],
    'israel': ['tel aviv', 'governo israelense', 'idf'],
    'onu': ['nacoes unidas', 'conselho de seguranca'],
    'união europeia': ['ue', 'bloco europeu', 'bruxelas'],
    'guerra': ['conflito armado', 'ofensiva militar', 'combates', 'hostilidades'],
  },
  clima: {
    'chuva forte': ['chuvas intensas', 'tempestade', 'precipitacao', 'chuva torrencial'],
    'onda de calor': ['calor extremo', 'temperaturas elevadas', 'calorao'],
    'inmet': ['instituto de meteorologia', 'alerta meteorologico'],
    'enchente': ['alagamento', 'inundacao', 'cheia', 'transbordamento'],
    'seca': ['estiagem', 'escassez hidrica', 'falta de chuva'],
  },
};

// ------------------------------------------------------------
// Normalização básica
// ------------------------------------------------------------
export const normalizeTerm = (term: any): string => {
  if (term == null) return '';
  return String(term)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s$%-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// ------------------------------------------------------------
// Índice reverso alias(normalizado) -> { canonical, domain }
// Construído uma única vez (lazy) — barato e O(1) na consulta.
// ------------------------------------------------------------
type IndexEntry = { canonical: string; domain: string };
let _reverseIndex: Map<string, IndexEntry> | null = null;
let _aliasKeysSorted: string[] | null = null;

const buildIndex = () => {
  const idx = new Map<string, IndexEntry>();
  const dict = SEMANTIC_DICTIONARY as Record<string, DomainDictionary>;
  for (const domain of Object.keys(dict)) {
    const entries = dict[domain] || {};
    for (const canonical of Object.keys(entries)) {
      const canonNorm = normalizeTerm(canonical);
      if (canonNorm) idx.set(canonNorm, { canonical, domain });
      for (const alias of entries[canonical] || []) {
        const aliasNorm = normalizeTerm(alias);
        if (aliasNorm && !idx.has(aliasNorm)) idx.set(aliasNorm, { canonical, domain });
      }
    }
  }
  _reverseIndex = idx;
  // Chaves multi-palavra primeiro (match mais específico vence)
  _aliasKeysSorted = Array.from(idx.keys()).sort((a, b) => b.length - a.length);
};

const getIndex = (): Map<string, IndexEntry> => {
  if (!_reverseIndex) buildIndex();
  return _reverseIndex as Map<string, IndexEntry>;
};

// Permite injetar dicionários externos maiores no futuro (1800+ termos)
export const registerDictionary = (extra: SemanticDictionary) => {
  const dict = SEMANTIC_DICTIONARY as Record<string, DomainDictionary>;
  for (const domain of Object.keys(extra || {})) {
    dict[domain] = { ...(dict[domain] || {}), ...(extra as any)[domain] };
  }
  _reverseIndex = null; // força rebuild
  _aliasKeysSorted = null;
};

// ------------------------------------------------------------
// API pública
// ------------------------------------------------------------

/** Retorna a forma canônica de um termo (ou o próprio termo normalizado). */
export const canonicalizeTerm = (term: any): string => {
  const norm = normalizeTerm(term);
  if (!norm) return '';
  const hit = getIndex().get(norm);
  return hit ? hit.canonical : norm;
};

/** Retorna [canônico, ...aliases] de um termo conhecido; senão [termo normalizado]. */
export const expandAliases = (term: any): string[] => {
  const norm = normalizeTerm(term);
  if (!norm) return [];
  const hit = getIndex().get(norm);
  if (!hit) return [norm];
  const dict = SEMANTIC_DICTIONARY as Record<string, DomainDictionary>;
  const aliases = dict[hit.domain]?.[hit.canonical] || [];
  return [hit.canonical, ...aliases];
};

/**
 * Varre um texto e retorna os termos canônicos encontrados (únicos).
 * Match por fronteira de palavra sobre o texto normalizado.
 */
export const getCanonicalTerms = (text: any): string[] => {
  const norm = normalizeTerm(text);
  if (!norm) return [];
  if (!_aliasKeysSorted) buildIndex();
  const idx = getIndex();
  const padded = ` ${norm} `;
  const found = new Set<string>();
  for (const key of _aliasKeysSorted as string[]) {
    if (padded.includes(` ${key} `)) {
      const hit = idx.get(key);
      if (hit) found.add(hit.canonical);
    }
  }
  return Array.from(found);
};

/**
 * Retorna os domínios mais prováveis do texto, ordenados por nº de hits.
 * Ex.: getDomainHints('dólar sobe após decisão do Fed') -> ['mercado']
 */
export const getDomainHints = (text: any): string[] => {
  const norm = normalizeTerm(text);
  if (!norm) return [];
  if (!_aliasKeysSorted) buildIndex();
  const idx = getIndex();
  const padded = ` ${norm} `;
  const counts: Record<string, number> = {};
  for (const key of _aliasKeysSorted as string[]) {
    if (padded.includes(` ${key} `)) {
      const hit = idx.get(key);
      if (hit) counts[hit.domain] = (counts[hit.domain] || 0) + 1;
    }
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
};

// ------------------------------------------------------------
// (ITEM 5) Camada de apresentação — displayLabel dos termos canônicos.
// Resolve o bug do "eua"/"arrowhead" minúsculos: o matching usa a forma
// normalizada, mas a UI recebe a forma correta de exibição.
// ------------------------------------------------------------

// Siglas conhecidas → caixa alta. Chave normalizada (sem acento).
const ACRONYMS = new Set([
  'eua', 'stf', 'stj', 'tse', 'tst', 'trf', 'pgr', 'mpf', 'pf', 'prf', 'pm',
  'bc', 'copom', 'pib', 'ipca', 'inpc', 'igp-m', 'ir', 'irpf', 'b3', 'ibov',
  'fed', 'fomc', 'onu', 'otan', 'ue', 'fmi', 'sus', 'anvisa', 'ia', 'ai',
  'ufc', 'nba', 'nfl', 'cbf', 'btc', 'usd', 'eac', 'petr4', 'idf', 'hc',
  'ong', 'mp', 'df', 'sp', 'rj', 'mg', 'pi', 'ne',
]);

// Exceções onde nem "sigla" nem "capitalizar" acertam a grafia jornalística.
const DISPLAY_OVERRIDES: Record<string, string> = {
  'petrobras': 'Petrobras',
  'ibovespa': 'Ibovespa',
  'selic': 'Selic',
  'bitcoin': 'Bitcoin',
  'iphone': 'iPhone',
  'ios': 'iOS',
  'chatgpt': 'ChatGPT',
  'youtube': 'YouTube',
  'whatsapp': 'WhatsApp',
  'inteligência artificial': 'Inteligência Artificial',
  'imposto de renda': 'Imposto de Renda',
  'banco central': 'Banco Central',
  'câmara dos deputados': 'Câmara dos Deputados',
  'governo federal': 'Governo Federal',
  'união europeia': 'União Europeia',
};

// Palavras que ficam em minúscula no meio de nomes próprios compostos.
const LOWER_CONNECTORS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'em', 'na', 'no']);

/** Converte um termo canônico na sua forma de exibição correta. */
export const displayCanonicalTerm = (term: any): string => {
  const raw = String(term ?? '').trim();
  if (!raw) return '';
  const norm = normalizeTerm(raw);
  if (DISPLAY_OVERRIDES[norm]) return DISPLAY_OVERRIDES[norm];
  if (ACRONYMS.has(norm)) return norm.toUpperCase();

  return raw
    .split(/\s+/)
    .map((word, i) => {
      const wNorm = normalizeTerm(word);
      if (ACRONYMS.has(wNorm)) return word.toUpperCase();
      if (i > 0 && LOWER_CONNECTORS.has(wNorm)) return word.toLowerCase();
      // capitaliza a primeira letra preservando o resto (mantém acentos)
      return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1);
    })
    .join(' ');
};

/** Como getCanonicalTerms, mas já retorna as formas de exibição. */
export const getCanonicalTermsForDisplay = (text: any): string[] =>
  getCanonicalTerms(text).map(displayCanonicalTerm);

