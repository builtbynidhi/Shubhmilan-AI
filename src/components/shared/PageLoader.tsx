import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Om logo animation */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-4xl om-glow"
        >
          🕉
        </motion.div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-[Cinzel,serif] text-xl font-bold text-[var(--color-text-primary)]">
            Shubh
          </span>
          <span className="font-[Cinzel,serif] text-xl font-bold text-[var(--color-accent)]">
            Milan
          </span>
          <span className="font-[Cinzel,serif] text-sm text-[var(--color-text-muted)]">
            .ai
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default PageLoader;
