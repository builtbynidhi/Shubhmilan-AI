/**
 * Kundli API — deterministic chart (real astronomy) + AI narrative.
 *
 * The birth chart (graha positions, lagna, houses, doshas) is computed locally
 * by src/lib/jyotish/chart.ts using astronomy-engine with the Lahiri ayanamsa —
 * the same panchang/ephemeris approach pandits use, so the same birth details
 * always produce the same chart. Groq only writes the warm bilingual
 * explanations around these computed facts (grounded in the classical KB via
 * astroRag when available) — it never invents positions or dosha statuses.
 *
 * Geocoding uses OpenStreetMap Nominatim. Degrades gracefully: if the AI call
 * fails, the computed chart is returned with a minimal narrative.
 */

import type { KundliData, ManglikAnalysis } from "@/types/kundli.types";
import { callGroqJSON } from "@/lib/groq";
import { retrieveAstroKnowledge, formatKnowledgeForPrompt } from "@/lib/astroRag";
import { computeBirthChart, type BirthChart } from "@/lib/jyotish/chart";

export interface BirthDetails {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm
  latitude: number;
  longitude: number;
  placeName: string;
  gender?: "male" | "female" | "other";
}

interface KundliNarrative {
  mangalExplanation?: string;
  kaalSarpExplanation?: string;
  sadeSatiExplanation?: string;
  manglikReason?: string;
  cancellationFactors?: string[];
  remedies?: string[];
  compatibilityTip?: string;
  navamsaReading?: string;
  navamsaReadingHindi?: string;
  explanation?: string;
  explanationHindi?: string;
}

/**
 * Classical grounding for the dosha/remedy narrative, targeted at the doshas
 * actually present in the computed chart. Fails soft to "" when the RAG infra
 * is unavailable.
 */
async function fetchKundliKnowledge(chart: BirthChart): Promise<string> {
  const queries: string[] = [`${chart.keyIndicators.nakshatra} nakshatra nature deity planet`];
  if (chart.mangal.status !== "no") {
    queries.push("Mangal dosha Mars houses definition marriage", "Mangal dosha cancellation factors", "Mangal dosha remedies");
  }
  if (chart.kaalSarp.status !== "no") queries.push("Kaal Sarp yoga definition effects remedies");
  if (chart.sadeSati.status !== "no") queries.push("Sade Sati Saturn definition phases effects");
  const chunks = await retrieveAstroKnowledge(queries);
  return formatKnowledgeForPrompt(chunks);
}

function buildNarrativePrompt(details: BirthDetails, chart: BirthChart, knowledgeBlock: string): string {
  const planetLines = chart.planetPositions
    .map((p) => `- ${p.planet} in ${p.rashi}, house ${p.house}, ${p.degree.toFixed(1)}°${p.status === "retrograde" ? " (retrograde)" : ""}`)
    .join("\n");
  const ki = chart.keyIndicators;

  return `You are Pandit Vishwanath Sharma — a respected Vedic Jyotish master with 40+ years of experience reading Kundlis. You speak simply — like a wise grandfather explaining things in plain, friendly words so anyone can understand, even without any astrology knowledge.

This person's Kundli has ALREADY been computed astronomically (sidereal, Lahiri Ayanamsa — like a panchang/ephemeris). These positions and dosha findings are FINAL — do NOT recompute, question, or change any of them. Your only job is to explain what they mean for this person's life.

Person: ${details.name}${details.gender ? ` (${details.gender})` : ""}
Born: ${details.dateOfBirth} at ${details.timeOfBirth} IST, ${details.placeName}

COMPUTED CHART (final):
Lagna (Ascendant): ${ki.lagna} (${ki.lagnaEnglish})
Moon Rashi: ${ki.rashi} (${ki.rashiEnglish})
Nakshatra: ${ki.nakshatra}, Pada ${ki.nakshatraPada}
Tithi: ${ki.tithi}
${planetLines}

COMPUTED DOSHA FINDINGS (final):
- Mangal Dosha: ${chart.mangal.status} — ${chart.mangal.facts}
- Kaal Sarp: ${chart.kaalSarp.status} — ${chart.kaalSarp.facts}
- Sade Sati: ${chart.sadeSati.status} — ${chart.sadeSati.facts}

COMPUTED NAVAMSA (D9 — the divisional chart for marriage/spouse, final):
${chart.navamsa.marriageFacts}
${knowledgeBlock ? `\nAUTHENTIC CLASSICAL KNOWLEDGE (retrieved from the shastra knowledge base — ground your explanations in these, citing inline as [K1], [K2] where relevant):\n${knowledgeBlock}\n` : ""}
IMPORTANT LANGUAGE RULES:
- "explanation" must be in simple, easy English — short sentences, everyday words, warm and encouraging tone. No hard astrology terms without explaining them.
- "explanationHindi" must be the same reading in natural, everyday Hindi (Devanagari script) — use "aap" and common Hindi words.

Return ONLY valid JSON matching this EXACT structure:
{
  "mangalExplanation": "<1-2 simple English sentences explaining the Mangal Dosha finding above>",
  "kaalSarpExplanation": "<1-2 simple English sentences explaining the Kaal Sarp finding above>",
  "sadeSatiExplanation": "<1-2 simple English sentences explaining the Sade Sati finding above>",
  "manglikReason": "<1-2 simple sentences explaining the Manglik status from the Mars placement above>",
  "cancellationFactors": ["<factor if any — in simple English, [] if none>"],
  "remedies": [${chart.mangal.status !== "no" ? `"<classical remedy 1 for Mangal dosha>", "<remedy 2>", "<remedy 3>"` : ""}],
  "compatibilityTip": "<1 simple sentence about marriage matching given the Manglik status>",
  "navamsaReading": "<60-100 words in simple English on what the Navamsa (D9) above says about this person's marriage and life partner: nature of the spouse, marital harmony, and the strength shown by any vargottama planets. Base it strictly on the computed D9 facts.>",
  "navamsaReadingHindi": "<Same Navamsa marriage reading in simple Hindi (Devanagari).>",
  "explanation": "<200-300 words in simple, friendly English. Cover: what kind of person they are (from the ${ki.lagnaEnglish} Lagna), how they feel inside (from the ${ki.rashiEnglish} Moon and ${ki.nakshatra} nakshatra), what kind of work suits them, love and marriage life, the doshas explained simply with easy remedies, and a warm encouraging message. Write directly to them — use 'you' and 'your'.>",
  "explanationHindi": "<Same reading in 200-300 words of simple, everyday Hindi (Devanagari script).>"
}

Output ONLY JSON. No markdown, no explanations outside the JSON.`;
}

