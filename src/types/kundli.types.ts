export type ChartStyle = "north_indian" | "south_indian";

export type PlanetName =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu";

export type PlanetStatus = "direct" | "retrograde";

export interface PlanetPosition {
  planet: PlanetName;
  symbol: string;
  rashi: string;
  house: number;
  degree: number;
  status: PlanetStatus;
}

export interface KeyIndicators {
  lagna: string;
  lagnaEnglish: string;
  rashi: string;
  rashiEnglish: string;
  nakshatra: string;
  nakshatraPada: number;
  tithi: string;
}

export type DoshaStatus = "yes" | "no" | "partial";

export interface DoshaAnalysis {
  mangalDosha: DoshaStatus;
  mangalExplanation: string;
  kaalSarp: DoshaStatus;
  kaalSarpExplanation: string;
  sadeSati: DoshaStatus;
  sadeSatiExplanation: string;
}

/** Detailed Manglik (Mangal Dosha) analysis derived from the birth chart */
export interface ManglikAnalysis {
  /** yes = fully Manglik, partial = cancellation factors present, no = not Manglik */
  status: DoshaStatus;
  /** House number Mars occupies */
  marsHouse: number;
  /** Zodiac sign Mars is placed in */
  marsRashi: string;
  /** Primary reason for the Manglik status */
  reason: string;
  /** Planetary combinations that cancel or reduce the dosha */
  cancellationFactors: string[];
  /** Vedic remedies if person is Manglik */
  remedies: string[];
  /** Short note on marriage compatibility */
  compatibilityTip: string;
}

export interface KundliData {
  chartStyle: ChartStyle;
  planetPositions: PlanetPosition[];
  keyIndicators: KeyIndicators;
  doshaAnalysis: DoshaAnalysis;
  manglikAnalysis: ManglikAnalysis;
  houses: Record<number, string[]>;
  /** AI interpretation in simple Hindi (Devanagari) */
  explanationHindi?: string;
}

export interface Kundli {
  id: string;
  userId: string;
  subjectName: string;
  birthDate: string;
  birthTime: string | null;
  birthPlace: string;
  latitude: number | null;
  longitude: number | null;
  kundliData: KundliData | null;
  aiExplanation: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export interface CompatibilityResult {
  score: number;
  maxScore: number;
  interpretation: string;
  categories: Array<{
    name: string;
    score: number;
    maxScore: number;
  }>;
}

// Form input shape submitted by the user
export interface KundliFormData {
  subject_name: string;
  birth_date: string;   // YYYY-MM-DD
  birth_time: string | null;
  birth_place: string;
  latitude: number | null;
  longitude: number | null;
  chart_style: ChartStyle;
}
