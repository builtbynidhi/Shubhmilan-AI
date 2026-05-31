# CLAUDE.md

Guidance for working in this repository.

## Communication

Is repo pe sab user-facing baat-cheet **Hinglish** (Hindi + English mix, Latin script) mein karo. Code, comments, identifiers, aur commit messages English hi rahenge.

## Project

**ShubhMilan AI** — an Indian matrimonial web app. Users build a marriage biodata, generate a downloadable PDF, and access AI-driven Vedic features: Kundli (birth chart), Guna Milan compatibility, and palm reading. React SPA frontend + a Vercel serverless `/api` backend over **Neon Postgres**; auth is **Clerk**.

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build (type-checks then bundles)
npm run lint     # eslint .
npm run preview  # serve the production build
```

```bash
npm run typecheck:api  # tsc on the api/ backend (separate from the frontend build)
npm run db:generate    # drizzle-kit generate (after schema changes)
npm run db:migrate      # apply migrations to Neon
npm run ingest:palmistry # embed + upsert the palmistry KB into Neon (pgvector)
```

There is no test suite. After changes, run `npm run build` (frontend, strict `tsc` — `noUnusedLocals`, `noUnusedParameters`) **and** `npm run typecheck:api` (backend). The `api/` folder is NOT part of the Vite build — it's type-checked via `tsconfig.api.json` and built by Vercel.

## Stack

- **React 19** + **TypeScript** + **Vite 7**, bundler module resolution.
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` — config is CSS-first in `src/styles/globals.css`).
- **Radix UI** primitives wrapped in `src/components/ui/*` (shadcn-style).
- **Zustand** for client state (`src/store/`), with `persist` middleware on the builder store.
- **TanStack Query** for server/async state (configured in `App.tsx`, 5-min staleTime, retry 1).
- **React Router v6** with lazy-loaded pages and `Suspense`.
- **Clerk** for auth. **Neon Postgres** (+ pgvector) via **Drizzle ORM** for data, behind a **Vercel `/api`** serverless backend. **Razorpay** for payments. **Groq** for AI. **Tesseract.js** for OCR. **jsPDF + html2canvas** for PDF export.

## Architecture

- **Frontend entry:** `src/main.tsx` wraps `<App/>` in `<ClerkProvider>` → `src/App.tsx` defines routes, guards (`ProtectedRoute`/`PublicRoute` read `useAuthStore`), and the QueryClient. `AuthInit` mounts `useAuth()` which **bridges Clerk → the auth store** and registers the token getter for `apiFetch`.
- **Backend:** `api/` = Vercel serverless functions (Node). `api/_lib/{schema,db,auth,http,serializers,pricing,razorpay}.ts` are shared; endpoints under `api/{profile,biodatas,kundlis,ai-usage,palm-rag-retrieve}` + `api/payments/*`. Every authed endpoint calls `requireUser(req)` (verifies the Clerk JWT) and scopes Drizzle queries by `userId`. **Neon is reached only server-side** — the browser never connects to it.
- **`src/lib/api.ts`** — `apiFetch(path, opts)` attaches the Clerk token and calls `/api/*`; the single choke-point all data hooks use.
- **Routes:** `/` landing, `/auth`, `/builder`, `/kundli`, `/calibrate`, `/palm`, `/compatibility` are public; only `/dashboard` requires login. Builder/Kundli/etc. work without an account.
- **`src/lib/`** — client integration layer: `api.ts`, `groq.ts`, `razorpay.ts` (checkout SDK only), `kundliApi.ts`, `compatibility.ts`, `palmReading.ts`, `palmRag.ts`, `ocr.ts`, `pdfGenerator.ts` + `genericTemplateRenderer.ts` + `templateThemes.ts` + `pdfTemplates.ts`.
- **`src/hooks/`** — `useAuth` (Clerk bridge), `useAI`, `useBiodata`, `useKundli`, `useOCR`, `usePayment` — all data hooks call `apiFetch`.
- **`src/store/`** — `authStore.ts` (Clerk-derived `AppUser` + profile from `/api/profile`), `builderStore.ts` (persisted form).
- **`src/types/`** — domain types per feature. **`@/`** aliases `src/` (in `vite.config.ts` + `tsconfig.app.json`; the `api/` tsconfig does NOT have it — keep backend imports relative).

