import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, User, Camera, RotateCcw,
  Heart, Briefcase, Activity, Coins, Star, ChevronDown, ChevronUp,
  AlertTriangle, Hand, Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzePalm, type PalmReadingResult, type PalmLine } from "@/lib/palmReading";

// ─── Translations ────────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Palm Reading",
    subtitle: "AI-Powered Hastrekha Shastra",
    heroTitle: "Read Your Palm",
    heroDesc: "Capture a clear photo of your palm and let our AI Palmist reveal your future",
    name: "Full Name",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    capture: "Open Camera",
    upload: "Upload Photo",
    retake: "Retake",
    cameraInstruction: "Place your palm flat, fingers spread, in good lighting",
    analyze: "Read My Palm",
    analyzing: "Reading your palm lines…",
    newReading: "New Reading",
    overallTitle: "Overall Reading",
    linesTitle: "Palm Lines Analysis",
    loveTitle: "Love & Relationships",
    careerTitle: "Career & Success",
    healthTitle: "Health & Vitality",
    wealthTitle: "Wealth & Finance",
    luckyTitle: "Lucky Elements",
    luckyNumber: "Lucky Number",
    luckyColor: "Lucky Color",
    luckyDay: "Lucky Day",
    gemstone: "Gemstone",
    personalityTitle: "Personality Traits",
    adviceTitle: "Guidance & Advice",
    strong: "Strong",
    moderate: "Moderate",
    faint: "Faint",
    absent: "Absent",
    langEn: "English",
    langHi: "हिंदी",
    disclaimer: "This reading is AI-generated for entertainment and guidance. For authoritative decisions, consult a qualified palmist.",
  },
  hi: {
    title: "हस्तरेखा पठन",
    subtitle: "AI-संचालित हस्तरेखा शास्त्र",
    heroTitle: "अपनी हथेली पढ़ें",
    heroDesc: "अपनी हथेली की साफ तस्वीर लें और हमारे AI हस्तरेखा विशेषज्ञ से अपना भविष्य जानें",
    name: "पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    capture: "कैमरा खोलें",
    upload: "फोटो अपलोड",
    retake: "दोबारा लें",
    cameraInstruction: "अपनी हथेली सपाट रखें, उंगलियां फैलाएं, अच्छी रोशनी में",
    analyze: "मेरी हथेली पढ़ें",
    analyzing: "हथेली की रेखाएं पढ़ रहे हैं…",
    newReading: "नई रीडिंग",
    overallTitle: "समग्र पठन",
    linesTitle: "हस्तरेखा विश्लेषण",
    loveTitle: "प्रेम और रिश्ते",
    careerTitle: "करियर और सफलता",
    healthTitle: "स्वास्थ्य और जीवन शक्ति",
    wealthTitle: "धन और वित्त",
    luckyTitle: "शुभ तत्व",
    luckyNumber: "शुभ अंक",
    luckyColor: "शुभ रंग",
    luckyDay: "शुभ दिन",
    gemstone: "रत्न",
    personalityTitle: "व्यक्तित्व लक्षण",
    adviceTitle: "मार्गदर्शन और सलाह",
    strong: "मजबूत",
    moderate: "सामान्य",
    faint: "हल्की",
    absent: "अनुपस्थित",
    langEn: "English",
    langHi: "हिंदी",
    disclaimer: "यह रीडिंग AI द्वारा मनोरंजन और मार्गदर्शन के लिए तैयार की गई है। प्रामाणिक निर्णयों के लिए किसी योग्य हस्तरेखा शास्त्री से परामर्श लें।",
  },
};
type Lang = "en" | "hi";

// ─── Palm Line Card ──────────────────────────────────────────────────────────
function PalmLineCard({ line, lang }: { line: PalmLine; lang: Lang }) {
  const t = T[lang];
  const qualityColors = {
    strong: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", dot: "bg-green-400" },
    moderate: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
    faint: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400" },
    absent: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  };
  const c = qualityColors[line.quality];
  const qualityLabel = t[line.quality as keyof typeof t] ?? line.quality;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${c.border} ${c.bg} p-4`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
        <span className={`text-sm font-bold ${c.text}`}>
          {lang === "hi" ? line.nameHindi : line.name}
        </span>
        <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${c.text}`}>
          {qualityLabel}
        </span>
      </div>
      <p className={`text-xs leading-relaxed text-[var(--color-text-muted)] ${lang === "hi" ? "font-[Noto_Sans_Devanagari,sans-serif]" : ""}`}>
        {lang === "hi" ? line.descriptionHindi : line.description}
      </p>
    </motion.div>
  );
}

