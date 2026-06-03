/**
 * Panchang — real astronomical tithi/nakshatra calculation (astronomy-engine).
 *
 * Computes the lunar day (tithi) from the Moon−Sun ecliptic elongation and the
 * Moon's nakshatra from its sidereal longitude (Lahiri ayanamsa, linear
 * approximation — accurate to well under one nakshatra width for decades
 * around 2000). Used to find genuine vivah (wedding) muhurat dates per the
 * Muhurta Chintamani rules, replacing AI-guessed dates.
 *
 * Approximations (documented intentionally):
 * - Each day is evaluated at 12:00 IST; tithi/nakshatra changing mid-day can
 *   shift a boundary by a day. Final muhurat timing should still be confirmed
 *   by a pandit with a local panchang.
 * - Kharmas (Sun in sidereal Dhanu/Meena) is excluded; Chaturmas is not.
 */

import { EclipticGeoMoon, SunPosition } from "astronomy-engine";
import { NAKSHATRAS } from "@/lib/jyotish/nakshatra";
import type { MuhurtDate } from "@/types/compatibility.types";

const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

export interface PanchangDay {
  date: Date;
  /** 0..29 — 0..14 Shukla paksha (14 = Purnima), 15..29 Krishna (29 = Amavasya) */
  tithiIndex: number;
  tithiName: string;
  /** 0..26 (Ashwini = 0) */
  nakshatraIndex: number;
  nakshatraName: string;
  /** Vishti karana — inauspicious window, avoided for muhurat */
  isBhadra: boolean;
  /** Sun in sidereal Dhanu/Meena — Kharmas, no vivah muhurat */
  isKharmas: boolean;
}

/** Lahiri ayanamsa, linear approximation: ≈23.85° at J2000 + 50.3″/year. */
export function lahiriAyanamsa(date: Date): number {
  const years = (date.getTime() - Date.UTC(2000, 0, 1)) / (365.25 * 86400_000);
  return 23.85 + 0.01397 * years;
}

function tithiName(index: number): string {
  const paksha = index < 15 ? "Shukla" : "Krishna";
  const day = index % 15;
  if (index === 14) return "Purnima";
  if (index === 29) return "Amavasya";
  return `${paksha} ${TITHI_NAMES[day]}`;
}

/** Compute the panchang elements for a given instant. */
export function computePanchang(date: Date): PanchangDay {
  const moonLon = EclipticGeoMoon(date).lon;
  const sunLon = SunPosition(date).elon;

  const elongation = (moonLon - sunLon + 360) % 360;
  const tithiIndex = Math.floor(elongation / 12); // 0..29

  // Vishti (Bhadra) karana: half-tithi index 7, 14, …, 56 in the movable cycle.
  const karana = Math.floor(elongation / 6); // 0..59
  const isBhadra = karana >= 7 && karana <= 56 && karana % 7 === 0;

  const ayanamsa = lahiriAyanamsa(date);
  const siderealMoon = (moonLon - ayanamsa + 360) % 360;
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27)); // 0..26

  const siderealSun = (sunLon - ayanamsa + 360) % 360;
  const sunRashi = Math.floor(siderealSun / 30); // 0 Mesha .. 11 Meena
  const isKharmas = sunRashi === 8 || sunRashi === 11; // Dhanu or Meena

  return {
    date,
    tithiIndex,
    tithiName: tithiName(tithiIndex),
    nakshatraIndex,
    nakshatraName: NAKSHATRAS[nakshatraIndex]?.name ?? "",
    isBhadra,
    isKharmas,
  };
}

// ─── Muhurta Chintamani vivah filters ────────────────────────────────────────

/** Auspicious tithis (within either paksha) for vivah per Muhurta Chintamani. */
const VIVAH_TITHIS = new Set([2, 3, 5, 7, 10, 11, 13]);

/** The 11 nakshatras sanctioned for vivah (Muhurta Chintamani, Vivaha Prakarana). */
const VIVAH_NAKSHATRAS = new Set([
  3,  // Rohini
  4,  // Mrigashira
  9,  // Magha
  11, // Uttara Phalguni
  12, // Hasta
  14, // Swati
  16, // Anuradha
  18, // Mula
  20, // Uttara Ashadha
  25, // Uttara Bhadrapada
  26, // Revati
]);

function isVivahDay(p: PanchangDay): boolean {
  const tithiNumber = (p.tithiIndex % 15) + 1; // 1..15 within the paksha
  return (
    VIVAH_TITHIS.has(tithiNumber) &&
    VIVAH_NAKSHATRAS.has(p.nakshatraIndex) &&
    !p.isBhadra &&
    !p.isKharmas
  );
}

/**
 * Scan the next 12 months for genuine vivah muhurat dates (computed, not
 * AI-generated). Returns up to `count` dates spread across the year, each
 * with its real tithi and nakshatra. The `remark` is left empty for the AI
 * narrative layer to fill in.
 */
export function findVivahMuhurats(from: Date = new Date(), count = 6): MuhurtDate[] {
  const matches: PanchangDay[] = [];
  for (let day = 1; day <= 365; day++) {
    // Evaluate at 12:00 IST (06:30 UTC) on each day.
    const d = new Date(from.getTime() + day * 86400_000);
    const noonIst = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 6, 30));
    const p = computePanchang(noonIst);
    if (isVivahDay(p)) matches.push(p);
  }
  if (matches.length === 0) return [];

  // Spread the picks evenly across the year instead of clustering early.
  const picked: PanchangDay[] = [];
  const step = Math.max(1, Math.floor(matches.length / Math.min(count, matches.length)));
  for (let i = 0; i < matches.length && picked.length < count; i += step) {
    picked.push(matches[i]);
  }

  return picked.map((p) => ({
    date: p.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }),
    tithi: p.tithiName,
    nakshatra: p.nakshatraName,
    remark: "",
  }));
}
