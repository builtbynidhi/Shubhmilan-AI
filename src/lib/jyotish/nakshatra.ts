/**
 * Jyotish reference data — the 27 nakshatras and 12 rashis.
 *
 * Classical attribute tables used by the deterministic Ashtakoot engine
 * (see ashtakoot.ts). Sources: standard Guna Milan tables as published in
 * classical compilations (Narada Samhita tradition; cross-checked against
 * Saravali's koota tables).
 *
 * NOTE on rashi mapping: a few nakshatras span two rashis (the rashi depends
 * on the pada). `rashiIndex` holds the majority-pada rashi (ties resolve to
 * the earlier sign). The UI lets the user correct the rashi if their pada
 * falls in the other sign.
 */

export type Gana = "Deva" | "Manushya" | "Rakshasa";
export type Nadi = "Aadi" | "Madhya" | "Antya";

/** The 14 yoni animals, indexed for the compatibility matrix in ashtakoot.ts. */
export const YONI_ANIMALS = [
  { en: "Horse", hi: "अश्व" },
  { en: "Elephant", hi: "गज" },
  { en: "Sheep", hi: "मेष" },
  { en: "Serpent", hi: "सर्प" },
  { en: "Dog", hi: "श्वान" },
  { en: "Cat", hi: "मार्जार" },
  { en: "Rat", hi: "मूषक" },
  { en: "Cow", hi: "गौ" },
  { en: "Buffalo", hi: "महिष" },
  { en: "Tiger", hi: "व्याघ्र" },
  { en: "Deer", hi: "मृग" },
  { en: "Monkey", hi: "वानर" },
  { en: "Mongoose", hi: "नकुल" },
  { en: "Lion", hi: "सिंह" },
] as const;

export interface Nakshatra {
  /** 0-based position, Ashwini = 0 */
  index: number;
  name: string;
  nameHi: string;
  /** Majority-pada moon sign (0 = Mesh … 11 = Meen) */
  rashiIndex: number;
  /** Index into YONI_ANIMALS */
  yoni: number;
  yoniGender: "m" | "f";
  gana: Gana;
  nadi: Nadi;
}

export const NAKSHATRAS: Nakshatra[] = [
  { index: 0,  name: "Ashwini",           nameHi: "अश्विनी",          rashiIndex: 0,  yoni: 0,  yoniGender: "m", gana: "Deva",     nadi: "Aadi" },
  { index: 1,  name: "Bharani",           nameHi: "भरणी",            rashiIndex: 0,  yoni: 1,  yoniGender: "m", gana: "Manushya", nadi: "Madhya" },
  { index: 2,  name: "Krittika",          nameHi: "कृत्तिका",          rashiIndex: 1,  yoni: 2,  yoniGender: "f", gana: "Rakshasa", nadi: "Antya" },
  { index: 3,  name: "Rohini",            nameHi: "रोहिणी",           rashiIndex: 1,  yoni: 3,  yoniGender: "m", gana: "Manushya", nadi: "Antya" },
  { index: 4,  name: "Mrigashira",        nameHi: "मृगशिरा",          rashiIndex: 1,  yoni: 3,  yoniGender: "f", gana: "Deva",     nadi: "Madhya" },
  { index: 5,  name: "Ardra",             nameHi: "आर्द्रा",           rashiIndex: 2,  yoni: 4,  yoniGender: "f", gana: "Manushya", nadi: "Aadi" },
  { index: 6,  name: "Punarvasu",         nameHi: "पुनर्वसु",          rashiIndex: 2,  yoni: 5,  yoniGender: "f", gana: "Deva",     nadi: "Aadi" },
  { index: 7,  name: "Pushya",            nameHi: "पुष्य",            rashiIndex: 3,  yoni: 2,  yoniGender: "m", gana: "Deva",     nadi: "Madhya" },
  { index: 8,  name: "Ashlesha",          nameHi: "आश्लेषा",          rashiIndex: 3,  yoni: 5,  yoniGender: "m", gana: "Rakshasa", nadi: "Antya" },
  { index: 9,  name: "Magha",             nameHi: "मघा",             rashiIndex: 4,  yoni: 6,  yoniGender: "m", gana: "Rakshasa", nadi: "Antya" },
  { index: 10, name: "Purva Phalguni",    nameHi: "पूर्वा फाल्गुनी",     rashiIndex: 4,  yoni: 6,  yoniGender: "f", gana: "Manushya", nadi: "Madhya" },
  { index: 11, name: "Uttara Phalguni",   nameHi: "उत्तरा फाल्गुनी",    rashiIndex: 5,  yoni: 7,  yoniGender: "m", gana: "Manushya", nadi: "Aadi" },
  { index: 12, name: "Hasta",             nameHi: "हस्त",            rashiIndex: 5,  yoni: 8,  yoniGender: "f", gana: "Deva",     nadi: "Aadi" },
  { index: 13, name: "Chitra",            nameHi: "चित्रा",           rashiIndex: 5,  yoni: 9,  yoniGender: "f", gana: "Rakshasa", nadi: "Madhya" },
  { index: 14, name: "Swati",             nameHi: "स्वाति",           rashiIndex: 6,  yoni: 8,  yoniGender: "m", gana: "Deva",     nadi: "Antya" },
  { index: 15, name: "Vishakha",          nameHi: "विशाखा",          rashiIndex: 6,  yoni: 9,  yoniGender: "m", gana: "Rakshasa", nadi: "Antya" },
  { index: 16, name: "Anuradha",          nameHi: "अनुराधा",          rashiIndex: 7,  yoni: 10, yoniGender: "f", gana: "Deva",     nadi: "Madhya" },
  { index: 17, name: "Jyeshtha",          nameHi: "ज्येष्ठा",          rashiIndex: 7,  yoni: 10, yoniGender: "m", gana: "Rakshasa", nadi: "Aadi" },
  { index: 18, name: "Mula",              nameHi: "मूल",             rashiIndex: 8,  yoni: 4,  yoniGender: "m", gana: "Rakshasa", nadi: "Aadi" },
  { index: 19, name: "Purva Ashadha",     nameHi: "पूर्वाषाढ़ा",        rashiIndex: 8,  yoni: 11, yoniGender: "m", gana: "Manushya", nadi: "Madhya" },
  { index: 20, name: "Uttara Ashadha",    nameHi: "उत्तराषाढ़ा",       rashiIndex: 9,  yoni: 12, yoniGender: "m", gana: "Manushya", nadi: "Antya" },
  { index: 21, name: "Shravana",          nameHi: "श्रवण",           rashiIndex: 9,  yoni: 11, yoniGender: "f", gana: "Deva",     nadi: "Antya" },
  { index: 22, name: "Dhanishta",         nameHi: "धनिष्ठा",          rashiIndex: 9,  yoni: 13, yoniGender: "f", gana: "Rakshasa", nadi: "Madhya" },
  { index: 23, name: "Shatabhisha",       nameHi: "शतभिषा",          rashiIndex: 10, yoni: 0,  yoniGender: "f", gana: "Rakshasa", nadi: "Aadi" },
  { index: 24, name: "Purva Bhadrapada",  nameHi: "पूर्व भाद्रपद",      rashiIndex: 10, yoni: 13, yoniGender: "m", gana: "Manushya", nadi: "Aadi" },
  { index: 25, name: "Uttara Bhadrapada", nameHi: "उत्तर भाद्रपद",     rashiIndex: 11, yoni: 7,  yoniGender: "f", gana: "Manushya", nadi: "Madhya" },
  { index: 26, name: "Revati",            nameHi: "रेवती",            rashiIndex: 11, yoni: 1,  yoniGender: "f", gana: "Deva",     nadi: "Antya" },
];

