import { useEffect, useState, useId, cloneElement, Children, type ReactElement, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  User,
  Briefcase,
  Users,
  Heart,
  Phone,
  Eye,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  Check,
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Camera,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useBuilderStore } from "@/store/builderStore";
import { useAuthStore } from "@/store/authStore";
import {
  personalInfoSchema,
  careerInfoSchema,
  familyInfoSchema,
  aboutInfoSchema,
  contactInfoSchema,
} from "@/utils/validators";
import { defaultTemplates } from "@/utils/templateConfig";
import type { z } from "zod";
import type { Community, PersonalInfo, CareerInfo, FamilyInfo, AboutInfo } from "@/types/biodata.types";

// ─── Types ──────────────────────────────────────────────────────────────────
type PersonalForm = z.infer<typeof personalInfoSchema>;
type CareerForm = z.infer<typeof careerInfoSchema>;
type FamilyForm = z.infer<typeof familyInfoSchema>;
type AboutForm = z.infer<typeof aboutInfoSchema>;
type ContactForm = z.infer<typeof contactInfoSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Personal",  icon: User },
  { id: 2, label: "Career",    icon: Briefcase },
  { id: 3, label: "Family",    icon: Users },
  { id: 4, label: "About Me",  icon: Heart },
  { id: 5, label: "Contact",   icon: Phone },
  { id: 6, label: "Preview",   icon: Eye },
];

// suppress unused-import warning (defaultTemplates is kept for potential future use)
void defaultTemplates;

const COMMUNITIES: { value: Community; label: string; icon: string }[] = [
  { value: "hindu", label: "Hindu", icon: "🕉️" },
  { value: "muslim", label: "Muslim", icon: "☪️" },
  { value: "christian", label: "Christian", icon: "✝️" },
  { value: "sikh", label: "Sikh", icon: "☬" },
  { value: "jain", label: "Jain", icon: "🪷" },
  { value: "buddhist", label: "Buddhist", icon: "☸️" },
];

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];
const HEIGHTS = ["4'8\"","4'9\"","4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\""];
const LANGUAGES = ["Hindi", "English", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati", "Kannada", "Punjabi", "Malayalam", "Odia"];
const INCOME_RANGES = ["Below ₹3L", "₹3L–5L", "₹5L–8L", "₹8L–12L", "₹12L–20L", "₹20L–30L", "₹30L–50L", "Above ₹50L"];
const HOBBIES_LIST = ["Reading", "Traveling", "Cooking", "Music", "Dancing", "Sports", "Photography", "Painting", "Yoga", "Gardening", "Gaming", "Fitness", "Writing", "Singing", "Trekking"];

// ─── Shared field wrapper ─────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = useId();
  const errId = `${id}-error`;
  const child = cloneElement(
    Children.only(children) as ReactElement<Record<string, unknown>>,
    {
      id,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errId : undefined,
    }
  );
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-white/80">{label}</Label>
      {child}
      {error && <p id={errId} className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  error,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field label={label} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--color-surface)] text-white">
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

