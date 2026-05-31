/**
 * Kundli API — uses Groq for Vedic birth chart generation
 * and OpenStreetMap Nominatim for geocoding.
 */

import type { KundliData } from "@/types/kundli.types";
import { callGroqJSON } from "@/lib/groq";

export interface BirthDetails {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm
  latitude: number;
  longitude: number;
  placeName: string;
  gender?: "male" | "female" | "other";
}

const KUNDLI_PROMPT = (details: string) => `You are Pandit Vishwanath Sharma — the world's finest Vedic Jyotish master with over 40 years of experience reading thousands of Kundlis. You have studied under the greatest Jyotish Gurus of India and your readings are known for being deeply accurate, warm, and life-changing. You speak simply — like a wise grandfather explaining things in plain, friendly words so anyone can understand, even without any astrology knowledge. You never use confusing jargon; instead you explain what each planet means for that person's real life.

Now calculate a complete Kundli (birth chart) for the person below using traditional Vedic sidereal calculations (Lahiri Ayanamsa).

Birth Details:
${details}

IMPORTANT LANGUAGE RULES:
- "explanation" must be in simple, easy English — short sentences, everyday words, like you are talking to a friend. No hard astrology terms without explaining them. Warm and encouraging tone.
- "explanationHindi" must be the same reading written in natural, everyday Hindi (Devanagari script) — as if you are speaking to the person directly in Hindi. Use simple Hindi words, not Sanskrit-heavy language.

Return ONLY valid JSON matching this exact structure:
{
  "chartStyle": "north_indian",
  "planetPositions": [
    {"planet": "Sun", "symbol": "Su", "rashi": "<Hindi rashi name>", "house": <1-12>, "degree": <0.0-30.0>, "status": "direct"},
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
    "mangalExplanation": "<1-2 simple sentences in English>",
    "kaalSarp": "yes|no|partial",
    "kaalSarpExplanation": "<1-2 simple sentences in English>",
    "sadeSati": "yes|no|partial",
    "sadeSatiExplanation": "<1-2 simple sentences in English>"
  },
  "manglikAnalysis": {
    "status": "yes|no|partial",
    "marsHouse": <house number 1-12 where Mars is placed>,
    "marsRashi": "<rashi/sign Mars is in>",
    "reason": "<1-2 simple sentences explaining Manglik status — mention house placement in plain words>",
    "cancellationFactors": ["<factor if any — in simple English>"],
    "remedies": ["<remedy 1>", "<remedy 2>", "<remedy 3>"],
    "compatibilityTip": "<1 simple sentence about marriage matching>"
  },
  "houses": {
    "1": ["<planet symbols in house 1>"],
    "2": [],
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": [],
    "8": [],
    "9": [],
    "10": [],
    "11": [],
    "12": []
  },
  "explanation": "<200-300 words in simple, friendly English. Cover: what kind of person they are (from Lagna), how they feel inside (from Moon sign), what kind of work suits them, love and marriage life, any doshas explained simply with easy remedies, and a warm encouraging message for their life ahead. Write like you are talking to them directly — use 'you' and 'your'.>",
  "explanationHindi": "<Same reading in 200-300 words of simple, everyday Hindi (Devanagari script). Write as if you are speaking to them warmly and directly — use 'aap' and common Hindi words. Explain what the planets mean for their life in a way any Hindi speaker can easily understand.>"
}

Rashi names: Mesh, Vrishabh, Mithun, Kark, Simha, Kanya, Tula, Vrishchik, Dhanu, Makar, Kumbh, Meen.
English: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.
Calculate accurately based on the date, time, and coordinates. Output ONLY JSON.`;

/**
 * Generate full Kundli (chart + explanation) via Groq.
 */
export async function generateKundli(
  details: BirthDetails
): Promise<KundliData & { explanation: string }> {
  const inputSummary = [
    `Name: ${details.name}`,
    `Date of Birth: ${details.dateOfBirth}`,
    `Time of Birth: ${details.timeOfBirth}`,
    `Place: ${details.placeName}`,
    `Latitude: ${details.latitude}`,
    `Longitude: ${details.longitude}`,
    details.gender ? `Gender: ${details.gender}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callGroqJSON(KUNDLI_PROMPT(inputSummary));

  // Parse the JSON response
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Sometimes the model wraps in markdown backticks — strip them
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  // Validate required keys
  const data = (parsed as unknown) as KundliData & { explanation?: string; explanationHindi?: string };
  if (!data.planetPositions || !data.keyIndicators || !data.doshaAnalysis) {
    throw new Error("Invalid Kundli data received from AI");
  }

  // Build fallback manglikAnalysis from doshaAnalysis if AI didn't return it
  const marsPlanet = data.planetPositions?.find((p: { planet: string }) => p.planet === "Mars");
  const manglikFallback: import("@/types/kundli.types").ManglikAnalysis = {
    status: data.doshaAnalysis?.mangalDosha ?? "no",
    marsHouse: marsPlanet?.house ?? 0,
    marsRashi: marsPlanet?.rashi ?? "",
    reason: data.doshaAnalysis?.mangalExplanation ?? "",
    cancellationFactors: [],
    remedies: [],
    compatibilityTip: "",
  };

  return {
    chartStyle: data.chartStyle ?? "north_indian",
    planetPositions: data.planetPositions,
    keyIndicators: data.keyIndicators,
    doshaAnalysis: data.doshaAnalysis,
    manglikAnalysis: (parsed as Record<string, unknown>).manglikAnalysis
      ? ((parsed as Record<string, unknown>).manglikAnalysis as import("@/types/kundli.types").ManglikAnalysis)
      : manglikFallback,
    houses: data.houses ?? {},
    explanation: data.explanation ?? "",
    explanationHindi: data.explanationHindi ?? "",
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
