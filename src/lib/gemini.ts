/**
 * Gemini AI Service — used for Kundli generation
 *
 * ▸ Model: gemini-2.0-flash
 * ▸ Uses the Gemini REST API (generateContent) — no SDK needed
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash";

/**
 * Call Gemini with a prompt and get the text response.
 * Supports optional JSON-mode via response_mime_type.
 */
export async function callGeminiJSON(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env");
  }

  const url = `${BASE}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg =
      (err as { error?: { message?: string } }).error?.message ??
      JSON.stringify(err);
    throw new Error(`Gemini API error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");

  return text.trim();
}
