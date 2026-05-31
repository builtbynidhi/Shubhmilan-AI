import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, BookOpen, Save, Home } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { CLERK_ENABLED } from "@/hooks/useAuth";

// Clerk UI themed to the sacred-temple palette.
const clerkAppearance = {
  variables: {
    colorPrimary: "#D4A84B",
    colorBackground: "#1A1025",
    colorText: "#F5E6C8",
    colorInputBackground: "#0D0A1A",
    colorInputText: "#F5E6C8",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "bg-transparent shadow-none",
    rootBox: "w-full",
    headerTitle: "font-[Cinzel,serif]",
  },
} as const;

export default function AuthPage() {
  const { user } = useAuthStore();

  // Redirect if already authenticated
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen bg-[var(--color-primary)]">
      {/* Left — sacred brand panel (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden w-5/12 flex-col items-center justify-center overflow-hidden bg-[var(--color-surface)] p-12 lg:flex"
      >
        <div className="mesh-gradient absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 400 400" width="500" height="500" fill="none" className="text-[var(--color-accent)] chakra-wheel opacity-[0.06]">
            <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="0.5" />
            {[...Array(12)].map((_, i) => (
              <line key={i} x1="200" y1="10" x2="200" y2="390" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${i * 15} 200 200)`} />
            ))}
          </svg>
        </div>
        <div className="glow-orb top-10 -left-10 h-40 w-40 bg-[var(--color-temple-maroon)]" />
        <div className="glow-orb bottom-10 -right-10 h-40 w-40 bg-[var(--color-accent)]" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <span className="text-6xl om-glow">🕉</span>
          <div>
            <h1 className="font-[Cinzel,serif] text-3xl font-bold tracking-wide">
              <span className="text-[var(--color-text-primary)]">Shubh</span>
              <span className="text-[var(--color-accent)]">Milan</span>
              <span className="text-[var(--color-text-muted)] text-base">.ai</span>
            </h1>
            <p className="mt-3 text-[var(--color-text-muted)]">
              Where Ancient Wisdom Meets Technology
            </p>
          </div>

          <div className="mt-2 w-full sacred-card p-6 backdrop-blur-sm">
            <p className="mb-4 font-[Cinzel,serif] text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
              Sign in to unlock
            </p>
            {[
              { icon: <Save className="h-4 w-4" />, emoji: "🪔", text: "Save & access your biodatas anytime" },
              { icon: <Star className="h-4 w-4" />, emoji: "⭐", text: "Store Kundli charts for future use" },
              { icon: <BookOpen className="h-4 w-4" />, emoji: "📜", text: "Order history & re-download PDFs" },
            ].map(({ text, emoji }) => (
              <div key={text} className="mb-3 flex items-center gap-3 text-sm text-[var(--color-text-primary)]/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-sm">
                  {emoji}
                </span>
                {text}
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            No account? You can still use the app — just sign in to save.
          </p>
        </div>
      </motion.div>

      {/* Right — Clerk sign-in panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-1 flex-col items-center justify-center px-6 py-12"
      >
        <Link to="/" className="absolute left-6 top-6 flex items-center gap-2 rounded-xl border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/5 px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10">
          <Home className="h-4 w-4" /> Home
        </Link>

        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="text-2xl om-glow">🕉</span>
          <span className="font-[Cinzel,serif] text-xl font-bold tracking-wide">
            <span className="text-[var(--color-text-primary)]">Shubh</span>
            <span className="text-[var(--color-accent)]">Milan</span>
          </span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Clerk handles Google + email/password + password reset */}
          {CLERK_ENABLED ? (
            <div className="flex justify-center">
              <SignIn
                routing="hash"
                signUpUrl="/auth#/sign-up"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-5 text-center">
              <p className="text-sm text-[var(--color-text-primary)]/80">
                Sign-in isn’t configured yet.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Set <code className="text-[var(--color-accent)]">VITE_CLERK_PUBLISHABLE_KEY</code> in
                <code> .env</code> to enable accounts. You can still use everything below without one.
              </p>
            </div>
          )}

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-[var(--color-text-muted)]">or continue without signing in</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/builder">
              <Button variant="outline" size="lg" className="w-full border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 text-[var(--color-text-primary)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]">
                📜 Create Biodata without signing in
              </Button>
            </Link>
            <Link to="/kundli">
              <Button variant="ghost" size="sm" className="w-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                🕉 Generate Kundli instead
              </Button>
            </Link>
            <Link to="/palm">
              <Button variant="ghost" size="sm" className="w-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                🤚 Try Palm Reading
              </Button>
            </Link>
            <Link to="/compatibility">
              <Button variant="ghost" size="sm" className="w-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                💑 Kundli Matching (कुंडली मिलान)
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-[var(--color-text-muted)]">
            By continuing, you agree to our{" "}
            <Link to="#" className="text-[var(--color-accent)] hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="#" className="text-[var(--color-accent)] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