/**
 * Generate full Kundli — deterministic chart + AI explanation.
 */
export async function generateKundli(
  details: BirthDetails
): Promise<KundliData & { explanation: string }> {
  // The chart is computed locally — the source of truth.
  const chart = computeBirthChart({
    dateOfBirth: details.dateOfBirth,
    timeOfBirth: details.timeOfBirth || "12:00",
    latitude: details.latitude,
    longitude: details.longitude,
  });

  // Ground + narrate; failure degrades to a minimal narrative.
  let narrative: KundliNarrative = {};
  try {
    const knowledgeBlock = await fetchKundliKnowledge(chart);
    const raw = await callGroqJSON(buildNarrativePrompt(details, chart, knowledgeBlock));
    try {
      narrative = JSON.parse(raw) as KundliNarrative;
    } catch {
      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      narrative = JSON.parse(cleaned) as KundliNarrative;
    }
  } catch (err) {
    console.warn("[kundli] AI narrative unavailable — returning computed chart only:", err);
  }

  const manglikAnalysis: ManglikAnalysis = {
    status: chart.mangal.status,
    marsHouse: chart.mangal.marsHouse,
    marsRashi: chart.mangal.marsRashi,
    reason: narrative.manglikReason || chart.mangal.facts,
    cancellationFactors: Array.isArray(narrative.cancellationFactors) ? narrative.cancellationFactors : [],
    remedies: Array.isArray(narrative.remedies) ? narrative.remedies : [],
    compatibilityTip: narrative.compatibilityTip || "",
  };

  return {
    chartStyle: "north_indian",
    planetPositions: chart.planetPositions,
    keyIndicators: chart.keyIndicators,
    doshaAnalysis: {
      mangalDosha: chart.mangal.status,
      mangalExplanation: narrative.mangalExplanation || chart.mangal.facts,
      kaalSarp: chart.kaalSarp.status,
      kaalSarpExplanation: narrative.kaalSarpExplanation || chart.kaalSarp.facts,
      sadeSati: chart.sadeSati.status,
      sadeSatiExplanation: narrative.sadeSatiExplanation || chart.sadeSati.facts,
    },
    manglikAnalysis,
    houses: chart.houses,
    navamsa: {
      lagna: chart.navamsa.lagna,
      lagnaEnglish: chart.navamsa.lagnaEnglish,
      houses: chart.navamsa.houses,
      vargottama: chart.navamsa.vargottama,
      marriageReading: narrative.navamsaReading || chart.navamsa.marriageFacts,
      marriageReadingHindi: narrative.navamsaReadingHindi || "",
    },
    explanation: narrative.explanation ?? "",
    explanationHindi: narrative.explanationHindi ?? "",
  };
}

/**
 * Geocode a place name to lat/lon using Nominatim.
 */
export interface PlaceResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function getPlaceCoordinates(
  placeName: string
): Promise<PlaceResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        placeName
      )}&countrycodes=in&limit=5`,
      { headers: { "User-Agent": "ShubhMilan.ai/1.0" } }
    );

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (results.length === 0) return null;

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Geocode returning multiple candidates (for autocomplete).
 */
export async function searchPlaces(
  query: string
): Promise<PlaceResult[]> {
  if (query.length < 2) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=6`,
      { headers: { "User-Agent": "ShubhMilan.ai/1.0" } }
    );

    if (!response.ok) return [];

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    return results.map((r) => ({
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      displayName: r.display_name,
    }));
  } catch {
    return [];
  }
}
