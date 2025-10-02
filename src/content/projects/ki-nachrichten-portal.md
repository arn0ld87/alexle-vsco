---
title: "KI Nachrichten Portal"
summary: "Dynamische KI-News mit automatisierten Updates – Machine-Learning-Trends und AI-Entwicklungen im Überblick"
tags:
  - KI
  - Automation
heroImage: "/media/ki_nachrichten.png"
demo: "ki-nachrichten.html"
---
## Überblick
Eine kuratierte Sammlung aktueller KI-Nachrichten, die automatisch aktualisiert wird. Ziel ist ein schneller Überblick über Machine-Learning-Trends.

## Problem
Das alte News-Widget musste manuell gepflegt werden und lieferte häufig veraltete Quellen.

## Rolle & Verantwortlichkeiten
Konzeption, technische Umsetzung der Datenerfassung sowie Gestaltung der Oberfläche.

## Lösung & Vorgehen
- Automatisierte Feeds via RSS + OpenAI-Tagging
- Content-Pipeline mit Cron-basiertem Scraper und Prüfroutinen
- Review-Step im CMS, bevor Inhalte live gehen

## Architektur & Tools
- GitHub Actions als Scheduler
- Node.js Script mit Cheerio & OpenAI API für Klassifikation
- Rendering in Astro mit Content Collections

## Ergebnisse
- Automatisiert gepflegte News-Übersicht
- Grundlage für spätere Integration in das KI-Agenten-Lab
- Verdeutlichung meiner Kompetenzen in Automatisierung und Content-Pipelines
- Frühwarnsystem für relevante KI-Trends anhand von Tagging-Statistiken
- Verbesserte Transparenz durch tägliche Statusreports ins Slack-Team
