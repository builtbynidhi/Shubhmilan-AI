/**
 * Server-authoritative pricing. Mirrors src/utils/templateConfig.ts — keep in
 * sync if template tiers/prices change there. The client total is display-only;
 * this is the source of truth for the charged amount.
 */

export const BASE_PDF_FEE = 30;

const TIER_PRICING: Record<string, number> = {
  free: 0,
  standard: 10,
  premium: 20,
  luxury: 30,
};

// templateId → tier (from defaultTemplates in src/utils/templateConfig.ts).
const TEMPLATE_TIER: Record<string, keyof typeof TIER_PRICING> = {
  tpl_brown_01: "free",
  tpl_beige_01: "free",
  tpl_green_01: "free",
  tpl_elegant_01: "standard",
  tpl_blue_01: "standard",
  tpl_beigebrown_01: "standard",
  tpl_bw_01: "premium",
  tpl_ok_01: "premium",
};

export function pdfPricing(templateId: string): {
  tier: string;
  templatePriceInr: number;
  baseFeeInr: number;
  totalInr: number;
} {
  const tier = TEMPLATE_TIER[templateId] ?? "free";
  const templatePriceInr = TIER_PRICING[tier];
  return {
    tier,
    templatePriceInr,
    baseFeeInr: BASE_PDF_FEE,
    totalInr: BASE_PDF_FEE + templatePriceInr,
  };
}

// Kundli generation fee (INR). Override via KUNDLI_FEE_INR env if needed.
export const KUNDLI_FEE_INR = Number(process.env.KUNDLI_FEE_INR ?? 51);
