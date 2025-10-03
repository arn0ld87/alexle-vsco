# Cloudflare Worker - Decap CMS OAuth Provider

Dieser Worker ermöglicht OAuth-Authentifizierung für Decap CMS via GitHub.

## 📁 Dateien

- `worker.js` - Worker Code (kopiere diesen in Cloudflare)
- `wrangler.toml` - Config (optional, für Wrangler CLI)

## 🚀 Manuelles Deployment (Empfohlen)

### Schritt 1: Worker erstellen
1. Cloudflare Dashboard → Workers & Pages
2. Create Application → Create Worker
3. Name: `cms-auth-alexle135`

### Schritt 2: Code deployen
1. Edit Code
2. Kopiere **kompletten Inhalt** von `worker.js`
3. Save and Deploy

### Schritt 3: Secrets setzen
Settings → Variables and Secrets:

```
GITHUB_CLIENT_ID = dein_client_id
GITHUB_CLIENT_SECRET = dein_client_secret
```

## 🛠️ Mit Wrangler CLI (Optional)

```bash
# Installation
npm install -g wrangler

# Login
wrangler login

# Secrets setzen
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# Deployen
wrangler deploy
```

## 🔗 Endpoints

Nach Deployment verfügbar unter: `https://cms-auth-alexle135.DEIN-ACCOUNT.workers.dev`

- `/auth` - OAuth Authorization
- `/callback` - OAuth Callback
- `/success` - Status Check

## ⚙️ Config in admin/config.yml

```yaml
backend:
  name: github
  repo: arn0ld87/alexle-vsco
  branch: main
  base_url: https://cms-auth-alexle135.DEIN-ACCOUNT.workers.dev
  auth_endpoint: /auth
```

## 🔒 CORS

Worker erlaubt nur Requests von:
- `https://www.alexle135.de`

Für andere Domains in `worker.js` ändern:
```javascript
'Access-Control-Allow-Origin': 'https://deine-domain.de'
```

## 📊 Monitoring

Cloudflare Dashboard → Worker → Metrics:
- Request Count
- Errors
- CPU Time
- Success Rate

## 💰 Kosten

**Free Tier:**
- 100.000 Requests / Tag
- Völlig ausreichend für CMS-Nutzung

## 🆘 Troubleshooting

**Worker antwortet nicht:**
```bash
curl https://WORKER-URL.workers.dev/success
```
Sollte zurückgeben: `{"status":"ok"}`

**CORS Error:**
- Origin in `worker.js` prüfen
- Browser Console für Details öffnen

**OAuth Error:**
- Secrets korrekt gesetzt?
- GitHub Callback URL korrekt?

## 📚 Weitere Infos

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Decap CMS Backend Docs](https://decapcms.org/docs/backends-overview/)
