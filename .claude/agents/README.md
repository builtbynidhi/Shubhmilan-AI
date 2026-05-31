# Subagents — ShubhMilan AI

Domain-expert Claude Code subagents. Each `.md` file is one expert with YAML frontmatter
(`name`, `description`, `model`) and a body that is its system prompt (expertise, owned
files, conventions, gotchas).

These are **on-demand**: the main agent delegates to an expert when a task matches its
`description`. There is no per-session auto-injection (no SessionStart hook).

## Roster & routing

| Agent | Delegate when the task involves… |
|-------|----------------------------------|
| `astrology-ai-expert` | Groq prompts; Kundli, Guna Milan compatibility, biodata text rewrites; `groq.ts`, `kundliApi.ts`, `compatibility.ts`, `useAI`/`useKundli`, legacy providers. |
| `palm-rag-expert` | Palm reading + the RAG pipeline; `palmReading.ts`, `palmRag.ts`, `knowledge/palmistry/`, ingestion script, `api/palm-rag-retrieve.ts`, pgvector `palmistry_knowledge` table, `PalmReadingPage`. |
| `frontend-ui-expert` | Tailwind v4 (CSS-first), Radix/shadcn primitives, framer-motion, theme tokens; `components/ui`, `components/shared`, `styles/globals.css`. |
| `neon-data-expert` | Clerk auth, Neon/Drizzle data layer, the Vercel `/api` backend; `useAuth`, `authStore`, `src/lib/api.ts`, `api/_lib/*`, `api/{profile,biodatas,kundlis,ai-usage}`, `drizzle.config.ts`, migrations. |
| `payments-expert` | Razorpay, `api/payments/*` functions, pricing/checkout; `razorpay.ts`, `usePayment`, `payment.types`, `api/_lib/{pricing,razorpay}.ts`. |
| `pdf-template-expert` | Biodata PDF rendering + templates/themes/pricing; `pdfGenerator`, `genericTemplateRenderer`, `templateThemes`, `templateConfig`, template images. |
| `forms-state-expert` | Multi-step builder, Zod validation, community fields; `builderStore`, `BuilderPage`, `validators`, `communityFields`, `biodata.types`. |
| `build-types-expert` | tsconfig/eslint/vite/package.json, strict-mode type errors, the `npm run build` gate, `@/` alias. |

## Notes
- Gates (no tests): `npm run build` (frontend, strict `tsc`) **and** `npm run typecheck:api` (the Vercel `api/` backend). Run both after changes.
- Intra-`src` imports use `@/…`; `api/` uses relative imports (no alias).
- Two secret tiers: `VITE_*` = browser-public; non-`VITE_` server secrets (`DATABASE_URL`, `CLERK_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, embedding `OPENAI_API_KEY`) live in Vercel env and `api/` only.
- Cross-cutting tasks may chain experts (e.g. palm RAG UI touches both `palm-rag-expert` and `frontend-ui-expert`).
