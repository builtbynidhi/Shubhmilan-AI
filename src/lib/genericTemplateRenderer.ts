/**
 * Generic Template Canvas Renderer — Multi-page
 *
 * A configurable renderer that can render biodata onto ANY template background.
 * Each template provides a TemplateTheme config (colors, fonts, safe area, etc.)
 * and this module does all the heavy-lifting of laying out sections, wrapping
 * text, paginating, drawing photos, etc.
 *
 * ─── Based on the proven Brown Vintage renderer logic ───
 */

import type { BiodataFormData } from "@/types/biodata.types";

// ─── Theme type ──────────────────────────────────────────────────────────────
export interface TemplateTheme {
  /** Vite-imported image source (import … from "@/assets/…") */
  templateSrc: string;
  /** Canvas pixel dimensions — must match the background image */
  width: number;
  height: number;
  /** Safe content area (px inset from edges) */
  safe: { top: number; right: number; bottom: number; left: number };
  /** Colours */
  colors: {
    titleText: string;
    subtitleText: string;
    nameText: string;
    labelText: string;
    valueText: string;
    headerText: string;
    divider: string;
    photoBorder: string;
    photoPlaceholderBg: string;
    photoPlaceholderFg: string;
    pageIndicator: string;
  };
  /** Font overrides (optional — sensible defaults are provided) */
  fonts?: Partial<{
    title: string;
    subtitle: string;
    name: string;
    label: string;
    value: string;
    sectionHeader: string;
  }>;
  /** Greeting text override per community (optional) */
  greetingOverride?: (community: string) => string;
  /** Whether to draw a decorative underline below the subtitle */
  drawSubtitleUnderline?: boolean;
}

// ─── Default fonts ───────────────────────────────────────────────────────────
const DEFAULT_FONTS = {
  title: "bold 60px 'Georgia', serif",
  subtitle: "32px 'Georgia', serif",
  name: "bold 56px 'Georgia', serif",
  label: "bold 30px Arial, sans-serif",
  value: "30px Arial, sans-serif",
  sectionHeader: "bold 38px 'Georgia', serif",
};

// ─── Community greetings ─────────────────────────────────────────────────────
function defaultGreeting(community: string): string {
  switch (community) {
    case "muslim":    return "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    case "christian": return "✝ In God We Trust";
    case "sikh":      return "ੴ ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ";
    case "jain":      return "णमो अरिहंताणं";
    case "buddhist":  return "बुद्धं शरणं गच्छामि";
    default:          return "ॐ श्री गणेशाय नमः";
  }
}

// ─── Image loaders ───────────────────────────────────────────────────────────
const _imageCache = new Map<string, HTMLImageElement>();

