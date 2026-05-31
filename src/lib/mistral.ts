/**
 * Mistral AI Service
 *
 * ▸ Model: mistral-medium-latest
 * ▸ Features: AI rewrite for About / Expectations / Hobbies / Kundli
 *
 * Replaces the previous Gemini integration. Uses the Mistral Chat Completions
 * API via raw fetch (no SDK) — consistent with the rest of the codebase.
 */

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string;

const BASE = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-medium-latest";

// ─── Type helpers ─────────────────────────────────────────────────────────────
export type MistralTextFeature =
  | "rewrite_hobbies"
  | "rewrite_about"
  | "rewrite_expectations"
  | "kundli_explain"
  | "kundli_generate";

// ─── Text prompts ─────────────────────────────────────────────────────────────
const REWRITE_RULES = `
RULES (follow strictly):
- The input may be rough notes, keywords, bullet points, or a full paragraph — treat all formats the same.
- Output ONLY the final rewritten paragraph. No labels, no options, no introductions, no "Here are", no explanations.
- Length: between 80 and 420 characters (strictly).
- Language: warm, genuine, matrimonially appropriate for Indian families.
- Expand the given points into natural flowing sentences. Do NOT invent details completely absent from the input.
- Do NOT use bullet points or line breaks in the output.
`;

const TEXT_PROMPTS: Record<MistralTextFeature, (input: string) => string> = {
  rewrite_hobbies: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about their hobbies below (may be keywords or rough phrases). Expand them into warm, engaging sentences suitable for an Indian marriage biodata. Only use what is mentioned.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  rewrite_about: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about themselves below (may be keywords, bullet points, or rough sentences). Expand them into a warm, confident 'About Me' paragraph for an Indian matrimonial biodata. Keep all stated personal facts.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  rewrite_expectations: (v) =>
    `You are a matrimonial biodata writer. The user has written notes about their partner expectations below (may be keywords or rough phrases). Expand them into a respectful, hopeful, warm paragraph for an Indian matrimonial biodata. Keep all stated requirements.\n${REWRITE_RULES}\nUser's notes: ${v}`,
  kundli_explain: (v) =>
    `You are an expert Vedic astrologer. Explain this kundli to a young Indian person in simple, friendly language covering personality, career, relationships, and guidance. Be positive and accurate. Keep within 420 characters. Output only the explanation.\nData: ${v}`,
  kundli_generate: (v) =>
    `You are an expert Vedic astrologer with deep knowledge of Jyotish Shastra. Calculate a complete birth chart (Kundli) from the following birth details. Use traditional Vedic sidereal calculations (Lahiri Ayanamsa).

Birth Details: ${v}

Return ONLY valid JSON (no markdown, no explanation, no backticks) matching this exact structure:
{
  "chartStyle": "north_indian",
  "planetPositions": [
    {"planet": "Sun", "symbol": "Su", "rashi": "<Hindi rashi name>", "house": <1-12>, "degree": <0-30>, "status": "direct"},
    {"planet": "Moon", "symbol": "Mo", "rashi": "...", "house": ..., "degree": ..., "status": "direct"},
    {"planet": "Mars", "symbol": "Ma", "rashi": "...", "house": ..., "degree": ..., "status": "direct|retrograde"},
    {"planet": "Mercury", "symbol": "Me", "rashi": "...", "house": ..., "degree": ..., "status": "direct|retrograde"},
    {"planet": "Jupiter", "symbol": "Ju", "rashi": "...", "house": ..., "degree": ..., "status": "direct|retrograde"},
    {"planet": "Venus", "symbol": "Ve", "rashi": "...", "house": ..., "degree": ..., "status": "direct|retrograde"},
    {"planet": "Saturn", "symbol": "Sa", "rashi": "...", "house": ..., "degree": ..., "status": "direct|retrograde"},
    {"planet": "Rahu", "symbol": "Ra", "rashi": "...", "house": ..., "degree": ..., "status": "retrograde"},
    {"planet": "Ketu", "symbol": "Ke", "rashi": "...", "house": ..., "degree": ..., "status": "retrograde"}
  ],
  "keyIndicators": {
    "lagna": "<Hindi name of Ascendant sign>",
    "lagnaEnglish": "<English name>",
    "rashi": "<Moon sign Hindi>",
    "rashiEnglish": "<Moon sign English>",
    "nakshatra": "<Birth Nakshatra>",
    "nakshatraPada": <1-4>,
    "tithi": "<Tithi name>"
  },
  "doshaAnalysis": {
    "mangalDosha": "yes|no|partial",
    "mangalExplanation": "<1-2 sentences>",
    "kaalSarp": "yes|no|partial",
    "kaalSarpExplanation": "<1-2 sentences>",
    "sadeSati": "yes|no|partial",
    "sadeSatiExplanation": "<1-2 sentences>"
  },
  "houses": {
    "1": ["<planets in house 1>"],
    "2": [],
    ... (all 12 houses, use planet symbols like Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke)
  },
  "explanation": "<A friendly 200-300 word Vedic astrology reading covering: personality from Lagna, emotional nature from Moon sign, career prospects, relationship outlook, major doshas and remedies if any, general life guidance. Be positive and encouraging while being accurate.>"
}

Rashi names to use: Mesh, Vrishabh, Mithun, Kark, Simha, Kanya, Tula, Vrishchik, Dhanu, Makar, Kumbh, Meen.
English equivalents: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.

Calculate accurately based on the date, time, and coordinates provided. Output ONLY the JSON.`,
};

/**
 * Call the Mistral AI text model.
 * Drop-in replacement for `callGemini`.
 */
export async function callMistral(
  feature: MistralTextFeature,
  inputText: string
): Promise<string> {
  if (!MISTRAL_API_KEY) {
    throw new Error("Mistral API key not configured. Set VITE_MISTRAL_API_KEY in .env");
  }

  const prompt = TEXT_PROMPTS[feature]?.(inputText);
  if (!prompt) throw new Error(`Unknown Mistral feature: ${feature}`);

  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: feature === "kundli_generate" ? 3000 : 120,
      temperature: feature === "kundli_generate" ? 0.3 : 0.7,
      ...(feature === "kundli_generate" && { response_format: { type: "json_object" } }),
    }),
  });

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
  if (!raw) throw new Error("No text in Mistral response");

  // Hard-trim at last sentence boundary within 490 chars — ensures field validation passes
  let result = raw.trim();
  if (result.length > 490) {
    const cut = result.lastIndexOf(".", 489);
    result = cut > 50 ? result.slice(0, cut + 1) : result.slice(0, 490);
  }
  return result;
}
