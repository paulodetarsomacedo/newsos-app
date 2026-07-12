// ============================================================================
// VETRA — GRUPOS EDITORIAIS (seed)
// Hoje o app deduplica fontes por NOME. Veículos do mesmo grupo aparecem como
// fontes independentes, inflando artificialmente a diversidade ("5 fontes"
// quando podem ser 2 grupos). Este mapa permite contar com honestidade:
//   "9 publicações · 6 veículos · 4 grupos editoriais independentes"
// ============================================================================

export interface EditorialGroup {
  id: string;
  name: string;
  outlets: string[];   // nomes como aparecem no campo `source` do artigo
}

export const EDITORIAL_GROUPS: EditorialGroup[] = [
  {
    id: 'globo',
    name: 'Grupo Globo',
    outlets: ['g1', 'o globo', 'globo', 'valor economico', 'valor econômico', 'valor', 'extra',
              'ge', 'globoesporte', 'cbn', 'epoca', 'época', 'época negócios', 'globo rural',
              'crescer', 'quem', 'marie claire', 'autoesporte', 'casa vogue', 'galileu',
              'revista glamour', 'pequenas empresas', 'globonews', 'gshow', 'sportv'],
  },
  {
    id: 'folha_uol',
    name: 'Folha / UOL',
    outlets: ['folha', 'folha de s.paulo', 'folha de sao paulo', 'folha de s. paulo', 'folhapress',
              'uol', 'uol noticias', 'uol notícias', 'uol economia', 'uol esporte', 'tilt',
              'universa', 'ecoa', 'splash', 'placar', 'band uol'],
  },
  {
    id: 'estadao',
    name: 'Grupo Estado',
    outlets: ['estadao', 'estadão', 'o estado de s. paulo', 'o estado de s.paulo',
              'estadao conteudo', 'estadão conteúdo', 'broadcast', 'jornal do carro',
              'e-investidor', 'estadao expresso'],
  },
  {
    id: 'abril',
    name: 'Grupo Abril',
    outlets: ['veja', 'veja sp', 'veja rio', 'veja saude', 'veja saúde', 'exame',
              'quatro rodas', 'superinteressante', 'super', 'capricho', 'claudia',
              'guia do estudante', 'placar abril', 'editora abril'],
  },
  {
    id: 'record',
    name: 'Grupo Record',
    outlets: ['r7', 'record', 'record news', 'recordtv', 'balanço geral', 'jornal da record'],
  },
  {
    id: 'sbt',
    name: 'SBT',
    outlets: ['sbt', 'sbt news', 'sbt brasil', 'jornal do sbt'],
  },
  {
    id: 'band',
    name: 'Grupo Bandeirantes',
    outlets: ['band', 'portal band', 'band news', 'bandnews', 'band jornalismo',
              'terra', 'bandsports', 'radio bandeirantes', 'rádio bandeirantes'],
  },
  {
    id: 'jovem_pan',
    name: 'Jovem Pan',
    outlets: ['jovem pan', 'jovempan', 'jp news', 'panflix'],
  },
  {
    id: 'rbs',
    name: 'Grupo RBS',
    outlets: ['gzh', 'zero hora', 'gaucha zh', 'gaúcha zh', 'rbs', 'pioneiro', 'diario catarinense',
              'diário catarinense', 'nsc total', 'nsc'],
  },
  {
    id: 'metropoles',
    name: 'Metrópoles',
    outlets: ['metropoles', 'metrópoles'],
  },
  {
    id: 'cnn_brasil',
    name: 'CNN Brasil',
    outlets: ['cnn brasil', 'cnn'],
  },
  {
    id: 'infoglobo_econ',
    name: 'InfoMoney / Grupo XP',
    outlets: ['infomoney', 'xp', 'spacemoney'],
  },
  {
    id: 'times_brasil',
    name: 'Times Brasil / CNBC',
    outlets: ['times brasil', 'times brasil cnbc', 'cnbc'],
  },
  {
    id: 'poder360',
    name: 'Poder360',
    outlets: ['poder360', 'poder 360'],
  },
  {
    id: 'gazeta_povo',
    name: 'Gazeta do Povo',
    outlets: ['gazeta do povo', 'gazeta'],
  },
  {
    id: 'carta_capital',
    name: 'Carta Capital',
    outlets: ['carta capital', 'cartacapital'],
  },
  {
    id: 'brasil247',
    name: 'Brasil 247',
    outlets: ['brasil 247', 'brasil247', '247'],
  },
  {
    id: 'intercept',
    name: 'Intercept Brasil',
    outlets: ['intercept', 'the intercept brasil', 'intercept brasil'],
  },
  {
    id: 'nexo',
    name: 'Nexo Jornal',
    outlets: ['nexo', 'nexo jornal'],
  },
  {
    id: 'agencia_brasil',
    name: 'EBC / Agência Brasil',
    outlets: ['agencia brasil', 'agência brasil', 'ebc', 'tv brasil', 'radioagencia nacional'],
  },
  {
    id: 'piaui_local',
    name: 'Imprensa do Piauí',
    outlets: ['180graus', '180 graus', 'cidade verde', 'portal az', 'meio norte', 'o dia piaui',
              'o dia piauí', 'gp1', 'g1 piaui', 'g1 piauí'],
  },
  {
    id: 'reuters',
    name: 'Reuters',
    outlets: ['reuters', 'thomson reuters'],
  },
  {
    id: 'ap',
    name: 'Associated Press',
    outlets: ['ap', 'associated press', 'ap news'],
  },
  {
    id: 'afp',
    name: 'AFP',
    outlets: ['afp', 'france presse', 'agence france-presse'],
  },
  {
    id: 'bbc',
    name: 'BBC',
    outlets: ['bbc', 'bbc brasil', 'bbc news'],
  },
  {
    id: 'elpais',
    name: 'PRISA / El País',
    outlets: ['el pais', 'el país', 'el pais brasil'],
  },
  {
    id: 'nyt',
    name: 'New York Times',
    outlets: ['new york times', 'nyt', 'nytimes'],
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    outlets: ['bloomberg', 'bloomberg linea', 'bloomberg línea'],
  },
  { id: 'macmagazine', name: 'MacMagazine', outlets: ['macmagazine'] },
  { id: 'macrumors', name: 'MacRumors', outlets: ['macrumors'] },
  { id: 'tecmundo', name: 'TecMundo', outlets: ['tecmundo', 'voxel'] },
  { id: 'olhar_digital', name: 'Olhar Digital', outlets: ['olhar digital'] },
  { id: 'canaltech', name: 'Canaltech', outlets: ['canaltech'] },
  { id: 'noticias_minuto', name: 'Notícias ao Minuto', outlets: ['noticias ao minuto', 'notícias ao minuto'] },
];

