/**
 * Deterministic Vedic birth chart (Kundli) — real astronomy, no AI.
 *
 * Computes the 9 graha positions (geocentric, sidereal with Lahiri ayanamsa),
 * the lagna (ascendant), whole-sign houses, key indicators (moon rashi /
 * nakshatra / pada / tithi) and the classical dosha checks (Mangal, Kaal Sarp,
 * Sade Sati — Brihat Parashara Hora Shastra rules) from the birth date, time
 * and place. Same input always gives the same chart — like a pandit reading a
 * panchang/ephemeris, the AI layer only narrates these facts.
 *
 * Approximations (documented intentionally):
 * - Birth time is interpreted as IST (the app geocodes Indian places only).
 * - Rahu/Ketu use the mean lunar node (standard in most panchangs).
 * - Whole-sign (rashi) houses from the lagna, the common North-Indian style.
 * - Lagna is minute-sensitive by nature; the UI already warns about this.
 */

import { Body, Ecliptic, GeoVector, SiderealTime } from "astronomy-engine";
import type {
  DoshaStatus,
  KeyIndicators,
  PlanetName,
  PlanetPosition,
  PlanetStatus,
} from "@/types/kundli.types";
import { NAKSHATRAS, RASHIS } from "@/lib/jyotish/nakshatra";
import { computePanchang, lahiriAyanamsa } from "@/lib/panchang";

const DEG = Math.PI / 180;
const OBLIQUITY = 23.4367; // mean obliquity of the ecliptic, degrees

const RASHI_HINDI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"];

export interface BirthChartInput {
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm (IST)
  latitude: number;
  longitude: number;
}

export interface ComputedDosha {
  status: DoshaStatus;
  /** Computed facts for the AI narrative layer (not user-facing verbatim) */
  facts: string;
}

export interface BirthChart {
  planetPositions: PlanetPosition[];
  keyIndicators: KeyIndicators;
  houses: Record<number, string[]>;
  lagnaRashi: number;
  moonRashi: number;
  mangal: ComputedDosha & { marsHouse: number; marsRashi: string };
  kaalSarp: ComputedDosha;
  sadeSati: ComputedDosha;
}

/** Interpret a local Indian birth date+time as a UTC Date (IST = UTC+5:30). */
export function istToDate(dateOfBirth: string, timeOfBirth: string): Date {
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  const [hh, mm] = timeOfBirth.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - 5.5 * 3600_000);
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Geocentric tropical ecliptic longitude of a body. */
function tropicalLongitude(body: Body, time: Date): number {
  return norm360(Ecliptic(GeoVector(body, time, true)).elon);
}

/** Mean lunar node (Rahu), tropical — standard linear theory. */
function meanNodeLongitude(time: Date): number {
  const d = (time.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400_000; // days since J2000.0
  return norm360(125.04452 - 0.05295377 * d);
}

/** Tropical ascendant from local sidereal time and geographic latitude. */
function tropicalAscendant(time: Date, latitude: number, longitude: number): number {
  const lstDeg = norm360(SiderealTime(time) * 15 + longitude); // local sidereal time, degrees
  const ramc = lstDeg * DEG;
  const eps = OBLIQUITY * DEG;
  const phi = latitude * DEG;
  const asc = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
  );
  return norm360(asc / DEG);
}

const PLANET_BODIES: { planet: PlanetName; symbol: string; body: Body }[] = [
  { planet: "Sun", symbol: "Su", body: Body.Sun },
  { planet: "Moon", symbol: "Mo", body: Body.Moon },
  { planet: "Mars", symbol: "Ma", body: Body.Mars },
  { planet: "Mercury", symbol: "Me", body: Body.Mercury },
  { planet: "Jupiter", symbol: "Ju", body: Body.Jupiter },
  { planet: "Venus", symbol: "Ve", body: Body.Venus },
  { planet: "Saturn", symbol: "Sa", body: Body.Saturn },
];

