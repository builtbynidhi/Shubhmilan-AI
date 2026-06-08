import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, ScrollText, Star, Hand, Heart, LogIn, LogOut, UserCircle, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { displayName } from "@/utils/userDisplay";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/builder", label: "Biodata", icon: ScrollText },
  { to: "/kundli", label: "Kundli", icon: Star },
  { to: "/palm", label: "Palm Reading", icon: Hand },
  { to: "/compatibility", label: "Matching (कुंडली मिलान)", icon: Heart, sparkle: true },
];

/** Spinning Chakra SVG used as decorative element */
function ChakraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {[...Array(8)].map((_, i) => (
        <line
          key={i}
          x1="50" y1="5" x2="50" y2="95"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.2"
          transform={`rotate(${i * 22.5} 50 50)`}
        />
      ))}
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile } = useAuthStore();
  const { signOut } = useAuth();
  const firstName = displayName(user, profile).split(" ")[0];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-accent)]/10 bg-[var(--color-primary)]/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <ChakraIcon className="absolute inset-0 h-9 w-9 text-[var(--color-accent)] chakra-wheel opacity-60" />
            <span className="relative text-lg om-glow">🕉</span>
          </div>
          <span className="font-[Cinzel,serif] text-lg font-bold tracking-wide">
            <span className="text-[var(--color-text-primary)]">Shubh</span>
            <span className="text-[var(--color-accent)]">Milan</span>
            <span className="text-[var(--color-text-muted)] text-xs">.ai</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ to, label, icon: Icon, sparkle }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={`relative gap-2 text-sm font-medium transition-all ${
                    sparkle
                      ? "bg-gradient-to-r from-[var(--color-lotus-pink)]/10 via-[var(--color-accent)]/10 to-[var(--color-saffron)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_16px_rgba(212,168,75,0.2)] hover:bg-[var(--color-accent)]/15"
                      : active
                        ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
                  }`}
                >
                  {sparkle && (
                    <>
                      <Sparkles className="h-3 w-3 text-[var(--color-saffron)] animate-pulse" />
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <span className="absolute inset-0 animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[var(--color-accent)]/10 to-transparent" style={{ backgroundSize: "200% 100%" }} />
                      </span>
                    </>
                  )}
                  <Icon className={`h-4 w-4 ${sparkle ? "text-[var(--color-lotus-pink)]" : ""}`} />
                  <span className={sparkle ? "bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-text-primary)] to-[var(--color-saffron)] bg-clip-text text-transparent font-semibold" : ""}>
                    {label}
                  </span>
                  {sparkle && <Sparkles className="h-3 w-3 text-[var(--color-accent)] animate-pulse" style={{ animationDelay: "0.5s" }} />}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right side: CTA + Mobile toggle */}
        <div className="flex items-center gap-2">
          {user ? (
            // Signed in — show who's logged in + dashboard + sign out.
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  className="gap-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                >
                  <UserCircle className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="max-w-[120px] truncate">{firstName}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={signOut}
                title="Sign out"
                className="gap-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Signed out — clear sign-in CTA.
            <Link to="/auth" className="hidden md:block">
              <Button className="gap-2 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] text-[var(--color-primary)] font-semibold hover:shadow-[0_0_20px_rgba(212,168,75,0.3)] transition-shadow">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-accent)]/20 text-[var(--color-accent)] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[var(--color-accent)]/10 bg-[var(--color-primary)]/95 backdrop-blur-xl md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map(({ to, label, icon: Icon, sparkle }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors overflow-hidden ${
                      sparkle
                        ? "bg-gradient-to-r from-[var(--color-lotus-pink)]/10 via-[var(--color-accent)]/10 to-[var(--color-saffron)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold"
                        : active
                          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {sparkle && <Sparkles className="h-3.5 w-3.5 text-[var(--color-saffron)] animate-pulse" />}
                    <Icon className={`h-4 w-4 ${sparkle ? "text-[var(--color-lotus-pink)]" : ""}`} />
                    <span className={sparkle ? "bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-text-primary)] to-[var(--color-saffron)] bg-clip-text text-transparent" : ""}>
                      {label}
                    </span>
                    {sparkle && <Sparkles className="ml-auto h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" style={{ animationDelay: "0.5s" }} />}
                    {sparkle && (
                      <span className="absolute inset-0 animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[var(--color-accent)]/8 to-transparent" style={{ backgroundSize: "200% 100%" }} />
                    )}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-[var(--color-accent)]/10" />
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-4 py-3 text-sm font-semibold text-[var(--color-accent)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {firstName} · Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); void signOut(); }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] px-4 py-3 text-sm font-bold text-[var(--color-primary)]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
