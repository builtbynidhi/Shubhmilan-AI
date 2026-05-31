/**
 * Template Theme Definitions
 *
 * Each template is defined by its background image, colour palette and safe area.
 * All images are 1414 × 2000 px (A4 ratio) unless noted.
 *
 * The generic renderer uses these themes to paint biodata data onto the
 * background at exactly the right positions.
 */

import type { TemplateTheme } from "@/lib/genericTemplateRenderer";

// ─── Background image imports ────────────────────────────────────────────────
import brownVintageSrc from "@/assets/templates/Brown Vintage Traditional Page Border Paper Background A4 Document.jpg";
import beigeVintageSrc from "@/assets/templates/Beige Vintage Watercolor Page Border A4 Document.jpg";
import greenFloralSrc from "@/assets/templates/Green Simple Feminine Floral Page Border Document A4.jpg";
import elegantMinimalSrc from "@/assets/templates/Elegant Minimalist A4 Stationery Paper Document.jpg";
import blueRibbonSrc from "@/assets/templates/Blue Beige Cute Simple Ribbon Frame A4 Document.jpg";
import beigeBrownSrc from "@/assets/templates/Beige Brown Trendy Simple Minimalist Border Stationery Paper A4 Document.jpg";
import blackWhiteSrc from "@/assets/templates/Black and White Traditional Elegant Page Border A4 Document .jpg";
import okTemplateSrc from "@/assets/templates/OK.jpg";

// ─── Common dimensions for 1414×2000 templates ──────────────────────────────
const STD_W = 1414;
const STD_H = 2000;

// ─── Theme definitions ──────────────────────────────────────────────────────

/** Brown Vintage Traditional — warm gold/brown ornate border */
export const brownVintageTheme: TemplateTheme = {
  templateSrc: brownVintageSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 105, right: 85, bottom: 90, left: 80 },
  colors: {
    titleText: "#000000",
    subtitleText: "#3B1A00",
    nameText: "#000000",
    labelText: "#000000",
    valueText: "#000000",
    headerText: "#000000",
    divider: "#8B6914",
    photoBorder: "#8B6914",
    photoPlaceholderBg: "#E8D9B0",
    photoPlaceholderFg: "#8B6914",
    pageIndicator: "#8B6914",
  },
  drawSubtitleUnderline: true,
};

/** Beige Vintage Watercolor — soft warm beige with watercolor border accents */
export const beigeVintageTheme: TemplateTheme = {
  templateSrc: beigeVintageSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 425, right: 325, bottom: 425, left: 325 },
  colors: {
    titleText: "#3E2723",
    subtitleText: "#5D4037",
    nameText: "#3E2723",
    labelText: "#5D4037",
    valueText: "#333333",
    headerText: "#4E342E",
    divider: "#A1887F",
    photoBorder: "#8D6E63",
    photoPlaceholderBg: "#EFEBE9",
    photoPlaceholderFg: "#8D6E63",
    pageIndicator: "#8D6E63",
  },
  drawSubtitleUnderline: true,
};

/** Green Floral — feminine with green floral page border */
export const greenFloralTheme: TemplateTheme = {
  templateSrc: greenFloralSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 150, right: 120, bottom: 100, left: 200 },
  colors: {
    titleText: "#1B5E20",
    subtitleText: "#2E7D32",
    nameText: "#1B5E20",
    labelText: "#33691E",
    valueText: "#212121",
    headerText: "#1B5E20",
    divider: "#4CAF50",
    photoBorder: "#388E3C",
    photoPlaceholderBg: "#E8F5E9",
    photoPlaceholderFg: "#388E3C",
    pageIndicator: "#388E3C",
  },
  drawSubtitleUnderline: true,
};

/** Elegant Minimalist — clean modern with thin borders */
export const elegantMinimalTheme: TemplateTheme = {
  templateSrc: elegantMinimalSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 195, right: 195, bottom: 195, left: 195 },
  colors: {
    titleText: "#212121",
    subtitleText: "#616161",
    nameText: "#212121",
    labelText: "#424242",
    valueText: "#333333",
    headerText: "#212121",
    divider: "#9E9E9E",
    photoBorder: "#757575",
    photoPlaceholderBg: "#F5F5F5",
    photoPlaceholderFg: "#757575",
    pageIndicator: "#757575",
  },
  drawSubtitleUnderline: false,
};

