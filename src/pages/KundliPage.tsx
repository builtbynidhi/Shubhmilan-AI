import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, MapPin, Calendar, Clock, User,
  Star, AlertTriangle, ChevronRight, RotateCcw, ShieldCheck, ShieldAlert, ShieldQuestion,
  Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateKundli, searchPlaces, type PlaceResult } from "@/lib/kundliApi";
import type { KundliData, PlanetPosition, DoshaStatus, ManglikAnalysis } from "@/types/kundli.types";

// ─── Translations ────────────────────────────────────────────────────────────
const L = {
  en: {
    newChart: "New Chart",
    generateAnother: "Generate Another",
    createBiodata: "Create Biodata",
    keyIndicatorsTitle: "Key Indicators",
    lagnaLabel: "Lagna (Ascendant)",
    moonSignLabel: "Moon Sign (Rashi)",
    nakshatraLabel: "Nakshatra",
    tithiLabel: "Tithi",
    pada: "Pada",
    birthChartTitle: "Birth Chart (D1)",
    planetaryTitle: "Planetary Positions",
    houseLabel: (n: number) => `House ${n}`,
    retrograde: "℞",
    doshaTitle: "Dosha Analysis",
    mangalDosha: "Mangal Dosha",
    kaalSarp: "Kaal Sarp Dosha",
    sadeSati: "Sade Sati",
    statusPresent: "Present",
    statusAbsent: "Not Present",
    statusPartial: "Partial",
    manglikTitle: "Manglik Status Check",
    freeBadge: "Free now · Premium soon",
    tapToReveal: "Tap to reveal your Manglik status from this Kundli — optional",
    manglikSubtitle: (n: string) => `Manglik analysis for ${n} based on Vedic birth chart`,
    isLabel: "is —",
    marsPlacementTitle: "Mars Placement",
    marsInHouse: (h: number, r: string) => `Mars is in House ${h}${r ? ` (${r})` : ""}`,
    marsClassicNote: "Classical Mangal Dosha is triggered when Mars occupies houses 1, 2, 4, 7, 8, or 12.",
    cancellationTitle: "Cancellation Factors",
    remediesTitle: "Vedic Remedies",
    compatTitle: "Marriage Compatibility",
    disclaimer: "This analysis is AI-generated based on Vedic Jyotish principles. For authoritative guidance, please consult a qualified astrologer.",
    kundliReading: "Kundli Reading",
    manglikYes: "Manglik",
    manglikNo: "Not Manglik",
    manglikPartial: "Partial Manglik",
    langEn: "English",
    langHi: "\u0939\u093f\u0902\u0926\u0940",
  },
  hi: {
    newChart: "\u0928\u0908 \u0915\u0941\u0902\u0921\u0932\u0940",
    generateAnother: "\u0926\u0942\u0938\u0930\u0940 \u092c\u0928\u093e\u090f\u0902",
    createBiodata: "\u092c\u093e\u092f\u094b\u0921\u0947\u091f\u093e \u092c\u0928\u093e\u090f\u0902",
    keyIndicatorsTitle: "\u092e\u0941\u0916\u094d\u092f \u091c\u093e\u0928\u0915\u093e\u0930\u0940",
    lagnaLabel: "\u0932\u0917\u094d\u0928 (\u0909\u0926\u092f\u0930\u093e\u0936\u093f)",
    moonSignLabel: "\u091a\u0902\u0926\u094d\u0930 \u0930\u093e\u0936\u093f",
    nakshatraLabel: "\u0928\u0915\u094d\u0937\u0924\u094d\u0930",
    tithiLabel: "\u0924\u093f\u0925\u093f",
    pada: "\u092a\u093e\u0926",
    birthChartTitle: "\u091c\u0928\u094d\u092e \u0915\u0941\u0902\u0921\u0932\u0940 (D1)",
    planetaryTitle: "\u0917\u094d\u0930\u0939 \u0938\u094d\u0925\u093f\u0924\u093f",
    houseLabel: (n: number) => `${n}\u0935\u093e\u0901 \u092d\u093e\u0935`,
    retrograde: "\u2bf8 \u0935\u0915\u094d\u0930\u0940",
    doshaTitle: "\u0926\u094b\u0937 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923",
    mangalDosha: "\u092e\u0902\u0917\u0932 \u0926\u094b\u0937",
    kaalSarp: "\u0915\u093e\u0932 \u0938\u0930\u094d\u092a \u0926\u094b\u0937",
    sadeSati: "\u0938\u093e\u0922\u093c\u0947 \u0938\u093e\u0924\u0940",
    statusPresent: "\u0939\u0948",
    statusAbsent: "\u0928\u0939\u0940\u0902 \u0939\u0948",
    statusPartial: "\u0906\u0902\u0936\u093f\u0915",
    manglikTitle: "\u092e\u093e\u0902\u0917\u0932\u093f\u0915 \u0938\u094d\u0925\u093f\u0924\u093f \u091c\u093e\u0901\u091a",
    freeBadge: "\u0905\u092d\u0940 \u092e\u0941\u092b\u093c\u0924 \u00b7 \u091c\u0932\u094d\u0926 \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e",
    tapToReveal: "\u0905\u092a\u0928\u0940 \u092e\u093e\u0902\u0917\u0932\u093f\u0915 \u0938\u094d\u0925\u093f\u0924\u093f \u091c\u093e\u0928\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u092f\u0939\u093e\u0901 \u0926\u092c\u093e\u090f\u0902 \u2014 \u0935\u0948\u0915\u0932\u094d\u092a\u093f\u0915",
    manglikSubtitle: (n: string) => `${n} \u0915\u0940 \u092e\u093e\u0902\u0917\u0932\u093f\u0915 \u0938\u094d\u0925\u093f\u0924\u093f \u2014 \u0935\u0948\u0926\u093f\u0915 \u091c\u0928\u094d\u092e \u0915\u0941\u0902\u0921\u0932\u0940 \u0915\u0947 \u0906\u0927\u093e\u0930 \u092a\u0930`,
    isLabel: "\u0939\u0948\u0902 \u2014",
    marsPlacementTitle: "\u092e\u0902\u0917\u0932 \u0915\u0940 \u0938\u094d\u0925\u093f\u0924\u093f",
    marsInHouse: (h: number, r: string) => `\u092e\u0902\u0917\u0932 ${h}\u0935\u0947\u0902 \u092d\u093e\u0935 \u092e\u0947\u0902 \u0939\u0948${r ? ` (${r})` : ""}`,
    marsClassicNote: "\u092a\u093e\u0930\u0902\u092a\u0930\u093f\u0915 \u092e\u0902\u0917\u0932 \u0926\u094b\u0937 \u0924\u092c \u0939\u094b\u0924\u093e \u0939\u0948 \u091c\u092c \u092e\u0902\u0917\u0932 1, 2, 4, 7, 8 \u092f\u093e 12\u0935\u0947\u0902 \u092d\u093e\u0935 \u092e\u0947\u0902 \u0939\u094b\u0964",
    cancellationTitle: "\u0926\u094b\u0937 \u0928\u093f\u0935\u093e\u0930\u0923 \u0915\u093e\u0930\u0915",
    remediesTitle: "\u0935\u0948\u0926\u093f\u0915 \u0909\u092a\u093e\u092f",
    compatTitle: "\u0935\u093f\u0935\u093e\u0939 \u0905\u0928\u0941\u0915\u0942\u0932\u0924\u093e",
    disclaimer: "\u092f\u0939 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0935\u0948\u0926\u093f\u0915 \u091c\u094d\u092f\u094b\u0924\u093f\u0937 \u0938\u093f\u0926\u094d\u0927\u093e\u0902\u0924\u094b\u0902 \u092a\u0930 \u0906\u0927\u093e\u0930\u093f\u0924 AI \u0926\u094d\u0935\u093e\u0930\u093e \u0924\u0948\u092f\u093e\u0930 \u0915\u093f\u092f\u093e \u0917\u092f\u093e \u0939\u0948\u0964 \u092a\u094d\u0930\u093e\u092e\u093e\u0923\u093f\u0915 \u092e\u093e\u0930\u094d\u0917\u0926\u0930\u094d\u0936\u0928 \u0915\u0947 \u0932\u093f\u090f \u0915\u093f\u0938\u0940 \u092f\u094b\u0917\u094d\u092f \u091c\u094d\u092f\u094b\u0924\u093f\u0937\u0940 \u0938\u0947 \u092a\u0930\u093e\u092e\u0930\u094d\u0936 \u0932\u0947\u0902\u0964",
    kundliReading: "\u0915\u0941\u0902\u0921\u0932\u0940 \u092a\u093e\u0920\u0928",
    manglikYes: "\u092e\u093e\u0902\u0917\u0932\u093f\u0915",
    manglikNo: "\u092e\u093e\u0902\u0917\u0932\u093f\u0915 \u0928\u0939\u0940\u0902",
    manglikPartial: "\u0906\u0902\u0936\u093f\u0915 \u092e\u093e\u0902\u0917\u0932\u093f\u0915",
    langEn: "English",
    langHi: "\u0939\u093f\u0902\u0926\u0940",
  },
};
type Lang = "en" | "hi";

