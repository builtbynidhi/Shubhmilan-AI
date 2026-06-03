/**
 * Compatibility — deterministic Ashtakoot Guna Milan + AI narrative.
 *
 * The 36-guna score is computed locally from classical lookup tables
 * (src/lib/jyotish/ashtakoot.ts — Narada Samhita tradition), and the shubh
 * vivah muhurat dates come from real panchang astronomy (src/lib/panchang.ts,
 * Muhurta Chintamani rules). Groq AI only writes the warm bilingual analysis
 * around these computed facts — it never invents scores or dates.
 *
 * Degrades gracefully: if the AI call fails, the deterministic result is
 * returned with a minimal narrative instead of throwing.
 */

import type { PartnerDetails, CompatibilityResult, MuhurtDate } from "@/types/compatibility.types";
import { callGroqJSON } from "@/lib/groq";
import { computeAshtakoot, type AshtakootResult } from "@/lib/jyotish/ashtakoot";
import { nakshatraIndexByName, rashiIndexByName } from "@/lib/jyotish/nakshatra";
import { findVivahMuhurats } from "@/lib/panchang";
import {
  buildAshtakootQueries,
  retrieveAstroKnowledge,
  formatKnowledgeForPrompt,
} from "@/lib/astroRag";

interface Narrative {
  verdictHindi?: string;
  analysis?: string;
  analysisHindi?: string;
  mangalNote?: string;
  remedies?: string[];
  /** One remark per auspicious date, same order as provided */
  dateRemarks?: string[];
}

function buildNarrativePrompt(
  partner1: PartnerDetails,
  partner2: PartnerDetails,
  result: AshtakootResult,
  verdict: string,
  dates: MuhurtDate[],
  knowledgeBlock: string,
): string {
  const scoreLines = result.categories
    .map((c) => `- ${c.name} (${c.nameHindi}): ${c.obtained}/${c.maximum} — ${c.description}`)
    .join("\n");
  const dateLines = dates
    .map((d, i) => `${i + 1}. ${d.date} — Tithi: ${d.tithi}, Nakshatra: ${d.nakshatra}`)
    .join("\n");

  return `You are Pandit Vishwanath Sharma — a respected Vedic Jyotish master with 40+ years of experience in Kundli matching. You explain everything warmly and simply, as if speaking to a loving family.

The Ashtakoot Guna Milan for this couple has ALREADY been computed using the classical tables (Narada Samhita tradition). These numbers are FINAL — do NOT recompute, question, or change any score.

Partner 1 (Boy/Groom): ${partner1.fullName}
Nakshatra: ${result.boy.nakshatra} | Rashi: ${result.boy.rashi}

Partner 2 (Girl/Bride): ${partner2.fullName}
Nakshatra: ${result.girl.nakshatra} | Rashi: ${result.girl.rashi}

COMPUTED SCORES (classical tables — final):
${scoreLines}
Total: ${result.total}/36 → Verdict: ${verdict}
Nadi dosha: ${result.nadiDosha ? "YES (same nadi — serious, discuss remedies)" : "No"}
Bhakoot dosha: ${result.bhakootDosha ? "YES (inauspicious rashi axis)" : "No"}
Gana dosha: ${result.ganaDosha ? "YES (temperament mismatch)" : "No"}
${dates.length > 0 ? `\nCOMPUTED SHUBH VIVAH MUHURAT DATES (real panchang, Muhurta Chintamani rules — final):\n${dateLines}` : ""}
${knowledgeBlock ? `\nAUTHENTIC CLASSICAL KNOWLEDGE (retrieved from the shastra knowledge base — ground your analysis in these and cite them inline as [K1], [K2] where relevant):\n${knowledgeBlock}` : ""}

IMPORTANT LANGUAGE RULES:
- "analysis" must be in simple English — warm, friendly, like a wise elder explaining to a young couple. Write directly to the couple — use "you both".
- "analysisHindi" must be the same in natural, everyday Hindi (Devanagari script).

Return ONLY valid JSON matching this EXACT structure:
{
  "verdictHindi": "<Hindi equivalent of the verdict '${verdict}'>",
  "analysis": "<250-400 words in simple English. Explain what the computed scores mean: each notable guna category briefly, any doshas and their significance, overall harmony, emotional bond, family life, and a final warm verdict consistent with ${result.total}/36.>",
  "analysisHindi": "<Same analysis in 250-400 words of simple Hindi (Devanagari script).>",
  "mangalNote": "<1-2 sentences in simple English noting that full Mangal Dosha analysis needs both complete birth charts (kundlis), and a gentle pointer based on the computed doshas above>",
  "remedies": [${result.total < 25 ? `"<remedy 1 — classical upay for the specific doshas found>", "<remedy 2>", "<remedy 3>"` : ""}],
  "dateRemarks": [${dates.map(() => `"<brief warm remark for the corresponding muhurat date, e.g. 'Highly auspicious for vivah'>"`).join(", ")}]
}

Output ONLY JSON. No markdown, no explanations outside the JSON.`;
}