// ─── Add More Fields (reusable for every step) ──────────────────────────────
function ExtraFieldsEditor({
  fields,
  append,
  remove,
  register,
  errors,
  sectionLabel = "Additional Info",
}: {
  fields: { id: string }[];
  append: (v: { label: string; value: string }) => void;
  remove: (i: number) => void;
  register: (name: string) => ReturnType<ReturnType<typeof useForm>["register"]>;
  errors?: Record<string, { label?: { message?: string }; value?: { message?: string } }>;
  sectionLabel?: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
          {sectionLabel}
        </p>
        <button
          type="button"
          onClick={() => append({ label: "", value: "" })}
          className="flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20"
        >
          <Plus className="h-3 w-3" /> Add More
        </button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-white/30">
          Click "Add More" to add custom fields (e.g. Rashi, Nakshatra, Time of Birth, etc.)
        </p>
      )}
      {fields.map((field, idx) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              {...register(`extraFields.${idx}.label` as string)}
              placeholder="Field name (e.g. Rashi)"
              className="bg-white/5 text-white text-sm"
            />
            {errors?.[idx]?.label?.message && (
              <p className="mt-0.5 text-xs text-[var(--color-error)]">{errors[idx].label!.message}</p>
            )}
          </div>
          <div className="flex-1">
            <Input
              {...register(`extraFields.${idx}.value` as string)}
              placeholder="Value (e.g. Simha)"
              className="bg-white/5 text-white text-sm"
            />
            {errors?.[idx]?.value?.message && (
              <p className="mt-0.5 text-xs text-[var(--color-error)]">{errors[idx].value!.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="mt-1 rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Step Progress Bar ───────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="relative flex items-center justify-between">
      {/* Background track */}
      <div className="absolute left-[18px] right-[18px] top-[18px] h-[2px] bg-white/5" />
      {/* Filled track */}
      <motion.div
        className="absolute left-[18px] top-[18px] h-[2px] bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-ai)] to-[var(--color-indigo)]"
        initial={false}
        animate={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      {STEPS.map((step) => {
        const Icon = step.icon;
        const isComplete = current > step.id;
        const isActive = current === step.id;
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
            <motion.div
              animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={isActive ? { repeat: Infinity, repeatDelay: 2, duration: 1 } : {}}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isComplete
                  ? "border-[var(--color-ai)] bg-[var(--color-ai)]/20 text-[var(--color-ai)] shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : isActive
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)] shadow-[0_0_16px_rgba(232,168,56,0.3)]"
                  : "border-white/15 bg-white/5 text-white/30"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </motion.div>
            <span
              className={`hidden text-[10px] tracking-wider uppercase md:block ${
                isActive
                  ? "font-bold text-[var(--color-accent)]"
                  : isComplete
                  ? "font-medium text-[var(--color-ai)]"
                  : "text-white/30"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Photo Uploader Component ────────────────────────────────────────────────
function PhotoUploader({
  value,
  onChange,
  label,
  optional = false,
}: {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  optional?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);

  // Downscale to a max dimension and re-encode as JPEG so the persisted base64
  // data URL stays small (localStorage has a ~5 MB/origin budget).
  function downscale(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Sirf image file upload karein (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Photo 5 MB se kam honi chahiye. Chhoti photo chunein.");
      return;
    }
    setErr(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const small = await downscale(reader.result as string);
      onChange(small);
    };
    reader.onerror = () => setErr("Photo padhne mein dikkat hui. Dobara koshish karein.");
    reader.readAsDataURL(file);
  }
  return (
    <div className="space-y-2">
      <Label className="text-white/80">
        {label}
        {optional && <span className="ml-1.5 text-xs text-white/40">(Optional)</span>}
      </Label>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative h-40 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 border-[var(--color-accent)]/50 shadow-md">
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-cover"
              onError={() => {
                // Stale/corrupt stored value (e.g. old localStorage) — clear so the
                // upload placeholder shows instead of a broken-image icon.
                setErr("Pichhli photo load nahi hui — dobara upload karein.");
                onChange("");
              }}
            />
          </div>
        ) : (
          <div className="flex h-28 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-white/30">
            <Camera className="h-7 w-7" />
          </div>
        )}
        <div className="space-y-2">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/15">
              <Upload className="h-3.5 w-3.5" />
              {value ? "Change Photo" : "Upload Photo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="block text-xs text-red-400/70 hover:text-red-400"
            >
              Remove
            </button>
          )}
          <p className="text-xs text-white/40">JPG, PNG, WEBP — Max 5 MB</p>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Personal ────────────────────────────────────────────────────────
function Step1Personal({ onNext }: { onNext: () => void }) {
  const { personal, updatePersonal } = useBuilderStore();
  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<PersonalForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { ...personal, extraFields: personal.extraFields ?? [] },
  });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "extraFields" as never });

  const community = watch("community");
  const photoUrl = watch("photoUrl");
  const secondPhotoUrl = watch("secondPhotoUrl");

  // age is derived from dateOfBirth — keep them consistent
  const dob = watch("dateOfBirth");
  useEffect(() => {
    if (!dob) return;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    setValue("age", a, { shouldValidate: true });
  }, [dob, setValue]);

  // DOB bounds: no future dates (today is the upper limit), and not older than 100 years.
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayDate = new Date();
  const maxDob = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;
  const minDob = `${todayDate.getFullYear() - 100}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;

  function onSubmit(data: PersonalForm) {
    updatePersonal(data as PersonalInfo);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-[Cinzel,serif] text-2xl font-bold text-[var(--color-text-primary)]">Personal Details</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Tell us about yourself</p>
      </div>

      {/* Photos */}
      <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
        <PhotoUploader
          label="Profile Photo"
          value={photoUrl}
          onChange={(url) => setValue("photoUrl", url)}
        />
        <PhotoUploader
          label="Second Photo"
          value={secondPhotoUrl}
          onChange={(url) => setValue("secondPhotoUrl", url)}
          optional
        />
      </div>

      {/* Community Selector */}
      <div className="space-y-2">
        <Label className="text-white/80">Community *</Label>
        <Controller
          name="community"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {COMMUNITIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => field.onChange(c.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-all ${
                    field.value === c.value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        />
        {errors.community && <p className="text-xs text-[var(--color-error)]">{errors.community.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name *" error={errors.fullName?.message}>
          <Input placeholder="e.g. Priya Sharma" className="bg-white/5 text-white" {...register("fullName")} />
        </Field>

        <Field label="Date of Birth *" error={errors.dateOfBirth?.message}>
          {(() => {
            const dobReg = register("dateOfBirth");
            return (
              <Input
                type="date"
                min={minDob}
                max={maxDob}
                className="cursor-pointer bg-white/5 text-white"
                {...dobReg}
                // Calendar-only input: block all typing so unrealistic years
                // (e.g. "6786") can't be keyed in; the picker enforces min/max.
                onKeyDown={(e) => {
                  if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault();
                }}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => {
                  // Safety net in case a browser still lets a value through.
                  const v = e.target.value;
                  if (v && v > maxDob) e.target.value = maxDob;
                  else if (v && v < minDob) e.target.value = minDob;
                  dobReg.onChange(e);
                  void trigger("dateOfBirth");
                }}
              />
            );
          })()}
        </Field>

        <Field label="Age *" error={errors.age?.message}>
          <Input type="number" readOnly placeholder="25" className="bg-white/5 text-white" {...register("age", { valueAsNumber: true })} />
        </Field>

        <Controller
          name="height"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Height *"
              error={errors.height?.message}
              value={field.value}
              onChange={field.onChange}
              options={HEIGHTS.map((h) => ({ value: h, label: h }))}
              placeholder="Select height"
            />
          )}
        />

        <Controller
          name="bloodGroup"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Blood Group *"
              error={errors.bloodGroup?.message}
              value={field.value}
              onChange={field.onChange}
              options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
              placeholder="Select"
            />
          )}
        />

        <Controller
          name="complexion"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Complexion *"
              error={errors.complexion?.message}
              value={field.value}
              onChange={field.onChange}
              options={["Fair", "Very Fair", "Wheatish", "Wheatish Brown", "Dark"].map((v) => ({ value: v, label: v }))}
              placeholder="Select"
            />
          )}
        />

        <Field label="Mother Tongue *" error={errors.motherTongue?.message}>
          <Input placeholder="e.g. Hindi" className="bg-white/5 text-white" {...register("motherTongue")} />
        </Field>

        <Controller
          name="maritalStatus"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Marital Status *"
              error={errors.maritalStatus?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "never_married", label: "Never Married" },
                { value: "divorced", label: "Divorced" },
                { value: "widowed", label: "Widowed" },
                { value: "awaiting_divorce", label: "Awaiting Divorce" },
              ]}
            />
          )}
        />
      </div>

      {/* Languages Known */}
      <div className="space-y-2">
        <Label className="text-white/80">Languages Known *</Label>
        <Controller
          name="languagesKnown"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    const current = field.value ?? [];
                    field.onChange(
                      current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang]
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition-all ${
                    (field.value ?? []).includes(lang)
                      ? "bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold"
                      : "border border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        />
        {errors.languagesKnown && <p className="text-xs text-[var(--color-error)]">{errors.languagesKnown.message}</p>}
      </div>

      {/* Community-specific fields */}
      {community === "hindu" && (
        <div className="grid gap-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 md:grid-cols-2">
          <p className="col-span-2 text-xs font-semibold text-orange-400">🕉️ Hindu-specific Details</p>
          <Field label="Caste" error={errors.caste?.message}>
            <Input placeholder="e.g. Brahmin" className="bg-white/5 text-white" {...register("caste")} />
          </Field>
          <Field label="Sub-Caste" error={errors.subCaste?.message}>
            <Input placeholder="e.g. Iyer" className="bg-white/5 text-white" {...register("subCaste")} />
          </Field>
          <Field label="Gotra" error={errors.gotra?.message}>
            <Input placeholder="e.g. Kashyap" className="bg-white/5 text-white" {...register("gotra")} />
          </Field>
          <Controller
            name="manglik"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Manglik Status"
                value={field.value ?? ""}
                onChange={field.onChange}
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "partial", label: "Partial/Anshik" }]}
                placeholder="Select"
              />
            )}
          />

          {/* Manglik Verification Add-on */}
          <div className="col-span-2 rounded-xl border border-[var(--color-accent)]/25 bg-gradient-to-r from-[var(--color-accent)]/5 to-[var(--color-indigo)]/5 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-2xl">🔮</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[var(--color-accent)]">Manglik Verification via AI Kundli</p>
                  <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)]">₹10 add-on in Biodata PDF</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Not sure about Manglik status? Generate a free AI Kundli to verify it accurately from your birth chart.
                  Add the verified result to your Biodata PDF as a premium add-on for just ₹10.
                </p>
              </div>
              <Link to="/kundli" className="shrink-0">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 text-xs font-semibold"
                >
                  Verify Free →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {community === "muslim" && (
        <div className="grid gap-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4 md:grid-cols-2">
          <p className="col-span-2 text-xs font-semibold text-green-400">☪️ Muslim-specific Details</p>
          <Field label="Sect" error={errors.sect?.message}>
            <Input placeholder="e.g. Sunni, Shia" className="bg-white/5 text-white" {...register("sect")} />
          </Field>
          <Field label="Maslak" error={errors.maslak?.message}>
            <Input placeholder="e.g. Hanafi" className="bg-white/5 text-white" {...register("maslak")} />
          </Field>
        </div>
      )}

      {community === "christian" && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="mb-3 text-xs font-semibold text-blue-400">✝️ Christian-specific Details</p>
          <Field label="Denomination" error={errors.denomination?.message}>
            <Input placeholder="e.g. Catholic, Protestant" className="bg-white/5 text-white" {...register("denomination")} />
          </Field>
        </div>
      )}

      {community === "jain" && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="mb-3 text-xs font-semibold text-purple-400">🪷 Jain-specific Details</p>
          <Field label="Jain Sect" error={errors.jainSect?.message}>
            <Input placeholder="e.g. Digambar, Shvetambar" className="bg-white/5 text-white" {...register("jainSect")} />
          </Field>
        </div>
      )}

      {/* Extra custom fields */}
      <ExtraFieldsEditor
        fields={extraFields}
        append={appendExtra}
        remove={removeExtra}
        register={register as never}
        errors={(errors as Record<string, unknown>).extraFields as never}
        sectionLabel="Additional Personal Details"
      />

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-glow)]">
          Next: Career <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Career ──────────────────────────────────────────────────────────
