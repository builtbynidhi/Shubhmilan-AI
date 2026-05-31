import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-accent)]/10 bg-[var(--color-primary)]">
      {/* Ornamental top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-2xl om-glow">🕉</span>
            <div>
              <span className="font-[Cinzel,serif] text-lg font-bold tracking-wide">
                <span className="text-[var(--color-text-primary)]">Shubh</span>
                <span className="text-[var(--color-accent)]">Milan</span>
                <span className="text-[var(--color-text-muted)] text-xs">.ai</span>
              </span>
              <p className="text-xs text-[var(--color-text-muted)]">Where Ancient Wisdom Meets AI</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Home</Link>
            <Link to="/builder" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Biodata</Link>
            <Link to="/kundli" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Kundli</Link>
            <Link to="/palm" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Palm Reading</Link>
            <Link to="/auth" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Login</Link>
          </div>

          {/* Bottom */}
          <div className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} ShubhMilan.ai
          </div>
        </div>

        {/* Sanskrit blessing */}
        <div className="mt-8 text-center">
          <p className="font-[Noto_Sans_Devanagari,sans-serif] text-xs text-[var(--color-accent)]/40">
            ॐ शुभ विवाह ॐ
          </p>
        </div>
      </div>
    </footer>
  );
}
