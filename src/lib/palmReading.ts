/**
 * Palm Reading API — two-pass, RAG-grounded palmistry via OpenAI GPT-4o.
 *
 * Pass 1 (vision): detect observable palm features → PalmObservations.
 * Retrieve:        build queries from observations, fetch grounding knowledge
 *                  from the palm-rag-retrieve Edge Function (see palmRag.ts).
 * Pass 2 (text):   compose a warm, grounded "Pandit Hastarekha Sharma" reading
 *                  that cites the retrieved palmistry knowledge.
 *
 * Degrades gracefully: if detection or retrieval is unavailable, falls back to a
 * single-pass ungrounded reading so the feature never hard-fails.
 */

import {
  buildPalmQueries,
  retrievePalmKnowledge,
  formatKnowledgeForPrompt,
  type RetrievedChunk,
} from "@/lib/palmRag";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string) || "gpt-4o";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export interface PalmReadingInput {
  imageBase64: string; // data URL (data:image/jpeg;base64,...)
  name: string;
  age: number;
  gender?: "male" | "female" | "other";
}

// ─── Pass 1: structured observations ────────────────────────────────────────

export interface ObservedLine {
  feature_key: string; // heart_line | head_line | life_line | fate_line | sun_line | marriage_line | health_line
  present: boolean;
  quality: "strong" | "moderate" | "faint" | "absent";
  qualifier?: string; // e.g. forked | curved | straight | wide_curve | clear | multiple
}

export interface ObservedMount {
  feature_key: string; // mount_jupiter | mount_saturn | mount_apollo | mount_mercury | mount_venus | mount_moon | mount_mars
  prominence: "prominent" | "normal" | "flat";
}

export interface ObservedSign {
  feature_key: string; // star | cross | triangle | square | island | grille
  location?: string; // e.g. on_apollo, on head line
}

export interface PalmObservations {
  lines: ObservedLine[];
  mounts: ObservedMount[];
  signs: ObservedSign[];
  palmShape?: string; // earth | air | fire | water
  fingerLength?: string; // long | short | average
  thumb?: string; // firm | flexible
}

// ─── Final reading ──────────────────────────────────────────────────────────

export interface PalmLine {
  name: string;
  nameHindi: string;
  description: string;
  descriptionHindi: string;
  quality: "strong" | "moderate" | "faint" | "absent";
}

export interface PalmReadingSource {
  section: string; // e.g. "loveLife", "overall"
  feature_key: string;
  source: string;
}

export interface PalmReadingResult {
  lines: PalmLine[];
  overallReading: string;
  overallReadingHindi: string;
  loveLife: string;
  loveLifeHindi: string;
  career: string;
  careerHindi: string;
  health: string;
  healthHindi: string;
  wealth: string;
  wealthHindi: string;
  luckyElements: {
    number: string;
    color: string;
    day: string;
    gemstone: string;
  };
  personalityTraits: string[];
  advice: string;
  adviceHindi: string;
  /** Present only when the reading was grounded in retrieved palmistry knowledge. */
  sources?: PalmReadingSource[];
  /** True when the reading was grounded in the palmistry knowledge base. */
  grounded?: boolean;
}

// ─── Prompts ──────────────────────────────────────────────────────────────

const OBSERVE_PROMPT = (name: string, age: number, gender?: string) =>
  `You are an expert palmist examining a photograph of ${name}'s palm (${age} years old${gender ? `, ${gender}` : ""}). Your ONLY job right now is to OBSERVE — do not interpret meaning yet.

Look carefully at the image and report what you actually see. For each line, say whether it is present and its quality. Use the exact feature_key values given.

Return ONLY valid JSON in this structure:
{
  "lines": [
    { "feature_key": "heart_line|head_line|life_line|fate_line|sun_line|marriage_line|health_line", "present": true, "quality": "strong|moderate|faint|absent", "qualifier": "<optional shape detail e.g. forked, curved, straight, wide_curve, clear, multiple, present, absent>" }
  ],
  "mounts": [
    { "feature_key": "mount_jupiter|mount_saturn|mount_apollo|mount_mercury|mount_venus|mount_moon|mount_mars", "prominence": "prominent|normal|flat" }
  ],
  "signs": [
    { "feature_key": "star|cross|triangle|square|island|grille", "location": "<where, e.g. on_apollo>" }
  ],
  "palmShape": "earth|air|fire|water",
  "fingerLength": "long|short|average",
  "thumb": "firm|flexible"
}

Include every line you can assess (use present:false + quality:"absent" when a line is not visible). Only list mounts that are clearly prominent or flat, and only signs you actually see. Output ONLY JSON.`;

const COMPOSE_PROMPT = (
  name: string,
  age: number,
  gender: string | undefined,
  observations: PalmObservations,
  knowledge: string
) =>
  `You are Pandit Hastarekha Sharma — the world's most renowned palmist with over 45 years of experience reading thousands of palms across India. You have studied under the greatest Samudrik Shastra Gurus. You speak simply — like a wise grandfather explaining things in everyday words.

You are reading the palm of ${name}, ${age} years old${gender ? `, ${gender}` : ""}.

Here is what was OBSERVED in the palm (structured):
${JSON.stringify(observations)}

${
  knowledge
    ? `Here is authentic palmistry knowledge retrieved for these exact features. GROUND your reading in it — base each statement on this knowledge rather than inventing meanings:
