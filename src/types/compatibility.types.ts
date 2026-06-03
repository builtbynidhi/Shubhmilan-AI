/** Ashtakoot Guna Milan — 8 categories totalling 36 Gunas */

export interface GunaCategory {
  name: string;
  nameHindi: string;
  description: string;
  obtained: number;
  maximum: number;
}

export interface MuhurtDate {
  date: string;       // e.g. "15 April 2026"
  tithi: string;       // e.g. "Akshaya Tritiya"
  nakshatra: string;
  remark: string;      // e.g. "Highly auspicious" or "Good for vivah"
}

export interface CompatibilityResult {
  /** Total gunas obtained out of 36 */
  totalScore: number;
  maxScore: 36;
  /** Percentage score 0-100 */
  percentage: number;
  /** "Excellent" | "Very Good" | "Good" | "Average" | "Not Recommended" */
  verdict: string;
  verdictHindi: string;
  /** Detailed category-wise breakdown */
  categories: GunaCategory[];
  /** Overall analysis paragraph */
  analysis: string;
  analysisHindi: string;
  /** Whether marriage is recommended */
  marriageRecommended: boolean;
  /** Suggested dates if recommended */
  auspiciousDates: MuhurtDate[];
  /** Mangal dosha compatibility note */
  mangalNote: string;
  /** Remedies / suggestions if score is low */
  remedies: string[];
  /** True when the narrative was grounded in the classical knowledge base */
  grounded?: boolean;
  /** Source attributions of the retrieved knowledge chunks */
  sources?: string[];
}

export interface PartnerDetails {
  fullName: string;
  /** Birth nakshatra e.g. "Rohini" — primary input for Ashtakoot */
  nakshatra: string;
  rashi: string;        // Moon sign e.g. "Mesh" / "Aries"
}
