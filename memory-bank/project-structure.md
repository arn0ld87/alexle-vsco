# Projekt-Struktur

## Tech-Stack
- **Astro** + **Tailwind CSS** Static Site Generator
- **TypeScript Strict Mode**
- **Content über Collections/CMS** (`src/content/`)
- **Performance-Budget**: LCP < 1.8s mobil, kritisches JS < 100 KB

## Wichtige Verzeichnisse
- **Projekt-Root**: `/Volumes/T7/Projekte/Alexle135-Codex`
- **Komponenten**: `src/components/` und `src/layouts/`
- **Content**: `src/content/` (Markdown-Dateien)
- **Thumbnails**: `/thumbnails/` (ki1.png bis ki8.png)

## Development Commands
```bash
# Development
pnpm dev

# Build
pnpm build
```

## Arbeitsabsprachen
- Schlanker, wartbarer static-site Code
- Inhalte ausschließlich aus `src/content`
- TypeScript Strict
- Keine Lottie/3rd-Party-Loader im kritischen Pfad
- Komponenten klein & fokussiert
- A11y (Kontrast, Fokus, ARIA) Pflicht
- Conventional Commits (feat, fix, chore, docs, refactor, perf, test)
- `main` geschützt; PRs via Feature-Branches