function Step2Career({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { career, updateCareer } = useBuilderStore();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CareerForm>({
    resolver: zodResolver(careerInfoSchema),
    defaultValues: { ...career, extraFields: career.extraFields ?? [] },
  });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "extraFields" as never });

  const workingAbroad = watch("workingAbroad");

  function onSubmit(data: CareerForm) {
    updateCareer(data as CareerInfo);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-[Cinzel,serif] text-2xl font-bold text-[var(--color-text-primary)]">Career & Education</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your educational &amp; professional details</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="highestEducation"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Highest Education *"
              error={errors.highestEducation?.message}
              value={field.value}
              onChange={field.onChange}
              options={["High School", "Diploma", "B.A.", "B.Sc.", "B.Com.", "B.Tech/B.E.", "B.B.A.", "M.A.", "M.Sc.", "M.Com.", "M.Tech", "M.B.A.", "M.B.B.S.", "Ph.D.", "Other"].map((v) => ({ value: v, label: v }))}
              placeholder="Select qualification"
            />
          )}
        />

        <Field label="Field of Study *" error={errors.fieldOfStudy?.message}>
          <Input placeholder="e.g. Computer Science" className="bg-white/5 text-white" {...register("fieldOfStudy")} />
        </Field>

        <Field label="College / University *" error={errors.college?.message}>
          <Input placeholder="e.g. IIT Delhi" className="bg-white/5 text-white" {...register("college")} />
        </Field>

        <Field label="Additional Qualifications" error={errors.additionalQualifications?.message}>
          <Input placeholder="e.g. CA, CFA" className="bg-white/5 text-white" {...register("additionalQualifications")} />
        </Field>

        <Controller
          name="employmentType"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Employment Type *"
              error={errors.employmentType?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "salaried", label: "Salaried" },
                { value: "business", label: "Business / Self-Employed" },
                { value: "government", label: "Government / PSU" },
                { value: "doctor", label: "Doctor" },
                { value: "lawyer", label: "Lawyer" },
                { value: "not_working", label: "Not Working" },
                { value: "student", label: "Student" },
              ]}
            />
          )}
        />

        <Field label="Company / Business Name *" error={errors.companyName?.message}>
          <Input placeholder="e.g. Infosys Ltd." className="bg-white/5 text-white" {...register("companyName")} />
        </Field>

        <Field label="Job Title / Designation *" error={errors.jobTitle?.message}>
          <Input placeholder="e.g. Software Engineer" className="bg-white/5 text-white" {...register("jobTitle")} />
        </Field>

        <Controller
          name="annualIncome"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Annual Income *"
              error={errors.annualIncome?.message}
              value={field.value}
              onChange={field.onChange}
              options={INCOME_RANGES.map((v) => ({ value: v, label: v }))}
              placeholder="Select range"
            />
          )}
        />

        <Field label="Work City *" error={errors.workCity?.message}>
          <Input placeholder="e.g. Bengaluru" className="bg-white/5 text-white" {...register("workCity")} />
        </Field>
      </div>

      {/* Working Abroad toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <Controller
          name="workingAbroad"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="workingAbroad"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
          )}
        />
        <Label htmlFor="workingAbroad" className="cursor-pointer text-white/80">
          Working / Settled Abroad
        </Label>
      </div>

      {workingAbroad && (
        <div className="grid gap-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 md:grid-cols-2">
          <Field label="Country of Residence" error={errors.countryOfResidence?.message}>
            <Input placeholder="e.g. USA" className="bg-white/5 text-white" {...register("countryOfResidence")} />
          </Field>
          <Field label="Visa Type" error={errors.visaType?.message}>
            <Input placeholder="e.g. H1B, PR" className="bg-white/5 text-white" {...register("visaType")} />
          </Field>
          <div className="col-span-2 flex items-center gap-3">
            <Controller
              name="openToReturnIndia"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="returnIndia"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
              )}
            />
            <Label htmlFor="returnIndia" className="cursor-pointer text-white/80">
              Open to settling back in India
            </Label>
          </div>
        </div>
      )}

      {/* Extra custom fields */}
      <ExtraFieldsEditor
        fields={extraFields}
        append={appendExtra}
        remove={removeExtra}
        register={register as never}
        errors={(errors as Record<string, unknown>).extraFields as never}
        sectionLabel="Additional Career Details"
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="submit" size="lg" className="bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-glow)]">
          Next: Family <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3: Family ──────────────────────────────────────────────────────────
