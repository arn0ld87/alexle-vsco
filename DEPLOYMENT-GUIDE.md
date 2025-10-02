# Deployment & Infrastructure Guide

## 🚀 Deployment-Workflow

### Aktueller Prozess
1. **Code-Änderungen** werden in `main` Branch committed
2. **GitHub Actions** triggert automatisch bei Push
3. **Build-Prozess** erstellt `dist/` Ordner mit Astro
4. **rsync-Deployment** überträgt Dateien auf Server
5. **Server** serviert statische Dateien über Apache

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
- name: Deploy to Server
  run: |
    rsync -avz --delete dist/ user@server:/var/www/html/
```

## 🔄 Rollback-Strategie

### Sofort-Rollback (Notfall)
```bash
# 1. Letzte stabile Version deployen
git checkout HEAD~1
pnpm build
rsync -avz --delete dist/ user@server:/var/www/html/

# 2. Oder spezifischen Commit deployen
git checkout <commit-hash>
pnpm build
rsync -avz --delete dist/ user@server:/var/www/html/
```

### Geplantes Rollback
1. **Problem identifizieren** (Monitoring, User-Feedback)
2. **Letzte stabile Version** identifizieren
3. **Rollback durchführen** (siehe Sofort-Rollback)
4. **Problem analysieren** und Fix entwickeln
5. **Fix testen** und erneut deployen

### Backup-Strategie
- **Git-History**: Vollständige Versionshistorie in GitHub
- **Server-Backup**: Tägliche Backups des `/var/www/html/` Ordners
- **Database**: Keine (statische Website)
- **Media-Assets**: Gesichert in `public/media/` im Repository

## 🔒 Security & HTTPS

### Aktuelle Konfiguration
- ✅ **HTTPS**: Aktiviert mit Let's Encrypt
- ✅ **HSTS**: `max-age=31536000; includeSubDomains; preload`
- ✅ **Redirects**: HTTP → HTTPS, www → bare domain
- ✅ **Security-Headers**: Vollständig implementiert

### Zertifikat-Management
- **Provider**: Let's Encrypt
- **Aktuell gültig bis**: November 30, 2025
- **Auto-Renewal**: Aktiviert (certbot)
- **Monitoring**: Zertifikat-Ablauf überwachen

### Security-Headers
```
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
```

## 📊 Monitoring & Alerting

### Performance-Monitoring
- **Lighthouse CI**: Automatische Performance-Tests
- **Uptime-Monitoring**: Externe Services (UptimeRobot, Pingdom)
- **Server-Monitoring**: Apache-Logs, Disk-Space, CPU

### Alert-Kriterien
- **Downtime**: > 5 Minuten
- **Performance**: LCP > 2.5s
- **SSL-Zertifikat**: < 30 Tage bis Ablauf
- **Disk-Space**: < 1GB frei

## 🛠 Troubleshooting

### Häufige Probleme

#### 1. Build-Fehler
```bash
# Lokal testen
pnpm build

# Logs prüfen
pnpm build --verbose
```

#### 2. Deployment-Fehler
```bash
# rsync-Verbindung testen
rsync --dry-run -avz dist/ user@server:/var/www/html/

# Server-Zugriff prüfen
ssh user@server "ls -la /var/www/html/"
```

#### 3. Performance-Probleme
```bash
# Asset-Größen prüfen
ls -lah dist/_astro/
ls -lah dist/media/

# Kompression testen
curl -H "Accept-Encoding: gzip" -I https://alexle135.de
```

## 📋 Deployment-Checkliste

### Vor Deployment
- [ ] Code lokal getestet (`pnpm dev`)
- [ ] Build erfolgreich (`pnpm build`)
- [ ] Keine Console-Errors
- [ ] Performance-Budget eingehalten

### Nach Deployment
- [ ] Website erreichbar (https://alexle135.de)
- [ ] Alle Seiten funktional
- [ ] Screenshots laden korrekt
- [ ] Performance-Test durchgeführt
- [ ] Mobile-Responsiveness geprüft

## 🔧 Server-Konfiguration

### Apache-Konfiguration
```apache
# /etc/apache2/sites-available/alexle135.de.conf
<VirtualHost *:443>
    ServerName alexle135.de
    ServerAlias www.alexle135.de
    DocumentRoot /var/www/html
    
    # SSL-Konfiguration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/alexle135.de/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/alexle135.de/privkey.pem
    
    # Security-Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Cache-Konfiguration
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|webp|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
    
    <LocationMatch "\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 5 minutes"
    </LocationMatch>
</VirtualHost>
```

## 📞 Notfall-Kontakte

- **Server-Provider**: [Provider-Details]
- **Domain-Provider**: [Domain-Details]
- **SSL-Zertifikat**: Let's Encrypt (certbot)
- **GitHub Repository**: arn0ld87/alexle-vsco

## 📈 Performance-Baseline

### Aktuelle Werte (Stand: Oktober 2025)
- **Ladezeit**: ~200ms
- **LCP**: ~500ms
- **CLS**: ~0.0
- **TBT**: ~0ms
- **Lighthouse-Score**: 95/100

### Zielwerte
- **LCP**: < 1.8s ✅
- **CLS**: < 0.05 ✅
- **TBT**: < 100ms ✅
- **Lighthouse-Score**: > 90 ✅
