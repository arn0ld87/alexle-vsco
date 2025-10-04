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

## ✅ Aktueller Stand
- **Astro 4 + Tailwind** vollständig konfiguriert und optimiert
- **Content Collections** implementiert (`hero`, `services`, `skills`, `about`, `projects`, `legal`)
- **Projekttexte** mit konkreten Kennzahlen und Ergebnissen erweitert
- **Performance-Optimierung** abgeschlossen (Lighthouse-Score: 95/100)
- **SEO-Grundlagen** implementiert (robots.txt, sitemap.xml)
- **Security-Headers** vollständig konfiguriert

## 🚀 Deployment
**GitHub Actions** automatisiert das Deployment:
1. Code-Push triggert Build-Prozess
2. `dist/` Ordner wird per rsync auf Server übertragen
3. Apache serviert statische Dateien mit optimierten Headers

**Detaillierte Anleitung:** Siehe [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

## 📊 Performance-Metriken
- **Ladezeit**: ~200ms
- **LCP**: ~500ms (< 1.8s Ziel ✅)
- **CLS**: ~0.0 (< 0.05 Ziel ✅)
- **Lighthouse-Score**: 95/100
- **Asset-Optimierung**: WebP-Screenshots, Gzip-Kompression

## 🔧 Content-Editing
Inhalte werden über **Content Collections** verwaltet:
- **Projekte**: `src/content/projects/*.md`
- **Über-mich**: `src/content/about/about.md`
- **Services/Skills**: `src/content/services/services.json`, `src/content/skills/skills.json`
- **Rechtliches**: `src/content/legal/*.md`

Nach Änderungen: `pnpm build` → automatisches Deployment via GitHub Actions

---
Letzter Stand: 02.10.2025

---

## Features & Demos

This project includes several interactive demos and features.

### Space Shooter Game
A 3D space shooter game built with Three.js, located under `/demos/space-shooter-game/`.

**Controls:**
- **Movement:** `Arrow Keys` or `WASD`
- **Fire:** `Spacebar`
- **Pause/Resume:** `ESC`

The game has been refactored to use a modular architecture and includes performance enhancements like object pooling. It features a progressive difficulty curve, a boss battle, and invulnerability frames for the player.

### Light/Dark Mode Toggle
The site supports both light and dark modes. The theme toggle button in the header allows you to switch between them. Your preference is saved in your browser's `localStorage` and will be automatically applied on your next visit. The implementation is designed to prevent any "flash of unstyled content" when loading pages.
