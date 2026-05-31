/**
 * DeepSeek AI Service — used for Kundli generation
 *
 * ▸ Model: deepseek-chat
 * ▸ Uses the OpenAI-compatible Chat Completions API
 */

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
const BASE = "https://api.deepseek.com/chat/completions";

/**
 * Call DeepSeek with a prompt and get a JSON response.
 */
export async function callDeepSeekJSON(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key not configured. Set VITE_DEEPSEEK_API_KEY in .env");
  }

  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert Vedic astrologer. Always respond with valid JSON only, no markdown, no explanations outside the JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (err as { error?: { message?: string } }).error?.message ??
      JSON.stringify(err);
    throw new Error(`DeepSeek API error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in DeepSeek response");

  return text.trim();
}