function getVerdict(score: number): string {
  if (score >= 28) return "Excellent";
  if (score >= 25) return "Very Good";
  if (score >= 21) return "Good";
  if (score >= 18) return "Average";
  return "Not Recommended";
}

const VERDICT_HI: Record<string, string> = {
  "Excellent": "उत्तम",
  "Very Good": "बहुत अच्छा",
  "Good": "अच्छा",
  "Average": "औसत",
  "Not Recommended": "अनुशंसित नहीं",
};

export async function checkCompatibility(
  partner1: PartnerDetails,
  partner2: PartnerDetails,
): Promise<CompatibilityResult> {
  const boyNak = nakshatraIndexByName(partner1.nakshatra);
  const girlNak = nakshatraIndexByName(partner2.nakshatra);
  if (boyNak < 0 || girlNak < 0) throw new Error("Invalid nakshatra selection");

  const boyRashi = rashiIndexByName(partner1.rashi);
  const girlRashi = rashiIndexByName(partner2.rashi);

  // Deterministic classical computation — the source of truth.
  const result = computeAshtakoot(
    { nakshatra: boyNak, rashi: boyRashi >= 0 ? boyRashi : undefined },
    { nakshatra: girlNak, rashi: girlRashi >= 0 ? girlRashi : undefined },
  );
  const verdict = getVerdict(result.total);
  const marriageRecommended = result.total >= 18;

  // Real panchang muhurat dates (only when the match is recommended).
  const dates = marriageRecommended ? findVivahMuhurats(new Date(), 6) : [];

  // Ground the narrative in the classical KB (fails soft to []).
  const chunks = await retrieveAstroKnowledge(buildAshtakootQueries(result));
  const knowledgeBlock = formatKnowledgeForPrompt(chunks);
  const sources = [...new Set(chunks.map((c) => c.source))];

  // AI narrates the computed facts; failure degrades to a minimal narrative.
  let narrative: Narrative = {};
  try {
    const raw = await callGroqJSON(
      buildNarrativePrompt(partner1, partner2, result, verdict, dates, knowledgeBlock),
    );
    try {
      narrative = JSON.parse(raw) as Narrative;
    } catch {
      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      narrative = JSON.parse(cleaned) as Narrative;
    }
  } catch (err) {
    console.warn("[compatibility] AI narrative unavailable — returning computed scores only:", err);
  }

  const remarks = Array.isArray(narrative.dateRemarks) ? narrative.dateRemarks : [];
  const auspiciousDates = dates.map((d, i) => ({
    ...d,
    remark: typeof remarks[i] === "string" && remarks[i] ? remarks[i] : "Shubh muhurat for vivah",
  }));

  return {
    totalScore: result.total,
    maxScore: 36,
    percentage: Math.round((result.total / 36) * 100),
    verdict,
    verdictHindi: narrative.verdictHindi || VERDICT_HI[verdict] || "",
    categories: result.categories,
    analysis: narrative.analysis || "",
    analysisHindi: narrative.analysisHindi || "",
    marriageRecommended,
    auspiciousDates,
    mangalNote: narrative.mangalNote || "",
    remedies: result.total < 25 && Array.isArray(narrative.remedies) ? narrative.remedies : [],
    grounded: chunks.length > 0,
    sources,
  };
}
