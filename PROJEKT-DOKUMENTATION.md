# Alexle135.de - Projekt-Dokumentation

## 🚀 Deployment-System

**Workflow:**
1. **GitHub Push** → **GitHub Actions** → **Automatisches Deployment auf Contabo Server**
2. **Deployment-Zeit**: ~2 Minuten nach Git Push
3. **Cloudflare Worker**: Nur für GitHub OAuth im Admin-Bereich (NICHT für Haupt-Deployment)
4. **Bewährtes Deployment-Script**: Bereits vorhanden und funktioniert perfekt

## 📁 Projekt-Struktur

**Tech-Stack:**
- **Astro** + **Tailwind CSS** Static Site Generator
- **TypeScript Strict Mode**
- **Content über Collections/CMS** (`src/content/`)
- **Performance-Budget**: LCP < 1.8s mobil, kritisches JS < 100 KB

**Wichtige Verzeichnisse:**
- **Projekt-Root**: `/Volumes/T7/Projekte/Alexle135-Codex`
- **Komponenten**: `src/components/` und `src/layouts/`
- **Content**: `src/content/` (Markdown-Dateien)
- **Thumbnails**: `/thumbnails/` (ki1.png bis ki8.png)

## 🔧 KI-Nachrichten Portal

**Features:**
- **RSS-Scraper** direkt in Astro integriert (`/api/ki-news`)
- **Demo-Seite**: `/ki-nachrichten-demo/`
- **Deutsche Artikel bevorzugt** (Heise, Golem, Computerwoche)
- **Thumbnails**: Zufällige aber konsistente Zuweisung aus `/thumbnails/`
- **Update-Intervall**: 8 Stunden (nicht 5 Minuten!)
- **Artikel-Links**: Funktionieren mit `window.openArticle()` globaler Funktion

**RSS-Feeds:**
- Deutsche: Heise, Golem
- Internationale: TechCrunch AI, MIT Technology Review, OpenAI Blog, ZDNet AI, VentureBeat, Wired

## 🌐 Live-System

**URLs:**
- **Live-Site**: https://alexle135.de
- **KI-Demo**: https://alexle135.de/ki-nachrichten-demo/
- **Projekte**: https://alexle135.de/projekte/
- **Admin**: GitHub OAuth über Cloudflare Worker

## ⚙️ Wichtige Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Deploy (automatisch via GitHub Actions)
git add .
git commit -m "feat: Beschreibung"
git push
```

## 🎯 Arbeitsabsprachen

**Ziele:**
- Schlanker, wartbarer static-site Code
- Performance-Budget einhalten
- Inhalte ausschließlich aus `src/content`

**Stil & Struktur:**
- TypeScript Strict
- Keine Lottie/3rd-Party-Loader im kritischen Pfad
- Komponenten klein & fokussiert
- A11y (Kontrast, Fokus, ARIA) Pflicht

**Commit/Branch:**
- Conventional Commits (feat, fix, chore, docs, refactor, perf, test)
- `main` geschützt; PRs via Feature-Branches

## 🔍 Troubleshooting

**Häufige Probleme:**
1. **Artikel-Links funktionieren nicht**: `window.openArticle` muss global sein
2. **Thumbnails zeigen falsches Bild**: Fallback auf `/media/default-news.png` entfernen
3. **Updates zu häufig**: Intervall auf 8h setzen, nicht 5min
4. **Build-Fehler**: Import-Pfade prüfen (relativ zu aktueller Datei)

**Debugging:**
- Browser-Konsole prüfen für JavaScript-Fehler
- API-Endpoint `/api/ki-news` direkt testen
- Astro Dev Server läuft auf Port 4322 (falls 4321 belegt)

---
*Letzte Aktualisierung: Oktober 2025*