// ─── Reading Section Card ────────────────────────────────────────────────────
function ReadingSection({
  icon,
  title,
  content,
  lang,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  lang: Lang;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-2xl"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ai)]/10 text-[var(--color-ai)]">
          {icon}
        </div>
        <span className="flex-1 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
          {title}
        </span>
        <div className="shrink-0 text-white/30">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className={`border-t border-white/5 px-5 pb-5 pt-3 text-sm leading-relaxed text-white/80 whitespace-pre-line ${lang === "hi" ? "font-[Noto_Sans_Devanagari,sans-serif]" : ""}`}>
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Camera Capture Component ────────────────────────────────────────────────
function PalmCapture({
  image,
  onCapture,
  onRetake,
  lang,
}: {
  image: string | null;
  onCapture: (dataUrl: string) => void;
  onRetake: () => void;
  lang: Lang;
}) {
  const t = T[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      // Set streaming first so the <video> element renders
      setStreaming(true);
    } catch {
      alert("Could not access camera. Please allow camera permissions or upload a photo instead.");
    }
  }, [facingMode]);

  // Attach stream to video element once it mounts
  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    onCapture(dataUrl);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image too large. Please use an image under 10 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => alert("Could not read that file. Please try another image.");
    reader.onload = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function flipCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (streaming && streamRef.current) {
      // Stop current stream and restart with new facing mode
      streamRef.current.getTracks().forEach((t) => t.stop());
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 960 } } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  if (image) {
    return (
      <div className="relative">
        <img src={image} alt="Palm" className="w-full rounded-2xl border-2 border-[var(--color-ai)]/30" />
        <Button
          type="button"
          size="sm"
          onClick={() => { onRetake(); }}
          className="absolute bottom-3 right-3 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
        >
          <RotateCcw className="mr-1 h-3 w-3" /> {t.retake}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {streaming ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-ai)]/30">
          <video ref={videoRef} autoPlay playsInline muted className="block w-full min-h-[300px] bg-black" />
          {/* Guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-48 rounded-3xl border-2 border-dashed border-[var(--color-ai)]/40" />
          </div>
          <p className="absolute bottom-20 left-0 right-0 text-center text-xs text-[var(--color-ai)]/70">
            {t.cameraInstruction}
          </p>
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={flipCamera}
              className="bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              className="h-14 w-14 rounded-full bg-[var(--color-ai)] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-[var(--color-ai)]/80"
            >
              <Camera className="h-6 w-6 text-white" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={stopCamera}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-ai)]/10">
            <Hand className="h-10 w-10 text-[var(--color-ai)]" />
          </div>
          <p className="text-sm text-white/50">{t.cameraInstruction}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={startCamera}
              className="bg-[var(--color-ai)] text-white hover:bg-[var(--color-ai)]/80"
            >
              <Camera className="mr-2 h-4 w-4" /> {t.capture}
            </Button>
            <label>
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/15">
                📁 {t.upload}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PalmReadingPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [image, setImage] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PalmReadingResult | null>(null);

  // Progress animation
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 6));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const canSubmit = name.trim() && age && image;

  async function handleAnalyze() {
    if (!canSubmit || !image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzePalm({
        imageBase64: image,
        name: name.trim(),
        age: parseInt(age, 10),
        gender: gender || undefined,
      });
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read palm. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setImage(null);
    setProgress(0);
  }

  const t = T[lang];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary)]">
      {/* Ambient glow */}
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
            🤚 {t.title}
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
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-ai)]/20 to-[var(--color-indigo)]/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                >
                  <Hand className="h-8 w-8 text-[var(--color-ai)]" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-accent)] to-[var(--color-saffron)] bg-clip-text font-[Cinzel,serif] text-3xl font-bold text-transparent md:text-4xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {t.heroDesc}
                </p>
              </div>

              {/* Form */}
              <div className="holo-border scan-lines relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl md:p-8">
                <div className="space-y-6">
                  {/* Name + Age */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <User className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> {t.name}
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
                        {t.age}
                      </Label>
                      <Input
                        type="number"
                        placeholder="25"
                        min={1}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-white/80">
                      {t.gender} <span className="text-xs text-white/30">(Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      {(["male", "female", "other"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(gender === g ? "" : g)}
                          className={`rounded-lg border px-4 py-2 text-sm capitalize transition-all ${
                            gender === g
                              ? "border-[var(--color-ai)] bg-[var(--color-ai)]/10 text-[var(--color-ai)]"
                              : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                          }`}
                        >
                          {t[g as "male" | "female" | "other"]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera / Upload */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <Camera className="h-3.5 w-3.5 text-[var(--color-ai)]/60" /> Palm Photo
                    </Label>
                    <PalmCapture
                      image={image}
                      onCapture={setImage}
                      onRetake={() => setImage(null)}
                      lang={lang}
                    />
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
                      onClick={handleAnalyze}
                      disabled={!canSubmit || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.analyzing}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {t.analyze}
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Progress */}
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
                        {progress < 25 ? "Detecting palm lines…" :
                         progress < 50 ? "Analysing heart, head & life lines…" :
                         progress < 75 ? "Reading fate & sun lines…" :
                         "Preparing your reading…"}
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
                    {name}'s Palm Reading
                  </h1>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    🤚 AI Hastrekha Analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Language toggle */}
                  <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                    <button
                      onClick={() => setLang("en")}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        lang === "en" ? "bg-[var(--color-ai)] text-[var(--color-primary)]" : "text-white/50 hover:text-white"
                      }`}
                    >
                      {t.langEn}
                    </button>
                    <button
                      onClick={() => setLang("hi")}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        lang === "hi" ? "bg-[var(--color-ai)] text-[var(--color-primary)]" : "text-white/50 hover:text-white"
                      }`}
                    >
                      {t.langHi}
                    </button>
                  </div>
                  <Button variant="outline" onClick={handleReset} className="border-white/15 text-white/70 hover:text-white">
                    <RotateCcw className="mr-1.5 h-4 w-4" /> {t.newReading}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Palm image + overall */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Image */}
                  {image && (
                    <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-4 shadow-2xl">
                      <img src={image} alt="Palm" className="w-full rounded-xl" />
                    </div>
                  )}

                  {/* Overall reading */}
                  <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                      <Sparkles className="h-4 w-4" /> {t.overallTitle}
                    </h3>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={lang + "-overall"}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`text-sm leading-relaxed text-white/80 whitespace-pre-line ${lang === "hi" ? "font-[Noto_Sans_Devanagari,sans-serif]" : ""}`}
                      >
                        {lang === "hi" ? result.overallReadingHindi : result.overallReading}
                      </motion.p>
                    </AnimatePresence>
                    {result.grounded && result.sources && result.sources.length > 0 && (
                      <div className="mt-4 border-t border-[var(--color-text-muted)]/20 pt-3">
                        <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] ${lang === "hi" ? "font-hindi" : ""}`}>
                          {lang === "hi" ? "शास्त्रीय हस्तरेखा स्रोतों पर आधारित" : "Grounded in classical palmistry sources"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set(result.sources.map((s) => s.source))].map((src) => (
                            <span
                              key={src}
                              className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[10px] text-white/60"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Palm Lines */}
                <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                    <Hand className="h-4 w-4" /> {t.linesTitle}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {result.lines.map((line, i) => (
                      <PalmLineCard key={i} line={line} lang={lang} />
                    ))}
                  </div>
                </div>

                {/* Detail sections */}
                <ReadingSection
                  icon={<Heart className="h-4 w-4" />}
                  title={t.loveTitle}
                  content={lang === "hi" ? result.loveLifeHindi : result.loveLife}
                  lang={lang}
                  defaultOpen
                />
                <ReadingSection
                  icon={<Briefcase className="h-4 w-4" />}
                  title={t.careerTitle}
                  content={lang === "hi" ? result.careerHindi : result.career}
                  lang={lang}
                  defaultOpen
                />
                <ReadingSection
                  icon={<Activity className="h-4 w-4" />}
                  title={t.healthTitle}
                  content={lang === "hi" ? result.healthHindi : result.health}
                  lang={lang}
                />
                <ReadingSection
                  icon={<Coins className="h-4 w-4" />}
                  title={t.wealthTitle}
                  content={lang === "hi" ? result.wealthHindi : result.wealth}
                  lang={lang}
                />

                {/* Lucky Elements */}
                <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                    <Star className="h-4 w-4" /> {t.luckyTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: t.luckyNumber, value: result.luckyElements.number, emoji: "🔢" },
                      { label: t.luckyColor, value: result.luckyElements.color, emoji: "🎨" },
                      { label: t.luckyDay, value: result.luckyElements.day, emoji: "📅" },
                      { label: t.gemstone, value: result.luckyElements.gemstone, emoji: "💎" },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{item.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-white">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Personality Traits */}
                <div className="holo-border relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-ai)]">
                    <Gem className="h-4 w-4" /> {t.personalityTitle}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.personalityTraits.map((trait, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-full border border-[var(--color-ai)]/20 bg-[var(--color-ai)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-ai)]"
                      >
                        {trait}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Advice */}
                <ReadingSection
                  icon={<Sparkles className="h-4 w-4" />}
                  title={t.adviceTitle}
                  content={lang === "hi" ? result.adviceHindi : result.advice}
                  lang={lang}
                  defaultOpen
                />

                {/* Disclaimer */}
                <p className={`text-center text-[10px] text-white/25 ${lang === "hi" ? "font-[Noto_Sans_Devanagari,sans-serif]" : ""}`}>
                  {t.disclaimer}
                </p>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset} className="border-white/15 text-white/70 hover:text-white">
                    <RotateCcw className="mr-1.5 h-4 w-4" /> {t.newReading}
                  </Button>
                  <Link to="/kundli" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-glow)] text-[var(--color-primary)] font-bold shadow-[0_0_20px_rgba(232,168,56,0.25)]"
                    >
                      Generate Kundli ✨
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