## AI provider

**Groq (`llama-3.3-70b-versatile`) is the unified AI provider** — see `src/lib/groq.ts`. It handles text rewrites, Kundli JSON, and compatibility. Use `callGroqJSON` for structured output. Legacy provider files (`claude.ts`, `mistral.ts`, `deepseek.ts`, `gemini.ts`) exist but are superseded by Groq — prefer Groq for new AI work. **Palm reading** uses OpenAI GPT-4o vision (`VITE_OPENAI_API_KEY`, now in `.env.example`).

## Palm reading — two-pass RAG

`src/lib/palmReading.ts` is a **two-pass, RAG-grounded** flow: (1) GPT-4o vision detects structured `PalmObservations`; (2) `src/lib/palmRag.ts` builds queries and calls the `/api/palm-rag-retrieve` endpoint (embeds server-side, cosine-searches the Neon pgvector KB); (3) GPT-4o text composes the grounded "Pandit Hastarekha Sharma" reading and cites sources. It **degrades gracefully** to a single-pass ungrounded reading if observation or retrieval is unavailable, so the feature never hard-fails when the RAG infra isn't deployed.

- **Knowledge base:** `knowledge/palmistry/` (curated bilingual chunks + `manifest.json`; `sources/` for user-provided texts). Schema: `id, category, feature_key, qualifier, text_en, text_hi, source`.
- **Vector store:** Drizzle `palmistryKnowledge` table (`api/_lib/schema.ts`) with `vector(1536)` + ivfflat cosine index on Neon.
- **Ingestion:** `npm run ingest:palmistry` → `scripts/ingest-palmistry.ts` (Node; embeds with `text-embedding-3-small`, upserts into Neon via Drizzle).
- **Retrieval:** `api/palm-rag-retrieve.ts` (Vercel function; public, embeds the query then cosine-searches).
- **Key separation:** browser vision uses `VITE_OPENAI_API_KEY`; the embedding key is `OPENAI_API_KEY` — **server-side only, never `VITE_`-prefixed** (Vercel env + local ingestion env). See `.env.example`.

## Subagents

`.claude/agents/` holds 8 on-demand domain-expert subagents (see `.claude/agents/README.md` for the roster + routing table): `astrology-ai-expert`, `palm-rag-expert`, `frontend-ui-expert`, `neon-data-expert` (Clerk auth + Neon/Drizzle + `/api` backend), `payments-expert`, `pdf-template-expert`, `forms-state-expert`, `build-types-expert`. The main agent delegates to the matching expert by task; there is no per-session auto-injection.

## PDF generation

Biodata PDFs are rendered client-side: `pdfGenerator.ts` renders the form data onto canvas pages via `genericTemplateRenderer.ts` using a theme from `templateThemes.ts` (keyed by `templateId`), then composes A4 pages with jsPDF. Template tiers and pricing live in `src/utils/templateConfig.ts` (base fee ₹30 + tier surcharge).

## Conventions

- Path imports use `@/...`, not relative deep paths.
- Lib service files are documented with a top-of-file comment block describing the provider and purpose — follow that pattern.
- This project is **not a git repository** and has no CI. There are no Cursor/Copilot rule files.
- **Two secret tiers:** `VITE_`-prefixed vars are browser-exposed — only public keys (Clerk publishable, Razorpay key id, Groq, palm-vision OpenAI key). Everything in `api/` reads **non-`VITE_` server secrets** (`DATABASE_URL`, `CLERK_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, embedding `OPENAI_API_KEY`) from Vercel env — never import these into `src/`. See `.env.example`.
- Backend (`api/`, `scripts/`, `drizzle.config.ts`) is excluded from the browser ESLint config and the Vite build; type-check it with `npm run typecheck:api`.
