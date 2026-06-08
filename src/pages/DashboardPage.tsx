import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ScrollText,
  Star,
  Hand,
  Heart,
  LogOut,
  ArrowRight,
  Loader2,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useBiodata } from "@/hooks/useBiodata";
import { useKundli } from "@/hooks/useKundli";
import { useBuilderStore } from "@/store/builderStore";
import { displayName } from "@/utils/userDisplay";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

function fmtDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user, profile);

  const { biodataList, deleteBiodata } = useBiodata();
  const { kundliList, deleteKundli } = useKundli();
  const loadBiodata = useBuilderStore((s) => s.loadBiodata);

  const biodatas = biodataList.data ?? [];
  const kundlis = kundliList.data ?? [];

  const tools = [
    { icon: "📜", lucide: <ScrollText className="h-5 w-5" />, title: "Create Biodata", desc: "Build a beautiful marriage biodata with AI assistance", link: "/builder", color: "var(--color-accent)" },
    { icon: "🕉", lucide: <Star className="h-5 w-5" />, title: "Generate Kundli", desc: "Get your Vedic birth chart & dosha analysis", link: "/kundli", color: "var(--color-indigo)" },
    { icon: "🤚", lucide: <Hand className="h-5 w-5" />, title: "Palm Reading", desc: "AI-powered Hastrekha analysis from your palm photo", link: "/palm", color: "var(--color-saffron)" },
    { icon: "💑", lucide: <Heart className="h-5 w-5" />, title: "Kundli Matching (कुंडली मिलान)", desc: "Ashtakoot Guna Milan compatibility check for marriage", link: "/compatibility", color: "var(--color-lotus-pink)" },
  ];

  function openBiodata(id: string) {
    const b = biodatas.find((x) => x.id === id);
    if (!b) return;
    loadBiodata(b);
    navigate("/builder");
  }

  return (
    <div className="min-h-screen bg-[var(--color-primary)]">
      <Navbar />

      <div className="relative overflow-hidden pt-16">
        {/* Sacred background */}
        <div className="glow-orb -left-20 top-20 h-64 w-64 bg-[var(--color-temple-maroon)]" />
        <div className="glow-orb -right-20 top-[40%] h-48 w-48 bg-[var(--color-accent)]" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 mx-auto max-w-4xl px-6 py-12">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <span className="text-4xl om-glow">🕉</span>
            <h1 className="mt-4 font-[Cinzel,serif] text-3xl font-bold tracking-wide text-[var(--color-text-primary)]">
              Namaste{name && name !== "Account" ? `, ${name}` : ""}!
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {profile?.email}
            </p>
            <p className="mt-1 font-[Noto_Sans_Devanagari,sans-serif] text-xs text-[var(--color-accent)]/50">
              शुभ दिन
            </p>
          </motion.div>

          {/* My Biodatas */}
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">My Biodatas</h2>
              <Link to="/builder">
                <Button size="sm" variant="outline" className="gap-1.5 border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10">
                  <Plus className="h-4 w-4" /> New
                </Button>
              </Link>
            </div>

            {biodataList.isLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] py-12 text-[var(--color-text-muted)]">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : biodatas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">Abhi tak koi biodata save nahi hua.</p>
                <Link to="/builder" className="mt-3 inline-block">
                  <Button size="sm" className="gap-1.5 bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold">
                    <Plus className="h-4 w-4" /> Create your first biodata
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {biodatas.map((b) => (
                  <div key={b.id} className="sacred-card flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-[Cinzel,serif] text-base font-bold text-[var(--color-text-primary)]">
                          {b.title || "Untitled Biodata"}
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {cap(b.community)}{b.updatedAt ? ` · Updated ${fmtDate(b.updatedAt)}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete this biodata?")) deleteBiodata.mutate(b.id);
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                        aria-label="Delete biodata"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBiodata(b.id)}
                      className="gap-1.5 border-white/15 text-white/80 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Open & Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Kundlis */}
          {kundlis.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">My Kundlis</h2>
              <div className="space-y-2">
                {kundlis.map((k) => (
                  <div key={k.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{k.subjectName || "Kundli"}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{fmtDate(k.birthDate)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this kundli?")) deleteKundli.mutate(k.id);
                      }}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                      aria-label="Delete kundli"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tool cards */}
          <h2 className="mb-4 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">Create something new</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={tool.link} className="group block">
                  <div className="sacred-card h-full p-6 transition-all duration-300 hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_30px_rgba(212,168,75,0.1)]">
                    <div className="mb-4 text-3xl">{tool.icon}</div>
                    <h3 className="mb-2 font-[Cinzel,serif] text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{tool.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Sign out */}
          <div className="mt-12 text-center">
            <Button
              variant="ghost"
              onClick={signOut}
              className="gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