function Step3Family({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { family, updateFamily } = useBuilderStore();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FamilyForm>({
    resolver: zodResolver(familyInfoSchema),
    defaultValues: { ...family, extraFields: family.extraFields ?? [] },
  });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "extraFields" as never });

  function onSubmit(data: FamilyForm) {
    updateFamily(data as FamilyInfo);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-[Cinzel,serif] text-2xl font-bold text-[var(--color-text-primary)]">Family Background</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Tell us about your family</p>
      </div>

      {/* Father */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Father's Details</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Father's Name *" error={errors.fatherName?.message}>
            <Input placeholder="e.g. Rajesh Sharma" className="bg-white/5 text-white" {...register("fatherName")} />
          </Field>
          <Field label="Occupation *" error={errors.fatherOccupation?.message}>
            <Input placeholder="e.g. Businessman" className="bg-white/5 text-white" {...register("fatherOccupation")} />
          </Field>
          <Controller
            name="fatherStatus"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Status *"
                error={errors.fatherStatus?.message}
                value={field.value}
                onChange={field.onChange}
                options={[{ value: "Alive", label: "Alive" }, { value: "Late", label: "Late / Deceased" }, { value: "Retired", label: "Retired" }]}
                placeholder="Select"
              />
            )}
          />
        </div>
      </div>

      {/* Mother */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Mother's Details</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Mother's Name *" error={errors.motherName?.message}>
            <Input placeholder="e.g. Sunita Sharma" className="bg-white/5 text-white" {...register("motherName")} />
          </Field>
          <Field label="Occupation *" error={errors.motherOccupation?.message}>
            <Input placeholder="e.g. Homemaker" className="bg-white/5 text-white" {...register("motherOccupation")} />
          </Field>
          <Controller
            name="motherStatus"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Status *"
                error={errors.motherStatus?.message}
                value={field.value}
                onChange={field.onChange}
                options={[{ value: "Alive", label: "Alive" }, { value: "Late", label: "Late / Deceased" }, { value: "Retired", label: "Retired (Homemaker)" }]}
                placeholder="Select"
              />
            )}
          />
        </div>
      </div>

      {/* Siblings */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Siblings</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { name: "brothers" as const, label: "Brothers" },
            { name: "marriedBrothers" as const, label: "Married Brothers" },
            { name: "sisters" as const, label: "Sisters" },
            { name: "marriedSisters" as const, label: "Married Sisters" },
          ].map(({ name, label }) => (
            <Field key={name} label={label} error={errors[name]?.message}>
              <Input type="number" min={0} max={10} className="bg-white/5 text-white" {...register(name, { valueAsNumber: true })} />
            </Field>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="familyType"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Family Type *"
              error={errors.familyType?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "nuclear", label: "Nuclear" },
                { value: "joint", label: "Joint" },
                { value: "extended", label: "Extended" },
              ]}
            />
          )}
        />

        <Controller
          name="familyValues"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Family Values *"
              error={errors.familyValues?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "traditional", label: "Traditional" },
                { value: "moderate", label: "Moderate" },
                { value: "liberal", label: "Liberal" },
              ]}
            />
          )}
        />

        <Field label="Native Place *" error={errors.nativePlace?.message}>
          <Input placeholder="e.g. Jaipur, Rajasthan" className="bg-white/5 text-white" {...register("nativePlace")} />
        </Field>

        <Field label="Family City *" error={errors.familyCity?.message}>
          <Input placeholder="e.g. Mumbai" className="bg-white/5 text-white" {...register("familyCity")} />
        </Field>
      </div>

      <Field label="About Family (optional)" error={errors.aboutFamily?.message}>
        <Textarea
          placeholder="Brief description about your family background, values, lifestyle..."
          rows={3}
          className="bg-white/5 text-white"
          {...register("aboutFamily")}
        />
      </Field>

      {/* Extra custom fields */}
      <ExtraFieldsEditor
        fields={extraFields}
        append={appendExtra}
        remove={removeExtra}
        register={register as never}
        errors={(errors as Record<string, unknown>).extraFields as never}
        sectionLabel="Additional Family Details"
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="submit" size="lg" className="bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-glow)]">
          Next: About Me <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 4: About Me ────────────────────────────────────────────────────────