/** Blue Beige Ribbon Frame — cute ribbon-style border in blue/beige */
export const blueRibbonTheme: TemplateTheme = {
  templateSrc: blueRibbonSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 260, right: 205, bottom: 255, left: 205 },
  colors: {
    titleText: "#1565C0",
    subtitleText: "#1976D2",
    nameText: "#0D47A1",
    labelText: "#1565C0",
    valueText: "#212121",
    headerText: "#0D47A1",
    divider: "#64B5F6",
    photoBorder: "#1976D2",
    photoPlaceholderBg: "#E3F2FD",
    photoPlaceholderFg: "#1976D2",
    pageIndicator: "#1976D2",
  },
  drawSubtitleUnderline: true,
};

/** Beige Brown Minimalist — trendy clean design with beige/brown tones */
export const beigeBrownTheme: TemplateTheme = {
  templateSrc: beigeBrownSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 200, right: 200, bottom: 195, left: 200 },
  colors: {
    titleText: "#3E2723",
    subtitleText: "#4E342E",
    nameText: "#3E2723",
    labelText: "#5D4037",
    valueText: "#333333",
    headerText: "#3E2723",
    divider: "#A1887F",
    photoBorder: "#795548",
    photoPlaceholderBg: "#EFEBE9",
    photoPlaceholderFg: "#795548",
    pageIndicator: "#795548",
  },
  drawSubtitleUnderline: true,
};

/** Black & White Traditional Elegant — classic B/W ornate border */
export const blackWhiteTheme: TemplateTheme = {
  templateSrc: blackWhiteSrc,
  width: STD_W,
  height: STD_H,
  safe: { top: 145, right: 105, bottom: 125, left: 105 },
  colors: {
    titleText: "#000000",
    subtitleText: "#333333",
    nameText: "#000000",
    labelText: "#1A1A1A",
    valueText: "#333333",
    headerText: "#000000",
    divider: "#555555",
    photoBorder: "#333333",
    photoPlaceholderBg: "#F0F0F0",
    photoPlaceholderFg: "#555555",
    pageIndicator: "#555555",
  },
  drawSubtitleUnderline: true,
};

/** OK — modern clean template (1080×1920) */
export const okTheme: TemplateTheme = {
  templateSrc: okTemplateSrc,
  width: 1080,
  height: 1920,
  safe: { top: 220, right: 190, bottom: 220, left: 190 },
  colors: {
    titleText: "#2C3E50",
    subtitleText: "#7F8C8D",
    nameText: "#2C3E50",
    labelText: "#34495E",
    valueText: "#2C3E50",
    headerText: "#2C3E50",
    divider: "#BDC3C7",
    photoBorder: "#7F8C8D",
    photoPlaceholderBg: "#ECF0F1",
    photoPlaceholderFg: "#7F8C8D",
    pageIndicator: "#7F8C8D",
  },
  fonts: {
    title: "bold 44px 'Georgia', serif",
    subtitle: "22px 'Georgia', serif",
    name: "bold 40px 'Georgia', serif",
    label: "bold 21px Arial, sans-serif",
    value: "21px Arial, sans-serif",
    sectionHeader: "bold 28px 'Georgia', serif",
  },
  drawSubtitleUnderline: false,
};

// ─── Master lookup ───────────────────────────────────────────────────────────
export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  tpl_brown_01:       brownVintageTheme,
  tpl_beige_01:       beigeVintageTheme,
  tpl_green_01:       greenFloralTheme,
  tpl_elegant_01:     elegantMinimalTheme,
  tpl_blue_01:        blueRibbonTheme,
  tpl_beigebrown_01:  beigeBrownTheme,
  tpl_bw_01:          blackWhiteTheme,
  tpl_ok_01:          okTheme,
};
