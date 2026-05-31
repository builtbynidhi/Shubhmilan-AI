const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

export type AIRewriteFeature = "rewrite_hobbies" | "rewrite_about" | "rewrite_expectations" | "kundli_explain";

const PROMPTS: Record<string, (input: string) => string> = {
  rewrite_hobbies: (hobbies: string) =>
    `You are helping create an Indian matrimonial biodata. Rewrite these hobbies in warm, engaging, matrimonial-friendly language. Make it sound genuine and personal. Keep to 2-3 sentences. Do not add fictional hobbies. Original: ${hobbies}`,
  rewrite_about: (aboutMe: string) =>
    `You are helping create an Indian matrimonial biodata. Rewrite this 'About Me' section to sound warm, confident, and genuine. Culturally appropriate for Indian families. 3-4 sentences max. Keep personal details accurate, only improve the language. Original: ${aboutMe}`,
  rewrite_expectations: (expectations: string) =>
    `You are helping create an Indian matrimonial biodata. Rewrite these partner expectations in a respectful, positive, and hopeful tone. Should sound warm, not demanding. 2-3 sentences. Keep requirements accurate, only improve language and tone. Original: ${expectations}`,
  kundli_explain: (kundliData: string) =>
    `You are an expert Vedic astrologer explaining a kundli to a young Indian person in simple, friendly language. Cover: personality traits, career strengths, relationships, and general guidance. Keep it positive and encouraging while being accurate. Data: ${kundliData}`,
};

export async function callClaude(
  feature: AIRewriteFeature,
  inputText: string
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in .env");
  }

  const prompt = PROMPTS[feature]?.(inputText);
  if (!prompt) {
    throw new Error(`Unknown AI feature: ${feature}`);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Claude API error: ${response.status} — ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textContent = data.content.find((block) => block.type === "text");
  if (!textContent) {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}