// --- índice reverso (lazy) ---
let OUTLET_INDEX: Map<string, EditorialGroup> | null = null;

const normalizeOutlet = (s: any): string =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildIndex = (): Map<string, EditorialGroup> => {
  if (OUTLET_INDEX) return OUTLET_INDEX;
  const idx = new Map<string, EditorialGroup>();
  for (const group of EDITORIAL_GROUPS) {
    for (const outlet of group.outlets) {
      idx.set(normalizeOutlet(outlet), group);
    }
  }
  OUTLET_INDEX = idx;
  return idx;
};

/**
 * Retorna o grupo editorial de um veículo. Se não estiver mapeado, cria um
 * grupo "próprio" (o veículo é seu próprio grupo) — honesto e seguro.
 */
export const getEditorialGroup = (sourceName: any): EditorialGroup => {
  const norm = normalizeOutlet(sourceName);
  if (!norm) return { id: 'desconhecido', name: 'Fonte desconhecida', outlets: [] };

  const idx = buildIndex();
  const exact = idx.get(norm);
  if (exact) return exact;

  // Match por prefixo/contém: "g1 piaui" → "g1"; "folha de s.paulo online" → folha
  for (const [outlet, group] of idx.entries()) {
    if (outlet.length < 3) continue;
    if (norm === outlet || norm.startsWith(outlet + ' ') || norm.endsWith(' ' + outlet) || norm.includes(' ' + outlet + ' ')) {
      return group;
    }
  }

  // Não mapeado: o veículo é seu próprio grupo (não inflaciona nem esconde).
  return { id: `own_${norm.replace(/\s+/g, '_')}`, name: String(sourceName || '').trim(), outlets: [norm] };
};

/**
 * Contagem HONESTA de um cluster.
 * Ex.: { publications: 9, outlets: 6, groups: 4 }
 * Substitui o "9 fontes" que inflava a diversidade.
 */
export interface CoverageCount {
  publications: number;   // total de matérias
  outlets: number;        // veículos distintos (G1, O Globo, Valor = 3)
  groups: number;         // grupos independentes (todos os 3 acima = 1)
  groupNames: string[];
  byGroup: { group: EditorialGroup; outlets: string[]; count: number }[];
}

export const countCoverage = (articles: any[]): CoverageCount => {
  const outletSet = new Set<string>();
  const groupMap = new Map<string, { group: EditorialGroup; outlets: Set<string>; count: number }>();

  for (const a of articles || []) {
    const src = a?.source || a?.sourceName || '';
    if (!src) continue;
    const normSrc = normalizeOutlet(src);
    outletSet.add(normSrc);

    const group = getEditorialGroup(src);
    const entry = groupMap.get(group.id) || { group, outlets: new Set<string>(), count: 0 };
    entry.outlets.add(String(src).trim());
    entry.count += 1;
    groupMap.set(group.id, entry);
  }

  const byGroup = [...groupMap.values()]
    .map(e => ({ group: e.group, outlets: [...e.outlets], count: e.count }))
    .sort((a, b) => b.count - a.count);

  return {
    publications: (articles || []).length,
    outlets: outletSet.size,
    groups: groupMap.size,
    groupNames: byGroup.map(g => g.group.name),
    byGroup,
  };
};

/**
 * Rótulo honesto para o cabeçalho do caso.
 * "9 publicações · 6 veículos · 4 grupos independentes"
 */
export const formatCoverageLabel = (c: CoverageCount): string => {
  const parts: string[] = [];
  parts.push(`${c.publications} publicaç${c.publications === 1 ? 'ão' : 'ões'}`);
  if (c.outlets !== c.publications) parts.push(`${c.outlets} veículo${c.outlets === 1 ? '' : 's'}`);
  parts.push(`${c.groups} grupo${c.groups === 1 ? '' : 's'} independente${c.groups === 1 ? '' : 's'}`);
  return parts.join(' · ');
};
