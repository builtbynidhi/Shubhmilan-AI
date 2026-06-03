/**
 * Deterministic Ashtakoot Guna Milan engine.
 *
 * Pure lookup-table implementation of the classical 36-guna matching used by
 * Jyotish pandits (Narada Samhita tradition; matrices cross-checked against
 * Saravali's published koota tables). No AI involved — given the same two
 * nakshatras the result is always identical. The AI layer only narrates these
 * computed facts.
 *
 * Conventions:
 * - "boy"/"girl" follow the classical vara/kanya direction — several koots
 *   (Varna, Tara, Gana, Vashya) are direction-sensitive.
 * - Yoni matrix rows = boy's yoni, columns = girl's yoni.
 * - Whole-sign approximation for Vashya groups (Sagittarius → Human,
 *   Capricorn → Jalachara); classical texts split these signs by half.
 */

import type { GunaCategory } from "@/types/compatibility.types";
import { NAKSHATRAS, RASHIS, YONI_ANIMALS, type Gana } from "./nakshatra";

export interface AshtakootInput {
  /** 0-based nakshatra index (Ashwini = 0) */
  nakshatra: number;
  /** Optional 0-based rashi override (for pada-boundary nakshatras); defaults to the majority-pada rashi */
  rashi?: number;
}

export interface AshtakootResult {
  categories: GunaCategory[];
  /** Total gunas obtained out of 36 */
  total: number;
  /** True when both partners share the same nadi (a serious dosha) */
  nadiDosha: boolean;
  /** True when the rashi distance falls on a 6-8, 9-5 or 2-12 axis */
  bhakootDosha: boolean;
  /** True when the gana score is 0 or 1 */
  ganaDosha: boolean;
  boy: { nakshatra: string; rashi: string };
  girl: { nakshatra: string; rashi: string };
}

// ─── Varna (max 1) ────────────────────────────────────────────────────────────
// Rashi → varna rank: 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra.
const VARNA_RANK = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // Mesh..Meen

function varnaKoot(boyRashi: number, girlRashi: number): number {
  return VARNA_RANK[boyRashi] >= VARNA_RANK[girlRashi] ? 1 : 0;
}

// ─── Vashya (max 2) ───────────────────────────────────────────────────────────
// Groups: 0 Chatushpada (quadruped), 1 Manava (human), 2 Jalachara (water),
// 3 Vanachara (Leo), 4 Keeta (Scorpio). Whole-sign approximation.
const VASHYA_GROUP = [0, 0, 1, 2, 3, 1, 1, 4, 1, 2, 1, 2]; // Mesh..Meen

// Rows = girl's (kanya) group, columns = boy's (vara) group — per Saravali.
const VASHYA_SCORE: number[][] = [
  [2, 0, 0, 0.5, 0], // girl Chatushpada
  [1, 2, 1, 0.5, 1], // girl Manava
  [0.5, 1, 2, 1, 1], // girl Jalachara
  [0, 0, 0, 2, 0],   // girl Vanachara (Leo)
  [1, 1, 1, 0, 2],   // girl Keeta (Scorpio)
];

function vashyaKoot(boyRashi: number, girlRashi: number): number {
  return VASHYA_SCORE[VASHYA_GROUP[girlRashi]][VASHYA_GROUP[boyRashi]];
}

// ─── Tara (max 3) ─────────────────────────────────────────────────────────────
// Count from one nakshatra to the other (inclusive), mod 9. Taras 3 (Vipat),
// 5 (Pratyari) and 7 (Vadha) are inauspicious. Both directions checked.
function taraIsGood(from: number, to: number): boolean {
  const count = ((to - from + 27) % 27) + 1;
  const tara = count % 9 === 0 ? 9 : count % 9;
  return tara !== 3 && tara !== 5 && tara !== 7;
}

function taraKoot(boyNak: number, girlNak: number): number {
  const good = Number(taraIsGood(girlNak, boyNak)) + Number(taraIsGood(boyNak, girlNak));
  return good === 2 ? 3 : good === 1 ? 1.5 : 0;
}

// ─── Yoni (max 4) ─────────────────────────────────────────────────────────────
// 14×14 animal compatibility matrix (rows = boy, cols = girl). Order matches
// YONI_ANIMALS: Horse, Elephant, Sheep, Serpent, Dog, Cat, Rat, Cow, Buffalo,
// Tiger, Deer, Monkey, Mongoose, Lion.
const YONI_SCORE: number[][] = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], // Horse
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], // Elephant
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1], // Sheep
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], // Serpent
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], // Dog
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1], // Cat
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], // Rat
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], // Cow
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1], // Buffalo
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], // Tiger
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], // Deer
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2], // Monkey
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], // Mongoose
  [1, 0, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 4], // Lion
];

function yoniKoot(boyNak: number, girlNak: number): number {
  return YONI_SCORE[NAKSHATRAS[boyNak].yoni][NAKSHATRAS[girlNak].yoni];
}

// ─── Graha Maitri (max 5) ─────────────────────────────────────────────────────
// Naisargika (natural) planetary friendship per Brihat Parashara Hora Shastra.
// Planets: 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn.
type Relation = "F" | "N" | "E";
const FRIENDSHIP: Relation[][] = [
  // to:  Sun  Moon Mars Merc Jup  Ven  Sat
  ["F", "F", "F", "N", "F", "E", "E"], // Sun
  ["F", "F", "N", "F", "N", "N", "N"], // Moon
  ["F", "F", "F", "E", "F", "N", "N"], // Mars
  ["F", "E", "N", "F", "N", "F", "N"], // Mercury
  ["F", "F", "F", "E", "F", "E", "N"], // Jupiter
  ["E", "E", "N", "F", "N", "F", "F"], // Venus
  ["E", "E", "E", "F", "N", "F", "F"], // Saturn
];

