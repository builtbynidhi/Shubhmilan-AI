/**
 * CalibratePage — Dev-only tool to visually check template field positions.
 * Visit /calibrate in dev mode to see colored dots on the template showing
 * exactly where each field is placed. Use this to adjust theme/layout constants
 * in src/lib/templateThemes.ts and src/lib/genericTemplateRenderer.ts.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/builderStore";
import type { BiodataFormData } from "@/types/biodata.types";

const SAMPLE: BiodataFormData = {
  personal: {
    community: "hindu",
    fullName: "Priya Sharma",
    dateOfBirth: "1997-03-15",
    age: 27,
    height: "5'4\"",
    complexion: "Fair",
    bloodGroup: "B+",
    motherTongue: "Hindi",
    languagesKnown: ["Hindi", "English", "Marathi"],
    maritalStatus: "never_married",
    caste: "Brahmin",
    gotra: "Kashyap",
    manglik: "no",
  },
  career: {
    highestEducation: "B.Tech (Computer Science)",
    fieldOfStudy: "Computer Science",
    college: "IIT Delhi",
    employmentType: "salaried",
    companyName: "TCS — Tata Consultancy Services",
    jobTitle: "Software Engineer",
    annualIncome: "₹8L–12L",
    workCity: "Pune",
    workingAbroad: false,
  },
  family: {
    fatherName: "Suresh Sharma",
    fatherOccupation: "Retired Govt. Officer",
    fatherStatus: "Alive",
    motherName: "Sunita Sharma",
    motherOccupation: "Homemaker",
    motherStatus: "Alive",
    brothers: 1,
    marriedBrothers: 1,
    sisters: 1,
    marriedSisters: 0,
    familyType: "joint",
    familyValues: "traditional",
    nativePlace: "Lucknow, UP",
    familyCity: "Lucknow",
    aboutFamily: "A respected traditional family in Lucknow with strong cultural values.",
  },
  about: {
    hobbies: ["Reading", "Cooking", "Yoga", "Travel"],
    aboutMe: "I am a cheerful, family-oriented girl who loves to balance a professional career with traditional values.",
    partnerExpectations: "Looking for a well-educated, respectful, and caring partner who values family.",
    diet: "vegetarian",
    smoking: "never",
    drinking: "never",
    physicalDisability: "None",
  },
  contact: {
    contactName: "Suresh Sharma (Father)",
    phone: "+91 98765 43210",
    email: "sharma.family@gmail.com",
    address: "12, Rose Garden Society, Gomti Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
  },
  templateId: "tpl_brown_01",
};

const TEMPLATE_IDS = [
  "tpl_brown_01",
  "tpl_beige_01",
  "tpl_green_01",
  "tpl_elegant_01",
  "tpl_blue_01",
  "tpl_beigebrown_01",
  "tpl_bw_01",
  "tpl_ok_01",
] as const;

export default function CalibratePage() {
  const store = useBuilderStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [useStore, setUseStore] = useState(false);
  const [calibrate, setCalibrate] = useState(true);
  const [selectedTpl, setSelectedTpl] = useState<string>("tpl_brown_01");

  async function render() {
    if (!canvasRef.current) return;
    setRendering(true);
    const { renderGenericToCanvas } = await import("@/lib/genericTemplateRenderer");
    const { TEMPLATE_THEMES } = await import("@/lib/templateThemes");
    const theme = TEMPLATE_THEMES[selectedTpl];
    if (!theme) { setRendering(false); return; }
    const data = useStore
      ? { personal: store.personal, career: store.career, family: store.family, about: store.about, contact: store.contact, templateId: selectedTpl }
      : { ...SAMPLE, templateId: selectedTpl };
    await renderGenericToCanvas(canvasRef.current, data, theme, { calibrate });
    setRendering(false);
  }

  useEffect(() => { void render(); }, [useStore, calibrate, selectedTpl]);

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/builder" className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Builder
            </Link>
            <span className="text-white/20">|</span>
            <h1 className="text-lg font-bold text-white">Coordinate Calibration</h1>
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">DEV ONLY</span>
          </div>
          <Button size="sm" onClick={render} disabled={rendering} className="gap-1 bg-white/10 text-white hover:bg-white/20">
            <RefreshCw className={`h-3.5 w-3.5 ${rendering ? "animate-spin" : ""}`} />
            Re-render
          </Button>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-white">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={calibrate} onChange={e => setCalibrate(e.target.checked)} className="accent-yellow-400" />
            Show calibration dots
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={useStore} onChange={e => setUseStore(e.target.checked)} className="accent-blue-400" />
            Use my form data (instead of sample)
          </label>
          <select
            value={selectedTpl}
            onChange={e => setSelectedTpl(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white"
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id} className="bg-gray-900">{id}</option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="mb-4 rounded-lg bg-blue-900/30 border border-blue-500/20 px-4 py-3 text-xs text-blue-300">
          <strong>How to adjust:</strong> Dots show field anchor points. Edit theme configs in{" "}
          <code className="rounded bg-blue-900/50 px-1 py-0.5">src/lib/templateThemes.ts</code>, then hit Re-render.
        </div>

        {/* Canvas preview */}
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-xl">
          <div className="relative bg-gray-800" style={{ paddingBottom: `${(2000 / 1414) * 100}%` }}>
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                Rendering…
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: rendering ? "none" : "block" }}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          Template size: 1414 × 2000 px • Canvas scales to fit browser window
        </p>
      </div>
    </div>
  );
}
