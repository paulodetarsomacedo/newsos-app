// ============================================================
// VETRA — aiUnifiedStream.ts
// Uma única chamada Gemini com resposta progressiva em NDJSON via SSE.
// Cada seção chega como um JSON independente; se uma seção vier inválida,
// as anteriores continuam válidas e a interface não quebra inteira.
// ============================================================

export type UnifiedAnalysisMode = 'article' | 'cluster';

export interface UnifiedStreamSection {
  section: string;
  payload: any;
}

export interface UnifiedStreamOptions {
  mode: UnifiedAnalysisMode;
  apiKey: string;
  context: string;
  title?: string;
  source?: string;
  model?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  onSection?: (event: UnifiedStreamSection) => void;
  onText?: (text: string) => void;
}

export interface UnifiedStreamResult {
  sections: Record<string, any>;
  rawText: string;
}

const ARTICLE_SECTION_ORDER = [
  'overview',
  'executive',
  'eli5',
  'sentiment',
  'mindmap',
  'timeline',
  'future',
  'done',
];

const CLUSTER_SECTION_ORDER = [
  'overview',
  'perspectives',
  'differences',
  'timeline',
  'xray',
  'done',
];

const compactText = (value: any, max = 18000): string =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const buildArticlePrompt = (title: string, source: string, context: string): string => `
Você é o motor editorial do Vetra. Analise SOMENTE o contexto fornecido.
Não invente fatos, datas, fontes, números ou relações. Quando algo não estiver
confirmado, marque como incerto. Não classifique ideologia política sem evidência;
analise enquadramento, tom, ênfase e lacunas.

FORMATO DE SAÍDA OBRIGATÓRIO:
- NDJSON MINIFICADO: exatamente UM objeto JSON por linha física.
- Sem markdown, sem crases, sem texto antes ou depois.
- Strings não podem conter quebras de linha físicas; use frases contínuas.
- Emita as linhas nesta ordem: ${ARTICLE_SECTION_ORDER.join(', ')}.
- Cada linha precisa ter: {"section":"...","payload":{...}}

SCHEMAS DAS LINHAS:
1) overview
{"section":"overview","payload":{"tldr":"2 a 3 frases densas","bullets":["4 fatos curtos"],"known":["até 3 fatos confirmados"],"unknown":["até 3 pontos ainda incertos"],"confidence":0}}
confidence é inteiro de 0 a 100 conforme qualidade e suficiência do contexto.

2) executive
{"section":"executive","payload":{"text":"3 parágrafos formais, separados por \\n\\n dentro da string"}}

3) eli5
{"section":"eli5","payload":{"text":"explicação pedagógica em um parágrafo curto, sem infantilizar"}}

4) sentiment
{"section":"sentiment","payload":{"summary":"síntese editorial","tone":"tom predominante","framing":["até 3 enquadramentos"],"omissions":["até 3 lacunas ou perguntas não respondidas"],"source_limits":["limitações do material disponível"]}}

5) mindmap
{"section":"mindmap","payload":{"center":"tema central em até 4 palavras","nodes":[{"name":"ator ou tema","type":"person|organization|place|event|issue","relation":"relação com o centro"}],"contextualTerms":[{"term":"nome do nó","context":"explicação em até 30 palavras","evidence_quotes":["trecho curto literal somente se existir no contexto"]}]}}
Forneça de 4 a 6 nós.

6) timeline
{"section":"timeline","payload":{"items":[{"date":"data ou referência temporal presente no contexto","label":"etapa curta","event":"evento objetivo","status":"confirmed|reported|uncertain","source":"fonte citada no contexto ou fonte principal"}]}}
Não crie datas. Se não houver cronologia real, faça 1 ou 2 itens e sinalize uncertain.

7) future
{"section":"future","payload":{"optimistic":"cenário condicional positivo","probable":"cenário mais plausível e condicional","pessimistic":"cenário de risco condicional","triggers":["gatilhos que mudariam o rumo"],"signals":["sinais observáveis para acompanhar"],"caveat":"cenários não são previsão; dependem de novos fatos"}}

8) done
{"section":"done","payload":{"ok":true}}

TÍTULO: ${compactText(title, 300)}
FONTE PRINCIPAL: ${compactText(source, 120)}
CONTEXTO:
${compactText(context, 18000)}
`;

