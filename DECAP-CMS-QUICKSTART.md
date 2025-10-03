# 🚀 Decap CMS - Quick Start (15 Minuten)

Schnelle Schritt-für-Schritt Anleitung zum CMS-Setup.

---

## ✅ Schritt 1: GitHub OAuth App (3 Min)

1. Öffne: https://github.com/settings/developers
2. Klicke "OAuth Apps" → "New OAuth App"
3. Ausfüllen:
   ```
   Name: Decap CMS alexle135
   Homepage: https://www.alexle135.de
   Callback: (erstmal leer lassen)
   ```
4. "Register application"
5. **Notiere Client ID** (wird angezeigt)
6. **"Generate new client secret"** → **NOTIEREN!** (nur einmal sichtbar)

---

## ✅ Schritt 2: Cloudflare Worker (5 Min)

### A) Account erstellen
1. https://dash.cloudflare.com/sign-up
2. Kostenloses Konto
3. Email bestätigen

### B) Worker erstellen
1. Dashboard → "Workers & Pages"
2. "Create Application" → "Create Worker"
3. Name: `cms-auth-alexle135`
4. "Deploy"

### C) Code deployen
1. "Edit Code"
2. Lösche Beispiel-Code
3. Kopiere Code aus `cloudflare-worker/worker.js`
4. "Save and Deploy"

### D) Secrets setzen
1. Zurück zum Worker → "Settings"
2. "Variables and Secrets" → "Add variable"

   **Variable 1:**
   - Type: Secret
   - Name: `GITHUB_CLIENT_ID`
   - Value: [Deine Client ID von Schritt 1]
   - Save

   **Variable 2:**
   - Type: Secret
   - Name: `GITHUB_CLIENT_SECRET`
   - Value: [Dein Client Secret von Schritt 1]
   - Save

3. Worker → "Deployments" → "Redeploy" beim neuesten

### E) Worker URL notieren
- Steht oben: `https://cms-auth-alexle135.DEIN-NAME.workers.dev`
- **NOTIEREN!**

---

## ✅ Schritt 3: GitHub OAuth Callback aktualisieren (1 Min)

1. Zurück zu: https://github.com/settings/developers
2. Deine OAuth App öffnen
3. "Authorization callback URL" eintragen:
   ```
   https://cms-auth-alexle135.DEIN-NAME.workers.dev/callback
   ```
4. "Update application"

---

## ✅ Schritt 4: Config aktualisieren & deployen (3 Min)

1. Öffne `admin/config.yml`
2. Ändere Zeile 5:
   ```yaml
   base_url: https://cms-auth-alexle135.DEIN-NAME.workers.dev
   ```
   Ersetze `DEIN-NAME` mit deinem echten Cloudflare-Account-Namen

3. Speichern & deployen:
   ```bash
   git add admin/config.yml
   git commit -m "feat(cms): configure Decap CMS with Cloudflare Worker"
   git push
   ```

4. **Warte 2-3 Minuten** bis GitHub Action fertig ist

---

## ✅ Schritt 5: CMS testen! 🎉

1. Öffne: **https://www.alexle135.de/admin/**
2. "Login with GitHub"
3. Popup → Autorisieren
4. **Fertig!** Du bist im CMS 🚀

---

## 📝 Content bearbeiten

**Collections:**
- 🎯 Hero Section → Startseite
- 👤 Über mich → About-Page
- 🛠️ Leistungen → Services
- 💡 Kompetenzen → Skills
- 🚀 Projekte → Portfolio
- ⚖️ Rechtliches → Impressum/Datenschutz

**Workflow:**
1. Collection auswählen
2. Bearbeiten
3. "Save"
4. Warte 2 Min → Live!

---

## 🆘 Probleme?

**Login funktioniert nicht:**
- Callback URL in GitHub korrekt? (muss `/callback` am Ende haben)
- Secrets in Cloudflare gesetzt?
- Worker URL in `admin/config.yml` korrekt?

**Config wird nicht geladen:**
- Deployment fertig? (GitHub Actions prüfen)
- Browser-Cache leeren (Strg+F5)

**Mehr Hilfe:** Siehe `DECAP-CMS-GUIDE.md` für Details

---

**Das war's! Happy Content Editing** ✨
