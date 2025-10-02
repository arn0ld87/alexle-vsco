# Neuaufbau Homepage Alexander Schneider (Arbeitsplan für „späteres Ich“)

Dieser Plan ist so geschrieben, dass du ihn schrittweise abarbeiten kannst – mit klaren TODOs, Kommandos, Checklisten und Stellen, an denen du einen neuen Chat starten solltest (wegen Kontextgröße und Fokus). Ziel: bestehende Struktur/Fotos erhalten, aber sichtbar moderner, professioneller und referenzfähig (Xing/LinkedIn). Kein „One‑Prompt“-Look – saubere IA, reduzierte Effekte, gute Typografie, nachvollziehbare Technik.

---
## 0. Leitbild & Ziele
- Behalte groben Seitenaufbau und Medien (Hero‑Video/Logo, Fotos, Über‑mich, Projekte). 
- Modernisiere: klare Typo‑Skala, großzügiger Weißraum, gezielte Micro‑Motion (CSS/SVG statt schwerem Lottie), akzentuierte Farbpalette.
- Zeige Stärken: Systemintegration/DevOps, Aufbau kompletter Projekte mit KI‑Agenten, saubere Dokumentation/Architektur. 
- Referenzfähigkeit: überzeugende Case‑Studies, Tech‑Stack sichtbar, Performance exzellent, Admin‑Editing ohne Frickelei.

Performance‑Budget
- LCP < 1.8s mobil (3G Fast), CLS ~0.0x, TBT < 100ms, Gesamt‑JS kritisch < 100 KB, HTML + CSS first paint < 60 KB.

---
## 1. Stack & Architektur (kurz)
- Static Site: Astro 4 + TypeScript (Zero‑JS by default).
- Styling: Tailwind CSS (Astro‑Integration) + kleine Utility‑CSS.
- Bilder: @astrojs/image (optimiert, responsive).
- Admin: Decap CMS (Git‑basiert), `/admin` im Repo, Netlify Identity oder GitHub OAuth.
- Inhalte: Astro Content Collections (`.md(x)`, `.json`).
- Deployment: Netlify (empfohlen) oder Vercel. CI auto‑build bei Push.

---
## 2. Seiten & IA
- Home (Hero, Value‑Props, „Warum ich“, Zahlen/Fakten, ausgewählte Projekte, Kontakt‑CTA).
- Über mich (Story, Skills/Stack, Zertifikate, Foto‑Set, Werte/Arbeitsweise).
- Projekte (Case Studies): je Detailseite mit Problem → Lösung → Architektur → Stack → Ergebnisse → Nächste Schritte.
- KI‑Agenten‑Lab (Showcase kurzer Demos/Flows, Diagramm/Sequenz, Sicherheits-/Ops‑Hinweise).
- Kontakt (Form + Direktlinks), Impressum, Datenschutz.

Komponenten (Auszug)
- Header/Nav, Footer, Hero, SectionHeader, Card, Stat/Badge, Timeline/Steps, TechStack/Grid, CTA‑Banner, CaseStudyLayout.

---
## 3. Content‑Modell (Collections)
- `site/hero.json` (Titel, Untertitel, CTA, Medienrefs)
- `site/about.md` (MDX: Text + Bilder)
- `site/services.json` (Liste mit Icon, Titel, Text, Tags)
- `site/skills.json`
- `projects/*.mdx` (Frontmatter: title, slug, summary, tags, heroImage, repo/demo, dates; Body: Problem, Approach, Arch, Results, Learnings)
- `legal/impressum.md`, `legal/datenschutz.md`

---
## 4. Admin‑Tool (Decap CMS)
- `/admin/index.html` + `admin/config.yml` (Collections für obige Inhalte).
- Auth: Netlify Identity (einfach) oder GitHub OAuth.
- Preview‑Templates optional (Live‑Vorschau von MDX).
- Commits aus CMS triggern Build → neues Deployment.

---
## 5. Projektstruktur (neu)
```
root
├─ public/            # statische Assets (optimiert)
│  └─ media/
├─ src/
│  ├─ content/        # Content Collections (MD/MDX/JSON)
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  └─ styles/
├─ admin/             # Decap CMS
├─ astro.config.mjs
├─ package.json
└─ AGENTS.md          # Arbeitsabsprachen & Konventionen
```

---
## 6. Phasenplan (mit Chat‑Breaks)

### Phase 0 – Repository & Grundgerüst (neuen Chat starten: „Projekt‑Setup Astro + CMS“) 
Ziel: leeres Astro‑Projekt, Tailwind, Basis‑CI, `AGENTS.md` angelegt.

1) Repo + Node
- GitHub Repo anlegen (`alexle135-homepage-new`).
- Lokal: Node 20+, `pnpm i -g pnpm`.

2) Astro init
```
pnpm create astro@latest my-site -- --template minimal --typescript strict
cd my-site
pnpm add -D tailwindcss postcss autoprefixer @astrojs/tailwind @astrojs/image
pnpm astro add tailwind
pnpm astro add image
pnpm add -D eslint prettier
```

3) Strukturen anlegen
- Ordner `src/content`, `src/components`, `src/layouts`, `admin`, `public/media`.
- `AGENTS.md` (Vorlage siehe unten) hinzufügen.

4) CI/Deploy vorbereiten
- Netlify: neues Projekt → Repo verbinden → Node 20 → Build `pnpm run build`, Publish `dist`.
- Optional: `netlify.toml` mit Basis‑Konfiguration.

### Phase 1 – Content Collections & Migration (neuen Chat starten: „Content‑Modellierung & Migration“)
Ziel: Inhalte aus `neuaufbau/reference-content.json` und HTML in Collections überführen.