function Step4About({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { about, updateAbout } = useBuilderStore();
  const [rewritingField, setRewritingField] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<AboutForm>({
    resolver: zodResolver(aboutInfoSchema),
    defaultValues: { ...about, extraFields: about.extraFields ?? [] },
  });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "extraFields" as never });

  async function handleAIRewrite(field: "aboutMe" | "partnerExpectations") {
    const currentValue = field === "aboutMe" ? watch("aboutMe") : watch("partnerExpectations");
    if (!currentValue || currentValue.length < 3) return;
    setRewritingField(field);
    setRewriteError(null);
    try {
      const { callGroq } = await import("@/lib/groq");
      const feature = field === "aboutMe" ? "rewrite_about" : "rewrite_expectations";
      const rewritten = await callGroq(feature, currentValue);
      setValue(field, rewritten, { shouldValidate: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI rewrite failed";
      // Surface a user-friendly message
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setRewriteError("AI quota reached — please try again in a minute.");
      } else {
        setRewriteError("AI rewrite failed. Check your internet connection.");
      }
    } finally {
      setRewritingField(null);
    }
  }

  function onSubmit(data: AboutForm) {
    updateAbout(data as AboutInfo);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-[Cinzel,serif] text-2xl font-bold text-[var(--color-text-primary)]">About You &amp; Preferences</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Let your personality shine</p>
      </div>

      {/* AI error banner */}
      {rewriteError && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-2.5 text-sm text-[var(--color-error)]">
          <span>⚠</span>
          <span className="flex-1">{rewriteError}</span>
          <button type="button" onClick={() => setRewriteError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Hobbies */}
      <div className="space-y-2">
        <Label className="text-white/80">Hobbies &amp; Interests *</Label>
        <Controller
          name="hobbies"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {HOBBIES_LIST.map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => {
                    const current = field.value ?? [];
                    field.onChange(
                      current.includes(hobby) ? current.filter((h) => h !== hobby) : [...current, hobby]
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition-all ${
                    (field.value ?? []).includes(hobby)
                      ? "bg-[var(--color-indigo)] text-white font-semibold"
                      : "border border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          )}
        />
        {errors.hobbies && <p className="text-xs text-[var(--color-error)]">{errors.hobbies.message}</p>}
      </div>

      {/* About Me */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-white/80">About Me * <span className="text-white/40">(min 50 chars)</span></Label>
          <button
            type="button"
            onClick={() => handleAIRewrite("aboutMe")}
            disabled={rewritingField === "aboutMe"}
            title="Type your key points below, then click to expand into a full paragraph"
            className="flex items-center gap-1 rounded-full bg-[var(--color-ai)]/10 px-3 py-1 text-xs text-[var(--color-ai)] transition hover:bg-[var(--color-ai)]/20"
          >
            {rewritingField === "aboutMe" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Rewrite
          </button>
        </div>
        <p className="text-xs text-white/40">💡 Type a few words or bullet points — AI Rewrite will expand them into a proper paragraph.</p>
        <Textarea
          placeholder="Jot down your key points, e.g: family-oriented, love cooking, software engineer, values honesty... AI will write the paragraph for you"
          rows={4}
          className="bg-white/5 text-white"
          {...register("aboutMe")}
        />
        {errors.aboutMe && <p className="text-xs text-[var(--color-error)]">{errors.aboutMe.message}</p>}
      </div>

      {/* Partner Expectations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-white/80">Partner Expectations * <span className="text-white/40">(min 50 chars)</span></Label>
          <button
            type="button"
            onClick={() => handleAIRewrite("partnerExpectations")}
            disabled={rewritingField === "partnerExpectations"}
            title="Type your key points below, then click to expand into a full paragraph"
            className="flex items-center gap-1 rounded-full bg-[var(--color-ai)]/10 px-3 py-1 text-xs text-[var(--color-ai)] transition hover:bg-[var(--color-ai)]/20"
          >
            {rewritingField === "partnerExpectations" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Rewrite
          </button>
        </div>
        <p className="text-xs text-white/40">💡 Type a few words or bullet points — AI Rewrite will expand them into a proper paragraph.</p>
        <Textarea
          placeholder="Jot down your key points, e.g: educated, good family, caring, height 5ft 8in+, non-smoker... AI will write the paragraph for you"
          rows={4}
          className="bg-white/5 text-white"
          {...register("partnerExpectations")}
        />
        {errors.partnerExpectations && <p className="text-xs text-[var(--color-error)]">{errors.partnerExpectations.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Controller
          name="diet"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Diet"
              error={errors.diet?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "vegetarian", label: "Vegetarian" },
                { value: "jain_vegetarian", label: "Jain Vegetarian" },
                { value: "eggetarian", label: "Eggetarian" },
                { value: "occasionally_non_veg", label: "Occasionally Non-Veg" },
                { value: "non_vegetarian", label: "Non-Vegetarian" },
              ]}
            />
          )}
        />

        <Controller
          name="smoking"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Smoking"
              error={errors.smoking?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "never", label: "Never" },
                { value: "occasionally", label: "Occasionally" },
                { value: "yes", label: "Yes" },
              ]}
            />
          )}
        />

        <Controller
          name="drinking"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Drinking"
              error={errors.drinking?.message}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "never", label: "Never" },
                { value: "occasionally", label: "Occasionally" },
                { value: "yes", label: "Yes" },
              ]}
            />
          )}
        />
      </div>

      <Field label="Physical Disability (if any)" error={errors.physicalDisability?.message}>
        <Input placeholder='Write "None" if not applicable' className="bg-white/5 text-white" {...register("physicalDisability")} />
      </Field>

      {/* Extra custom fields */}
      <ExtraFieldsEditor
        fields={extraFields}
        append={appendExtra}
        remove={removeExtra}
        register={register as never}
        errors={(errors as Record<string, unknown>).extraFields as never}
        sectionLabel="Additional Lifestyle Details"
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="submit" size="lg" className="bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-glow)]">
          Next: Contact Details <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}


// ─── Step 5: Contact Details ──────────────────────────────────────────────────
function Step5Contact({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { contact, updateContact } = useBuilderStore();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: { ...contact, extraFields: contact.extraFields ?? [] },
  });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "extraFields" as never });

  function onSubmit(data: ContactForm) {
    updateContact(data);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-[Cinzel,serif] text-2xl font-bold text-[var(--color-text-primary)]">Contact Details</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">These details will appear at the bottom of your biodata</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact Person Name" error={errors.contactName?.message}>
          <Input
            {...register("contactName")}
            placeholder="e.g. Rajesh Gupta (Father)"
            className="bg-white/5 text-white"
          />
        </Field>
        <Field label="Phone Number" error={errors.phone?.message}>
          {(() => {
            const phoneReg = register("phone");
            return (
              <Input
                {...phoneReg}
                onChange={(e) => {
                  // Keep digits only, cap at 10 (Indian mobile) — blocks >10 chars as you type
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  phoneReg.onChange(e);
                }}
                placeholder="9876543210"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="bg-white/5 text-white"
              />
            );
          })()}
        </Field>
      </div>

      <Field label="Email Address" error={errors.email?.message}>
        <Input
          {...register("email")}
          placeholder="family@email.com"
          type="email"
          className="bg-white/5 text-white"
        />
      </Field>

      <Field label="Address (House No., Street, Area)" error={errors.address?.message}>
        <Input
          {...register("address")}
          placeholder="12, Rose Garden Society, Near City Mall"
          className="bg-white/5 text-white"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="City" error={errors.city?.message}>
          <Input
            {...register("city")}
            placeholder="Mumbai"
            className="bg-white/5 text-white"
          />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <Input
            {...register("state")}
            placeholder="Maharashtra"
            className="bg-white/5 text-white"
          />
        </Field>
      </div>

      {/* Extra custom fields */}
      <ExtraFieldsEditor
        fields={extraFields}
        append={appendExtra}
        remove={removeExtra}
        register={register as never}
        errors={(errors as Record<string, unknown>).extraFields as never}
        sectionLabel="Additional Contact Details"
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="submit" size="lg" className="bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-glow)]">
          Preview Biodata <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 6: Preview + Download ───────────────────────────────────────────────
// ─── Template options for the picker ─────────────────────────────────────────
const TEMPLATE_OPTIONS = [
  {
    id: "tpl_brown_01",
    name: "Brown Vintage Classic",
    description: "Elegant vintage border, serif layout",
    accent: "#8B6914",
  },
  {
    id: "tpl_beige_01",
    name: "Beige Vintage Watercolor",
    description: "Soft warm beige, watercolor border",
    accent: "#A1887F",
  },
  {
    id: "tpl_green_01",
    name: "Green Floral Feminine",
    description: "Fresh green floral page border",
    accent: "#4CAF50",
  },
  {
    id: "tpl_elegant_01",
    name: "Elegant Minimalist",
    description: "Clean modern minimal design",
    accent: "#757575",
  },
  {
    id: "tpl_blue_01",
    name: "Blue Ribbon Frame",
    description: "Cute blue-beige ribbon frame",
    accent: "#1976D2",
  },
  {
    id: "tpl_beigebrown_01",
    name: "Beige Brown Minimalist",
    description: "Trendy minimalist beige-brown border",
    accent: "#795548",
  },
  {
    id: "tpl_bw_01",
    name: "Black & White Elegant",
    description: "Classic B&W traditional ornate border",
    accent: "#333333",
  },
  {
    id: "tpl_ok_01",
    name: "Modern Clean",
    description: "Fresh modern clean layout",
    accent: "#7F8C8D",
  },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

// ─────────────────────────────────────────────────────────────────────────────
function Step6Preview({ onPrev }: { onPrev: () => void }) {
  const store  = useBuilderStore();
  const { user } = useAuthStore();
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [rendering, setRendering] = useState(true);
  const [paying, setPaying]       = useState(false);
  const [pdfError, setPdfError]   = useState<string | null>(null);
  const [selectedTpl, setSelectedTpl] = useState<TemplateId>("tpl_brown_01");

  const formData = {
    personal: store.personal,
    career:   store.career,
    family:   store.family,
    about:    store.about,
    contact:  store.contact,
    templateId: selectedTpl,
  };

  // Stable JSON key for formData — re-render only when content actually changes
  const formDataKey = JSON.stringify(formData);

  // Re-render when template or form data changes (debounced 400ms to avoid thrashing)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const { renderGenericToCanvasPages } = await import("@/lib/genericTemplateRenderer");
        const { TEMPLATE_THEMES } = await import("@/lib/templateThemes");
        const theme = TEMPLATE_THEMES[selectedTpl];
        if (!theme) throw new Error(`Unknown template: ${selectedTpl}`);
        const pages = await renderGenericToCanvasPages(formData, theme);
        if (!cancelled) {
          setPageImages(pages.map((c) => c.toDataURL("image/jpeg", 0.92)));
          setRendering(false);
        }
      } catch (e) {
        console.error("Canvas render error", e);
        if (!cancelled) setRendering(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTpl, formDataKey]);

  async function handleDownloadPDF() {
    setPaying(true);
    setPdfError(null);
    try {
      const { generateBiodataPDF, downloadBlob } = await import("@/lib/pdfGenerator");
      const blob = await generateBiodataPDF(formData, selectedTpl);
      downloadBlob(blob, `${store.personal.fullName.replace(/ /g, "_")}_Biodata.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      setPdfError("PDF banane mein dikkat aayi — dobara try karein.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Futuristic header with glow */}
      <div className="relative">
        <div className="glow-orb -left-10 -top-10 h-32 w-32 bg-[var(--color-ai)]" />
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-accent)] to-[var(--color-saffron)] bg-clip-text font-[Cinzel,serif] text-2xl font-bold text-transparent md:text-3xl"
        >
          Biodata Preview
        </motion.h2>
        <p className="relative z-10 mt-1.5 text-sm tracking-wide text-[var(--color-text-muted)]">
          Select a design, then download your finished PDF
        </p>
      </div>

      {/* Template picker — holographic cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TEMPLATE_OPTIONS.map((tpl) => {
          const active = selectedTpl === tpl.id;
          return (
            <motion.button
              key={tpl.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedTpl(tpl.id)}
              className={[
                "holo-shimmer relative rounded-xl border p-3 text-left transition-all duration-300",
                active
                  ? "border-[var(--color-ai)] bg-[var(--color-ai)]/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <div
                className="mb-2 h-1.5 w-full rounded-full"
                style={{
                  background: active
                    ? `linear-gradient(90deg, ${tpl.accent}, var(--color-ai))`
                    : tpl.accent,
                  opacity: active ? 1 : 0.6,
                }}
              />
              <p className={`text-sm font-semibold ${active ? "text-white" : "text-white/60"}`}>{tpl.name}</p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{tpl.description}</p>
              {active && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ai)]"
                >
                  <Check className="h-3 w-3" /> Selected
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Preview area — futuristic container */}
      {rendering ? (
        <div className="scan-lines relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-ai)]/20 bg-[var(--color-surface)] py-24">
          <div className="glow-orb left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-ai)]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 text-[var(--color-ai)]" />
          </motion.div>
          <span className="text-sm font-medium tracking-wider text-[var(--color-ai)]/80">RENDERING BIODATA…</span>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-ai)] to-[var(--color-accent)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {pageImages.map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="holo-border relative overflow-hidden rounded-2xl shadow-2xl"
            >
              {pageImages.length > 1 && (
                <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-[var(--color-ai)]/30 bg-black/70 px-3 py-1 text-xs font-bold tracking-wider text-[var(--color-ai)] backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ai)] shadow-[0_0_6px_var(--color-ai)]" />
                  {idx + 1} / {pageImages.length}
                </div>
              )}
              <img
                src={src}
                alt={`Biodata page ${idx + 1}`}
                className="relative z-[1] w-full"
                draggable={false}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Page count — futuristic info bar */}
      {!rendering && pageImages.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-[var(--color-ai)]/20 bg-[var(--color-ai)]/5 px-4 py-3 text-sm"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ai)]/20 text-xs font-bold text-[var(--color-ai)]">
            {pageImages.length}
          </span>
          <span className="text-[var(--color-ai)]/90">
            Your biodata spans <strong className="text-white">{pageImages.length} pages</strong> — all included in the final PDF.
          </span>
        </motion.div>
      )}

      {/* PDF error banner */}
      {pdfError && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-2.5 text-sm text-[var(--color-error)]">
          <span>⚠</span>
          <span className="flex-1">{pdfError}</span>
          <button type="button" onClick={() => setPdfError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onPrev}
          className="border-white/15 text-white/70 hover:border-white/30 hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-glow)] to-[var(--color-accent)] bg-[length:200%_100%] text-[var(--color-primary)] font-bold tracking-wide shadow-[0_0_20px_rgba(232,168,56,0.25)] transition-all hover:bg-right hover:shadow-[0_0_30px_rgba(232,168,56,0.4)]"
            onClick={handleDownloadPDF}
            disabled={paying || rendering}
          >
            {paying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF…</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Download PDF</>
            )}
          </Button>
        </motion.div>
      </div>

      {!user && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-indigo)]/20 bg-[var(--color-indigo)]/5 px-4 py-3 text-sm text-[var(--color-indigo)]">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            <Link to="/auth" className="font-semibold underline hover:text-white">Sign in</Link> to save this biodata and re-download anytime.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Builder Page ────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { currentStep, nextStep, prevStep } = useBuilderStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary)]">
      {/* Ambient glow orbs */}
      <div className="glow-orb -left-20 top-20 h-64 w-64 bg-[var(--color-indigo)]" style={{ animationDelay: "0s" }} />
      <div className="glow-orb -right-20 top-[40%] h-48 w-48 bg-[var(--color-ai)]" style={{ animationDelay: "2s" }} />
      <div className="glow-orb bottom-10 left-[30%] h-56 w-56 bg-[var(--color-accent)]" style={{ animationDelay: "1s", opacity: 0.15 }} />

      {/* Header — sacred glass morphism */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-accent)]/10 bg-[var(--color-primary)]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <div className="h-4 w-px bg-[var(--color-accent)]/15" />
          <span className="bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text font-[Cinzel,serif] text-sm font-bold text-transparent">
            📜 Biodata Builder
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[11px] font-medium tracking-widest uppercase text-[var(--color-accent)]/60 sm:inline">
              Step {currentStep} / 6
            </span>
            {/* Mini progress bar */}
            <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-[var(--color-accent)]/10 sm:block">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-saffron)] to-[var(--color-accent)]"
                initial={false}
                animate={{ width: `${(currentStep / 6) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 container mx-auto max-w-3xl px-6 py-8">
        {/* Step bar */}
        <div className="mb-10">
          <StepBar current={currentStep} />
        </div>

        {/* Step content — holo border card */}
        <div className="holo-border scan-lines relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && <Step1Personal onNext={nextStep} />}
              {currentStep === 2 && <Step2Career onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 3 && <Step3Family onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 4 && <Step4About onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 5 && <Step5Contact onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 6 && <Step6Preview onPrev={prevStep} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auto-save note */}
        <p className="mt-5 text-center text-[11px] tracking-wider uppercase text-[var(--color-text-muted)]/50">
          ✦ Progress auto-saved in your browser
        </p>
      </div>
    </div>
  );
}

