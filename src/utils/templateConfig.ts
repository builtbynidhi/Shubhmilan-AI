import type { Template, TemplateTier } from "@/types/biodata.types";

export const BASE_PDF_FEE = 30;

export const tierPricing: Record<TemplateTier, number> = {
  free: 0,
  standard: 10,
  premium: 20,
  luxury: 30,
};

export function calculateTotal(tier: TemplateTier): number {
  return BASE_PDF_FEE + tierPricing[tier];
}

export const tierLabels: Record<TemplateTier, string> = {
  free: "FREE",
  standard: "₹10",
  premium: "₹20",
  luxury: "₹30",
};

export const tierColors: Record<TemplateTier, string> = {
  free: "bg-success/20 text-success",
  standard: "bg-blue-500/20 text-blue-400",
  premium: "bg-accent/20 text-accent",
  luxury: "bg-amber-400/20 text-amber-300",
};

export const defaultTemplates: Template[] = [
  {
    id: "tpl_brown_01",
    name: "Brown Vintage Classic",
    category: "hindu",
    tier: "free",
    priceInr: 0,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_beige_01",
    name: "Beige Vintage Watercolor",
    category: "hindu",
    tier: "free",
    priceInr: 0,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_green_01",
    name: "Green Floral Feminine",
    category: "hindu",
    tier: "free",
    priceInr: 0,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_elegant_01",
    name: "Elegant Minimalist",
    category: "modern",
    tier: "standard",
    priceInr: 10,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_blue_01",
    name: "Blue Ribbon Frame",
    category: "modern",
    tier: "standard",
    priceInr: 10,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_beigebrown_01",
    name: "Beige Brown Minimalist",
    category: "modern",
    tier: "standard",
    priceInr: 10,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_bw_01",
    name: "Black & White Elegant",
    category: "modern",
    tier: "premium",
    priceInr: 20,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_ok_01",
    name: "Modern Clean",
    category: "modern",
    tier: "premium",
    priceInr: 20,
    previewImageUrl: null,
    thumbnailUrl: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];
