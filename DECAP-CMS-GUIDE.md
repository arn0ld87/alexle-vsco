# 🎯 Decap CMS Setup Guide mit Cloudflare Worker OAuth

Vollständige Anleitung zur Einrichtung des Content Management Systems für die Astro-Website.

---

## 📋 Übersicht

**Was wird eingerichtet:**
- ✅ Decap CMS für Content-Management ohne Code
- ✅ GitHub OAuth via Cloudflare Worker (kostenlos)
- ✅ Alle Content Collections editierbar
- ✅ Media-Upload für Bilder
- ✅ Preview-Funktion
- ✅ Editorial Workflow (Draft → Review → Publish)

**Dauer:** Ca. 15 Minuten  
**Kosten:** 0€ (alles kostenlose Tier)

---

## 🚀 Teil 1: GitHub OAuth App erstellen

### Schritt 1: GitHub OAuth App anlegen

1. **Gehe zu GitHub Settings:**
   - Öffne: https://github.com/settings/developers
   - Oder: GitHub → Settings → Developer settings → OAuth Apps

2. **Klicke auf "New OAuth App"**

3. **Fülle das Formular aus:**
   ```
   Application name:         Decap CMS - alexle135.de
   Homepage URL:             https://www.alexle135.de
   Application description:  CMS for alexle135.de
   Authorization callback:   https://DEINE-WORKER-URL.workers.dev/callback
   ```
   
   ⚠️ **WICHTIG:** Die Callback URL bekommst du erst in Teil 2 (Cloudflare Worker), 
   du kannst sie hier erstmal leer lassen und später aktualisieren!

4. **Klicke "Register application"**

5. **Notiere dir:**
   - ✅ **Client ID** (direkt sichtbar)
   - ✅ **Client Secret** (klicke "Generate a new client secret")
   
   ⚠️ **WICHTIG:** Client Secret wird nur EINMAL angezeigt! Speichere es sicher.

---

## ☁️ Teil 2: Cloudflare Worker deployen

### Schritt 1: Cloudflare Account erstellen

1. Gehe zu: https://dash.cloudflare.com/sign-up
2. Erstelle kostenloses Konto
3. Email bestätigen
4. Login ins Dashboard

### Schritt 2: Worker erstellen

1. **Im Cloudflare Dashboard:**
   - Klicke links auf "Workers & Pages"
   - Klicke "Create Application"
   - Wähle "Create Worker"

2. **Worker konfigurieren:**
   - Name: `cms-auth-alexle135` (oder beliebig)
   - Klicke "Deploy"

3. **Worker Code ersetzen:**
   - Klicke "Edit Code"
   - Lösche den Beispiel-Code
   - Kopiere den kompletten Code aus `cloudflare-worker/worker.js`
   - Klicke "Save and Deploy"

### Schritt 3: Environment Variables setzen

1. **Zurück zum Worker Dashboard:**
   - Klicke auf "Settings"
   - Scrolle zu "Variables and Secrets"

2. **Füge die Secrets hinzu:**
   
   **GITHUB_CLIENT_ID:**
   - Klicke "Add variable"
   - Type: "Secret"
   - Name: `GITHUB_CLIENT_ID`
   - Value: Deine Client ID von GitHub
   - Klicke "Save"

   **GITHUB_CLIENT_SECRET:**
   - Klicke "Add variable"
   - Type: "Secret"
   - Name: `GITHUB_CLIENT_SECRET`
   - Value: Dein Client Secret von GitHub
   - Klicke "Save"

3. **Worker neu deployen:**
   - Klicke oben "Deployments"
   - Klicke "Redeploy" beim neuesten Deployment

### Schritt 4: Worker URL notieren

- Deine Worker URL ist: `https://cms-auth-alexle135.DEIN-ACCOUNT.workers.dev`
- Beispiel: `https://cms-auth-alexle135.alex-schneider.workers.dev`

⚠️ **WICHTIG:** Gehe jetzt zurück zu GitHub OAuth App und aktualisiere die Callback URL:
```
https://DEINE-WORKER-URL.workers.dev/callback
```

---

## 🔧 Teil 3: Decap CMS Config aktualisieren

### Schritt 1: Config-Datei anpassen

Öffne die Datei `admin/config.yml` und ersetze:

```yaml
base_url: https://cms-auth.YOUR-WORKER-SUBDOMAIN.workers.dev
```

Mit deiner echten Worker URL:

```yaml
base_url: https://cms-auth-alexle135.DEIN-ACCOUNT.workers.dev
```

### Schritt 2: Änderungen committen & pushen

```bash
git add admin/config.yml
git commit -m "chore(cms): configure Cloudflare Worker OAuth"
git push origin main
```

Nach dem Push wird die Seite automatisch deployed (via GitHub Actions).

---

## ✅ Teil 4: CMS testen

### Schritt 1: CMS öffnen

Warte ca. 2 Minuten bis das Deployment durch ist, dann:

1. Öffne: **https://www.alexle135.de/admin/**
2. Du solltest den Decap CMS Login-Screen sehen

### Schritt 2: Login

1. Klicke "Login with GitHub"
2. Ein Popup öffnet sich (GitHub OAuth)
3. Autorisiere die App
4. Das Popup schließt sich automatisch
5. Du bist im CMS eingeloggt! 🎉

### Schritt 3: Content bearbeiten

**Collections im CMS:**

- 🎯 **Hero Section** → Startseite Header
- 👤 **Über mich** → About-Seite
- 🛠️ **Leistungen** → Services Liste
- 💡 **Kompetenzen** → Skills Liste
- 🚀 **Projekte** → Projekt-Portfolio
- ⚖️ **Rechtliches** → Impressum & Datenschutz
- 🤖 **KI-News** → Auto-Update Feed (nur ansehen)

---

## 📝 Content bearbeiten - Workflow

### Einfacher Workflow (direkter Commit)

1. Wähle Collection (z.B. "Über mich")
2. Klicke auf den Eintrag
3. Bearbeite den Content
4. Klicke "Save"
5. Änderung wird direkt committed → Auto-Deploy startet

### Editorial Workflow (mit Review)

Aktuell ist `publish_mode: editorial_workflow` aktiv:

1. **Draft erstellen:**
   - Bearbeite Content
   - Klicke "Save" → Status: "Draft"

2. **Ready for Review:**
   - Klicke "Set status" → "Ready for review"
   - Erstellt einen Pull Request auf GitHub

3. **Publish:**
   - Klicke "Publish" → Merged PR → Auto-Deploy

**Workflow-Tabs:**
- **"Contents"** → Alle veröffentlichten Inhalte
- **"Workflow"** → Drafts & In Review
- **"Media"** → Hochgeladene Bilder

---

## 📸 Bilder hochladen

1. Klicke oben rechts auf "Media"
2. Klicke "Upload"
3. Wähle Bild aus (wird nach `public/media/uploads/` hochgeladen)
4. Bild URL: `/media/uploads/dein-bild.jpg`

**Bilder in Content verwenden:**
- In Markdown: `![Alt Text](/media/uploads/bild.jpg)`
- In Image-Feldern: `/media/uploads/bild.jpg`

---

## 🔒 Sicherheit

### Was ist geschützt?

- ✅ **OAuth via GitHub:** Nur autorisierte GitHub-User
- ✅ **Repository-Zugriff:** Nur du hast Write-Access
- ✅ **Worker Secrets:** Verschlüsselt bei Cloudflare
- ✅ **CORS:** Nur alexle135.de erlaubt

### Wer kann Inhalte bearbeiten?

Aktuell: **Nur du** (Owner des GitHub Repos)

**Weitere Redakteure hinzufügen:**
1. Gehe zu GitHub Repo Settings
2. Manage access → Invite a collaborator
3. Gebe "Write" Permission
4. Redakteur kann sich mit eigenem GitHub-Account im CMS anmelden

---

## 🛠️ Troubleshooting

### Problem: "Failed to load config.yml"

**Lösung:**
1. Prüfe ob `/admin/config.yml` im Build vorhanden ist
2. YAML Syntax checken: https://www.yamllint.com/
3. Browser-Console öffnen (F12) → Fehler lesen

### Problem: "Authentication failed"

**Mögliche Ursachen:**
1. **Worker URL falsch in config.yml**
   - Prüfe `base_url` in `admin/config.yml`
   
2. **GitHub OAuth Callback URL falsch**
   - Gehe zu GitHub OAuth App Settings
   - Callback muss sein: `https://WORKER-URL.workers.dev/callback`
   
3. **Secrets nicht gesetzt**
   - Cloudflare Dashboard → Worker → Settings → Variables
   - Prüfe ob `GITHUB_CLIENT_ID` und `GITHUB_CLIENT_SECRET` gesetzt sind

### Problem: "CORS error"

**Lösung:**
- Öffne `cloudflare-worker/worker.js`
- Prüfe ob `Access-Control-Allow-Origin` deine Domain enthält:
  ```javascript
  'Access-Control-Allow-Origin': 'https://www.alexle135.de'
  ```

### Problem: Bilder werden nicht angezeigt

**Lösung:**
1. Prüfe Pfad: `/media/uploads/bild.jpg` (nicht `media/...`)
2. Nach Upload: Warte auf Deployment (ca. 2 Min)
3. Browser-Cache leeren (Strg+F5)

### Problem: Collection wird nicht angezeigt

**Lösung:**
1. Prüfe ob Datei existiert im Repo
2. Pfad in `config.yml` muss exakt stimmen:
   - Hero: `src/content/hero/hero.json`
   - About: `src/content/about/about.md`
   - etc.

---

## 🎨 Collections Übersicht

### Hero Section (JSON)
**Datei:** `src/content/hero/hero.json`  
**Felder:**
- `title` → Hauptüberschrift
- `subtitle` → Untertext
- `cta` → Button-Text
- `media` → Video/Bild Pfad

