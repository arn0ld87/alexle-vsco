# KI-Nachrichten Demo

Ein einfaches Tool, das automatisch die neuesten KI-Nachrichten aus RSS-Feeds sammelt und übersichtlich darstellt.

## Features

- ✅ **Automatisches RSS-Scraping** von 10+ KI-Quellen
- ✅ **Deutsche Priorität** - Bevorzugung deutscher Artikel
- ✅ **Thumbnail-Extraktion** für bessere Visualisierung
- ✅ **Live-Updates** alle 6 Stunden
- ✅ **Responsive Design** mit Homepage-Integration
- ✅ **Fallback-System** bei API-Ausfällen

## Setup

### 1. Dependencies installieren

```bash
cd scripts/ki-news-scraper
npm install
```

### 2. Server starten

```bash
npm start
```

Der Server läuft auf `http://localhost:3001`

### 3. Demo testen

Öffne `http://localhost:3001/demos/ki-news/index.html` im Browser

## API Endpoints

- `GET /api/ki-news` - Aktuelle KI-Artikel abrufen
- `POST /api/scrape` - Manuelles Scraping auslösen
- `GET /api/health` - Health Check

## RSS-Feeds

### Deutsche Quellen
- Heise.de
- Golem.de
- Computerwoche.de

### Internationale Quellen
- TechCrunch AI
- VentureBeat AI
- MIT Technology Review
- OpenAI Blog
- Anthropic News
- Google AI Blog
- The Verge AI
- ZDNet AI

## Automatisches Scraping

Das System führt automatisch alle 6 Stunden ein Scraping durch. Für manuelle Updates:

```bash
curl -X POST http://localhost:3001/api/scrape
```

## Datenformat

```json
{
  "title": "Artikel-Titel",
  "link": "https://example.com/article",
  "description": "Artikel-Beschreibung...",
  "pubDate": "2024-01-01T12:00:00Z",
  "source": "Heise",
  "language": "de",
  "thumbnail": "https://example.com/image.jpg",
  "category": "Machine Learning"
}
```

## Deployment

Für Production-Deployment:

1. **Backend**: Railway, Render oder Vercel Functions
2. **Frontend**: Vercel, Netlify oder GitHub Pages
3. **Cron-Jobs**: GitHub Actions oder externe Services

## Kosten

- **Hosting**: ~$5-10/Monat
- **Keine API-Kosten** (nur RSS-Feeds)
- **Skalierbar** für höhere Traffic-Lasten