// ─── North-Indian chart SVG ──────────────────────────────────────────────────
/** Draws a classic North-Indian diamond-style chart on a 400×400 SVG. */
function NorthIndianChart({ houses }: { houses: Record<number, string[]> }) {
  // North Indian chart layout: diamonds within square
  // House positions map to triangular/trapezoidal sections
  const S = 400;
  const M = S / 2;

  // The 12 house polygons in North Indian style
  const housePolygons: { house: number; points: string; cx: number; cy: number }[] = [
    { house: 1,  points: `${M},40 ${M+80},${M} ${M},${M} ${M-80},${M}`, cx: M, cy: M - 50 },
    { house: 2,  points: `40,40 ${M},40 ${M-80},${M}`, cx: 80, cy: 95 },
    { house: 3,  points: `40,40 40,${M} ${M-80},${M}`, cx: 75, cy: M - 30 },
    { house: 4,  points: `40,${M} ${M-80},${M} ${M},${M+80} 40,${S-40}`, cx: M - 100, cy: M + 10 },
    { house: 5,  points: `40,${S-40} ${M-80},${M} ${M},${S-40}`, cx: 80, cy: S - 100 },
    { house: 6,  points: `40,${S-40} ${M},${S-40} ${M},${S-40}`, cx: 80, cy: S - 60 },
    { house: 7,  points: `${M},${S-40} ${M+80},${M} ${M},${M} ${M-80},${M}`, cx: M, cy: M + 50 },
    { house: 8,  points: `${M},${S-40} ${M+80},${M} ${S-40},${S-40}`, cx: S - 80, cy: S - 100 },
    { house: 9,  points: `${S-40},${S-40} ${M+80},${M} ${S-40},${M}`, cx: S - 75, cy: M + 30 },
    { house: 10, points: `${S-40},${M} ${M+80},${M} ${M},40 ${S-40},40`, cx: M + 100, cy: M - 10 },
    { house: 11, points: `${S-40},40 ${M},40 ${M+80},${M}`, cx: S - 80, cy: 95 },
    { house: 12, points: `40,40 ${M},40 ${M-80},${M}`, cx: 80, cy: 95 },
  ];

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="h-full w-full" style={{ maxWidth: 380 }}>
      {/* Background */}
      <rect x="30" y="30" width={S - 60} height={S - 60} fill="none" stroke="var(--color-ai)" strokeWidth="1.5" opacity="0.4" />
      {/* Outer square */}
      <rect x="40" y="40" width={S - 80} height={S - 80} fill="none" stroke="var(--color-ai)" strokeWidth="2" opacity="0.6" />
      {/* Inner diamond */}
      <polygon
        points={`${M},40 ${S-40},${M} ${M},${S-40} 40,${M}`}
        fill="none" stroke="var(--color-ai)" strokeWidth="1.5" opacity="0.5"
      />
      {/* Cross lines */}
      <line x1="40" y1="40" x2={S - 40} y2={S - 40} stroke="var(--color-ai)" strokeWidth="1" opacity="0.3" />
      <line x1={S - 40} y1="40" x2="40" y2={S - 40} stroke="var(--color-ai)" strokeWidth="1" opacity="0.3" />

      {/* House labels and planets */}
      {housePolygons.map(({ house, cx, cy }) => {
        const planets = houses[house] ?? [];
        return (
          <g key={house}>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(6,182,212,0.5)" fontSize="10" fontWeight="600">
              {house}
            </text>
            {planets.map((p, i) => (
              <text
                key={p}
                x={cx}
                y={cy + 8 + i * 14}
                textAnchor="middle"
                fill="var(--color-accent)"
                fontSize="11"
                fontWeight="700"
              >
                {p}
              </text>
            ))}
          </g>
        );
      })}

      {/* Glow effect */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ─── Planet row ──────────────────────────────────────────────────────────────
function PlanetRow({ planet, lang }: { planet: PlanetPosition; lang: Lang }) {
  const lx = L[lang];
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ai)]/10 text-xs font-bold text-[var(--color-ai)]">
          {planet.symbol}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{planet.planet}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{planet.rashi}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-white/80">{lx.houseLabel(planet.house)}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {planet.degree.toFixed(1)}° {planet.status === "retrograde" ? lx.retrograde : ""}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Dosha badge ─────────────────────────────────────────────────────────────
function DoshaBadge({ label, status, explanation, lang }: { label: string; status: DoshaStatus; explanation: string; lang: Lang }) {
  const lx = L[lang];
  const colorMap: Record<DoshaStatus, { bg: string; text: string; dot: string }> = {
    no:      { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
    yes:     { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
    partial: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  };
  const c = colorMap[status];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border border-white/5 ${c.bg} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
        <span className={`text-sm font-bold ${c.text}`}>{label}</span>
        <span className={`ml-auto text-xs font-semibold uppercase tracking-wider ${c.text}`}>
          {status === "no" ? lx.statusAbsent : status === "yes" ? lx.statusPresent : lx.statusPartial}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{explanation}</p>
    </motion.div>
  );
}

// ─── Manglik Check Section ───────────────────────────────────────────────────
function ManglikCheckSection({ analysis, name, lang }: { analysis: ManglikAnalysis; name: string; lang: Lang }) {
  const lx = L[lang];
  const [revealed, setRevealed] = useState(false);

  const statusConfig = {
    yes:     { icon: ShieldAlert,    bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400",    dot: "bg-red-400",    label: lx.manglikYes,      tagBg: "bg-red-500/15" },
    partial: { icon: ShieldQuestion, bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", label: lx.manglikPartial,  tagBg: "bg-yellow-500/15" },
    no:      { icon: ShieldCheck,    bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  dot: "bg-green-400",  label: lx.manglikNo,       tagBg: "bg-green-500/15" },
  };
  const cfg = statusConfig[analysis.status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-2xl"
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setRevealed((v) => !v)}
        className="flex w-full items-center gap-3 p-6 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.border} border`}>
          <Icon className={`h-5 w-5 ${cfg.text}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
              {lx.manglikTitle}
            </span>
            {/* Premium badge */}
            <span className="flex items-center gap-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              <Lock className="h-2.5 w-2.5" /> {lx.freeBadge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {revealed ? lx.manglikSubtitle(name) : lx.tapToReveal}
          </p>
        </div>
        <div className="shrink-0 text-white/30">
          {revealed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Revealed panel */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-white/5 px-6 pb-6 pt-4">
              {/* Status banner */}
              <div className={`flex items-center gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                <span className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot} shadow-[0_0_8px] shadow-current`} />
                <div className="flex-1">
                  <p className={`text-base font-bold ${cfg.text}`}>{name} {lx.isLabel} {cfg.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{analysis.reason}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold uppercase ${cfg.tagBg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Mars placement */}
              {analysis.marsHouse > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="mt-0.5 text-lg">♂</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ai)]/70">{lx.marsPlacementTitle}</p>
                    <p className="mt-0.5 text-sm text-white/80">
                      {lx.marsInHouse(analysis.marsHouse, analysis.marsRashi)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {lx.marsClassicNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancellation factors */}
              {analysis.cancellationFactors.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-green-400/70">{lx.cancellationTitle}</p>
                  <ul className="space-y-1">
                    {analysis.cancellationFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                        <span className="mt-0.5 shrink-0 text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Remedies — only if Manglik or partial */}
              {analysis.status !== "no" && analysis.remedies.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ai)]/70">{lx.remediesTitle}</p>
                  <ul className="space-y-1">
                    {analysis.remedies.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                        <span className="mt-0.5 shrink-0 text-[var(--color-ai)]">→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compatibility tip */}
              {analysis.compatibilityTip && (
                <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]/70">{lx.compatTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">{analysis.compatibilityTip}</p>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-white/25">
                {lx.disclaimer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Place autocomplete input ────────────────────────────────────────────────
function PlaceInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: PlaceResult) => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchSuggestions = useCallback((query: string) => {
    clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(query);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 350);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ai)]/50" />
        <Input
          placeholder="e.g. Pune, Maharashtra, India"
          value={value}
          onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--color-ai)]/20 bg-[var(--color-surface)] shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={() => { onSelect(s); onChange(s.displayName.split(",").slice(0, 3).join(",")); setOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/80 hover:bg-[var(--color-ai)]/10"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-ai)]/60" />
                <span className="truncate">{s.displayName}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function KundliPage() {
  // Form state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Birth date bounds: no future dates (today is the upper limit), max 120 years back.
  const _pad = (n: number) => String(n).padStart(2, "0");
  const _now = new Date();
  const maxDob = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
  const minDob = `${_now.getFullYear() - 120}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;

  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(KundliData & { explanation: string; explanationHindi?: string }) | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("en");

  // Progress animation
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8));
    }, 400);
    return () => clearInterval(interval);
  }, [loading]);

  const canSubmit = name.trim() && dob && time && coords;

  async function handleGenerate() {
    if (!canSubmit || !coords) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateKundli({
        name: name.trim(),
        dateOfBirth: dob,
        timeOfBirth: time,
        latitude: coords.lat,
        longitude: coords.lon,
        placeName: place,
        gender: gender || undefined,
      });
      setProgress(100);
      await new Promise((r) => setTimeout(r, 500));
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setError("AI thodi busy hai — kuch der baad dobara try karein.");
      } else if (msg.includes("401") || msg.includes("403")) {
        setError("AI service abhi unavailable hai. Thodi der baad try karein.");
      } else {
        setError("Kundli generate nahi ho payi. Internet check karke dobara try karein.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setProgress(0);
  }

  // Format DOB for display
  const dobDisplay = dob
    ? new Date(dob + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary)]">
      {/* Ambient glow orbs */}
      <div className="glow-orb -left-20 top-20 h-64 w-64 bg-[var(--color-indigo)]" style={{ animationDelay: "0s" }} />
      <div className="glow-orb -right-16 top-[50%] h-48 w-48 bg-[var(--color-ai)]" style={{ animationDelay: "2s" }} />
      <div className="glow-orb bottom-10 left-[40%] h-40 w-40 bg-[var(--color-accent)]" style={{ animationDelay: "1s", opacity: 0.15 }} />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-accent)]/10 bg-[var(--color-primary)]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <div className="h-4 w-px bg-[var(--color-accent)]/15" />
          <span className="bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text font-[Cinzel,serif] text-sm font-bold text-transparent">
            🕉 Kundli Generator
          </span>
          <div className="ml-auto text-[11px] font-medium tracking-widest uppercase text-[var(--color-accent)]/50">
            AI-Powered Vedic Astrology
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-6 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            /* ───── INPUT FORM ───── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
              {/* Hero */}
              <div className="mb-10 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-ai)]/20 to-[var(--color-indigo)]/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                >
                  <Star className="h-8 w-8 text-[var(--color-ai)]" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-accent)] to-[var(--color-saffron)] bg-clip-text font-[Cinzel,serif] text-3xl font-bold text-transparent md:text-4xl">
                  Generate Your Kundli
                </h1>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Enter your birth details to create a complete Vedic birth chart powered by AI
                </p>
              </div>

              {/* Form card */}
              <div className="holo-border scan-lines relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl md:p-8">
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <User className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> Full Name
                    </Label>
                    <Input
                      placeholder="e.g. Ankur Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    />
                  </div>

                  {/* DOB + Time row */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <Calendar className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> Date of Birth
                      </Label>
                      <Input
                        type="date"
                        value={dob}
                        min={minDob}
                        max={maxDob}
                        // Calendar-only input: block all typing so unrealistic
                        // years can't be keyed in; the picker enforces min/max.
                        onKeyDown={(e) => {
                          if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault();
                        }}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        onChange={(e) => {
                          // Safety net in case a browser still lets a value through.
                          const v = e.target.value;
                          if (v && v > maxDob) setDob(maxDob);
                          else if (v && v < minDob) setDob(minDob);
                          else setDob(v);
                        }}
                        className="cursor-pointer border-white/10 bg-white/5 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <Clock className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> Exact Time of Birth
                      </Label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="border-white/10 bg-white/5 text-white"
                      />
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Even a 4-5 minute difference can change your Lagna
                      </p>
                    </div>
                  </div>

                  {/* Place */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <MapPin className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> Place of Birth
                    </Label>
                    <PlaceInput
                      value={place}
                      onChange={setPlace}
                      onSelect={(p) => setCoords({ lat: p.latitude, lon: p.longitude })}
                    />
                    {coords && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[var(--color-ai)]/60">
                        📍 {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                      </motion.p>
                    )}
                  </div>

                  {/* Gender (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-white/80">
                      Gender <span className="text-xs text-white/30">(Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      {(["male", "female", "other"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(gender === g ? "" : g)}
                          className={`rounded-lg border px-4 py-2 text-sm capitalize transition-all ${
                            gender === g
                              ? "border-[var(--color-ai)] bg-[var(--color-ai)]/10 text-[var(--color-ai)]"
                              : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-[var(--color-ai)] to-[var(--color-indigo)] text-white font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.25)] disabled:opacity-40"
                      onClick={handleGenerate}
                      disabled={!canSubmit || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating Birth Chart…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Kundli with AI
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Progress bar during loading */}
                  {loading && (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[var(--color-ai)] to-[var(--color-accent)]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-center text-[11px] tracking-wider uppercase text-[var(--color-ai)]/60">
                        {progress < 30 ? "Analyzing planetary positions…" :
                         progress < 60 ? "Computing house placements…" :
                         progress < 85 ? "Evaluating doshas & yogas…" :
                         "Preparing your birth chart…"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ───── RESULTS ───── */
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Result header */}
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text font-[Cinzel,serif] text-2xl font-bold text-transparent md:text-3xl">
                    {name}&apos;s Kundli
                  </h1>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {dobDisplay} &bull; {time} &bull; {place.split(",").slice(0, 2).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Global language toggle */}
                  <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                    <button
                      onClick={() => setLang("en")}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        lang === "en"
                          ? "bg-[var(--color-ai)] text-[var(--color-primary)]"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {L.en.langEn}
                    </button>
                    <button
                      onClick={() => setLang("hi")}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        lang === "hi"
                          ? "bg-[var(--color-ai)] text-[var(--color-primary)]"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {L.en.langHi}
                    </button>
                  </div>
                  <Button variant="outline" onClick={handleReset} className="border-white/15 text-white/70 hover:text-white">
                    <RotateCcw className="mr-1.5 h-4 w-4" /> {L[lang].newChart}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Key indicators */}
                <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                    <Star className="h-4 w-4" /> {L[lang].keyIndicatorsTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: L[lang].lagnaLabel, value: `${result.keyIndicators.lagna} (${result.keyIndicators.lagnaEnglish})` },
                      { label: L[lang].moonSignLabel, value: `${result.keyIndicators.rashi} (${result.keyIndicators.rashiEnglish})` },
                      { label: L[lang].nakshatraLabel, value: `${result.keyIndicators.nakshatra} (${L[lang].pada} ${result.keyIndicators.nakshatraPada})` },
                      { label: L[lang].tithiLabel, value: result.keyIndicators.tithi },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{item.label}</p>
                        <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Chart + Planets side by side */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Birth chart */}
                  <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                      <span className="text-base">🔯</span> {L[lang].birthChartTitle}
                    </h3>
                    <div className="flex items-center justify-center">
                      <NorthIndianChart houses={result.houses} />
                    </div>
                  </div>

                  {/* Planet positions */}
                  <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                      <span className="text-base">🪐</span> {L[lang].planetaryTitle}
                    </h3>
                    <div className="space-y-2">
                      {result.planetPositions.map((p) => (
                        <PlanetRow key={p.planet} planet={p} lang={lang} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dosha analysis */}
                <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                    <AlertTriangle className="h-4 w-4" /> {L[lang].doshaTitle}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DoshaBadge label={L[lang].mangalDosha} status={result.doshaAnalysis.mangalDosha} explanation={result.doshaAnalysis.mangalExplanation} lang={lang} />
                    <DoshaBadge label={L[lang].kaalSarp} status={result.doshaAnalysis.kaalSarp} explanation={result.doshaAnalysis.kaalSarpExplanation} lang={lang} />
                    <DoshaBadge label={L[lang].sadeSati} status={result.doshaAnalysis.sadeSati} explanation={result.doshaAnalysis.sadeSatiExplanation} lang={lang} />
                  </div>
                </div>

                {/* ─── Manglik Check ─── */}
                {result.manglikAnalysis && (
                  <ManglikCheckSection analysis={result.manglikAnalysis} name={name} lang={lang} />
                )}

                {/* AI Explanation */}
                {result.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl"
                  >
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                      <Sparkles className="h-4 w-4" /> {L[lang].kundliReading}
                    </h3>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={lang}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className={`text-sm leading-relaxed text-white/80 whitespace-pre-line ${lang === "hi" ? "font-[Noto_Sans_Devanagari,sans-serif]" : ""}`}
                      >
                        {lang === "hi" && result.explanationHindi
                          ? result.explanationHindi
                          : result.explanation}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset} className="border-white/15 text-white/70 hover:text-white">
                    <RotateCcw className="mr-1.5 h-4 w-4" /> {L[lang].generateAnother}
                  </Button>
                  <Link to="/builder" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-glow)] text-[var(--color-primary)] font-bold shadow-[0_0_20px_rgba(232,168,56,0.25)]"
                    >
                      {L[lang].createBiodata} <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
