# GitHub OAuth Setup für Decap CMS

Diese Anleitung beschreibt, wie der Login ins Decap CMS über GitHub OAuth umgesetzt wird. Ziel ist, dass sich Redakteur:innen
mit ihrem GitHub-Account anmelden und Änderungen automatisch als Commits im Repository `alexle135/alexle-vsco` landen.

## Voraussetzungen

- GitHub-Repository mit Schreibrechten (`alexle135/alexle-vsco`).
- Live-Domain: `https://alexle135.de` (identisch mit `admin/config.yml`).
- Zugriff auf den Zielserver, auf dem das OAuth-Proxy-Skript laufen soll.
- Node.js ≥ 18 auf dem Server für das Decap Auth Proxy (`decap-server`).

## 1. GitHub OAuth App anlegen

1. Melde dich bei GitHub an und öffne **Settings → Developer settings → OAuth Apps**.
2. Klicke auf **"New OAuth App"** und fülle folgende Felder aus:
   - **Application name**: `Decap CMS alexle135.de`
   - **Homepage URL**: `https://alexle135.de`
   - **Authorization callback URL**: `https://alexle135.de/api/auth/callback`
3. Nach dem Erstellen erhältst du eine **Client ID**. Generiere außerdem direkt ein **Client Secret**.
4. Notiere beide Werte – sie werden als Umgebungsvariablen für den OAuth-Proxy benötigt.

> ⚠️ Die Callback-URL muss exakt zum späteren Reverse-Proxy passen. Falls die Seite in einer Staging-Umgebung läuft,
> dort entsprechend eine eigene OAuth App anlegen.

## 2. OAuth Proxy mit `decap-server` bereitstellen

Decap CMS benötigt bei GitHub immer einen kleinen Proxy, der die OAuth-Anmeldung handhabt. Der einfachste Weg ist das npm-Paket
[`decap-server`](https://www.npmjs.com/package/decap-server).

### Installation (Server)

```bash
npm install -g decap-server
```

### Service-Konfiguration

1. Lege auf dem Server eine `.env` Datei an, z. B. `/opt/decap-oauth/.env`:
   ```env
   GITHUB_CLIENT_ID=<Client ID aus GitHub>
   GITHUB_CLIENT_SECRET=<Client Secret aus GitHub>
   GITHUB_REDIRECT_URI=https://alexle135.de/api/auth/callback
   ORIGIN=https://alexle135.de
   PORT=9000
   ```
2. Starte den Proxy testweise:
   ```bash
   decap-server --auth-type=github --port=${PORT:-9000}
   ```
   Die Ausgabe sollte `listening on http://0.0.0.0:9000` enthalten.

### Reverse Proxy / Apache

Der OAuth-Proxy wird anschließend über den Webserver erreichbar gemacht. Für Apache (vgl. bestehenden Deployment-Stack):

```apacheconf
ProxyPass        /api/auth http://127.0.0.1:9000/ retry=0 timeout=30
ProxyPassReverse /api/auth http://127.0.0.1:9000/
```

Danach Apache neustarten (`sudo systemctl reload apache2`).

## 3. Secrets in GitHub Actions hinterlegen

Damit Deployments weiterhin funktionieren, sollten die OAuth-Credentials zusätzlich als Repository-Secrets abgelegt werden (z. B.
`CMS_GITHUB_CLIENT_ID`, `CMS_GITHUB_CLIENT_SECRET`). Sie werden aktuell noch nicht im Build benötigt, dienen aber als Backup und
können für automatisierte Tests genutzt werden.

## 4. Lokales Testen

Für lokale Redaktions-Tests kann der Proxy ebenfalls gestartet werden:

```bash
pnpm dlx decap-server --auth-type=github --port=8088
```

In `admin/config.yml` kann temporär `base_url: http://localhost:8088` gesetzt werden. Danach ist das CMS auf
`http://localhost:4321/admin/` lauffähig.

## 5. Abgleich mit `admin/config.yml`

Die Datei [`admin/config.yml`](../admin/config.yml) ist bereits vorbereitet:

```yaml
backend:
  name: github
  repo: alexle135/alexle-vsco
  branch: main
  base_url: https://alexle135.de
  auth_endpoint: api/auth
```

- **`base_url`** zeigt auf die Domain, auf der der OAuth-Proxy erreichbar ist.
- **`auth_endpoint`** entspricht dem Apache-Proxy (`/api/auth`).

Nach erfolgreichem Login legt Decap CMS Commits im `main`-Branch an und löst damit automatisch den bestehenden GitHub-Actions
Workflow aus.
