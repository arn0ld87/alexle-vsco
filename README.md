# alexle135.de – Neuaufbau

Neuaufbau der persönlichen Homepage von Alexander Schneider. Ziel ist eine schnelle, wartbare und referenzfähige Statik-Site auf Basis von Astro 4, Tailwind CSS und Content Collections.

## Voraussetzungen
- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Entwicklung
```bash
pnpm install
pnpm run dev
```
Der Dev-Server läuft standardmäßig auf <http://localhost:4321>. Für den vorhandenen Live-Server unter `http://127.0.0.1:5500` kannst du weiterhin das alte Material aus `neuaufbau/` nutzen.

## Build & Preview
```bash
pnpm run build
pnpm run preview
```

## Projektstruktur (Auszug)
```
root
├─ admin/             # Decap CMS (geplant)
├─ public/            # Statische Assets (optimiert)
│  └─ media/
├─ src/
│  ├─ content/        # Content Collections (MD/MDX/JSON)
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  └─ styles/
├─ astro.config.mjs
├─ package.json
└─ AGENTS.md          # Arbeitsabsprachen & Konventionen
```

## Aktueller Stand
- Astro 4 + Tailwind konfiguriert
- Content Collections vorbereitet (`hero`, `services`, `skills`, `about`, `projects`, `legal`)
- Legacy-Inhalte liegen in `neuaufbau/` zur Migration bereit

## Nächste Schritte
1. Inhalte aus `neuaufbau/reference-content.json` in Collections überführen
2. UI-Komponenten und Layouts implementieren (Hero, Header, Footer, etc.)
3. Decap CMS (`admin/`) konfigurieren und Netlify-Deployment aufsetzen
4. Performance-Budget (LCP < 1.8s mobil, kritisches JS < 100 KB) und QA sicherstellen

## Deployment
Empfohlen ist Netlify (Build-Kommando `pnpm run build`, Publish-Ordner `dist`). Alternativ kann Vercel oder ein eigener Static-Host genutzt werden.

---
Letzter Stand: 02.10.2025
