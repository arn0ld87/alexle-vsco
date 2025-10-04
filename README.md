# alexle135.de

Schnelle, wartbare persönliche Site mit Astro + Tailwind.

## Quickstart
```bash
pnpm install
pnpm dev
```
Build/Preview:
```bash
pnpm build && pnpm preview
```

## Struktur
`src/content` = sämtlicher Inhalt. Komponenten in `src/components`, Layouts in `src/layouts`.

## Entwicklung
- Node 20+, pnpm
- Dark/Light Theme Toggle inkl. Persistenz vorhanden
- Content Collections für Hero, Services, Skills, About, Projekte, Legal

## Deployment
`pnpm build` via CI → statische Dateien nach `dist/` → Server/Hosting (siehe Workflow). Keine weiteren manuellen Schritte nötig.

## Konventionen
- Conventional Commits
- Performance Budget: LCP < 1.8s mobil, kritisches JS < 100 KB
- A11y: Fokus, Kontrast, ARIA

## Edit Content
Beispiele:
- Projekte: `src/content/projects/*.md`
- About: `src/content/about/about.md`
- Services/Skills: `src/content/services/services.json`, `src/content/skills/skills.json`
- Rechtliches: `src/content/legal/*.md`

## Sonstiges
- Theme wird per inline Script früh gesetzt (kein FOUC)
- Tests/Playwright vorhanden

Letztes Update: 04.10.2025