/** Rashi lords as planet indices: 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn */
export interface Rashi {
  index: number;
  name: string;     // "Mesh (Aries)" — matches the values used by the UI selects
  hindi: string;
  english: string;
  lord: number;
}

export const RASHIS: Rashi[] = [
  { index: 0,  name: "Mesh (Aries)",        hindi: "मेष",     english: "Aries",       lord: 2 },
  { index: 1,  name: "Vrishabh (Taurus)",   hindi: "वृषभ",    english: "Taurus",      lord: 5 },
  { index: 2,  name: "Mithun (Gemini)",     hindi: "मिथुन",   english: "Gemini",      lord: 3 },
  { index: 3,  name: "Kark (Cancer)",       hindi: "कर्क",     english: "Cancer",      lord: 1 },
  { index: 4,  name: "Simha (Leo)",         hindi: "सिंह",     english: "Leo",         lord: 0 },
  { index: 5,  name: "Kanya (Virgo)",       hindi: "कन्या",    english: "Virgo",       lord: 3 },
  { index: 6,  name: "Tula (Libra)",        hindi: "तुला",     english: "Libra",       lord: 5 },
  { index: 7,  name: "Vrishchik (Scorpio)", hindi: "वृश्चिक",   english: "Scorpio",     lord: 2 },
  { index: 8,  name: "Dhanu (Sagittarius)", hindi: "धनु",     english: "Sagittarius", lord: 4 },
  { index: 9,  name: "Makar (Capricorn)",   hindi: "मकर",     english: "Capricorn",   lord: 6 },
  { index: 10, name: "Kumbh (Aquarius)",    hindi: "कुम्भ",    english: "Aquarius",    lord: 6 },
  { index: 11, name: "Meen (Pisces)",       hindi: "मीन",     english: "Pisces",      lord: 4 },
];

/** Look up a nakshatra by its display name ("Ashwini" etc.). */
export function nakshatraIndexByName(name: string): number {
  const target = name.trim().toLowerCase();
  return NAKSHATRAS.findIndex((n) => n.name.toLowerCase() === target);
}

/** Look up a rashi index from the UI value (e.g. "Mesh (Aries)"). */
export function rashiIndexByName(name: string): number {
  const target = name.trim().toLowerCase();
  return RASHIS.findIndex(
    (r) => r.name.toLowerCase() === target || r.english.toLowerCase() === target,
  );
}
