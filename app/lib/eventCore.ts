// ============================================================================
// VETRA — eventCore.ts
// NÚCLEO DO EVENTO: (ator, ação, alvo) extraído do título.
//
// PROBLEMA QUE RESOLVE: o motor antigo media PARECENÇA TEXTUAL, não identidade
// de evento. "Lula critica STF" e "STF derruba decisão de Lula" compartilham
// as mesmas palavras e agrupavam juntas — mas são eventos diferentes (papéis
// invertidos). Sem núcleo de evento, um cluster é "assunto parecido", não "caso".
// ============================================================================

import { normalizeTerm } from './semanticDictionary';

// ---------------------------------------------------------------------------
// FAMÍLIAS DE AÇÃO
// "manda", "ordena", "determina" e "decide" são o MESMO evento com verbos
// diferentes. Agrupar em famílias é o que permite reconhecer isso.
// ~30 famílias cobrem a esmagadora maioria do noticiário brasileiro.
// ---------------------------------------------------------------------------
const VERB_FAMILIES: Record<string, string[]> = {
  DETERMINAR: ['determina', 'determinou', 'ordena', 'ordenou', 'manda', 'mandou', 'decide', 'decidiu',
               'decreta', 'decretou', 'autoriza', 'autorizou', 'nega', 'negou', 'concede', 'concedeu',
               'defere', 'deferiu', 'indefere', 'rejeita', 'rejeitou', 'acata', 'acatou'],
  PRENDER:    ['prende', 'prendeu', 'detem', 'deteve', 'captura', 'capturou', 'apreende', 'apreendeu',
               'e preso', 'sao presos', 'foi preso', 'foram presos'],
  ACUSAR:     ['acusa', 'acusou', 'denuncia', 'denunciou', 'indicia', 'indiciou', 'processa', 'processou',
               'aciona', 'acionou', 'pede', 'pediu', 'requer', 'requereu', 'protocola', 'protocolou'],
  CONDENAR:   ['condena', 'condenou', 'absolve', 'absolveu', 'julga', 'julgou', 'sentencia', 'sentenciou'],
  ANUNCIAR:   ['anuncia', 'anunciou', 'confirma', 'confirmou', 'divulga', 'divulgou', 'revela', 'revelou',
               'comunica', 'comunicou', 'informa', 'informou', 'apresenta', 'apresentou'],
  APROVAR:    ['aprova', 'aprovou', 'sanciona', 'sancionou', 'promulga', 'veta', 'vetou', 'derruba', 'derrubou',
               'vota', 'votou', 'assina', 'assinou'],
  LANCAR:     ['lanca', 'lancou', 'estreia', 'estreou', 'inaugura', 'inaugurou', 'apresenta'],
  DEMITIR:    ['demite', 'demitiu', 'exonera', 'exonerou', 'afasta', 'afastou', 'destitui', 'destituiu',
               'renuncia', 'renunciou', 'deixa', 'deixou', 'sai', 'saiu', 'pede demissao'],
  NOMEAR:     ['nomeia', 'nomeou', 'indica', 'indicou', 'escolhe', 'escolheu', 'elege', 'elegeu',
               'empossa', 'empossou', 'assume', 'assumiu'],
  MORRER:     ['morre', 'morreu', 'falece', 'faleceu', 'e morto', 'foi morto', 'sao mortos', 'perde a vida'],
  MATAR:      ['mata', 'matou', 'assassina', 'assassinou', 'executa', 'executou'],
  ATACAR:     ['ataca', 'atacou', 'bombardeia', 'bombardeou', 'invade', 'invadiu', 'dispara', 'disparou',
               'lanca ataque', 'agride', 'agrediu'],
  CRITICAR:   ['critica', 'criticou', 'ataca verbalmente', 'condena publicamente', 'repudia', 'repudiou',
               'rebate', 'rebateu', 'responde', 'respondeu', 'contesta', 'contestou', 'nega'],
  DEFENDER:   ['defende', 'defendeu', 'apoia', 'apoiou', 'endossa', 'endossou', 'elogia', 'elogiou'],
  SUBIR:      ['sobe', 'subiu', 'dispara', 'disparou', 'avanca', 'avancou', 'salta', 'saltou',
               'cresce', 'cresceu', 'aumenta', 'aumentou', 'valoriza', 'valorizou', 'atinge', 'atingiu'],
  CAIR:       ['cai', 'caiu', 'recua', 'recuou', 'despenca', 'despencou', 'desaba', 'desabou',
               'diminui', 'diminuiu', 'reduz', 'reduziu', 'desvaloriza', 'perde', 'perdeu'],
  VENCER:     ['vence', 'venceu', 'ganha', 'ganhou', 'bate', 'bateu', 'derrota', 'derrotou',
               'elimina', 'eliminou', 'goleia', 'goleou', 'conquista', 'conquistou', 'classifica'],
  EMPATAR:    ['empata', 'empatou', 'fica no empate'],
  CONTRATAR:  ['contrata', 'contratou', 'anuncia contratacao', 'acerta', 'acertou', 'fecha com'],
  INVESTIGAR: ['investiga', 'investigou', 'apura', 'apurou', 'abre inquerito', 'instaura', 'instaurou',
               'deflagra', 'deflagrou', 'cumpre mandado'],
  PROIBIR:    ['proibe', 'proibiu', 'veta', 'bloqueia', 'bloqueou', 'suspende', 'suspendeu',
               'cancela', 'cancelou', 'barra', 'barrou', 'impede', 'impediu'],
  LIBERAR:    ['libera', 'liberou', 'autoriza', 'desbloqueia', 'desbloqueou', 'retoma', 'retomou',
               'reabre', 'reabriu', 'restabelece'],
  ADIAR:      ['adia', 'adiou', 'posterga', 'postergou', 'prorroga', 'prorrogou', 'atrasa'],
  ACORDAR:    ['fecha acordo', 'assina acordo', 'firma', 'firmou', 'sela', 'selou', 'negocia', 'negociou'],
  COMPRAR:    ['compra', 'comprou', 'adquire', 'adquiriu', 'assume controle', 'incorpora'],
  VENDER:     ['vende', 'vendeu', 'aliena', 'privatiza', 'privatizou'],
  RENUNCIAR:  ['renuncia', 'renunciou', 'abandona', 'abandonou', 'desiste', 'desistiu'],
  PROTESTAR:  ['protesta', 'protestou', 'manifesta', 'manifestou', 'ocupa', 'ocupou', 'greve'],
  ACIDENTE:   ['cai', 'colide', 'colidiu', 'bate', 'capota', 'capotou', 'descarrila', 'explode', 'explodiu',
               'incendeia', 'pega fogo', 'desaba', 'desabou'],
  RESGATAR:   ['resgata', 'resgatou', 'socorre', 'socorreu', 'salva', 'salvou', 'evacua', 'evacuou'],
  ALERTAR:    ['alerta', 'alertou', 'adverte', 'advertiu', 'avisa', 'avisou', 'preve', 'previu'],
};

