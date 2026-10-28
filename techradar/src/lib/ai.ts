/**
 * Integração com IA (Anthropic API) para geração de flashcards a partir de notas.
 * Usa a API diretamente via fetch (sem SDK) para manter o MVP enxuto.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface CodeReviewResult {
  feedback: string;
  score: number; // 0-100
}

export interface GenerateFlashcardsResult {
  cards: GeneratedFlashcard[];
  error?: string;
}

/**
 * Gera flashcards a partir do conteúdo de uma nota.
 * Retorna lista vazia se não houver API key configurada ou se falhar.
 */
export async function generateFlashcardsFromNote(
  content: string,
  context?: string
): Promise<GenerateFlashcardsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { cards: [] };
  }

  const prompt = [
    "Você é um assistente de estudos que gera flashcards de revisão.",
    "Com base no conteúdo de estudo abaixo, gere exatamente 5 flashcards no formato JSON.",
    "Cada flashcard deve ter campos 'front' (pergunta/conceito) e 'back' (resposta/explicação).",
    "Responda APENAS com um JSON válido no formato: {\"cards\": [{\"front\": \"...\", \"back\": \"...\"}]}",
    "",
    context ? `Contexto adicional: ${context}` : "",
    `Conteúdo: ${content}`,
  ].join("\n");

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { cards: [], error: `Anthropic API error: ${res.status} ${errorText}` };
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

    const parsed = JSON.parse(text) as { cards?: GeneratedFlashcard[] };
    const cards = (parsed.cards ?? [])
      .filter((c) => c?.front?.trim() && c?.back?.trim())
      .map((c) => ({ front: String(c.front).trim(), back: String(c.back).trim() }));

    return { cards };
  } catch (error) {
    return { cards: [], error: error instanceof Error ? error.message : "Erro ao gerar cards" };
  }
}

/**
 * Gera feedback de revisão de código (qualidade, melhorias, security, etc.).
 * Retorna feedback vazio se não houver API key configurada.
 */
export async function reviewCode(
  code: string,
  context?: string
): Promise<CodeReviewResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { feedback: "IA não configurada.", score: 0 };
  }

  const prompt = [
    "Você é um code reviewer técnico. Revise o código abaixo.",
    "Responda em JSON: {\"feedback\": \"...\", \"score\": <0-100>}",
    context ? `Contexto: ${context}` : "",
    `Código:\n${code}`,
  ].join("\n");

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return { feedback: `IA indisponível (${res.status}).`, score: 0 };
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

    const parsed = JSON.parse(text) as { feedback?: string; score?: number };
    const score = typeof parsed.score === "number" ? parsed.score : 0;

    return { feedback: parsed.feedback ?? "Sem feedback.", score };
  } catch (error) {
    return { feedback: error instanceof Error ? error.message : "Erro ao revisar.", score: 0 };
  }
}