${knowledge}`
    : `(No retrieved knowledge available — give an authentic reading from classical palmistry principles.)`
}

LANGUAGE RULES:
- English: simple, friendly, everyday words — like talking to a friend. No jargon.
- Hindi: natural everyday Hindi (Devanagari), simple words, not Sanskrit-heavy.
- Warm, encouraging, and positive while being honest. Address ${name} as "you".

Return ONLY valid JSON in this exact structure:
{
  "lines": [
    { "name": "<line name English>", "nameHindi": "<Hindi Devanagari>", "description": "<2-3 simple English sentences on what this line reveals for ${name}>", "descriptionHindi": "<same in simple Hindi>", "quality": "strong|moderate|faint|absent" }
  ],
  "overallReading": "<150-200 words, warm personal reading in simple English>",
  "overallReadingHindi": "<same in simple Hindi Devanagari>",
  "loveLife": "<3-4 simple English sentences on love and relationships>",
  "loveLifeHindi": "<same in simple Hindi>",
  "career": "<3-4 simple English sentences on career and success>",
  "careerHindi": "<same in simple Hindi>",
  "health": "<3-4 simple English sentences on health outlook>",
  "healthHindi": "<same in simple Hindi>",
  "wealth": "<2-3 simple English sentences on financial prospects>",
  "wealthHindi": "<same in simple Hindi>",
  "luckyElements": { "number": "<lucky number>", "color": "<lucky color>", "day": "<lucky weekday>", "gemstone": "<recommended gemstone>" },
  "personalityTraits": ["<trait 1>", "<trait 2>", "<trait 3>", "<trait 4>", "<trait 5>"],
  "advice": "<2-3 warm sentences of life guidance>",
  "adviceHindi": "<same in simple Hindi>"
}

Cover the lines that were observed (one entry per observed line). Output ONLY JSON.`;

// Legacy single-pass prompt — used as the graceful fallback when detection fails.
const FALLBACK_PROMPT = (name: string, age: number, gender?: string) =>
  `You are Pandit Hastarekha Sharma — a renowned palmist with 45+ years of experience. Carefully analyse this photograph of ${name}'s palm. ${name} is ${age} years old${gender ? `, ${gender}` : ""}.

Study the lines (Heart, Head, Life, Fate, Sun, Marriage, Health), mounts, finger lengths, thumb, and overall palm shape.

LANGUAGE RULES: simple everyday English and natural Hindi (Devanagari). Warm, honest, positive.

Return ONLY valid JSON matching this structure:
{
  "lines": [ { "name": "", "nameHindi": "", "description": "", "descriptionHindi": "", "quality": "strong|moderate|faint|absent" } ],
  "overallReading": "<150-200 words English>", "overallReadingHindi": "",
  "loveLife": "", "loveLifeHindi": "",
  "career": "", "careerHindi": "",
  "health": "", "healthHindi": "",
  "wealth": "", "wealthHindi": "",
  "luckyElements": { "number": "", "color": "", "day": "", "gemstone": "" },
  "personalityTraits": ["", "", "", "", ""],
  "advice": "", "adviceHindi": ""
}
Output ONLY JSON.`;

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

interface ChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail: "high" | "low" | "auto" };
}

async function callOpenAIChat(content: ChatContentPart[]): Promise<string> {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content }],
      max_completion_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `OpenAI API error: ${response.status}`
    );
  }

  const json = await response.json();
  return (json.choices?.[0]?.message?.content as string) ?? "";
}

/** Map retrieved knowledge to lightweight per-feature source attributions. */
function buildSources(chunks: RetrievedChunk[]): PalmReadingSource[] {
  const seen = new Set<string>();
  const sources: PalmReadingSource[] = [];
  for (const c of chunks) {
    const key = `${c.feature_key}|${c.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ section: c.category, feature_key: c.feature_key, source: c.source });
  }
  return sources;
}

function validate(result: PalmReadingResult): PalmReadingResult {
  if (!result.overallReading) {
    throw new Error("Invalid palm reading data received from AI");
  }
  result.lines = Array.isArray(result.lines) ? result.lines : [];
  result.personalityTraits = Array.isArray(result.personalityTraits) ? result.personalityTraits : [];
  const le = (result.luckyElements ?? {}) as Partial<PalmReadingResult["luckyElements"]>;
  result.luckyElements = {
    number: le.number ?? "",
    color: le.color ?? "",
    day: le.day ?? "",
    gemstone: le.gemstone ?? "",
  };
  return result;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Analyse a palm image and return a grounded palmistry reading.
 * Two-pass + RAG when available; gracefully falls back to single-pass otherwise.
 */
export async function analyzePalm(input: PalmReadingInput): Promise<PalmReadingResult> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file."
    );
  }

  const { imageBase64, name, age, gender } = input;

  // Pass 1 — detect observable features. On failure, fall back to single-pass.
  let observations: PalmObservations | null = null;
  try {
    const raw = await callOpenAIChat([
      { type: "text", text: OBSERVE_PROMPT(name, age, gender) },
      { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
    ]);
    observations = parseJson<PalmObservations>(raw);
  } catch (err) {
    console.warn("[palmReading] observation pass failed — using single-pass fallback:", err);
  }

  if (!observations) {
    const raw = await callOpenAIChat([
      { type: "text", text: FALLBACK_PROMPT(name, age, gender) },
      { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
    ]);
    return validate(parseJson<PalmReadingResult>(raw));
  }

  // Retrieve grounding knowledge (fails soft to []).
  const chunks = await retrievePalmKnowledge(buildPalmQueries(observations));

  // Pass 2 — compose the grounded reading (text-only).
  const raw = await callOpenAIChat([
    {
      type: "text",
      text: COMPOSE_PROMPT(name, age, gender, observations, formatKnowledgeForPrompt(chunks)),
    },
  ]);
  const result = validate(parseJson<PalmReadingResult>(raw));

  if (chunks.length > 0) {
    result.grounded = true;
    result.sources = buildSources(chunks);
  } else {
    result.grounded = false;
  }
  return result;
}