const buildClusterPrompt = (title: string, context: string): string => `
Você é o motor de inteligência de casos do Vetra. O contexto contém manchetes,
resumos, fontes e horários de um cluster já pré-agrupado. Analise SOMENTE esses
dados. Não invente consenso, ideologia, datas, relações causais ou probabilidades.
Diferencie fato, interpretação e incerteza. Cenários devem ser condicionais.

FORMATO DE SAÍDA OBRIGATÓRIO:
- NDJSON MINIFICADO: exatamente UM objeto JSON por linha física.
- Sem markdown, sem crases, sem texto antes ou depois.
- Strings sem quebras físicas; use frases contínuas.
- Ordem: ${CLUSTER_SECTION_ORDER.join(', ')}.
- Cada linha: {"section":"...","payload":{...}}

1) overview
{"section":"overview","payload":{"headline":"título jornalístico neutro","summary":"síntese de 3 a 5 frases","fact":"núcleo factual do caso","why_it_matters":"relevância","watch":["3 pontos concretos para acompanhar"],"known":["fatos compartilhados pelas fontes"],"unknown":["lacunas e controvérsias"],"confidence":0,"consensus":0}}
confidence = confiança na síntese. consensus = convergência factual estimada, ambos 0-100.

2) perspectives
{"section":"perspectives","payload":{"items":[{"source":"nome exato da fonte","angle":"ângulo editorial observado","claim":"ênfase principal","alignment":0,"distinctive_point":"o que essa fonte acrescenta ou muda"}]}}
alignment mede proximidade com o núcleo factual comum, não viés ideológico.

3) differences
{"section":"differences","payload":{"items":[{"dimension":"tema de divergência","level":"Baixa|Média|Alta","explanation":"como as coberturas diferem","sources":["fontes relacionadas"]}],"consensus_points":["pontos realmente convergentes"],"blindspots":["questões pouco cobertas"]}}

4) timeline
{"section":"timeline","payload":{"items":[{"date":"data ou horário presente","label":"etapa","event":"evento","status":"confirmed|reported|uncertain","source":"fonte"}]}}
Ordene do mais antigo ao mais recente. Não invente datas.

5) xray
{"section":"xray","payload":{"headline":"leitura central","executive":"análise executiva em 2 parágrafos separados por \\n\\n","bullets":["4 achados"],"signals":["sinais fracos ou mudanças de enquadramento"],"blindspots":["lacunas"],"scenarios":{"optimistic":"condicional","probable":"condicional","pessimistic":"condicional","triggers":["gatilhos"],"signals":["indicadores"]}}}

6) done
{"section":"done","payload":{"ok":true}}

CASO: ${compactText(title, 300)}
DADOS DO CLUSTER:
${compactText(context, 20000)}
`;