// Índice reverso: verbo → família (lazy)
let VERB_INDEX: Map<string, string> | null = null;
const buildVerbIndex = (): Map<string, string> => {
  if (VERB_INDEX) return VERB_INDEX;
  const idx = new Map<string, string>();
  for (const [family, verbs] of Object.entries(VERB_FAMILIES)) {
    for (const v of verbs) idx.set(normalizeTerm(v), family);
  }
  VERB_INDEX = idx;
  return idx;
};

// Verbos que aparecem em quase todo título e não identificam evento.
const WEAK_VERBS = new Set(['e', 'sao', 'esta', 'estao', 'tem', 'ter', 'faz', 'fez', 'diz', 'disse',
                            've', 'viu', 'da', 'dao', 'vai', 'vao', 'pode', 'deve', 'quer']);

const STOP = new Set(['a','o','e','de','do','da','das','dos','para','com','sem','um','uma','os','as',
                      'que','em','no','na','nos','nas','seu','sua','por','apos','ate','sobre','contra',
                      'entre','como','mais','menos','ja','nao','ao','aos','pelo','pela','se','ou','mas']);

export interface EventCore {
  actor: string | null;      // quem faz
  action: string | null;     // família do verbo (DETERMINAR, PRENDER…)
  target: string | null;     // sobre quem/o quê
  actorTokens: Set<string>;  // tokens do ator (para overlap parcial)
  targetTokens: Set<string>;
  numbers: Set<string>;      // números normalizados do título (R$ 120 mi, 199,7%)
  raw: string;
}

