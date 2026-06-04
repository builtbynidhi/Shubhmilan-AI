/**
 * SourceAttribution — a small trust badge that names the classical texts a
 * result was computed/grounded from (e.g. Narada Samhita, Muhurta Chintamani).
 *
 * The `texts` are the always-true computation sources (deterministic tables /
 * astronomy). `grounded`/`groundedSources` reflect the optional RAG layer —
 * when the AI narrative cited the knowledge base, those source strings are
 * shown too.
 */

import { ScrollText } from "lucide-react";

interface SourceAttributionProps {
  texts: string[];
  lang: "en" | "hi";
  grounded?: boolean;
  groundedSources?: string[];
}

export function SourceAttribution({ texts, lang, grounded, groundedSources }: SourceAttributionProps) {
  const heading = lang === "hi" ? "शास्त्रीय स्रोत" : "Classical Sources";
  const computedNote =
    lang === "hi"
      ? "गणना इन्हीं शास्त्रों की पारंपरिक तालिकाओं व पंचांग गणित से की गई है"
      : "Computed from the traditional tables and panchang mathematics of these texts";

  // De-dupe grounded sources against the static texts.
  const extra = (groundedSources ?? []).filter(
    (s) => !texts.some((t) => s.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(s.toLowerCase())),
  );

  return (
    <div className="rounded-xl border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/[0.04] p-4">
      <div className="mb-2 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-[var(--color-accent)]" />
        <span className="text-xs font-semibold tracking-wide text-[var(--color-accent)]">{heading}</span>
      </div>
      <p className="mb-2.5 text-[11px] leading-relaxed text-[var(--color-text-muted)]">{computedNote}</p>
      <div className="flex flex-wrap gap-1.5">
        {texts.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-primary)]"
          >
            {t}
          </span>
        ))}
      </div>
      {grounded && extra.length > 0 && (
        <p className="mt-2.5 text-[10px] leading-relaxed text-[var(--color-text-muted)]/70">
          {lang === "hi" ? "ग्रंथ-संदर्भ: " : "Knowledge cited: "}
          {extra.join(" · ")}
        </p>
      )}
    </div>
  );
}