Schritte
- Schemas definieren (Astro Content Collections).
- `hero.json`, `services.json`, `skills.json`, `about.md`, `projects/*.mdx`, `legal/*.md` befüllen.
- Bilder aus `neuaufbau/media` optimiert nach `public/media` kopieren; Dateinamen konsistent: `kebab-case.ext`.

### Phase 2 – Layout & Komponenten (neuen Chat starten: „UI‑Komponenten & Layouts“)
Ziel: Seitenrahmen + zentrale Blöcke, Stil modernisieren (Typo, Spacing, Farben, Motion‑Guidelines).

Schritte
- `BaseLayout.astro` (SEO, Meta, Header, Footer, Slot).
- Hero, SectionHeader, Card, TechGrid, CTA, Footer/Header.
- Responsives Grid, Fokuszustände, A11y (Kontraste, Skiplinks).
- Micro‑Animations: CSS (transform/opacity) + `prefers-reduced-motion`.

### Phase 3 – Projektseiten & KI‑Agenten‑Lab (neuen Chat starten: „Case Studies & Lab“)
Ziel: 2–3 Case Studies solide, je Struktur Problem→Lösung→Arch→Ergebnis→Lessons, plus Lab‑Übersicht.

Schritte
- `src/pages/projekte/[slug].astro` (Dynamic Routes aus Projects‑Collection).
- Arch‑Diagramm als SVG oder einfache Mermaid‑Darstellung (statisch gerendert).
- Lab: kurze Demos/Skizzen, klare Abgrenzung zu Produktions‑Use‑Cases.

### Phase 4 – Admin (Decap) (neuen Chat starten: „CMS‑Konfiguration & Preview“)
Ziel: `/admin` live, Collections editierbar, Preview optional.

Schritte
- `admin/index.html` + `admin/config.yml` (Git backend, Collections mapping zu `src/content`).
- Netlify Identity aktivieren, Rollen/Autorisierung setzen.

### Phase 5 – QA/Performance & Deployment (neuen Chat starten: „QA, Lighthouse & Go‑Live“)
Ziel: Performance‑Budget einhalten, E2E Smoke, saubere Meta/OG.

Checks
- Lighthouse mobil ≥ 95, LCP < 1.8s, CLS < 0.05.
- Visuell: Abstände, Typo‑Skala, dunkles/helles Theme (optional).
- SEO: Title/Desc, Canonical, Open Graph, Twitter Cards.
- Sitemap/robots, 404/500.
- Deployment auf Netlify (oder Vercel), Domain binden.

---
## 7. Konkrete TODO‑Liste (kopierbar)
- [ ] GitHub Repo „alexle-vsco“ anlegen
- [ ] Astro Projekt initialisieren (Phase 0 Befehle)
- [ ] Netlify Projekt verbinden, Build testen
- [ ] `AGENTS.md` ins Repo legen (Vorlage s.u.)
- [ ] Content Collections definieren (Schemas)
- [ ] Inhalte aus `neuaufbau/reference-content.json` migrieren
- [ ] Medien optimieren & nach `public/media` kopieren
- [ ] Basis‑Komponenten (Header, Footer, Hero) umsetzen
- [ ] 2–3 Case Studies schreiben (eine KI‑Agenten‑Case‑Study Pflicht)
- [ ] Decap CMS konfigurieren, Identity testen
- [ ] Lighthouse/QA, Browser‑Test, Responsiveness
- [ ] Go‑Live, Redirects/Meta prüfen
- [ ] Xing/LinkedIn aktualisieren (Projektlink, kurze Summary, 3 Bullet Results)

---
## 8. Design‑Hinweise (damit es „neu & besser“ wirkt)
- Typografie: Zwei Schriftschnitte (z. B. Inter/IBM Plex), klare Skala (12/14/16/20/24/32/48/64). 
- Farben: Eine Primärfarbe (Blau), eine Akzentfarbe (Violett/Grün), viel neutrales Grau/Beige.
- Bilder: Gleichmäßige Zuschnitte (16:9/4:3 Quadrate), konsistente Ränder/Radien.
- Bewegung: Nur zielgerichtet (Reveal, Scale‑in), 150–250 ms, mit `prefers-reduced-motion` fallback.
- Inhalt: Weniger Buzzwords – mehr Struktur, echte Ergebnisse, Diagramme/Architektur.

---
## 9. AGENTS.md – Vorlage (ins neue Repo legen)
```
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
```

---
## 10. Notizen für LinkedIn/Xing
- Kurze Projektbeschreibung (2–3 Sätze). 
- Drei Bullet‑Ergebnisse (z. B. „LCP 1.4s mobil“, „Decap‑CMS für Inhalte“, „Case‑Studies zu KI‑Agenten“).
- Ein Hero‑Screenshot (1200×630) + Architekturdiagramm.

---
## 11. Was bereits gesichert ist (Ordner `neuaufbau/`)
- `reference-content.json` (Inhalte aus Altprojekt)
- `index.html`, `ueber-mich.html`, `projekte.html`, `ki-nachrichten.html`
- `media/`, `assets-media/`, `push/` (Bilder/Assets/Demos)
- Logos: `logo.*`, `small_logo.jpg`

---
## 12. Wann neuen Chat starten
- Nach jeder Phase (0–5) eine neue Unterhaltung eröffnen mit knackigem Titel und kurzem Status (kopiere relevante Codepfade + offene Punkte). 
- Für Ideen/UX/Texte kurz auf „GPT‑5 High“ wechseln (Kreativ‑Feinschliff), Implementierung wieder „GPT‑5 Codex Medium“.

Letzter Stand: 02.10.2025  
Autor: Codex (GPT‑5)
