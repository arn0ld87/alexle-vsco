# Content-Editing Workflow (Decap CMS)

Diese Anleitung beschreibt den kompletten Redaktions-Workflow – von der Anmeldung im CMS bis zum veröffentlichten Inhalt auf
der Live-Seite.

## 1. Anmelden

1. Rufe `https://alexle135.de/admin/` auf.
2. Melde dich mit deinem GitHub-Account an (OAuth). Nach erfolgreichem Login erscheint das Decap Dashboard mit allen Collections.

## 2. Inhalte bearbeiten

1. Wähle in der linken Navigation die gewünschte Collection (z. B. **Projekte**, **Services**, **KI News**).
2. Bei **Listen-Collections** (z. B. Projekte) kannst du über **"New"** neue Einträge erzeugen oder bestehende auswählen.
3. Felder sind in Klartext beschrieben. Pflichtfelder sind markiert, optionale Felder können leer bleiben.
4. Nutze das rechte Panel **Preview**, um die speziell vorbereiteten Vorschauen für jeden Content-Typ zu prüfen.

## 3. Änderungen speichern

- **Save** legt einen Draft an und erstellt einen Branch (`cms/<collection>/<slug>`). Ideal für Zwischenstände.
- **Publish** (oben rechts) merged den Draft in `main`. Dadurch wird automatisch die GitHub Action zum Deployment gestartet.

## 4. Medien verwalten

1. Öffne in der Seitenleiste den Menüpunkt **Media**.
2. Lade neue Bilder/Videos hoch – sie werden automatisch in `public/media/uploads` gespeichert.
3. Über das Feld `media` bzw. `heroImage` lassen sich die Assets per Dropdown auswählen.

## 5. Review-Prozess (Editorial Workflow)

- Jeder Draft taucht im Tab **Review** auf.
- Status wechseln per Buttons:
  - **Draft** → **In Review** (wenn Kolleg:in prüfen soll)
  - **In Review** → **Ready** (Freigabe)
  - **Ready** → **Publish** (geht nach `main`)
- Kommentare können direkt im GitHub Pull Request ergänzt werden (Decap legt automatisch einen PR an).

## 6. Deployment & Kontrolle

1. Nach dem Publish wartet ca. 2–3 Minuten, bis GitHub Actions den Build ausgeführt hat.
2. Prüfe den Status unter `https://github.com/alexle135/alexle-vsco/actions`.
3. Nach erfolgreichem Build werden die Dateien via rsync auf den Server kopiert.
4. Öffne die Live-Seite und kontrolliere die Änderungen (Cache ggf. mit `Shift + Reload` leeren).

## 7. Fehlerbehebung

- **Login schlägt fehl**: OAuth-Proxy prüfen (`sudo systemctl status decap-oauth`).
- **Medien erscheinen nicht**: Sicherstellen, dass die Datei im CMS als Asset gewählt wurde und nicht nur der Dateiname eingegeben
  ist.
- **Preview leer**: Pflichtfelder (Titel, Summary etc.) ergänzen – die Templates benötigen minimale Inhalte.

## 8. Good Practices

- Vor größeren Änderungen immer einen Draft speichern und Feedback einholen.
- Markdown-Inhalte mit Überschriften strukturieren (`## Abschnitt`) – die Preview zeigt das später wie auf der Live-Seite.
- Für rechtliche Texte (Impressum/Datenschutz) nur veröffentlichen, wenn juristisch geprüft.

Mit diesem Workflow lassen sich alle Inhalte ohne lokale Entwicklungsumgebung pflegen. Änderungen bleiben nachvollziehbar, da
jeder Schritt als Commit im Git-Verlauf landet.
