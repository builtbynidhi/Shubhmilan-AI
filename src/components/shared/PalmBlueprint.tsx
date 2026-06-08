/**
 * PalmBlueprint — a stylised, animated SVG palm that "draws" the detected lines.
 *
 * Purely visual + driven by the reading's own `lines` data (name + quality), so it
 * never invents anything: a line is bright when detected strong, dim when faint,
 * and barely-there when it wasn't clearly seen. Tap a line to read its meaning.
 * No overlay on the real photo (vision can't place lines precisely) — this is a
 * clean "blueprint" of what the reading found.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import type { PalmLine } from "@/lib/palmReading";

type Lang = "en" | "hi";

interface LineDef {
  key: string;
  aliases: string[];
  labelEn: string;
  labelHi: string;
  d: string;
}

// Stylised line paths inside a ~300×360 palm (not anatomically exact — a mystic blueprint).
const LINE_DEFS: LineDef[] = [
  { key: "heart",    aliases: ["heart", "हृदय", "hriday"],            labelEn: "Heart",    labelHi: "हृदय",    d: "M80 175 Q150 158 222 182" },
  { key: "head",     aliases: ["head", "mind", "मस्तिष्क", "mastishk"], labelEn: "Head",     labelHi: "मस्तिष्क", d: "M80 210 Q150 200 215 232" },
  { key: "life",     aliases: ["life", "जीवन", "jeevan"],             labelEn: "Life",     labelHi: "जीवन",    d: "M102 152 Q78 245 138 322" },
  { key: "fate",     aliases: ["fate", "destiny", "भाग्य", "bhagya"], labelEn: "Fate",     labelHi: "भाग्य",   d: "M152 322 Q153 235 150 165" },
  { key: "sun",      aliases: ["sun", "apollo", "सूर्य", "surya"],    labelEn: "Sun",      labelHi: "सूर्य",   d: "M196 322 Q201 255 206 196" },
  { key: "marriage", aliases: ["marriage", "विवाह", "vivah"],         labelEn: "Marriage", labelHi: "विवाह",   d: "M205 176 L232 172" },
  { key: "health",   aliases: ["health", "mercury", "स्वास्थ्य"],      labelEn: "Health",   labelHi: "स्वास्थ्य", d: "M140 315 Q182 252 200 200" },
];

function styleFor(quality?: string): { color: string; opacity: number; width: number; glow: boolean } {
  switch (quality) {
    case "strong":   return { color: "var(--color-accent)", opacity: 1,    width: 3,   glow: true };
    case "moderate": return { color: "var(--color-saffron)", opacity: 0.9, width: 2.5, glow: true };
    case "faint":    return { color: "var(--color-accent)", opacity: 0.55, width: 2,   glow: false };
    default:         return { color: "#ffffff",              opacity: 0.12, width: 1.5, glow: false }; // absent / not seen
  }
}

function matchLine(aliases: string[], lines: PalmLine[]): PalmLine | undefined {
  return lines.find((l) => {
    const hay = `${l.name ?? ""} ${l.nameHindi ?? ""}`.toLowerCase();
    return aliases.some((a) => hay.includes(a));
  });
}

export function PalmBlueprint({ lines, lang }: { lines: PalmLine[]; lang: Lang }) {
  const [selected, setSelected] = useState<string | null>(null);
  const selDef = LINE_DEFS.find((d) => d.key === selected);
  const selLine = selDef ? matchLine(selDef.aliases, lines) : undefined;

  return (
    <div className="mb-5 rounded-2xl border border-[var(--color-ai)]/20 bg-black/30 p-4">
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-ai)]/80">
        {lang === "hi" ? "आपकी हस्तरेखा (Palm Blueprint)" : "Your Palm Blueprint"}
      </p>

      <div className="mx-auto max-w-[280px]">
        <svg viewBox="0 0 300 360" className="w-full">
          {/* faint hand silhouette + finger/thumb hints */}
          <g stroke="var(--color-ai)" strokeOpacity="0.18" fill="none" strokeLinecap="round" strokeWidth="2">
            <rect x="60" y="120" width="180" height="220" rx="74" fill="var(--color-ai)" fillOpacity="0.04" />
            <line x1="95" y1="118" x2="95" y2="72" />
            <line x1="130" y1="118" x2="130" y2="56" />
            <line x1="167" y1="118" x2="167" y2="62" />
            <line x1="202" y1="118" x2="202" y2="82" />
            <line x1="64" y1="212" x2="84" y2="166" />
          </g>

          {/* detected palm lines — animate-drawn, coloured by quality */}
          {LINE_DEFS.map((def, i) => {
            const line = matchLine(def.aliases, lines);
            const st = styleFor(line?.quality);
            const isSel = selected === def.key;
            return (
              <motion.path
                key={def.key}
                d={def.d}
                fill="none"
                stroke={st.color}
                strokeOpacity={isSel ? 1 : st.opacity}
                strokeWidth={isSel ? st.width + 1.5 : st.width}
                strokeLinecap="round"
                style={{
                  filter: st.glow || isSel ? `drop-shadow(0 0 6px ${st.color})` : undefined,
                  cursor: line ? "pointer" : "default",
                }}
                onClick={() => { if (line) setSelected(isSel ? null : def.key); }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.12 * i, ease: "easeInOut" }}
              />
            );
          })}
        </svg>
      </div>

      <p className="mt-1 text-center text-[10px] text-[var(--color-text-muted)]/60">
        {lang === "hi" ? "किसी रेखा पर टैप करके उसका मतलब देखें" : "Tap a glowing line to read what it means"}
      </p>

      {selDef && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-[var(--color-ai)]/20 bg-[var(--color-surface)] p-3"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-accent)]">
            {lang === "hi" ? `${selDef.labelHi} रेखा` : `${selDef.labelEn} Line`}
            {selLine && (
              <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-accent)]/80">
                {selLine.quality}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {selLine
              ? (lang === "hi" ? selLine.descriptionHindi : selLine.description)
              : (lang === "hi" ? "यह रेखा साफ नहीं दिखी।" : "This line wasn't clearly visible in the photo.")}
          </p>
        </motion.div>
      )}
    </div>
  );
}