function grahaMaitriKoot(boyRashi: number, girlRashi: number): number {
  const lordB = RASHIS[boyRashi].lord;
  const lordG = RASHIS[girlRashi].lord;
  if (lordB === lordG) return 5;
  const rel1 = FRIENDSHIP[lordB][lordG];
  const rel2 = FRIENDSHIP[lordG][lordB];
  const pair = [rel1, rel2].sort().join(""); // alphabetical: E < F < N
  switch (pair) {
    case "FF": return 5;
    case "FN": return 4;
    case "NN": return 3;
    case "EF": return 1;
    case "EN": return 0.5;
    default:   return 0; // EE
  }
}

// ─── Gana (max 6) ─────────────────────────────────────────────────────────────
// Rows = girl's (kanya) gana, columns = boy's (vara) gana — per Saravali.
const GANA_ORDER: Gana[] = ["Deva", "Manushya", "Rakshasa"];
const GANA_SCORE: number[][] = [
  [6, 6, 0], // girl Deva
  [5, 6, 0], // girl Manushya
  [1, 0, 6], // girl Rakshasa
];

function ganaKoot(boyNak: number, girlNak: number): number {
  const g = GANA_ORDER.indexOf(NAKSHATRAS[girlNak].gana);
  const b = GANA_ORDER.indexOf(NAKSHATRAS[boyNak].gana);
  return GANA_SCORE[g][b];
}

// ─── Bhakoot (max 7) ──────────────────────────────────────────────────────────
// Rashi distance (counted inclusively both ways). The 6-8 (Shadashtak),
// 9-5 (Navam-Pancham) and 2-12 (Dwirdwadash) axes are Bhakoot dosha → 0.
function bhakootKoot(boyRashi: number, girlRashi: number): number {
  const d1 = ((girlRashi - boyRashi + 12) % 12) + 1;
  const d2 = ((boyRashi - girlRashi + 12) % 12) + 1;
  const dosha =
    (d1 === 6 && d2 === 8) || (d1 === 8 && d2 === 6) ||
    (d1 === 9 && d2 === 5) || (d1 === 5 && d2 === 9) ||
    (d1 === 2 && d2 === 12) || (d1 === 12 && d2 === 2);
  return dosha ? 0 : 7;
}

// ─── Nadi (max 8) ─────────────────────────────────────────────────────────────
function nadiKoot(boyNak: number, girlNak: number): number {
  return NAKSHATRAS[boyNak].nadi === NAKSHATRAS[girlNak].nadi ? 0 : 8;
}

// ─── Composition ──────────────────────────────────────────────────────────────

function guna(
  name: string,
  nameHindi: string,
  description: string,
  obtained: number,
  maximum: number,
): GunaCategory {
  return { name, nameHindi, description, obtained, maximum };
}

/**
 * Compute the full 36-guna Ashtakoot score from the partners' nakshatras.
 * The boy/girl direction matters — pass arguments in vara, kanya order.
 */
export function computeAshtakoot(boy: AshtakootInput, girl: AshtakootInput): AshtakootResult {
  const bNak = NAKSHATRAS[boy.nakshatra];
  const gNak = NAKSHATRAS[girl.nakshatra];
  if (!bNak || !gNak) throw new Error("Invalid nakshatra index");

  const bRashi = boy.rashi ?? bNak.rashiIndex;
  const gRashi = girl.rashi ?? gNak.rashiIndex;

  const yoniB = YONI_ANIMALS[bNak.yoni].en;
  const yoniG = YONI_ANIMALS[gNak.yoni].en;

  const categories: GunaCategory[] = [
    guna("Varna", "वर्ण", "Spiritual compatibility and ego balance", varnaKoot(bRashi, gRashi), 1),
    guna("Vashya", "वश्य", "Mutual attraction and influence", vashyaKoot(bRashi, gRashi), 2),
    guna("Tara", "तारा", "Birth-star harmony, health and fortune", taraKoot(boy.nakshatra, girl.nakshatra), 3),
    guna("Yoni", "योनि", `Physical and instinctive compatibility (${yoniB} × ${yoniG})`, yoniKoot(boy.nakshatra, girl.nakshatra), 4),
    guna("Graha Maitri", "ग्रह मैत्री", "Friendship of the moon-sign lords; mental match", grahaMaitriKoot(bRashi, gRashi), 5),
    guna("Gana", "गण", `Temperament match (${bNak.gana} × ${gNak.gana})`, ganaKoot(boy.nakshatra, girl.nakshatra), 6),
    guna("Bhakoot", "भकूट", "Rashi axis — love, family and prosperity", bhakootKoot(bRashi, gRashi), 7),
    guna("Nadi", "नाड़ी", `Health and progeny (${bNak.nadi} × ${gNak.nadi} nadi)`, nadiKoot(boy.nakshatra, girl.nakshatra), 8),
  ];

  const total = categories.reduce((acc, c) => acc + c.obtained, 0);

  return {
    categories,
    total,
    nadiDosha: bNak.nadi === gNak.nadi,
    bhakootDosha: bhakootKoot(bRashi, gRashi) === 0,
    ganaDosha: ganaKoot(boy.nakshatra, girl.nakshatra) <= 1,
    boy: { nakshatra: bNak.name, rashi: RASHIS[bRashi].name },
    girl: { nakshatra: gNak.name, rashi: RASHIS[gRashi].name },
  };
}