// Números como identidade do evento (crucial em mercado/economia).
const NUMBER_RX = /(?:R\$|US\$|\$|€)\s?[\d.,]+(?:\s?(?:mil|milhoes|milhões|milhao|milhão|bilhoes|bilhões|bilhao|bilhão|tri|trilhoes))?|\b\d+(?:[.,]\d+)?\s?%|\b\d{1,3}(?:\.\d{3})+\b|\b\d+\s?x\s?\d+\b/gi;

const extractNumbers = (title: string): Set<string> => {
  const out = new Set<string>();
  const matches = String(title).match(NUMBER_RX) || [];
  for (const m of matches) {
    // normaliza: "R$ 120 milhões" e "R$ 120 mi" → "rs120milh"
    const n = normalizeTerm(m)
      .replace(/\s+/g, '')
      .replace(/milhoes|milhao|mi\b/g, 'milh')
      .replace(/bilhoes|bilhao|bi\b/g, 'bilh');
    if (n.length > 1) out.add(n);
  }
  return out;
};

/**
 * Extrai o núcleo (ator, ação, alvo) de um título.
 * Português noticioso é fortemente SVO: "[Ator] [verbo] [alvo]".
 */
export const extractEventCore = (title: string, entities: string[] = []): EventCore => {
  const raw = String(title || '');
  const norm = normalizeTerm(raw);
  const tokens = norm.split(' ').filter(Boolean);
  const verbIdx = buildVerbIndex();

  // 1) Acha o VERBO PRINCIPAL: o primeiro token (ou bigrama) que seja de família.
  let verbPos = -1;
  let action: string | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const bigram = i + 1 < tokens.length ? `${tokens[i]} ${tokens[i + 1]}` : '';
    if (bigram && verbIdx.has(bigram)) { action = verbIdx.get(bigram)!; verbPos = i; break; }
    if (verbIdx.has(tokens[i]) && !WEAK_VERBS.has(tokens[i])) {
      action = verbIdx.get(tokens[i])!;
      verbPos = i;
      break;
    }
  }

  // 2) ATOR = conteúdo ANTES do verbo. ALVO = conteúdo DEPOIS.
  //    Sem verbo identificado, usa a primeira entidade como ator.
  const contentTokens = (arr: string[]) => arr.filter(w => w.length > 2 && !STOP.has(w));

  let actorTokens: Set<string>;
  let targetTokens: Set<string>;

  if (verbPos >= 0) {
    actorTokens = new Set(contentTokens(tokens.slice(0, verbPos)));
    targetTokens = new Set(contentTokens(tokens.slice(verbPos + 1)));
  } else {
    // Sem verbo de família: divide pela primeira entidade conhecida.
    const entNorm = entities.map(e => normalizeTerm(e)).filter(Boolean);
    const firstEnt = entNorm.find(e => norm.includes(e));
    if (firstEnt) {
      const at = norm.indexOf(firstEnt);
      actorTokens = new Set(contentTokens(norm.slice(0, at + firstEnt.length).split(' ')));
      targetTokens = new Set(contentTokens(norm.slice(at + firstEnt.length).split(' ')));
    } else {
      const half = Math.ceil(tokens.length / 2);
      actorTokens = new Set(contentTokens(tokens.slice(0, half)));
      targetTokens = new Set(contentTokens(tokens.slice(half)));
    }
  }

  // Ator canônico: a entidade conhecida presente no lado do ator (mais confiável
  // que a primeira palavra, que pode ser um adjunto).
  const entNorm = entities.map(e => normalizeTerm(e)).filter(Boolean);
  const actor = entNorm.find(e => [...actorTokens].some(t => e.includes(t) || t.includes(e)))
    || [...actorTokens][0] || null;
  const target = entNorm.find(e => [...targetTokens].some(t => e.includes(t) || t.includes(e)))
    || [...targetTokens][0] || null;

  return {
    actor,
    action,
    target,
    actorTokens,
    targetTokens,
    numbers: extractNumbers(raw),
    raw,
  };
};

