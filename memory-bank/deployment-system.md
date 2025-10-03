# Deployment-System

## Workflow
1. **GitHub Push** → **GitHub Actions** → **Automatisches Deployment auf Contabo Server**
2. **Deployment-Zeit**: ~2 Minuten nach Git Push
3. **Cloudflare Worker**: Nur für GitHub OAuth im Admin-Bereich (NICHT für Haupt-Deployment)
4. **Bewährtes Deployment-Script**: Bereits vorhanden und funktioniert perfekt

## Commands
```bash
# Deploy (automatisch via GitHub Actions)
git add .
git commit -m "feat: Beschreibung"
git push
```

## Wichtige URLs
- **Live-Site**: https://alexle135.de
- **KI-Demo**: https://alexle135.de/ki-nachrichten-demo/
- **Projekte**: https://alexle135.de/projekte/
- **Admin**: GitHub OAuth über Cloudflare Worker
