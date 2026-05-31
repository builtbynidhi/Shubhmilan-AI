import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScrollText, Star, Hand, Heart, LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { signOut } = useAuth();

  const tools = [
    { icon: "📜", lucide: <ScrollText className="h-5 w-5" />, title: "Create Biodata", desc: "Build a beautiful marriage biodata with AI assistance", link: "/builder", color: "var(--color-accent)" },
    { icon: "🕉", lucide: <Star className="h-5 w-5" />, title: "Generate Kundli", desc: "Get your Vedic birth chart & dosha analysis", link: "/kundli", color: "var(--color-indigo)" },
    { icon: "🤚", lucide: <Hand className="h-5 w-5" />, title: "Palm Reading", desc: "AI-powered Hastrekha analysis from your palm photo", link: "/palm", color: "var(--color-saffron)" },
    { icon: "💑", lucide: <Heart className="h-5 w-5" />, title: "Kundli Matching (कुंडली मिलान)", desc: "Ashtakoot Guna Milan compatibility check for marriage", link: "/compatibility", color: "var(--color-lotus-pink)" },
  ];

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
              Namaste{profile?.fullName ? `, ${profile.fullName}` : ""}!
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {profile?.email}
            </p>
            <p className="mt-1 font-[Noto_Sans_Devanagari,sans-serif] text-xs text-[var(--color-accent)]/50">
              शुभ दिन
            </p>
          </motion.div>

          {/* Tool cards */}
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