// ---------------------------------------------------------------------------
// COMPATIBILIDADE DE EVENTO
// Retorna 0..1. É o portão: sem núcleo compatível, não é o mesmo caso —
// por mais parecidas que as palavras sejam.
// ---------------------------------------------------------------------------
const setOverlap = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    for (const y of b) {
      if (x === y || (x.length > 4 && y.length > 4 && (x.includes(y) || y.includes(x)))) { inter++; break; }
    }
  }
  return inter / Math.min(a.size, b.size);
};

export const eventCompatibility = (a: EventCore, b: EventCore): number => {
  // 1) Ação: famílias diferentes = eventos diferentes (sinal forte).
  let actionScore = 0.5; // neutro quando uma das ações não foi identificada
  if (a.action && b.action) {
    actionScore = a.action === b.action ? 1 : 0;
  }

  // 2) Papéis: ator com ator, alvo com alvo (a ORDEM importa).
  const actorMatch = setOverlap(a.actorTokens, b.actorTokens);
  const targetMatch = setOverlap(a.targetTokens, b.targetTokens);

  // 3) INVERSÃO DE PAPÉIS: "Lula critica STF" vs "STF critica Lula".
  //    Mesmas palavras, evento oposto. Detecta e ZERA.
  const crossA = setOverlap(a.actorTokens, b.targetTokens);
  const crossB = setOverlap(a.targetTokens, b.actorTokens);
  const inverted = (crossA > 0.5 && crossB > 0.5) && (actorMatch < 0.3 && targetMatch < 0.3);
  if (inverted) return 0;

  // 4) NÚMERO IDÊNTICO = o número É o evento (mercado, valores, placares).
  //    "Dólar sobe e fecha a R$ 6,10" e "Moeda americana atinge R$ 6,10" são
  //    o MESMO fato, ainda que ator e verbo sejam verbalizados diferente.
  const numMatch = setOverlap(a.numbers, b.numbers);
  const bothHaveNumbers = a.numbers.size > 0 && b.numbers.size > 0;
  if (bothHaveNumbers && numMatch >= 0.99) return Math.max(0.75, actorMatch * 0.2 + 0.75);

  const roleScore = Math.max(actorMatch, targetMatch) * 0.6 + Math.min(actorMatch, targetMatch) * 0.4;

  // 4b) ALVO FORTE COMPARTILHADO com ação compatível = mesmo caso, ainda que os
  //     ATORES difiram. "PF pede apreensão do passaporte" e "Mendonça determina
  //     apreensão do passaporte" são o MESMO caso — atores diferentes (quem pede
  //     vs. quem decide), mesmo objeto. Exigir os dois papéis batendo fragmenta
  //     casos legítimos.
  if (actionScore === 1 && targetMatch >= 0.5) {
    return Math.min(1, 0.55 + targetMatch * 0.35 + actorMatch * 0.10);
  }

  // 5) MESMO CASO, FASE DIFERENTE (reação / desdobramento).
  //    "Mendonça determina apreensão do passaporte de Thiago Miranda" (fato) e
  //    "Defesa de Thiago Miranda nega ilegalidades após apreensão" (reação):
  //    ator e ação divergem, mas o ALVO do caso ("Thiago Miranda", "apreensão")
  //    é o mesmo. Um caso é um fio, não um instante — a reação pertence a ele.
  //    Detecta pelo cruzamento: o alvo de um aparece em QUALQUER papel do outro.
  const caseOverlap = Math.max(
    setOverlap(a.targetTokens, b.targetTokens),
    setOverlap(a.targetTokens, b.actorTokens),
    setOverlap(a.actorTokens, b.targetTokens),
  );
  if (actionScore === 0 && caseOverlap >= 0.5) {
    // Mesmo assunto, fase distinta: compatível, porém abaixo de um match pleno.
    return Math.min(0.72, 0.45 + caseOverlap * 0.3);
  }

  // Ação incompatível e sem núcleo comum: eventos distintos.
  if (actionScore === 0) return roleScore * 0.35;

  return Math.min(1, roleScore * 0.65 + actionScore * 0.20 + numMatch * 0.15);
};
