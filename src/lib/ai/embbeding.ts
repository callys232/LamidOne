/**
 * Embeddings.
 *
 * Rewritten from the OpenAI SDK to plain fetch when this module was
 * cloned in, so the app carries no vendor SDK for a single endpoint.
 * Same model, same return shape — `matcher.ts`, `projectMatcher.ts`
 * and `similarity.ts` consume it unchanged.
 *
 * The original threw a confusing runtime error when the key was
 * missing (`apiKey: process.env.OPENAI_API_KEY!` asserts it away).
 * This one fails with a message that names the variable.
 */

const MODEL = process.env.LAMID_EMBEDDING_MODEL ?? "text-embedding-3-small";

export class EmbeddingError extends Error {
  constructor(msg: string) { super(msg); this.name = "EmbeddingError"; }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key) throw new EmbeddingError("OPENAI_API_KEY is not set — embeddings are unavailable.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000) }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new EmbeddingError(`Embedding request failed with ${res.status}.`);
  }

  const json = (await res.json()) as { data?: { embedding: number[] }[] };
  const vector = json.data?.[0]?.embedding;
  if (!vector) throw new EmbeddingError("Embedding response contained no vector.");
  return vector;
}