### Über mich (Markdown)
**Datei:** `src/content/about/about.md`  
**Felder:**
- `title` → Seitentitel
- `profileImage` → Profilbild Pfad
- `profileImageAlt` → Alt-Text
- `body` → Markdown Content

### Leistungen (JSON)
**Datei:** `src/content/services/services.json`  
**Felder (Array):**
- `title` → Service-Name
- `description` → Beschreibung
- `icon` → FontAwesome Klasse
- `color` → blue, purple, green, etc.

### Kompetenzen (JSON)
**Datei:** `src/content/skills/skills.json`  
**Felder (Array):**
- `name` → Skill-Name
- `percentage` → 0-100
- `category` → Beschreibung

### Projekte (Markdown Collection)
**Ordner:** `src/content/projects/*.md`  
**Felder:**
- `title` → Projekttitel
- `summary` → Kurzbeschreibung
- `tags` → Tags (Array)
- `heroImage` → Header-Bild
- `body` → Projektdetails (Markdown)

**Neues Projekt anlegen:**
1. CMS → "Projekte" → "New Projekt"
2. Felder ausfüllen
3. "Save" → Neue Datei wird erstellt

### Rechtliches (Markdown Files)
**Dateien:**
- `src/content/legal/impressum.md`
- `src/content/legal/datenschutz.md`

**Felder:**
- `title` → Seitentitel
- `body` → Markdown Content

### KI-News (JSON, Read-Only)
**Datei:** `src/content/ki-news/index.json`  
**Hinweis:** Wird automatisch via GitHub Action aktualisiert.  
Im CMS nur zum Ansehen, nicht editierbar.

---

## ⚙️ Advanced Config

### Editorial Workflow deaktivieren

Wenn du Änderungen direkt publishen willst (ohne Draft/Review):

In `admin/config.yml` ändern:
```yaml
publish_mode: simple  # statt editorial_workflow
```

### Lokales CMS testen

Für lokale Entwicklung (ohne OAuth):

1. **Terminal 1:** Astro Dev Server
   ```bash
   pnpm dev
   ```

2. **Terminal 2:** Decap Proxy Server
   ```bash
   npx decap-server
   ```

3. **Browser:** `http://localhost:4321/admin/`
   - Login mit lokalem Backend (kein OAuth nötig)

### Custom Domain für Worker

Worker ist erreichbar unter: `https://cms-auth-alexle135.ACCOUNT.workers.dev`

**Eigene Domain nutzen:**
1. Cloudflare Dashboard → Worker → Triggers
2. "Add Custom Domain"
3. Z.B.: `cms-auth.alexle135.de`
4. Config in `admin/config.yml` updaten

---

## 📊 Deployment-Flow

```
Content bearbeiten im CMS
         ↓
    Klick "Save"
         ↓
  Commit zu GitHub
         ↓
GitHub Action triggert
         ↓
    pnpm build
         ↓
  rsync zu Contabo
         ↓
Live auf alexle135.de
```

**Dauer:** Ca. 2-3 Minuten vom "Save" bis Live

---

## 🎓 Tipps & Best Practices

### Content schreiben

1. **Markdown nutzen:**
   - `# Überschrift 1`
   - `## Überschrift 2`
   - `**fett**` `*kursiv*`
   - `[Link](url)` `![Bild](url)`

2. **Preview nutzen:**
   - Rechts im Editor siehst du Live-Preview
   - Was du siehst, wird auch auf der Website so aussehen

3. **Bilder optimieren:**
   - Max 1920px Breite
   - WebP Format bevorzugen
   - Vor Upload komprimieren (z.B. TinyPNG)

### Workflow

1. **Kleinere Änderungen:** Direkt editieren & publishen
2. **Größere Changes:** Draft → Review → Publish
3. **Bilder zuerst hochladen,** dann in Content verwenden

### Sicherheit

- 🔒 Secrets **niemals** in Config oder Code
- 🔑 Client Secret sicher aufbewahren
- 👥 Nur vertrauenswürdige User als Collaborators

---

## 📞 Support & Weitere Infos

**Decap CMS Dokumentation:**  
https://decapcms.org/docs/

**Cloudflare Workers Docs:**  
https://developers.cloudflare.com/workers/

**GitHub OAuth Docs:**  
https://docs.github.com/en/developers/apps/building-oauth-apps

---

## ✅ Checkliste

Nach dem Setup sollte alles funktionieren:

- [ ] Cloudflare Worker deployed
- [ ] GitHub OAuth App erstellt
- [ ] Secrets in Cloudflare gesetzt
- [ ] Callback URL in GitHub gesetzt
- [ ] `admin/config.yml` mit Worker URL aktualisiert
- [ ] Änderungen gepusht & deployed
- [ ] CMS Login funktioniert
- [ ] Content editierbar
- [ ] Bilder hochladbar
- [ ] Änderungen werden deployed

---

**Viel Erfolg! Bei Fragen einfach melden.** 🚀