async function loadImage(src: string, cache = true): Promise<HTMLImageElement> {
  if (cache && _imageCache.has(src)) return _imageCache.get(src)!;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (cache) _imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

// ─── HELPER: wrap text into lines that fit within maxW ───────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else if (ctx.measureText(word).width > maxW) {
      // single word wider than maxW — split by characters
      if (line) { lines.push(line); line = ""; }
      let chars = "";
      for (const ch of word) {
        if (ctx.measureText(chars + ch).width > maxW) {
          if (chars) lines.push(chars);
          chars = ch;
        } else { chars += ch; }
      }
      line = chars;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// ─── HELPER: draw label + wrapped value; returns total height consumed ────────
function drawLabelValue(
  ctx: CanvasRenderingContext2D,
  label: string, value: string,
  lx: number, vx: number, y: number,
  lf: string, lc: string, vf: string, vc: string,
  maxValueW: number,
  lineH: number,
): number {
  // Returns height used (lineH × lines drawn)
  if (!value) return 0;
  ctx.font = lf; ctx.fillStyle = lc; ctx.textAlign = "left";
  ctx.fillText(`${label}:`, lx, y);          // label — never squish
  ctx.font = vf; ctx.fillStyle = vc;
  const lines = wrapText(ctx, value, Math.max(60, maxValueW));
  lines.forEach((ln, i) => ctx.fillText(ln, vx, y + i * lineH));
  return lines.length * lineH;
}

// ─── Format helpers ──────────────────────────────────────────────────────────
function fmt(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function fmtEnum(val: string): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MULTI-PAGE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
export async function renderGenericToCanvasPages(
  data: BiodataFormData,
  theme: TemplateTheme,
  opts: { calibrate?: boolean } = {},
): Promise<HTMLCanvasElement[]> {
  const W = theme.width;
  const H = theme.height;
  const S_L = theme.safe.left;
  const S_R = W - theme.safe.right;
  const S_T = theme.safe.top;
  const S_B = H - theme.safe.bottom;
  const CX = W / 2;
  const C = theme.colors;
  const getGreeting = theme.greetingOverride ?? defaultGreeting;

  // Ensure web fonts (incl. Noto Sans Devanagari) are ready before drawing to canvas
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }

  const tplImg = await loadImage(theme.templateSrc);

  // ── Computed layout ────────────────────────────────────────────────────────
  const contentW = S_R - S_L;

  // Font scale: fonts are designed for a 1134px content area (1414px canvas @ 140px margins)
  // Scale down proportionally when content area is narrower; never scale up beyond 1×
  const REF_CONTENT_W = 1134;
  const fontScale = Math.min(1.0, contentW / REF_CONTENT_W);
  const fs = (px: number) => Math.max(14, Math.round(px * fontScale));

  // Scaled font set (theme fonts take priority but also get scaled if not overridden)
  const F_BASE = { ...DEFAULT_FONTS, ...theme.fonts };
  const F = theme.fonts ? F_BASE : {
    title:         `bold ${fs(60)}px 'Georgia', serif`,
    subtitle:      `${fs(32)}px 'Georgia', serif`,
    name:          `bold ${fs(56)}px 'Georgia', serif`,
    label:         `bold ${fs(30)}px Arial, sans-serif`,
    value:         `${fs(30)}px Arial, sans-serif`,
    sectionHeader: `bold ${fs(38)}px 'Georgia', serif`,
  };

  // Ensure every font string carries a Devanagari fallback so Hindi glyphs shape
  // correctly on canvas (covers DEFAULT_FONTS, the scaled set, AND theme overrides).
  const withDeva = (f: string) =>
    f.includes("Noto Sans Devanagari")
      ? f
      : f.replace(/(serif|sans-serif)\s*$/i, (m) => `'Noto Sans Devanagari', ${m}`);
  const FF = {
    title: withDeva(F.title),
    subtitle: withDeva(F.subtitle),
    name: withDeva(F.name),
    label: withDeva(F.label),
    value: withDeva(F.value),
    sectionHeader: withDeva(F.sectionHeader),
  };

  // Scaled spacing constants
  const ROW_H     = Math.round(62 * fontScale);
  const PRIM_LBL  = Math.round(270 * fontScale);   // wide enough for "Marital Status:"
  const PRIM_LBL2 = Math.round(300 * fontScale);   // wide enough for "Mother Tongue:"

  // Photo box (top-right) — 28% of content width for a more prominent portrait
  const photoW = Math.round(contentW * 0.28);
  const photoH = Math.round(photoW * 1.3);
  const photoX = S_R - photoW;
  const photoY = S_T + Math.round(130 * fontScale);

  // Name & primary rows (left side, beside photo)
  const nameX = S_L;
  const nameY = S_T + Math.round(220 * fontScale);
  const nameMaxW = photoX - S_L - 40;

  const primStartX = S_L;
  const primStartY = S_T + Math.round(286 * fontScale);
  const primRowH = ROW_H;
  // Horizontal space available to the left of the photo
  const primAvailW = photoX - S_L - 16;
  // Split into two equal halves; col2 starts at the midpoint
  const primHalfW   = Math.floor(primAvailW / 2);
  const primCol2X   = S_L + primHalfW;
  const primLabelW  = PRIM_LBL;
  // Col2 label width: adaptive — fills at most 55% of half-width
  const primCol2LW  = Math.min(PRIM_LBL2, Math.round(primHalfW * 0.55));
  // Only render 2 columns when each half has room for a label + at least 50px of value
  const primCol2Fits = primHalfW > primLabelW + 50 && primHalfW > primCol2LW + 50;
  // Col1 values stop before col2 (or photo if single-column)
  const primValMaxW    = Math.max(60, (primCol2Fits ? primHalfW : primAvailW) - primLabelW - 10);
  // Col2 values stop before the photo
  const primCol2ValMaxW = Math.max(40, primHalfW - primCol2LW - 10);

  // Section layout — fully proportional to the safe-area content width
  const secMinFirstY = Math.max(Math.round(700 * fontScale), photoY + photoH + 30);
  const secRowH = ROW_H;
  const secCol1Label = S_L;
  // 36% of content width covers "College / University:" at the bigger font size
  const secLabelW = Math.min(Math.round(400 * fontScale), Math.round(contentW * 0.36));
  const secCol1Value = S_L + secLabelW;
  const colGap = 24;
  const col1W = Math.floor((contentW - colGap) / 2);
  const secCol2Label = S_L + col1W + colGap;
  const secCol2LabelW = Math.min(Math.round(360 * fontScale), Math.round(col1W * 0.46));
  const secCol2Value = secCol2Label + secCol2LabelW;
  const secGap = 22;
  const secAfterGap = 34;
  const col1ValueMaxW = Math.max(60, secCol2Label - secCol1Value - 10);
  const col2ValueMaxW = Math.max(60, S_R - secCol2Value - 10);

  // ── Pagination state ───────────────────────────────────────────────────────
  const pages: HTMLCanvasElement[] = [];
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let sy = secMinFirstY;

  function newPage(): void {
    if (pages.length >= 15) return;   // hard cap — prevents runaway loops
    canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext("2d")!;
    ctx.drawImage(tplImg, 0, 0, W, H);
    pages.push(canvas);

    if (pages.length > 1) {
      ctx.font = `${fs(20)}px 'Noto Sans Devanagari', 'Georgia', serif`;
      ctx.fillStyle = C.pageIndicator;
      ctx.textAlign = "center";
      ctx.fillText(`— Page ${pages.length} —`, CX, S_T + 26);
      sy = S_T + 70;
    }
  }

  function checkBreak(need: number = 50): void {
    if (sy + need > S_B) newPage();
  }

  // ─── Page 1 ────────────────────────────────────────────────────────────────
  newPage();

  // Title
  ctx!.font = FF.title; ctx!.fillStyle = C.titleText; ctx!.textAlign = "center";
  ctx!.fillText("Marriage Biodata", CX, S_T + fs(52));

  // Subtitle (community greeting)
  ctx!.font = FF.subtitle; ctx!.fillStyle = C.subtitleText; ctx!.textAlign = "center";
  ctx!.fillText(getGreeting(data.personal.community), CX, S_T + fs(110));

  // Optional decorative underline
  if (theme.drawSubtitleUnderline !== false) {
    const ulY = S_T + fs(130);
    const ulHalf = Math.round(240 * fontScale);
    ctx!.beginPath();
    ctx!.moveTo(CX - ulHalf, ulY);
    ctx!.lineTo(CX + ulHalf, ulY);
    ctx!.strokeStyle = C.divider;
    ctx!.lineWidth = 1.8;
    ctx!.stroke();
  }

  // Photo placeholder border
  ctx!.strokeStyle = C.photoBorder;
  ctx!.lineWidth = 2.5;
  ctx!.strokeRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6);

  // Photo image
  if (data.personal.photoUrl) {
    try {
      const pImg = await loadImage(data.personal.photoUrl, false);
      ctx!.save();
      const r = 4;
      ctx!.beginPath();
      ctx!.moveTo(photoX + r, photoY);
      ctx!.lineTo(photoX + photoW - r, photoY); ctx!.arcTo(photoX + photoW, photoY, photoX + photoW, photoY + r, r);
      ctx!.lineTo(photoX + photoW, photoY + photoH - r); ctx!.arcTo(photoX + photoW, photoY + photoH, photoX + photoW - r, photoY + photoH, r);
      ctx!.lineTo(photoX + r, photoY + photoH); ctx!.arcTo(photoX, photoY + photoH, photoX, photoY + photoH - r, r);
      ctx!.lineTo(photoX, photoY + r); ctx!.arcTo(photoX, photoY, photoX + r, photoY, r);
      ctx!.closePath(); ctx!.clip();
      const scale = Math.max(photoW / pImg.width, photoH / pImg.height);
      const sw = pImg.width * scale, sh = pImg.height * scale;
      ctx!.drawImage(pImg, photoX + (photoW - sw) / 2, photoY + (photoH - sh) / 2, sw, sh);
      ctx!.restore();
    } catch { /* ignore */ }
  } else {
    ctx!.fillStyle = C.photoPlaceholderBg;
    ctx!.fillRect(photoX, photoY, photoW, photoH);
    ctx!.font = "bold 18px 'Noto Sans Devanagari', Arial, sans-serif";
    ctx!.fillStyle = C.photoPlaceholderFg;
    ctx!.textAlign = "center";
    ctx!.fillText("Photo", photoX + photoW / 2, photoY + photoH / 2);
  }

  // Candidate name — centered in the left text zone (between safe left and photo)
  const nameCenterX = Math.round((S_L + photoX - 20) / 2);
  ctx!.font = FF.name; ctx!.fillStyle = C.nameText; ctx!.textAlign = "center";
  ctx!.fillText(data.personal.fullName || "—", nameCenterX, nameY, nameMaxW);

  // Primary rows (beside photo)
  type PRow = [string, string, string, string];
  const primaryRows: PRow[] = [
    ["Date of Birth", fmt(data.personal.dateOfBirth), "Age", data.personal.age ? `${data.personal.age} Years` : ""],
    ["Height", data.personal.height, "Blood Group", data.personal.bloodGroup],
    ["Complexion", data.personal.complexion, "Mother Tongue", data.personal.motherTongue],
    ["Gotra", data.personal.gotra ?? "", "Caste", data.personal.caste ?? ""],
    ["Marital Status", fmtEnum(data.personal.maritalStatus), "Manglik", fmtEnum(data.personal.manglik ?? "")],
  ];

  let py = primStartY;
  for (const [l1, v1, l2, v2] of primaryRows) {
    if (!v1 && !v2) continue;
    let rowH = primRowH;
    if (v1) {
      // Draw col1 — wrap to next lines, never squish
      const h1 = drawLabelValue(ctx!, l1, v1, primStartX, primStartX + primLabelW, py,
        FF.label, C.labelText, FF.value, C.valueText, primValMaxW, primRowH);
      rowH = Math.max(rowH, h1);
    }
    if (v2 && primCol2Fits) {
      const h2 = drawLabelValue(ctx!, l2, v2, primCol2X, primCol2X + primCol2LW, py,
        FF.label, C.labelText, FF.value, C.valueText, primCol2ValMaxW, primRowH);
      rowH = Math.max(rowH, h2);
    } else if (v2 && !primCol2Fits) {
      // Stack below col1 on its own line
      py += rowH;
      rowH = primRowH;
      const h2 = drawLabelValue(ctx!, l2, v2, primStartX, primStartX + primLabelW, py,
        FF.label, C.labelText, FF.value, C.valueText, primValMaxW, primRowH);
      rowH = Math.max(rowH, h2);
    }
    py += rowH;
  }

  // Personal extra fields
  if (data.personal.extraFields?.length) {
    for (const ef of data.personal.extraFields) {
      if (!ef.label || !ef.value) continue;
      const h = drawLabelValue(ctx!, ef.label, ef.value, primStartX, primStartX + primLabelW, py,
        FF.label, C.labelText, FF.value, C.valueText, primValMaxW, primRowH);
      py += Math.max(primRowH, h);
    }
  }

  // Ensure sections start below primary rows and photo
  sy = Math.max(secMinFirstY, py + 24, photoY + photoH + 30);

  // ── Section drawing helpers ────────────────────────────────────────────────
  function drawDivider(y: number) {
    ctx!.beginPath();
    ctx!.moveTo(S_L, y);
    ctx!.lineTo(S_R, y);
    ctx!.strokeStyle = C.divider;
    ctx!.lineWidth = 1.4;
    ctx!.stroke();
  }

  type SRow =
    | { type: "row"; label: string; value: string }
    | { type: "row2"; l1: string; v1: string; l2: string; v2: string }
    | { type: "multiline"; label: string; value: string };

  function drawSection(header: string, rows: SRow[]): void {
    checkBreak(secGap + 40 + secRowH);
    drawDivider(sy - 12);

    ctx!.font = FF.sectionHeader; ctx!.fillStyle = C.headerText; ctx!.textAlign = "center";
    ctx!.fillText(header, CX, sy + 24);
    sy += secGap + 40;

    for (const row of rows) {
      if (row.type === "row" && row.value) {
        checkBreak(secRowH);
        const h = drawLabelValue(ctx!, row.label, row.value,
          secCol1Label, secCol1Value, sy,
          FF.label, C.labelText, FF.value, C.valueText,
          S_R - secCol1Value - 10, secRowH);
        sy += Math.max(secRowH, h);

      } else if (row.type === "row2" && (row.v1 || row.v2)) {
        checkBreak(secRowH);
        // Both columns drawn at same y; advance by whichever wraps more
        const h1 = row.v1
          ? drawLabelValue(ctx!, row.l1, row.v1, secCol1Label, secCol1Value, sy,
              FF.label, C.labelText, FF.value, C.valueText, col1ValueMaxW, secRowH)
          : 0;
        const h2 = row.v2
          ? drawLabelValue(ctx!, row.l2, row.v2, secCol2Label, secCol2Value, sy,
              FF.label, C.labelText, FF.value, C.valueText, col2ValueMaxW, secRowH)
          : 0;
        sy += Math.max(secRowH, h1, h2);

      } else if (row.type === "multiline" && row.value) {
        const mlLineH = secRowH;
        checkBreak(mlLineH * 2);
        ctx!.font = FF.label; ctx!.fillStyle = C.labelText; ctx!.textAlign = "left";
        ctx!.fillText(`${row.label}:`, secCol1Label, sy);
        sy += mlLineH;
        ctx!.font = FF.value; ctx!.fillStyle = C.valueText;
        const lines = wrapText(ctx!, row.value, S_R - secCol1Label - 20);
        for (const ln of lines) {
          checkBreak(mlLineH);
          ctx!.font = FF.value; ctx!.fillStyle = C.valueText; ctx!.textAlign = "left";
          ctx!.fillText(ln, secCol1Label + 14, sy);
          sy += mlLineH;
        }
        sy += 6;
      }
    }
    sy += secAfterGap;
  }

  // ── Education & Career ─────────────────────────────────────────────────────
  const edu = data.career;
  const eduRows: SRow[] = [
    { type: "row2", l1: "Education", v1: edu.highestEducation, l2: "Field", v2: edu.fieldOfStudy },
    { type: "row", label: "College / University", value: edu.college },
    { type: "row2", l1: "Occupation", v1: fmtEnum(edu.employmentType), l2: "Designation", v2: edu.jobTitle },
    { type: "row", label: "Company / Business", value: edu.companyName },
    { type: "row2", l1: "Annual Income", v1: edu.annualIncome, l2: "Work City", v2: edu.workCity },
  ];
  if (edu.workingAbroad && edu.countryOfResidence) {
    eduRows.push({ type: "row", label: "Country of Residence", value: edu.countryOfResidence });
  }
  if (edu.extraFields?.length) {
    for (const ef of edu.extraFields) {
      if (ef.label && ef.value) eduRows.push({ type: "row", label: ef.label, value: ef.value });
    }
  }
  drawSection("✦  Education & Career  ✦", eduRows);

  // ── Family Details ─────────────────────────────────────────────────────────
  const fam = data.family;
  const sibStr = [
    fam.brothers > 0 ? `${fam.brothers} Brother${fam.brothers > 1 ? "s" : ""} (${fam.marriedBrothers} married)` : "",
    fam.sisters  > 0 ? `${fam.sisters} Sister${fam.sisters > 1 ? "s" : ""} (${fam.marriedSisters} married)` : "",
  ].filter(Boolean).join(", ");

  const famRows: SRow[] = [
    { type: "row", label: "Father's Name", value: `${fam.fatherName} (${fam.fatherOccupation})` },
    { type: "row", label: "Mother's Name", value: `${fam.motherName} (${fam.motherOccupation})` },
    { type: "row2", l1: "Siblings", v1: sibStr, l2: "Family Type", v2: fmtEnum(fam.familyType) },
    { type: "row2", l1: "Native Place", v1: fam.nativePlace, l2: "Family City", v2: fam.familyCity },
  ];
  if (fam.aboutFamily) famRows.push({ type: "multiline", label: "About Family", value: fam.aboutFamily });
  if (fam.extraFields?.length) {
    for (const ef of fam.extraFields) {
      if (ef.label && ef.value) famRows.push({ type: "row", label: ef.label, value: ef.value });
    }
  }
  drawSection("✦  Family Details  ✦", famRows);

  // ── About & Lifestyle ──────────────────────────────────────────────────────
  const about = data.about;
  const aboutRows: SRow[] = [
    { type: "row", label: "Diet", value: fmtEnum(about.diet) },
    { type: "row", label: "Languages", value: (data.personal.languagesKnown ?? []).join(", ") },
    { type: "row", label: "Hobbies", value: about.hobbies.join(", ") },
  ];
  if (about.aboutMe) aboutRows.push({ type: "multiline", label: "About Me", value: about.aboutMe });
  if (about.partnerExpectations) aboutRows.push({ type: "multiline", label: "Partner Expectations", value: about.partnerExpectations });
  if (about.extraFields?.length) {
    for (const ef of about.extraFields) {
      if (ef.label && ef.value) aboutRows.push({ type: "row", label: ef.label, value: ef.value });
    }
  }
  drawSection("✦  About & Lifestyle  ✦", aboutRows);

  // ── Contact Details ────────────────────────────────────────────────────────
  const con = data.contact;
  const contactRows: SRow[] = [
    { type: "row2", l1: "Contact Person", v1: con.contactName, l2: "Phone", v2: con.phone },
    { type: "row", label: "Email", value: con.email },
    ...(con.address ? [{ type: "multiline" as const, label: "Address", value: con.address }] : []),
    ...(con.city || con.state ? [{ type: "row2" as const, l1: "City", v1: con.city, l2: "State", v2: con.state }] : []),
  ];
  if (con.extraFields?.length) {
    for (const ef of con.extraFields) {
      if (ef.label && ef.value) contactRows.push({ type: "row", label: ef.label, value: ef.value });
    }
  }
  drawSection("✦  Contact Details  ✦", contactRows);

  // ── Optional Second Photo ──────────────────────────────────────────────────
  if (data.personal.secondPhotoUrl) {
    try {
      const img2 = await loadImage(data.personal.secondPhotoUrl, false);

      // ALWAYS start the secondary photo on a fresh dedicated page.
      // This guarantees the photo is never split or squeezed on a partial page.
      newPage();

      // Draw heading on the new page
      ctx!.font = FF.sectionHeader; ctx!.fillStyle = C.headerText; ctx!.textAlign = "center";
      ctx!.fillText("✦  Additional Photo  ✦", CX, sy);
      sy += 40;

      // Full content width
      const p2W = S_R - S_L;
      // Scale to fit the full page (heading already consumed some space)
      const availH = S_B - sy - 10;
      const naturalH = Math.round(p2W * img2.height / img2.width);
      let drawW = p2W;
      let drawH = naturalH;
      if (drawH > availH) {
        // Scale proportionally so entire photo fits on this single page
        drawH = availH;
        drawW = Math.round(drawH * img2.width / img2.height);
      }
      const drawX = S_L + Math.round((p2W - drawW) / 2); // centre horizontally

      ctx!.strokeStyle = C.photoBorder; ctx!.lineWidth = 2.5;
      ctx!.strokeRect(drawX - 3, sy - 3, drawW + 6, drawH + 6);
      ctx!.drawImage(img2, drawX, sy, drawW, drawH);
      sy += drawH + 10;
    } catch { /* ignore invalid image */ }
  }

  // ── CALIBRATION overlay ────────────────────────────────────────────────────
  if (opts.calibrate) {
    const dots = [
      { x: CX, y: S_T + 52, label: "title", color: "#00FFFF" },
      { x: photoX, y: photoY, label: "photo TL", color: "#00FF00" },
      { x: photoX + photoW, y: photoY + photoH, label: "photo BR", color: "#00FF00" },
      { x: nameX, y: nameY, label: "name", color: "#FFFF00" },
      { x: primStartX, y: primStartY, label: "primary", color: "#FF00FF" },
      { x: secCol1Label, y: secMinFirstY, label: "section start", color: "#FF6600" },
    ];
    const page1ctx = pages[0].getContext("2d")!;
    for (const dot of dots) {
      page1ctx.beginPath();
      page1ctx.arc(dot.x, dot.y, 7, 0, Math.PI * 2);
      page1ctx.fillStyle = dot.color;
      page1ctx.fill();
      page1ctx.font = "bold 12px Arial"; page1ctx.fillStyle = dot.color; page1ctx.textAlign = "left";
      page1ctx.fillText(dot.label, dot.x + 10, dot.y + 5);
    }
  }

  return pages;
}

// ── Single-canvas convenience (renders page 1 only) ─────────────────────────
export async function renderGenericToCanvas(
  canvasEl: HTMLCanvasElement,
  data: BiodataFormData,
  theme: TemplateTheme,
  opts: { calibrate?: boolean } = {},
): Promise<void> {
  const pages = await renderGenericToCanvasPages(data, theme, opts);
  const src = pages[0];
  canvasEl.width = src.width;
  canvasEl.height = src.height;
  canvasEl.getContext("2d")!.drawImage(src, 0, 0);
}
