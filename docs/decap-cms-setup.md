# Decap CMS – GitHub OAuth & Redaktions-Workflow

Diese Anleitung beschreibt, wie das GitHub OAuth Login für Decap CMS eingerichtet wird und wie Redakteur:innen Inhalte pflegen können.

## 1. GitHub OAuth einrichten

### 1.1 OAuth App auf GitHub anlegen
1. Melde dich bei GitHub an und öffne **Settings → Developer settings → OAuth Apps**.
2. Klicke auf **New OAuth App** und fülle die Felder wie folgt aus:
   - **Application name:** `Decap CMS – alexle135`
   - **Homepage URL:** `https://alexle135.de`
   - **Authorization callback URL:** `https://alexle135.de/api/auth/callback`
3. Nach dem Erstellen notiere dir die **Client ID** und generiere über **Generate a new client secret** einen **Client Secret**.

> Hinweis: Für lokale Tests kann eine zweite OAuth-App mit `http://localhost:4321` als Homepage & Callback URL (`http://localhost:4321/api/auth/callback`) genutzt werden.

### 1.2 Decap OAuth Server bereitstellen
Decap CMS benötigt einen kleinen OAuth-Proxy, der den GitHub Login übernimmt. Empfohlen wird [`decap-cms-oauth`](https://github.com/decaporg/decap-cms-oauth).

1. Füge das Repository `decaporg/decap-cms-oauth` als Git-Submodule oder eigenständigen Dienst hinzu.
2. Lege eine Konfigurationsdatei `.env` (oder Secret Variablen im Deployment) mit folgendem Inhalt an:
   ```bash
   GITHUB_CLIENT_ID=<die oben erzeugte Client ID>
   GITHUB_CLIENT_SECRET=<das erzeugte Client Secret>
   GITHUB_OAUTH_REDIRECT_URL=https://alexle135.de/api/auth/callback
   JWT_SECRET=<zufälliger mindestens 32 Zeichen langer Key>
   ```
3. Starte den OAuth-Server (z. B. via Docker):
   ```bash
   docker run -d \
     -e GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
     -e GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
     -e GITHUB_OAUTH_REDIRECT_URL=https://alexle135.de/api/auth/callback \
     -e JWT_SECRET=$JWT_SECRET \
     -p 8080:8080 \
     decaporg/decap-cms-oauth
   ```
4. Richte auf dem Produktionsserver ein Reverse Proxy Routing ein, das `https://alexle135.de/api/auth/` auf den OAuth-Server weiterleitet.

### 1.3 CMS mit OAuth verbinden
Die Datei [`admin/config.yml`](../admin/config.yml) ist bereits auf den GitHub Backend-Typ konfiguriert. Ergänze im Deployment die Umgebungsvariablen:

```bash
export CMS_GITHUB_CLIENT_ID=<Client ID>
export CMS_GITHUB_CLIENT_SECRET=<Client Secret>
```

Falls der OAuth-Proxy unter einer anderen URL läuft, passe die Callback-URL in GitHub und die Weiterleitung auf dem Server entsprechend an.

## 2. Medienverwaltung
- Medien werden im Repository unter `public/media/uploads/` abgelegt.
- Die Felder in den Collections nutzen `widget: image` oder `widget: file`, wodurch Decap CMS automatisch Uploads und Vorschaubilder verwaltet.

## 3. Redaktions-Workflow

### 3.1 Vorbereitung
1. Redakteur:in ruft `https://alexle135.de/admin/` auf.
2. GitHub Login erfolgt über den OAuth-Dialog.
3. Nach erfolgreichem Login zeigt Decap CMS das Dashboard mit allen Collections.

### 3.2 Inhalte bearbeiten
1. Wähle die gewünschte Collection (z. B. **Leistungen** oder **Projekte**).
2. Nutze die Formularfelder bzw. Markdown-Editoren. Jede Collection besitzt eine Live-Vorschau über die registrierten Preview-Templates.
3. Medien (Bilder, Videos) können über die Medienbibliothek hochgeladen und per Klick verknüpft werden.

### 3.3 Veröffentlichungsprozess
1. Klicke auf **Speichern** für einen Entwurf oder **Veröffentlichen**, um den Beitrag in den Review-Workflow zu senden.
2. Dank `publish_mode: editorial_workflow` entsteht ein Pull-Request/Commit mit dem Präfix aus `commit_messages`.
3. GitHub Actions führen automatisch `pnpm build` und das Deploy-Script (rsync) aus.
4. Sobald die Pipeline erfolgreich war, ist die Änderung auf dem Produktionsserver verfügbar.

### 3.4 Tipps für Redakteur:innen
- Nutze sprechende Titel & Beschreibungen – sie landen direkt in den Meta-Daten der Seiten.
- Bilder sollten mindestens 1600 px breit sein und werden in `public/media/uploads/` abgelegt.
- Bei Markdown-Texten stehen Überschriften (`##`), Listen und Zitate zur Verfügung.
- Der KI-News-Feed erlaubt das Pflegen externer Artikel inklusive Relevanz-Scores.

## 4. Fehlerbehebung
- **Login schlägt fehl:** Prüfe Callback-URL, OAuth-Server-Logs und GitHub Client Secret.
- **Medien werden nicht angezeigt:** Sicherstellen, dass der Upload-Pfad `/media/uploads/` öffentlich erreichbar ist.
- **Änderungen erscheinen nicht:** GitHub Actions Status prüfen; das rsync-Deployment muss erfolgreich abgeschlossen sein.

Mit diesen Schritten ist das Decap CMS vollständig in den GitHub-basierten Workflow integriert und ermöglicht redaktionelle Pflege ohne Code-Kenntnisse.
