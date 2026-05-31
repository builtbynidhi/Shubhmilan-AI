import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ScrollText, Star, ShieldCheck, Heart, Hand } from "lucide-react";
import biodataShowcase from "@/assets/hero-showcase.jpg";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

/* ── Decorative spinning Chakra SVG ────────────────────────────────────────── */
function ChakraSVG({ size = 400, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className={className} fill="none">
      <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      <circle cx="200" cy="200" r="70" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
      <circle cx="200" cy="200" r="30" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      {/* Spokes */}
      {[...Array(12)].map((_, i) => (
        <line key={i} x1="200" y1="10" x2="200" y2="390" stroke="currentColor" strokeWidth="0.3" opacity="0.08"
          transform={`rotate(${i * 15} 200 200)`} />
      ))}
      {/* Petals */}
      {[...Array(8)].map((_, i) => (
        <ellipse key={`p${i}`} cx="200" cy="60" rx="18" ry="40" stroke="currentColor" strokeWidth="0.5" opacity="0.1"
          transform={`rotate(${i * 45} 200 200)`} />
      ))}
    </svg>
  );
}

/* ── Mandala ring decoration ───────────────────────────────────────────────── */
function MandalaRing({ size = 600, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 600 600" width={size} height={size} className={className} fill="none">
      <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <circle cx="300" cy="300" r="260" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <circle cx="300" cy="300" r="220" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <circle cx="300" cy="300" r="180" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
      <circle cx="300" cy="300" r="140" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      {[...Array(16)].map((_, i) => (
        <line key={i} x1="300" y1="20" x2="300" y2="580" stroke="currentColor" strokeWidth="0.3" opacity="0.05"
          transform={`rotate(${i * 11.25} 300 300)`} />
      ))}
      {[...Array(12)].map((_, i) => (
        <ellipse key={`l${i}`} cx="300" cy="50" rx="12" ry="30" stroke="currentColor" strokeWidth="0.4" opacity="0.06"
          transform={`rotate(${i * 30} 300 300)`} />
      ))}
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-primary)] text-[var(--color-text-primary)]">
      <Navbar />

      {/* ══════ HERO SECTION ══════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Sacred background layers */}
        <div className="mesh-gradient absolute inset-0 opacity-50" />

        {/* Spinning chakra decorations */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <ChakraSVG size={700} className="text-[var(--color-accent)] chakra-wheel opacity-[0.07]" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <MandalaRing size={900} className="text-[var(--color-saffron)] chakra-wheel-reverse opacity-[0.05]" />
        </div>

        {/* Warm glow orbs */}
        <div className="glow-orb -left-20 top-40 h-72 w-72 bg-[var(--color-temple-maroon)]" style={{ animationDelay: "0s" }} />
        <div className="glow-orb -right-20 top-[30%] h-56 w-56 bg-[var(--color-accent)]" style={{ animationDelay: "2s" }} />
        <div className="glow-orb bottom-20 left-[30%] h-48 w-48 bg-[var(--color-saffron)]" style={{ animationDelay: "1s", opacity: 0.15 }} />

        <div className="container relative z-10 mx-auto flex flex-col items-center gap-12 py-20 lg:flex-row lg:items-center lg:justify-between">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            {/* Sacred badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8 px-5 py-2 text-sm font-medium text-[var(--color-accent)]">
              <span className="om-glow text-base">🕉</span>
              <span>No Login Required — Generate & Download Instantly</span>
            </div>

            <h1 className="font-[Cinzel,serif] text-4xl font-bold leading-tight tracking-wide md:text-5xl lg:text-6xl">
              Where Ancient{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-glow)] to-[var(--color-saffron)] bg-clip-text text-transparent">
                  Wisdom
                </span>
              </span>
              <br />
              Meets{" "}
              <span className="bg-gradient-to-r from-[var(--color-saffron)] to-[var(--color-lotus-pink)] bg-clip-text text-transparent">
                Technology
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-muted)] md:text-xl">
              Create sacred marriage biodatas with divine precision. 
              Generate Vedic Kundlis, check compatibility, and discover your destiny through
              ancient palmistry — all powered by AI.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link to="/builder">
                <Button size="lg" className="h-14 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] px-8 text-lg font-bold text-[var(--color-primary)] shadow-[0_0_30px_rgba(212,168,75,0.25)] hover:shadow-[0_0_40px_rgba(212,168,75,0.4)] transition-shadow">
                  Create Biodata — Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/kundli">
                <Button size="lg" variant="outline" className="h-14 border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 px-8 text-lg text-[var(--color-text-primary)] backdrop-blur-sm hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]">
                  🕉 Generate Kundli
                </Button>
              </Link>
              <Link to="/palm">
                <Button size="lg" variant="outline" className="h-14 border-[var(--color-saffron)]/25 bg-[var(--color-saffron)]/5 px-8 text-lg text-[var(--color-saffron)] backdrop-blur-sm hover:bg-[var(--color-saffron)]/10 hover:border-[var(--color-saffron)]/40">
                  🤚 Read My Palm
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-[var(--color-text-muted)]">
              ✦ No account needed · Fill & preview FREE · Pay ₹30 only to download
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-[var(--color-text-muted)] lg:justify-start">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />
                <span>No Login Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--color-lotus-pink)]" />
                <span>50k+ Families Trust Us</span>
              </div>
            </div>
          </motion.div>

          {/* Right — Showcase Image with sacred frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="relative flex-shrink-0"
          >
            {/* Sacred glow behind the card */}
            <div
              className="absolute inset-0 -z-10 scale-110 rounded-3xl blur-3xl"
              style={{ background: "radial-gradient(ellipse, rgba(212,168,75,0.25) 0%, rgba(107,26,42,0.15) 50%, transparent 70%)" }}
            />

            {/* Mini spinning chakra behind image */}
            <div className="absolute -left-12 -top-12 pointer-events-none">
              <ChakraSVG size={120} className="text-[var(--color-accent)] chakra-wheel opacity-20" />
            </div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative rounded-2xl border-2 border-[var(--color-accent)]/30 p-1 shadow-[0_0_60px_rgba(212,168,75,0.15)]">
                <img
                  src={biodataShowcase}
                  alt="Sample biodata preview"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full max-w-xs rounded-xl md:max-w-sm lg:max-w-md"
                />
                {/* Golden corner ornaments */}
                <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-[var(--color-accent)]/50 rounded-tl-lg" />
                <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-[var(--color-accent)]/50 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-[var(--color-accent)]/50 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-[var(--color-accent)]/50 rounded-br-lg" />
              </div>
            </motion.div>

            {/* Floating pills */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-10 top-14 hidden items-center gap-2 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-surface)]/90 px-4 py-2 text-xs font-medium text-[var(--color-accent)] shadow-lg backdrop-blur-sm lg:flex"
            >
              <span className="text-sm">🪔</span> 15+ Sacred Templates
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute -right-8 bottom-20 hidden items-center gap-2 rounded-full border border-[var(--color-saffron)]/20 bg-[var(--color-surface)]/90 px-4 py-2 text-xs font-medium text-[var(--color-saffron)] shadow-lg backdrop-blur-sm lg:flex"
            >
              ✨ AI-Powered Astrology
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--color-accent)]/40"
        >
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <div className="h-8 w-px bg-gradient-to-b from-[var(--color-accent)]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ══════ FEATURES SECTION ══════ */}
      <section className="relative z-10 py-28 overflow-hidden">
        {/* Temple divider at top */}
        <div className="temple-divider mb-20 mx-auto max-w-xl" />

        {/* Background mandala */}
        <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 pointer-events-none">
          <MandalaRing size={500} className="text-[var(--color-accent)] mandala-bg opacity-[0.04]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 font-[Noto_Sans_Devanagari,sans-serif] text-sm text-[var(--color-accent)]/60"
            >
              शुभ सेवाएं
            </motion.p>
            <h2 className="font-[Cinzel,serif] text-3xl font-bold tracking-wide md:text-4xl text-[var(--color-text-primary)]">
              Sacred Tools for Your <br />
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] bg-clip-text text-transparent">
                Divine Journey
              </span>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)]">Start instantly. No account needed. Login only to save your data.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {
                icon: <ScrollText className="h-6 w-6" />,
                emoji: "📜",
                title: "Sacred Biodata Builder",
                desc: "Choose from 15+ premium temple-inspired templates. Our AI helps craft impressive descriptions with divine precision.",
                link: "/builder",
                color: "var(--color-accent)",
              },
              {
                icon: <Star className="h-6 w-6" />,
                emoji: "🕉",
                title: "Vedic Kundli & Guna Milan",
                desc: "Generate detailed Kundli charts and Ashtakoot Guna Milan compatibility scores instantly.",
                link: "/kundli",
                color: "var(--color-indigo)",
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                emoji: "✨",
                title: "AI Rewrite Assistance",
                desc: "Let our AI rewrite your bio to sound professional, humble, or engaging for marriage biodatas.",
                link: "/builder",
                color: "var(--color-saffron)",
              },
              {
                icon: <Hand className="h-6 w-6" />,
                emoji: "🤚",
                title: "AI Hastrekha Reading",
                desc: "Upload your palm photo and discover your destiny through ancient palmistry powered by AI.",
                link: "/palm",
                color: "var(--color-lotus-pink)",
              },
              {
                icon: <Heart className="h-6 w-6" />,
                emoji: "💑",
                title: "Kundli Matching (कुंडली मिलान)",
                desc: "Select Rashi of both partners for Ashtakoot Guna Milan — know if the stars align for your marriage.",
                link: "/compatibility",
                color: "var(--color-temple-maroon)",
                isNew: true,
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={feat.link} className="group block h-full">
                  <div className="sacred-card relative h-full p-6 transition-all duration-300 hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_30px_rgba(212,168,75,0.08)]">
                    {feat.isNew && (
                      <div className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-[var(--color-saffron)] to-[var(--color-lotus-pink)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        New
                      </div>
                    )}
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                        style={{ background: `color-mix(in srgb, ${feat.color} 15%, transparent)` }}
                      >
                        {feat.emoji}
                      </div>
                    </div>
                    <h3 className="mb-2 font-[Cinzel,serif] text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{feat.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                      Explore <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="temple-divider mb-20 mx-auto max-w-xl" />

        {/* Background spinning chakra */}
        <div className="absolute left-0 bottom-0 -translate-x-1/3 translate-y-1/4 pointer-events-none">
          <ChakraSVG size={400} className="text-[var(--color-accent)] chakra-wheel-reverse opacity-[0.04]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 font-[Noto_Sans_Devanagari,sans-serif] text-sm text-[var(--color-accent)]/60">
              कैसे काम करता है
            </p>
            <h2 className="font-[Cinzel,serif] text-3xl font-bold tracking-wide text-[var(--color-text-primary)]">
              Three Sacred Steps
            </h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Your perfect biodata in minutes</p>
          </div>

          <div className="relative flex flex-col justify-between gap-10 md:flex-row">
            {/* Connecting golden line */}
            <div className="absolute top-10 hidden w-full md:block">
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent" />
            </div>

            {[
              { step: "०१", title: "Enter Details", desc: "Fill in your personal, family, and career details securely.", icon: "🪔" },
              { step: "०२", title: "Select Template", desc: "Choose from elegant, community-inspired sacred designs.", icon: "📜" },
              { step: "०३", title: "Download PDF", desc: "Preview for free. Pay only ₹30 when you download.", icon: "✨" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 flex flex-1 flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-temple-dark)] to-[var(--color-surface)] shadow-[0_0_25px_rgba(212,168,75,0.15)]">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-0.5 font-[Noto_Sans_Devanagari,sans-serif] text-xs font-bold text-[var(--color-primary)]">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-[Cinzel,serif] text-lg font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="max-w-xs text-sm text-[var(--color-text-muted)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA BANNER ══════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="temple-divider mb-16 mx-auto max-w-xl" />
        
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-temple-dark)] via-[var(--color-surface)] to-[var(--color-temple-maroon)]/20 p-12 text-center shadow-[0_0_80px_rgba(212,168,75,0.08)]"
          >
            {/* Background chakra */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <ChakraSVG size={350} className="text-[var(--color-accent)] chakra-wheel opacity-[0.06]" />
            </div>

            <div className="relative z-10">
              <span className="text-4xl om-glow">🕉</span>
              <h2 className="mt-4 font-[Cinzel,serif] text-3xl font-bold tracking-wide text-[var(--color-text-primary)] md:text-4xl">
                Begin Your Sacred Journey
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[var(--color-text-muted)]">
                Join thousands of families who trust ShubhMilan.ai for creating beautiful,
                culturally respectful marriage biodatas and Vedic Kundlis.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/builder">
                  <Button size="lg" className="h-14 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-saffron)] px-10 text-lg font-bold text-[var(--color-primary)] shadow-[0_0_30px_rgba(212,168,75,0.3)] hover:shadow-[0_0_50px_rgba(212,168,75,0.5)] transition-shadow">
                    Create My Biodata
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/kundli">
                  <Button size="lg" variant="outline" className="h-14 border-[var(--color-accent)]/30 px-10 text-lg text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10">
                    Generate Kundli
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