/** Compute the full deterministic birth chart. */
export function computeBirthChart(input: BirthChartInput): BirthChart {
  const time = istToDate(input.dateOfBirth, input.timeOfBirth);
  const ayanamsa = lahiriAyanamsa(time);
  const toSidereal = (tropical: number) => norm360(tropical - ayanamsa);

  // ── Lagna ──────────────────────────────────────────────────────────────────
  const lagnaLon = toSidereal(tropicalAscendant(time, input.latitude, input.longitude));
  const lagnaRashi = Math.floor(lagnaLon / 30);
  const houseOf = (rashi: number) => ((rashi - lagnaRashi + 12) % 12) + 1;

  // ── Grahas ─────────────────────────────────────────────────────────────────
  const dayLater = new Date(time.getTime() + 86400_000);
  const positions: (PlanetPosition & { lon: number })[] = [];

  for (const { planet, symbol, body } of PLANET_BODIES) {
    const lon = toSidereal(tropicalLongitude(body, time));
    let status: PlanetStatus = "direct";
    if (planet !== "Sun" && planet !== "Moon") {
      const motion = norm360(tropicalLongitude(body, dayLater) - tropicalLongitude(body, time));
      status = motion > 180 ? "retrograde" : "direct"; // negative daily motion
    }
    const rashi = Math.floor(lon / 30);
    positions.push({
      planet,
      symbol,
      rashi: RASHI_HINDI[rashi],
      house: houseOf(rashi),
      degree: Math.round((lon % 30) * 100) / 100,
      status,
      lon,
    });
  }

  // Rahu/Ketu — mean node, always retrograde.
  const rahuLon = toSidereal(meanNodeLongitude(time));
  const ketuLon = norm360(rahuLon + 180);
  for (const [planet, symbol, lon] of [["Rahu", "Ra", rahuLon], ["Ketu", "Ke", ketuLon]] as const) {
    const rashi = Math.floor(lon / 30);
    positions.push({
      planet,
      symbol,
      rashi: RASHI_HINDI[rashi],
      house: houseOf(rashi),
      degree: Math.round((lon % 30) * 100) / 100,
      status: "retrograde",
      lon,
    });
  }

  // ── Houses record ──────────────────────────────────────────────────────────
  const houses: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) houses[h] = [];
  for (const p of positions) houses[p.house].push(p.symbol);

  // ── Key indicators (Moon) ──────────────────────────────────────────────────
  const moon = positions.find((p) => p.planet === "Moon")!;
  const moonRashi = Math.floor(moon.lon / 30);
  const nakshatraIndex = Math.floor(moon.lon / (360 / 27));
  const pada = (Math.floor(moon.lon / (360 / 108)) % 4) + 1;
  const panchang = computePanchang(time);

  const keyIndicators: KeyIndicators = {
    lagna: RASHI_HINDI[lagnaRashi],
    lagnaEnglish: RASHIS[lagnaRashi].english,
    rashi: RASHI_HINDI[moonRashi],
    rashiEnglish: RASHIS[moonRashi].english,
    nakshatra: NAKSHATRAS[nakshatraIndex].name,
    nakshatraPada: pada,
    tithi: panchang.tithiName,
  };

  // ── Mangal Dosha (BPHS) ────────────────────────────────────────────────────
  const mars = positions.find((p) => p.planet === "Mars")!;
  const marsRashiIdx = Math.floor(mars.lon / 30);
  const MANGAL_HOUSES = new Set([1, 2, 4, 7, 8, 12]);
  const marsHouseFromMoon = ((marsRashiIdx - moonRashi + 12) % 12) + 1;
  const fromLagna = MANGAL_HOUSES.has(mars.house);
  const fromMoon = MANGAL_HOUSES.has(marsHouseFromMoon);
  // Cancellation: Mars in own sign (Mesha/Vrishchika) or exalted (Makara).
  const marsCancelled = marsRashiIdx === 0 || marsRashiIdx === 7 || marsRashiIdx === 9;
  let mangalStatus: DoshaStatus = "no";
  if (fromLagna || fromMoon) mangalStatus = marsCancelled ? "partial" : fromLagna ? "yes" : "partial";
  const mangal = {
    status: mangalStatus,
    marsHouse: mars.house,
    marsRashi: RASHI_HINDI[marsRashiIdx],
    facts: `Mars in house ${mars.house} from lagna (${RASHI_HINDI[marsRashiIdx]}), house ${marsHouseFromMoon} from Moon.${marsCancelled ? " Mars is in own/exalted sign — dosha softened." : ""}`,
  };

  // ── Kaal Sarp (all grahas within the Rahu→Ketu arc) ────────────────────────
  const arcFromRahu = (lon: number) => norm360(lon - rahuLon); // 0..360, Ketu at 180
  const sides = positions
    .filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu")
    .map((p) => arcFromRahu(p.lon));
  const allFirstHalf = sides.every((a) => a < 180);
  const allSecondHalf = sides.every((a) => a >= 180);
  const nearAxis = sides.some((a) => a < 5 || Math.abs(a - 180) < 5 || a > 355);
  const kaalSarpStatus: DoshaStatus =
    allFirstHalf || allSecondHalf ? (nearAxis ? "partial" : "yes") : "no";
  const kaalSarp = {
    status: kaalSarpStatus,
    facts:
      kaalSarpStatus === "no"
        ? "Planets occupy both sides of the Rahu–Ketu axis."
        : `All seven grahas lie on one side of the Rahu–Ketu axis${nearAxis ? " (one near the axis boundary)" : ""}.`,
  };

  // ── Sade Sati (current Saturn transit vs natal Moon) ───────────────────────
  const now = new Date();
  const saturnNowRashi = Math.floor(toSidereal(tropicalLongitude(Body.Saturn, now)) / 30);
  // Note: uses birth-time ayanamsa for the current date too — the few arc-minute
  // drift cannot change the rashi except exactly at a boundary.
  const diff = ((saturnNowRashi - moonRashi + 12) % 12);
  const inSadeSati = diff === 11 || diff === 0 || diff === 1;
  const phase = diff === 11 ? "first (rising)" : diff === 0 ? "second (peak)" : "third (setting)";
  const sadeSati = {
    status: (inSadeSati ? "yes" : "no") as DoshaStatus,
    facts: inSadeSati
      ? `Saturn currently transits ${RASHI_HINDI[saturnNowRashi]} — the ${phase} phase of Sade Sati for a ${RASHI_HINDI[moonRashi]} Moon.`
      : `Saturn currently transits ${RASHI_HINDI[saturnNowRashi]}, away from the ${RASHI_HINDI[moonRashi]} Moon — no Sade Sati now.`,
  };

  return {
    planetPositions: positions.map(({ lon: _lon, ...p }) => p),
    keyIndicators,
    houses,
    lagnaRashi,
    moonRashi,
    mangal,
    kaalSarp,
    sadeSati,
  };
}
