/**
 * Groq AI Service — unified provider for all AI features
 *
 * ▸ Model: llama-3.3-70b-versatile (text) / llama-3.3-70b-versatile (JSON)
 * ▸ Uses the OpenAI-compatible Chat Completions API
 * ▸ Replaces: Claude (text rewrites), Mistral (text rewrites), DeepSeek (kundli JSON)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const BASE = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── Feature types ────────────────────────────────────────────────────────────

export type GroqTextFeature =
  | "rewrite_hobbies"
  | "rewrite_about"
  | "rewrite_expectations"
  | "kundli_explain";

/** Alias kept for backward-compat with useAI hook */
export type AIRewriteFeature = GroqTextFeature;

// ─── Rewrite prompts ──────────────────────────────────────────────────────────

const REWRITE_RULES = `
RULES (follow strictly):
- The input may be rough notes, keywords, bullet points, or a full paragraph — treat all formats the same.
- Output ONLY the final rewritten paragraph. No labels, no options, no introductions, no "Here are", no explanations.
- Length: between 80 and 420 characters (strictly).
- Language: warm, genuine, matrimonially appropriate for Indian families.
- Expand the given points into natural flowing sentences. Do NOT invent details completely absent from the input.
- Do NOT use bullet points or line breaks in the output.
`;

const TEXT_PROMPTS: Record<GroqTextFeature, (input: string) => string> = {
  rewrite_hobbies: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about their hobbies below (may be keywords or rough phrases). Expand them into warm, engaging sentences suitable for an Indian marriage biodata. Only use what is mentioned.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  rewrite_about: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about themselves below (may be keywords, bullet points, or rough sentences). Expand them into a warm, confident 'About Me' paragraph for an Indian matrimonial biodata. Keep all stated personal facts.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  rewrite_expectations: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about their partner expectations below (may be keywords or rough phrases). Expand them into a respectful, hopeful, warm paragraph for an Indian matrimonial biodata. Keep all stated requirements.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  kundli_explain: (v) =>
    `You are an expert Vedic astrologer. Explain this kundli to a young Indian person in simple, friendly language covering personality, career, relationships, and guidance. Be positive and accurate. Keep within 420 characters. Output only the explanation.\nData: ${v}`,
};

// ─── Text completions (rewrites, kundli explanation) ──────────────────────────

/**
 * Call Groq for text features (rewrites, kundli explanation).
 * Drop-in replacement for `callMistral` and `callClaude`.
 */
export async function callGroq(
  feature: GroqTextFeature,
  inputText: string
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured. Set VITE_GROQ_API_KEY in .env");
  }

  const prompt = TEXT_PROMPTS[feature]?.(inputText);
  if (!prompt) throw new Error(`Unknown Groq feature: ${feature}`);

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 45000);
  let res: Response;
  try {
    res = await fetch(BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: ctl.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("AI request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const status = res.status;
    const apiMsg =
      (err as { error?: { message?: string } }).error?.message ??
      (err as { message?: string }).message ??
      JSON.stringify(err);
    throw new Error(`${status}: ${apiMsg}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("No text in Groq response");

  // Hard-trim at last sentence boundary within 490 chars
  let result = raw.trim();
  if (result.length > 490) {
    const cut = result.lastIndexOf(".", 489);
    result = cut > 50 ? result.slice(0, cut + 1) : result.slice(0, 490);
  }
  return result;
}

// ─── JSON completions (kundli generation) ─────────────────────────────────────

/**
 * Call Groq with a prompt and get a JSON response.
 * Drop-in replacement for `callDeepSeekJSON`.
 */
export async function callGroqJSON(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured. Set VITE_GROQ_API_KEY in .env");
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 45000);
  let res: Response;
  try {
    res = await fetch(BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert Vedic astrologer. Always respond with valid JSON only, no markdown, no explanations outside the JSON.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: ctl.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("AI request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (err as { error?: { message?: string } }).error?.message ??
      JSON.stringify(err);
    throw new Error(`Groq API error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in Groq response");

  return text.trim();
}
