# Arbeitsabsprachen für dieses Repo

## Ziele
- Schlanker, wartbarer static‑site Code (Astro + Tailwind), Content über Collections/CMS.
- Performance‑Budget einhalten: LCP < 1.8s mobil, kritisches JS < 100 KB.

## Stil & Struktur
- TypeScript Strict, Module in `src/components`/`src/layouts`.
- Inhalte ausschließlich aus `src/content`.
- Keine Lottie/3rd‑Party‑Loader im kritischen Pfad.
- Komponenten klein & fokusiert; A11y (Kontrast, Fokus, ARIA) Pflicht.

## Commit/Branch
- Conventional Commits (feat, fix, chore, docs, refactor, perf, test).
- `main` geschützt; PRs via Feature‑Branches.

## CI & QA
- PR‑Check: `pnpm build`, `pnpm lint`, Lighthouse CI (optional).
- Keine Console‑Errors/Unhandled Rejections.

## Review‑Kriterien
- Lesbarkeit, Tests/Previews, Performance‑Budget ok, Content aus Collections.
