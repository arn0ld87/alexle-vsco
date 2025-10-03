# KI-Nachrichten Portal

## Features
- **RSS-Scraper** direkt in Astro integriert (`/api/ki-news`)
- **Demo-Seite**: `/ki-nachrichten-demo/`
- **Deutsche Artikel bevorzugt** (Heise, Golem, Computerwoche)
- **Thumbnails**: Zufällige aber konsistente Zuweisung aus `/thumbnails/`
- **Update-Intervall**: 8 Stunden (nicht 5 Minuten!)
- **Artikel-Links**: Funktionieren mit `window.openArticle()` globaler Funktion

## RSS-Feeds
- **Deutsche**: Heise, Golem
- **Internationale**: TechCrunch AI, MIT Technology Review, OpenAI Blog, ZDNet AI, VentureBeat, Wired

## Thumbnail-System
- **8 KI-Bilder**: ki1.png bis ki8.png aus `/thumbnails/`
- **Zufällige aber konsistente Zuweisung**: Per Titel-Hash
- **Kein Fallback auf User-Bild**: Echte KI-Thumbnails

## Troubleshooting
1. **Artikel-Links funktionieren nicht**: `window.openArticle` muss global sein
2. **Thumbnails zeigen falsches Bild**: Fallback auf `/media/default-news.png` entfernen
3. **Updates zu häufig**: Intervall auf 8h setzen, nicht 5min
4. **Build-Fehler**: Import-Pfade prüfen (relativ zu aktueller Datei)
