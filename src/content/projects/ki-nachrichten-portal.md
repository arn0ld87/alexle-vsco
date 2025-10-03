---
title: "KI Nachrichten Portal"
summary: "Dynamische KI-News mit automatisierten Updates – Machine-Learning-Trends und AI-Entwicklungen im Überblick"
tags:
  - KI
  - Automation
heroImage: "/media/ki_nachrichten_new.png"
demo: "/ki-nachrichten-demo/"
---

## Überblick
Ein einfaches Tool, das automatisch die neuesten KI-Nachrichten aus verschiedenen RSS-Feeds sammelt und übersichtlich darstellt. Fokus auf deutsche Artikel mit schönen Thumbnails für eine bessere Benutzererfahrung.

## Problem
Manuelle Sammlung von KI-Nachrichten ist zeitaufwendig und führt zu veralteten oder irrelevanten Inhalten. Es fehlte eine zentrale Quelle für aktuelle KI-Entwicklungen.

## Rolle & Verantwortlichkeiten
Konzeption, Entwicklung des RSS-Scrapers, Frontend-Integration und Deployment der Demo-Anwendung.

## Lösung & Vorgehen
- **RSS-Scraping**: Node.js Script mit rss-parser für automatische Datenerfassung
- **Content-Filterung**: Keyword-basierte Filterung für KI-relevante Artikel
- **Thumbnail-Extraktion**: Automatische Bild-Extraktion aus Artikeln
- **Deutsche Priorität**: Bevorzugung deutscher Quellen (Heise, Golem, Computerwoche)
- **Live-Updates**: Automatische Aktualisierung alle 6 Stunden

## Architektur & Tools
- **Backend**: Node.js + Express.js für API-Server
- **RSS-Parser**: rss-parser für Feed-Abfrage
- **Frontend**: Vanilla JavaScript mit Fetch API
- **Datenquellen**: 10+ RSS-Feeds (deutsche + internationale KI-Quellen)
- **Deployment**: Lokaler Server mit automatischem Scraping

## Ergebnisse & Kennzahlen
- **Automatisierung**: 100% automatische Datenerfassung ohne manuellen Eingriff
- **Content-Vielfalt**: 10+ RSS-Feeds mit deutschen und internationalen Quellen
- **Performance**: Ladezeit < 1.2s, Live-Updates alle 5 Minuten
- **Deutsche Priorität**: Bevorzugung deutscher Artikel für bessere Lokalisierung
- **Thumbnail-Qualität**: Automatische Bild-Extraktion für visuelle Attraktivität
- **Echtzeit-Daten**: Aktuelle Artikel mit Zeitstempel und Quellen-Angabe

## Technische Highlights
- **Multi-Source Aggregation**: RSS-Feeds von Heise, Golem, TechCrunch, OpenAI, etc.
- **Intelligent Filtering**: Keyword-basierte KI-Relevanz-Filterung
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Fallback-System**: Graceful Degradation bei API-Ausfällen