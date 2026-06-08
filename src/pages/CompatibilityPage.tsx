import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Heart, Loader2, User, Star,
  RotateCcw, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  CalendarHeart, ShieldCheck, ChevronDown, MapPin, Calendar, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkCompatibility } from "@/lib/compatibility";
import { computeBirthChart } from "@/lib/jyotish/chart";
import { searchPlaces, type PlaceResult } from "@/lib/kundliApi";
import { NAKSHATRAS, RASHIS as JYOTISH_RASHIS } from "@/lib/jyotish/nakshatra";
import { SourceAttribution } from "@/components/shared/SourceAttribution";
import type { CompatibilityResult, PartnerDetails } from "@/types/compatibility.types";

// Birth-date bounds: no future, max 120 years back.
const _pad = (n: number) => String(n).padStart(2, "0");
const _now = new Date();
const MAX_DOB = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
const MIN_DOB = `${_now.getFullYear() - 120}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;

// ─── Rashi list ──────────────────────────────────────────────────────────────
const RASHIS = [
  { value: "Mesh (Aries)", hindi: "मेष", english: "Aries", emoji: "♈" },
  { value: "Vrishabh (Taurus)", hindi: "वृषभ", english: "Taurus", emoji: "♉" },
  { value: "Mithun (Gemini)", hindi: "मिथुन", english: "Gemini", emoji: "♊" },
  { value: "Kark (Cancer)", hindi: "कर्क", english: "Cancer", emoji: "♋" },
  { value: "Simha (Leo)", hindi: "सिंह", english: "Leo", emoji: "♌" },
  { value: "Kanya (Virgo)", hindi: "कन्या", english: "Virgo", emoji: "♍" },
  { value: "Tula (Libra)", hindi: "तुला", english: "Libra", emoji: "♎" },
  { value: "Vrishchik (Scorpio)", hindi: "वृश्चिक", english: "Scorpio", emoji: "♏" },
  { value: "Dhanu (Sagittarius)", hindi: "धनु", english: "Sagittarius", emoji: "♐" },
  { value: "Makar (Capricorn)", hindi: "मकर", english: "Capricorn", emoji: "♑" },
  { value: "Kumbh (Aquarius)", hindi: "कुम्भ", english: "Aquarius", emoji: "♒" },
  { value: "Meen (Pisces)", hindi: "मीन", english: "Pisces", emoji: "♓" },
];

// ─── Translations ────────────────────────────────────────────────────────────
const L = {
  en: {
    title: "Kundli Matching (कुंडली मिलान)",
    subtitle: "Ashtakoot Guna Milan",
    heroTitle: "Check Your Compatibility",
    heroDesc: "Enter both partners' birth details — we'll automatically work out the Nakshatra & Rashi for a complete Ashtakoot Guna Milan from the classical 36-guna tables.",
    partner1: "Partner 1 — Groom (वर)",
    partner2: "Partner 2 — Bride (वधू)",
    fullName: "Full Name",
    birthDate: "Date of Birth",
    birthTime: "Time of Birth",
    birthPlace: "Place of Birth",
    placePlaceholder: "e.g. Pune, Maharashtra, India",
    knowNakshatra: "I already know my Nakshatra & Rashi",
    useBirthDetails: "Use birth details instead",
    needPlace: "Please pick the birth place from the suggestions for both partners.",
    nakshatra: "Nakshatra (नक्षत्र)",
    selectNakshatra: "Select Nakshatra…",
    rashi: "Rashi (राशि)",
    selectRashi: "Select Rashi…",
    checkBtn: "Check Compatibility (मिलान जाँचें)",
    checking: "Analyzing Gunas…",
    newCheck: "New Check",
    gunaScore: "Guna Score",
    outOf: "out of 36",
    verdict: "Verdict",
    categories: "Detailed Guna Breakdown",
    analysis: "Expert Analysis",
    muhurt: "Auspicious Marriage Dates (शुभ मुहूर्त)",
    mangalNote: "Mangal Dosha Note",
    remedies: "Suggested Remedies",
    disclaimer: "Guna scores and muhurat dates are computed from classical Ashtakoot tables and panchang astronomy; the analysis is AI-written. For authoritative guidance, please consult a qualified Jyotish pandit.",
    langEn: "English",
    langHi: "हिंदी",
  },
  hi: {
    title: "कुंडली मिलान (Kundli Matching)",
    subtitle: "अष्टकूट गुण मिलान",
    heroTitle: "अपनी अनुकूलता जाँचें",
    heroDesc: "दोनों साथियों की जन्म जानकारी भरें — हम नक्षत्र व राशि अपने-आप निकाल कर शास्त्रीय 36-गुण तालिकाओं से अष्टकूट गुण मिलान करेंगे।",
    partner1: "साथी 1 — वर (Groom)",
    partner2: "साथी 2 — वधू (Bride)",
    fullName: "पूरा नाम",
    birthDate: "जन्म तिथि",
    birthTime: "जन्म समय",
    birthPlace: "जन्म स्थान",
    placePlaceholder: "जैसे पुणे, महाराष्ट्र, भारत",
    knowNakshatra: "मुझे अपना नक्षत्र व राशि पता है",
    useBirthDetails: "जन्म जानकारी से भरें",
    needPlace: "कृपया दोनों साथियों का जन्म स्थान सुझावों में से चुनें।",
    nakshatra: "नक्षत्र (Nakshatra)",
    selectNakshatra: "नक्षत्र चुनें…",
    rashi: "राशि (Rashi)",
    selectRashi: "राशि चुनें…",
    checkBtn: "अनुकूलता जाँचें",
    checking: "गुण विश्लेषण हो रहा है…",
    newCheck: "नई जाँच",
    gunaScore: "गुण अंक",
    outOf: "/ 36 में से",
    verdict: "निर्णय",
    categories: "विस्तृत गुण विवरण",
    analysis: "विशेषज्ञ विश्लेषण",
    muhurt: "शुभ विवाह मुहूर्त",
    mangalNote: "मंगल दोष टिप्पणी",
    remedies: "सुझाए गए उपाय",
    disclaimer: "गुण अंक और मुहूर्त तिथियाँ शास्त्रीय अष्टकूट तालिकाओं व पंचांग गणना से निकाली गई हैं; विश्लेषण AI द्वारा लिखा गया है। प्रामाणिक मार्गदर्शन के लिए किसी योग्य ज्योतिषी से परामर्श लें।",
    langEn: "English",
    langHi: "हिंदी",
  },
};
type Lang = "en" | "hi";

// ─── Rashi Select ────────────────────────────────────────────────────────────
function RashiSelect({ value, onChange, placeholder, lang }: {
  value: string; onChange: (v: string) => void; placeholder: string; lang: Lang;
}) {
  return (
    <div className="relative">
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]/40" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/30"
      >
        <option value="" disabled className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">{placeholder}</option>
        {RASHIS.map((r) => (
          <option key={r.value} value={r.value} className="bg-[var(--color-surface)] text-white">
            {r.emoji} {lang === "hi" ? `${r.hindi} (${r.english})` : `${r.english} (${r.hindi})`}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Nakshatra Select ────────────────────────────────────────────────────────
function NakshatraSelect({ value, onChange, placeholder, lang }: {
  value: string; onChange: (v: string) => void; placeholder: string; lang: Lang;
}) {
  return (
    <div className="relative">
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]/40" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/30"
      >
        <option value="" disabled className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">{placeholder}</option>
        {NAKSHATRAS.map((n) => (
          <option key={n.name} value={n.name} className="bg-[var(--color-surface)] text-white">
            {lang === "hi" ? `${n.nameHi} (${n.name})` : `${n.name} (${n.nameHi})`}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100;
  const r = 70;
  const C = 2 * Math.PI * r;
  const offset = C - (pct / 100) * C;
  const color = score >= 25 ? "var(--color-success)" : score >= 18 ? "var(--color-accent)" : "var(--color-error)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="6" opacity="0.1" />
        <motion.circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-[Cinzel,serif] text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[var(--color-text-muted)]">/ {max}</span>
      </div>
    </div>
  );
}

// ─── Guna Bar ────────────────────────────────────────────────────────────────
function GunaBar({ name, nameHindi, obtained, maximum, description, lang, delay }: {
  name: string; nameHindi: string; obtained: number; maximum: number; description: string; lang: Lang; delay: number;
}) {
  const pct = maximum > 0 ? (obtained / maximum) * 100 : 0;
  const color = pct >= 75 ? "var(--color-success)" : pct >= 50 ? "var(--color-accent)" : "var(--color-error)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{lang === "hi" ? nameHindi : name}</span>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{obtained}/{maximum}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// ─── Place autocomplete (Nominatim, reused pattern from Kundli) ───────────────
function PlaceInput({ value, onChange, onSelect, placeholder }: {
  value: string; onChange: (v: string) => void; onSelect: (p: PlaceResult) => void; placeholder: string;
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
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]/50" />
        <Input
          placeholder={placeholder}
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
            className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-surface)] shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => { onSelect(s); setOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/80 hover:bg-[var(--color-accent)]/10"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]/60" />
                <span className="truncate">{s.displayName}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Partner Form (birth details — Nakshatra/Rashi auto-computed) ─────────────
function BirthPartnerForm({
  label, emoji, name, setName, dob, setDob, time, setTime, place, setPlace, onPickPlace, t,
}: {
  label: string; emoji: string;
  name: string; setName: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  time: string; setTime: (v: string) => void;
  place: string; setPlace: (v: string) => void;
  onPickPlace: (p: PlaceResult) => void;
  t: typeof L.en;
}) {
  return (
    // overflow-visible so the place-suggestion dropdown isn't clipped by the
    // card's `overflow:hidden` (the place field is the last row in this card).
    <div className="sacred-card p-6 space-y-4" style={{ overflow: "visible" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-[Cinzel,serif] text-base font-bold text-[var(--color-text-primary)]">{label}</h3>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <User className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.fullName}
        </Label>
        <Input placeholder="e.g. Ankur Singh" value={name} onChange={(e) => setName(e.target.value)} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.birthDate}
          </Label>
          <Input type="date" min={MIN_DOB} max={MAX_DOB} value={dob} onChange={(e) => setDob(e.target.value)} className="border-white/10 bg-white/5 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.birthTime}
          </Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border-white/10 bg-white/5 text-white" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.birthPlace}
        </Label>
        <PlaceInput value={place} onChange={setPlace} onSelect={onPickPlace} placeholder={t.placePlaceholder} />
      </div>
    </div>
  );
}

// ─── Partner Form (manual — for users who already know their Nakshatra) ───────
function ManualPartnerForm({
  label,
  emoji,
  name, setName,
  nakshatra, setNakshatra,
  rashi, setRashi,
  t,
  lang,
}: {
  label: string;
  emoji: string;
  name: string; setName: (v: string) => void;
  nakshatra: string; setNakshatra: (v: string) => void;
  rashi: string; setRashi: (v: string) => void;
  t: typeof L.en;
  lang: Lang;
}) {
  return (
    <div className="sacred-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-[Cinzel,serif] text-base font-bold text-[var(--color-text-primary)]">{label}</h3>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <User className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.fullName}
        </Label>
        <Input
          placeholder="e.g. Ankur Singh"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.nakshatra}
        </Label>
        <NakshatraSelect value={nakshatra} onChange={setNakshatra} placeholder={t.selectNakshatra} lang={lang} />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Star className="h-3.5 w-3.5 text-[var(--color-accent)]/60" /> {t.rashi}
        </Label>
        <RashiSelect value={rashi} onChange={setRashi} placeholder={t.selectRashi} lang={lang} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CompatibilityPage() {
  // Input mode: default = birth details (auto-computes nakshatra/rashi); manual = user knows their nakshatra.
  const [manualMode, setManualMode] = useState(false);

  // Partner 1 — name + birth details (default) + manual nakshatra/rashi (fallback)
  const [p1Name, setP1Name] = useState("");
  const [p1Dob, setP1Dob] = useState("");
  const [p1Time, setP1Time] = useState("");
  const [p1Place, setP1Place] = useState("");
  const [p1Coords, setP1Coords] = useState<{ lat: number; lon: number } | null>(null);
  const [p1Nakshatra, setP1Nakshatra] = useState("");
  const [p1Rashi, setP1Rashi] = useState("");

  // Partner 2 — same
  const [p2Name, setP2Name] = useState("");
  const [p2Dob, setP2Dob] = useState("");
  const [p2Time, setP2Time] = useState("");
  const [p2Place, setP2Place] = useState("");
  const [p2Coords, setP2Coords] = useState<{ lat: number; lon: number } | null>(null);
  const [p2Nakshatra, setP2Nakshatra] = useState("");
  const [p2Rashi, setP2Rashi] = useState("");

  // Picking a nakshatra auto-fills its majority-pada rashi (user can override
  // if their pada falls in the adjacent sign).
  function deriveRashi(nakshatraName: string): string {
    const nak = NAKSHATRAS.find((n) => n.name === nakshatraName);
    return nak ? JYOTISH_RASHIS[nak.rashiIndex].name : "";
  }
  function pickP1Nakshatra(v: string) {
    setP1Nakshatra(v);
    setP1Rashi(deriveRashi(v));
  }
  function pickP2Nakshatra(v: string) {
    setP2Nakshatra(v);
    setP2Rashi(deriveRashi(v));
  }

  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  // Progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 6));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const t = L[lang];

  const canSubmit = manualMode
    ? !!(p1Name.trim() && p1Nakshatra && p1Rashi && p2Name.trim() && p2Nakshatra && p2Rashi)
    : !!(p1Name.trim() && p1Dob && p1Time && p1Coords && p2Name.trim() && p2Dob && p2Time && p2Coords);

  async function handleCheck() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let partner1: PartnerDetails;
      let partner2: PartnerDetails;
      if (manualMode) {
        partner1 = { fullName: p1Name.trim(), nakshatra: p1Nakshatra, rashi: p1Rashi };
        partner2 = { fullName: p2Name.trim(), nakshatra: p2Nakshatra, rashi: p2Rashi };
      } else {
        if (!p1Coords || !p2Coords) { setError(t.needPlace); return; }
        // Auto-compute each partner's Moon nakshatra + rashi from birth details.
        const c1 = computeBirthChart({ dateOfBirth: p1Dob, timeOfBirth: p1Time, latitude: p1Coords.lat, longitude: p1Coords.lon });
        const c2 = computeBirthChart({ dateOfBirth: p2Dob, timeOfBirth: p2Time, latitude: p2Coords.lat, longitude: p2Coords.lon });
        partner1 = { fullName: p1Name.trim(), nakshatra: c1.keyIndicators.nakshatra, rashi: c1.keyIndicators.rashiEnglish };
        partner2 = { fullName: p2Name.trim(), nakshatra: c2.keyIndicators.nakshatra, rashi: c2.keyIndicators.rashiEnglish };
      }
      const data = await checkCompatibility(partner1, partner2);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setError(lang === "hi" ? "AI अभी व्यस्त है — कुछ देर बाद दोबारा प्रयास करें।" : "The AI is busy right now — please try again in a moment.");
      } else if (msg.includes("401") || msg.includes("403")) {
        setError(lang === "hi" ? "AI सेवा अभी उपलब्ध नहीं है। थोड़ी देर बाद प्रयास करें।" : "The AI service is currently unavailable. Please try again shortly.");
      } else {
        setError(lang === "hi" ? "मिलान नहीं हो पाया। इंटरनेट जांच कर दोबारा प्रयास करें।" : "Couldn't run the match. Check your connection and try again.");
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

  const verdictColor = result
    ? result.totalScore >= 25
      ? "var(--color-success)"
      : result.totalScore >= 18
        ? "var(--color-accent)"
        : "var(--color-error)"
    : "var(--color-accent)";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary)]">
      {/* Ambient glow */}
      <div className="glow-orb -left-20 top-20 h-64 w-64 bg-[var(--color-temple-maroon)]" style={{ animationDelay: "0s" }} />
      <div className="glow-orb -right-16 top-[50%] h-48 w-48 bg-[var(--color-accent)]" style={{ animationDelay: "2s" }} />
      <div className="glow-orb bottom-10 left-[40%] h-40 w-40 bg-[var(--color-indigo)]" style={{ animationDelay: "1s", opacity: 0.15 }} />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-accent)]/10 bg-[var(--color-primary)]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <div className="h-4 w-px bg-[var(--color-accent)]/15" />
          <span className="bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text font-[Cinzel,serif] text-sm font-bold text-transparent">
            💑 {t.title}
          </span>
          <div className="ml-auto text-[11px] font-medium tracking-widest uppercase text-[var(--color-accent)]/50">
            {t.subtitle}
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
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-lotus-pink)]/20 to-[var(--color-accent)]/20 shadow-[0_0_30px_rgba(212,168,75,0.15)]"
                >
                  <Heart className="h-8 w-8 text-[var(--color-lotus-pink)]" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-accent)] to-[var(--color-saffron)] bg-clip-text font-[Cinzel,serif] text-3xl font-bold text-transparent md:text-4xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-2 max-w-2xl mx-auto text-sm text-[var(--color-text-muted)]">
                  {t.heroDesc}
                </p>
              </div>

              {/* Mode toggle — birth details (default) vs manual nakshatra */}
              <div className="mb-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setManualMode((m) => !m)}
                  className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-4 py-1.5 text-xs font-medium text-[var(--color-accent)]/90 transition-colors hover:bg-[var(--color-accent)]/10"
                >
                  {manualMode ? `↩ ${t.useBirthDetails}` : `${t.knowNakshatra} →`}
                </button>
              </div>

              {/* Two partner forms */}
              <div className="grid gap-6 md:grid-cols-2">
                {manualMode ? (
                  <>
                    <ManualPartnerForm
                      label={t.partner1} emoji="🤵"
                      name={p1Name} setName={setP1Name}
                      nakshatra={p1Nakshatra} setNakshatra={pickP1Nakshatra}
                      rashi={p1Rashi} setRashi={setP1Rashi}
                      t={t} lang={lang}
                    />
                    <ManualPartnerForm
                      label={t.partner2} emoji="👰"
                      name={p2Name} setName={setP2Name}
                      nakshatra={p2Nakshatra} setNakshatra={pickP2Nakshatra}
                      rashi={p2Rashi} setRashi={setP2Rashi}
                      t={t} lang={lang}
                    />
                  </>
                ) : (
                  <>
                    <BirthPartnerForm
                      label={t.partner1} emoji="🤵"
                      name={p1Name} setName={setP1Name}
                      dob={p1Dob} setDob={setP1Dob}
                      time={p1Time} setTime={setP1Time}
                      place={p1Place}
                      setPlace={(v) => { setP1Place(v); setP1Coords(null); }}
                      onPickPlace={(p) => { setP1Place(p.displayName.split(",").slice(0, 3).join(",")); setP1Coords({ lat: p.latitude, lon: p.longitude }); }}
                      t={t}
                    />
                    <BirthPartnerForm
                      label={t.partner2} emoji="👰"
                      name={p2Name} setName={setP2Name}
                      dob={p2Dob} setDob={setP2Dob}
                      time={p2Time} setTime={setP2Time}
                      place={p2Place}
                      setPlace={(v) => { setP2Place(v); setP2Coords(null); }}
                      onPickPlace={(p) => { setP2Place(p.displayName.split(",").slice(0, 3).join(",")); setP2Coords({ lat: p.latitude, lon: p.longitude }); }}
                      t={t}
                    />
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-center text-sm text-[var(--color-error)]">
                  <AlertTriangle className="mr-2 inline h-4 w-4" /> {error}
                </motion.div>
              )}

              {/* Loading bar */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-saffron)] to-[var(--color-accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                    {t.checking}
                  </p>
                </motion.div>
              )}

              {/* Submit button */}
              <div className="mt-8 text-center">
                <Button
                  onClick={handleCheck}
                  disabled={!canSubmit || loading}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] px-10 text-[var(--color-primary)] font-bold shadow-[0_0_30px_rgba(212,168,75,0.2)] hover:shadow-[0_0_40px_rgba(212,168,75,0.35)] disabled:opacity-40 disabled:shadow-none transition-all"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t.checking}</>
                  ) : (
                    <><Heart className="h-4 w-4" /> {t.checkBtn}</>
                  )}
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-center text-[10px] tracking-wider uppercase text-[var(--color-text-muted)]/40">
                ✦ {t.disclaimer}
              </p>
            </motion.div>
          ) : (
            /* ───── RESULTS ───── */
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Action bar */}
              <div className="mb-6 flex items-center justify-between">
                <Button onClick={handleReset} variant="ghost" className="gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                  <RotateCcw className="h-4 w-4" /> {t.newCheck}
                </Button>
                {/* Language toggle */}
                <div className="flex gap-1 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-surface)] p-0.5">
                  {(["en", "hi"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        lang === l ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "text-[var(--color-text-muted)] hover:text-white"
                      }`}
                    >
                      {l === "en" ? t.langEn : t.langHi}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result header */}
              <div className="mb-8 text-center">
                <h1 className="bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text font-[Cinzel,serif] text-2xl font-bold text-transparent md:text-3xl">
                  {p1Name} & {p2Name}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.gunaScore}</p>
              </div>

              {/* Score ring + verdict */}
              <div className="mb-10 flex flex-col items-center gap-4">
                <ScoreRing score={result.totalScore} max={result.maxScore} />
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
                    style={{ background: `color-mix(in srgb, ${verdictColor} 15%, transparent)`, color: verdictColor }}
                  >
                    {result.marriageRecommended
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <XCircle className="h-4 w-4" />
                    }
                    {lang === "hi" ? result.verdictHindi : result.verdict}
                  </motion.div>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {result.totalScore} {t.outOf} ({result.percentage}%)
                  </p>
                </div>
              </div>

              {/* Guna breakdown */}
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" /> {t.categories}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.categories.map((cat, i) => (
                    <GunaBar
                      key={cat.name}
                      name={cat.name}
                      nameHindi={cat.nameHindi}
                      obtained={cat.obtained}
                      maximum={cat.maximum}
                      description={cat.description}
                      lang={lang}
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              </div>

              {/* Mangal note */}
              {result.mangalNote && (
                <div className="mb-8 sacred-card p-5">
                  <h3 className="mb-2 flex items-center gap-2 font-[Cinzel,serif] text-sm font-bold text-[var(--color-text-primary)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" /> {t.mangalNote}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{result.mangalNote}</p>
                </div>
              )}

              {/* Analysis */}
              <div className="mb-8 sacred-card p-6">
                <h2 className="mb-3 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">
                  {t.analysis}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {lang === "hi" ? result.analysisHindi : result.analysis}
                </p>
              </div>

              {/* Auspicious dates */}
              {result.auspiciousDates.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">
                    <CalendarHeart className="h-5 w-5 text-[var(--color-accent)]" /> {t.muhurt}
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {result.auspiciousDates.map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="sacred-card p-4"
                      >
                        <p className="font-[Cinzel,serif] text-sm font-bold text-[var(--color-accent)]">{d.date}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {d.tithi} · {d.nakshatra}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-success)]">{d.remark}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remedies */}
              {result.remedies.length > 0 && (
                <div className="mb-8 sacred-card p-5">
                  <h3 className="mb-3 font-[Cinzel,serif] text-sm font-bold text-[var(--color-text-primary)]">
                    {t.remedies}
                  </h3>
                  <ul className="space-y-2">
                    {result.remedies.map((rem, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                        <span className="mt-0.5 text-[var(--color-accent)]">•</span>
                        {rem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Classical source attribution */}
              <div className="mb-8">
                <SourceAttribution
                  texts={["Narada Samhita (Ashtakoot)", "Muhurta Chintamani"]}
                  lang={lang}
                  grounded={result.grounded}
                  groundedSources={result.sources}
                />
              </div>

              {/* Disclaimer */}
              <p className="mt-6 text-center text-[10px] tracking-wider uppercase text-[var(--color-text-muted)]/40">
                ✦ {t.disclaimer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
