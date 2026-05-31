/**
 * Compatibility API — Ashtakoot Guna Milan via Groq AI
 *
 * Takes birth details of two partners and returns:
 * - 8-category Guna Milan score (out of 36)
 * - Marriage verdict
 * - Auspicious marriage dates (if compatible)
 * - Detailed analysis in English & Hindi
 */

import type { PartnerDetails, CompatibilityResult } from "@/types/compatibility.types";
import { callGroqJSON } from "@/lib/groq";

function buildPrompt(partner1: PartnerDetails, partner2: PartnerDetails): string {
  return `You are Pandit Vishwanath Sharma — the world's most respected Vedic Jyotish master with 40+ years of experience in Kundli matching and Guna Milan. Thousands of families across India trust your readings. You explain everything warmly and simply, as if speaking to a loving family.

Perform a complete **Ashtakoot Guna Milan** (8-fold compatibility check) for this couple based on their Moon signs (Rashi).

Partner 1 (Boy/Groom):
Name: ${partner1.fullName}
Rashi (Moon Sign): ${partner1.rashi}

Partner 2 (Girl/Bride):
Name: ${partner2.fullName}
Rashi (Moon Sign): ${partner2.rashi}

Calculate all 8 Gunas accurately based on the Moon signs (Rashis) provided. Use the standard Ashtakoot matching tables used in Vedic Jyotish for Rashi-based Guna Milan.

IMPORTANT LANGUAGE RULES:
- "analysis" must be in simple English — warm, friendly, like a wise elder explaining to a young couple.
- "analysisHindi" must be the same in natural, everyday Hindi (Devanagari script).

Return ONLY valid JSON matching this EXACT structure:
{
  "totalScore": <number 0-36>,
  "maxScore": 36,
  "percentage": <number 0-100>,
  "verdict": "<Excellent (28+) | Very Good (25-27) | Good (21-24) | Average (18-20) | Not Recommended (<18)>",
  "verdictHindi": "<Hindi equivalent of verdict>",
  "categories": [
    {"name": "Varna", "nameHindi": "वर्ण", "description": "<1 line what this tests — simple English>", "obtained": <0-1>, "maximum": 1},
    {"name": "Vashya", "nameHindi": "वश्य", "description": "<1 line>", "obtained": <0-2>, "maximum": 2},
    {"name": "Tara", "nameHindi": "तारा", "description": "<1 line>", "obtained": <0-3>, "maximum": 3},
    {"name": "Yoni", "nameHindi": "योनि", "description": "<1 line>", "obtained": <0-4>, "maximum": 4},
    {"name": "Graha Maitri", "nameHindi": "ग्रह मैत्री", "description": "<1 line>", "obtained": <0-5>, "maximum": 5},
    {"name": "Gana", "nameHindi": "गण", "description": "<1 line>", "obtained": <0-6>, "maximum": 6},
    {"name": "Bhakoot", "nameHindi": "भकूट", "description": "<1 line>", "obtained": <0-7>, "maximum": 7},
    {"name": "Nadi", "nameHindi": "नाड़ी", "description": "<1 line>", "obtained": <0-8>, "maximum": 8}
  ],
  "analysis": "<250-400 words in simple English. Cover: each guna category briefly, overall harmony, emotional bond, career compatibility, family life, health considerations, and a final warm verdict. Write directly to the couple — use 'you both'.>",
  "analysisHindi": "<Same analysis in 250-400 words of simple Hindi (Devanagari script).>",
  "marriageRecommended": <true if totalScore >= 18, false otherwise>,
  "auspiciousDates": [
    {"date": "<DD Month YYYY>", "tithi": "<tithi name>", "nakshatra": "<nakshatra name>", "remark": "<brief remark>"},
    {"date": "...", "tithi": "...", "nakshatra": "...", "remark": "..."},
    {"date": "...", "tithi": "...", "nakshatra": "...", "remark": "..."}
  ],
  "mangalNote": "<1-2 sentences about Mangal Dosha compatibility between the two — in simple English>",
  "remedies": ["<remedy 1 if score < 25>", "<remedy 2>", "<remedy 3>"]
}

IMPORTANT:
- auspiciousDates: Give 3-5 upcoming auspicious marriage dates (muhurts) within the next 12 months from today (${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}). Only include if marriageRecommended is true, otherwise return empty array.
- remedies: Provide only if totalScore < 25. Otherwise return empty array.
- Ensure totalScore equals the sum of all category "obtained" values.
- Output ONLY JSON. No markdown, no explanations outside the JSON.`;
}

export async function checkCompatibility(
  partner1: PartnerDetails,
  partner2: PartnerDetails,
): Promise<CompatibilityResult> {
  const raw = await callGroqJSON(buildPrompt(partner1, partner2));

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  const data = parsed as unknown as CompatibilityResult;

  if (!data.categories || !Array.isArray(data.categories) || data.categories.length !== 8) {
    throw new Error("Invalid compatibility data received from AI");
  }

  // Coerce + clamp each category before summing (AI output is untrusted)
  const toNum = (n: unknown, fallback = 0) => {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
  };
  const cats = data.categories.map((c) => {
    const maximum = Math.max(0, toNum(c.maximum));
    const obtained = Math.max(0, Math.min(toNum(c.obtained), maximum));
    return { ...c, obtained, maximum };
  });
  const sum = cats.reduce((acc, c) => acc + c.obtained, 0);

  return {
    totalScore: sum,
    maxScore: 36,
    percentage: Math.round((sum / 36) * 100),
    verdict: data.verdict || getVerdict(sum),
    verdictHindi: data.verdictHindi || "",
    categories: cats,
    analysis: data.analysis || "",
    analysisHindi: data.analysisHindi || "",
    marriageRecommended: sum >= 18,
    auspiciousDates: sum >= 18 ? (data.auspiciousDates || []) : [],
    mangalNote: data.mangalNote || "",
    remedies: sum < 25 ? (data.remedies || []) : [],
  };
}

function getVerdict(score: number): string {
  if (score >= 28) return "Excellent";
  if (score >= 25) return "Very Good";
  if (score >= 21) return "Good";
  if (score >= 18) return "Average";
  return "Not Recommended";
}
