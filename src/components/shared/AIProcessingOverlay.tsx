import { motion, AnimatePresence } from "framer-motion";

interface AIProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function AIProcessingOverlay({
  isVisible,
  message = "AI is working its magic...",
}: AIProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] px-8 py-6 shadow-[0_0_40px_rgba(212,168,75,0.25)]"
            style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
          >
            {/* Pulsing outer ring */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute h-16 w-16 rounded-full bg-[var(--color-accent)]/20"
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-accent)]">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="text-xl"
                >
                  🕉
                </motion.span>
              </div>
            </div>

            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {message}
            </p>

            {/* Dot loader */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
