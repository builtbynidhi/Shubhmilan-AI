/**
 * Palm Reading API — two-pass, RAG-grounded palmistry via Google Gemini (free).
 *
 * Pass 1 (vision): detect observable palm features → PalmObservations.
 * Retrieve:        build queries from observations, fetch grounding knowledge
 *                  from the rag-retrieve function (see palmRag.ts).
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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-flash";
const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

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
  confidence?: "high" | "low"; // how clearly this was actually visible
  evidence?: string; // where on the palm + what it looks like (proof it was seen, not guessed)
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
  /** false when the photo is not a clear, usable palm (blurry, not a palm, too dark, partial). */
  imageOk?: boolean;
  imageIssue?: string;
  lines: ObservedLine[];
  mounts: ObservedMount[];
  signs: ObservedSign[];
  palmShape?: string; // earth | air | fire | water
  fingerLength?: string; // long | short | average
  thumb?: string; // firm | flexible
}

/** Thrown when the uploaded image isn't a clear palm — the UI asks for a retake. */
export class PalmImageError extends Error {
  issue: string;
  constructor(issue: string) {
    super(issue || "Palm image not clear");
    this.name = "PalmImageError";
    this.issue = issue;
  }
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
  `You are a careful, HONEST palm-image analyst examining a photograph of ${name}'s palm (${age} years old${gender ? `, ${gender}` : ""}). Your ONLY job is to OBSERVE what is genuinely visible in THIS photo — do not interpret meaning, and do NOT guess.

CRITICAL RULES — follow exactly:
1. First judge the image. If it is NOT a clear, usable palm (blurry, too dark/bright, cropped/partial, fingers cut off, or not a hand/palm at all), set "imageOk": false with a short "imageIssue", and return empty arrays. Do not analyse an unusable image.
2. Report a line/feature as present:true ONLY if you can actually SEE it in this image. If you are unsure, set present:false. It is far better to omit than to assume.
3. NEVER invent features and NEVER assume a "typical" palm. Base everything on THIS photo only.
4. For every feature you mark present:true, you MUST add "evidence": where on the palm it sits and what it looks like (this proves you actually saw it, not guessed).
5. Set "confidence":"high" only when the feature is clearly visible; otherwise "low".

Return ONLY valid JSON in this structure:
{
  "imageOk": true,
  "imageIssue": "<short reason — ONLY if imageOk is false, else omit>",
  "lines": [
    { "feature_key": "heart_line|head_line|life_line|fate_line|sun_line|marriage_line|health_line", "present": true, "quality": "strong|moderate|faint|absent", "qualifier": "<shape detail ONLY if clearly seen, e.g. forked, curved, straight, chained>", "confidence": "high|low", "evidence": "<where on the palm + what it looks like>" }
  ],
  "mounts": [
    { "feature_key": "mount_jupiter|mount_saturn|mount_apollo|mount_mercury|mount_venus|mount_moon|mount_mars", "prominence": "prominent|normal|flat", "confidence": "high|low" }
  ],
  "signs": [
    { "feature_key": "star|cross|triangle|square|island|grille", "location": "<where>", "confidence": "high|low" }
  ],
  "palmShape": "earth|air|fire|water (ONLY if clear, else omit)",
  "fingerLength": "long|short|average (ONLY if clear, else omit)",
  "thumb": "firm|flexible (ONLY if clear, else omit)"
}

For lines you cannot see, use present:false. Only list mounts/signs you can actually see (omit the rest). Output ONLY JSON.`;

const COMPOSE_PROMPT = (
  name: string,
  age: number,
  gender: string | undefined,
  observations: PalmObservations,
  knowledge: string
) =>
  `You are a knowledgeable, HONEST palmist (in the Samudrik Shastra tradition) writing a reading for ${name}, ${age} years old${gender ? `, ${gender}` : ""}. Speak simply and warmly like a wise elder — but be truthful, not flattering or fortune-telling.

These are the features ACTUALLY OBSERVED in ${name}'s palm photo (with confidence + evidence):
${JSON.stringify(observations)}

${
  knowledge
    ? `Authentic palmistry knowledge (classical Samudrik Shastra) retrieved for these features. Base EVERY interpretation on this text — do not invent meanings:
${knowledge}`
    : `(No retrieved knowledge available — keep interpretations general and clearly traditional; do NOT invent specific claims.)`
}

STRICT RULES (so nothing is made up):
- Write ONLY about features observed with present:true. Ignore anything present:false or low-confidence (you may briefly note a feature "could not be clearly seen").
- Ground each meaning in the retrieved knowledge above. If there is no knowledge for a feature, keep it general — never invent a specific claim.
- Use honest, traditional framing: "In palmistry, a [feature] is traditionally associated with [meaning]" — NOT definite predictions like "you will…". Make no guarantees about the future.
- Be clear and concrete with simple everyday words. NO vague horoscope filler, NO generic flattery.

LANGUAGE RULES:
- English: simple, clear, everyday words. Hindi: natural Devanagari, simple (not Sanskrit-heavy).
- Warm and respectful while honest. Address ${name} as "you".

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

// Self-verification critic — strips any claim not backed by an observed feature or the KB.
const VERIFY_PROMPT = (observations: PalmObservations, knowledge: string, draftJson: string) =>
  `You are a strict fact-checker for a palmistry reading. You are given (1) the features ACTUALLY observed in the palm, (2) the authentic palmistry knowledge available, and (3) a DRAFT reading in JSON.

OBSERVED:
${JSON.stringify(observations)}

KNOWLEDGE:
${knowledge || "(none)"}

DRAFT READING (JSON):
${draftJson}

Return a corrected version of the SAME JSON (identical keys and structure) in which EVERY statement is supported by an observed present:true feature OR by the knowledge above:
- Remove or soften any claim that is invented, not observed, or unsupported — especially confident predictions with no basis.
- Keep honest traditional framing ("traditionally associated with…"), simple clear language, and warmth.
- Do NOT add features that were not observed.
Output ONLY the corrected JSON.`;

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

/**
 * Call Gemini generateContent with a text prompt and an optional palm image.
 * JSON output is forced via responseMimeType so the prompts' JSON contracts hold.
 */
async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  const parts: GeminiPart[] = [{ text: prompt }];
  if (imageBase64) {
    // Gemini wants raw base64 — strip the `data:image/...;base64,` prefix.
    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
    parts.push({
      inline_data: {
        mime_type: match?.[1] ?? "image/jpeg",
        data: match ? match[2] : imageBase64,
      },
    });
  }

  const response = await fetch(GEMINI_URL(GEMINI_MODEL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        // gemini-2.5-flash "thinks" by default and can burn the whole token
        // budget on thoughts (finishReason: MAX_TOKENS, empty output). Disable
        // thinking for this structured-extraction task and give the large
        // bilingual JSON room.
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `Gemini API error: ${response.status}`
    );
  }

  const json = await response.json();
  const respParts = (json?.candidates?.[0]?.content?.parts ?? []) as GeminiPart[];
  return respParts.map((p) => p.text ?? "").join("");
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

/** Critic pass: re-ground the draft reading, removing unsupported/invented claims. */
async function verifyReading(
  observations: PalmObservations,
  knowledge: string,
  draft: PalmReadingResult
): Promise<PalmReadingResult> {
  const raw = await callGemini(VERIFY_PROMPT(observations, knowledge, JSON.stringify(draft)));
  return validate(parseJson<PalmReadingResult>(raw));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Analyse a palm image and return a grounded palmistry reading.
 * Two-pass + RAG when available; gracefully falls back to single-pass otherwise.
 */
export async function analyzePalm(input: PalmReadingInput): Promise<PalmReadingResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  const { imageBase64, name, age, gender } = input;

  // Pass 1 — detect observable features. On failure, fall back to single-pass.
  let observations: PalmObservations | null = null;
  try {
    const raw = await callGemini(OBSERVE_PROMPT(name, age, gender), imageBase64);
    observations = parseJson<PalmObservations>(raw);
  } catch (err) {
    console.warn("[palmReading] observation pass failed — using single-pass fallback:", err);
  }

  // Image gate — if the observe pass clearly says the photo isn't a usable palm,
  // do NOT fabricate a reading; ask for a clearer photo. (Thrown past the fallback.)
  if (observations && observations.imageOk === false) {
    throw new PalmImageError(observations.imageIssue || "");
  }

  if (!observations) {
    const raw = await callGemini(FALLBACK_PROMPT(name, age, gender), imageBase64);
    return validate(parseJson<PalmReadingResult>(raw));
  }

  // Retrieve grounding knowledge (fails soft to []).
  const chunks = await retrievePalmKnowledge(buildPalmQueries(observations));
  const knowledge = formatKnowledgeForPrompt(chunks);

  // Pass 2 — compose the grounded reading (text-only).
  const composed = validate(
    parseJson<PalmReadingResult>(
      await callGemini(COMPOSE_PROMPT(name, age, gender, observations, knowledge))
    )
  );

  // Pass 3 — self-verification critic: strip unsupported/invented claims.
  // Degrades gracefully to the composed reading if the verify call fails.
  let result = composed;
  try {
    result = await verifyReading(observations, knowledge, composed);
  } catch (err) {
    console.warn("[palmReading] verification pass failed — using composed reading:", err);
  }

  if (chunks.length > 0) {
    result.grounded = true;
    result.sources = buildSources(chunks);
  } else {
    result.grounded = false;
  }
  return result;
}