const stripFences = (value: string): string =>
  String(value || '')
    .replace(/^\s*```(?:json|jsonl|ndjson)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

const safeParseJson = (value: string): any | null => {
  const raw = stripFences(value);
  if (!raw) return null;

  const candidates = [
    raw,
    raw.replace(/,\s*([}\]])/g, '$1'),
  ];

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = raw.slice(firstBrace, lastBrace + 1);
    candidates.push(sliced, sliced.replace(/,\s*([}\]])/g, '$1'));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
};

// Extrai objetos JSON completos respeitando strings e escapes.
const extractBalancedObjects = (text: string): string[] => {
  const out: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return out;
};

const getChunkText = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part: any) => String(part?.text || '')).join('');
};

const createCombinedAbortController = (externalSignal?: AbortSignal, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException('Timeout', 'AbortError')), timeoutMs);

  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) abortFromExternal();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  return {
    controller,
    cleanup: () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    },
  };
};

export async function streamUnifiedCaseAnalysis(options: UnifiedStreamOptions): Promise<UnifiedStreamResult> {
  const {
    mode,
    apiKey,
    context,
    title = '',
    source = '',
    model = 'gemini-2.5-flash',
    signal,
    timeoutMs = 45000,
    onSection,
    onText,
  } = options;

  if (!apiKey) throw new Error('API key ausente.');
  if (!compactText(context, 200).trim()) throw new Error('Contexto insuficiente.');

  const prompt = mode === 'cluster'
    ? buildClusterPrompt(title, context)
    : buildArticlePrompt(title, source, context);

  const { controller, cleanup } = createCombinedAbortController(signal, timeoutMs);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const sections: Record<string, any> = {};
  let rawText = '';
  let sseBuffer = '';
  let modelBuffer = '';
  const emitted = new Set<string>();

  const emitParsed = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') return false;
    const section = String(parsed.section || '').trim();
    if (!section || !Object.prototype.hasOwnProperty.call(parsed, 'payload')) return false;

    sections[section] = parsed.payload;
    // Uma seção pode ser atualizada pelo modelo; emitimos a versão mais recente.
    emitted.add(section);
    onSection?.({ section, payload: parsed.payload });
    return true;
  };

  const consumeModelText = (text: string) => {
    if (!text) return;
    rawText += text;
    modelBuffer += text;
    onText?.(text);

    const lines = modelBuffer.split(/\r?\n/);
    modelBuffer = lines.pop() || '';
    for (const line of lines) {
      const parsed = safeParseJson(line);
      if (parsed) emitParsed(parsed);
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topP: 0.8,
          maxOutputTokens: mode === 'cluster' ? 4600 : 5200,
          responseMimeType: 'text/plain',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini ${response.status}: ${errorText.slice(0, 300)}`);
    }
    if (!response.body) throw new Error('Streaming indisponível neste navegador.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });

      const blocks = sseBuffer.split(/\r?\n\r?\n/);
      sseBuffer = blocks.pop() || '';

      for (const block of blocks) {
        const dataLines = block
          .split(/\r?\n/)
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())
          .filter(Boolean);

        for (const dataLine of dataLines) {
          if (dataLine === '[DONE]') continue;
          const apiPayload = safeParseJson(dataLine);
          if (!apiPayload) continue;
          consumeModelText(getChunkText(apiPayload));
        }
      }
    }

    // Processa resto do decoder/SSE.
    sseBuffer += decoder.decode();
    if (sseBuffer.trim()) {
      for (const line of sseBuffer.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue;
        const apiPayload = safeParseJson(line.slice(5).trim());
        if (apiPayload) consumeModelText(getChunkText(apiPayload));
      }
    }

    // Tenta a última linha incompleta.
    const lastParsed = safeParseJson(modelBuffer);
    if (lastParsed) emitParsed(lastParsed);

    // Salvage global: mesmo se o modelo ignorar JSONL e colar objetos,
    // extraímos cada objeto balanceado sem derrubar os já recebidos.
    for (const objectText of extractBalancedObjects(rawText)) {
      const parsed = safeParseJson(objectText);
      if (parsed) emitParsed(parsed);
    }

    if (Object.keys(sections).length === 0) {
      throw new Error('A IA respondeu, mas nenhuma seção JSON válida foi recuperada.');
    }

    return { sections, rawText };
  } finally {
    cleanup();
  }
}

export const buildAnalysisCacheKey = (mode: UnifiedAnalysisMode, id: any, contentHash = ''): string => {
  const base = `${mode}:${String(id || 'unknown')}:${String(contentHash || '').slice(0, 40)}`;
  let hash = 2166136261;
  for (let i = 0; i < base.length; i++) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `vetra_ai_v3_${mode}_${(hash >>> 0).toString(36)}`;
};

export const readAnalysisCache = (key: string, maxAgeMs: number): Record<string, any> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!parsed?.createdAt || !parsed?.sections) return null;
    if (Date.now() - Number(parsed.createdAt) > maxAgeMs) return null;
    return parsed.sections;
  } catch {
    return null;
  }
};

export const writeAnalysisCache = (key: string, sections: Record<string, any>): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ createdAt: Date.now(), sections }));
  } catch {
    // Cache é melhoria, nunca pode quebrar o fluxo principal.
  }
};
