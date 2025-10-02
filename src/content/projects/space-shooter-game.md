---
title: "Space Shooter Game"
summary: "Browser-basiertes Spiel mit HTML5 Canvas – zeigt praktische JavaScript-Anwendung und Game Development"
tags:
  - JavaScript
  - Game Dev
heroImage: "/media/spaceshooter.png"
demo: "space-shooter.html"
---
## Überblick
Ein kleines Arcade-Spiel im Browser, umgesetzt mit HTML5 Canvas und Vanilla JavaScript. Fokus lag auf Spiellogik, Animationen und Kollisionsabfragen.

## Problem
Ich wollte einen leichtgewichtigen Showcase für JavaScript-Animationen und Game-Loops, der auch ohne Framework performt.

## Rolle & Verantwortlichkeiten
Ich habe die Spielmechanik entworfen, Grafiken integriert und die Steuerung per Tastatur umgesetzt.

## Lösung & Vorgehen
- Entity-System für Spieler, Gegner und Projektile
- Canvas-Rendering mit requestAnimationFrame und Double Buffering
- Utility-Funktionen für Hitboxen und Scoring

## Architektur & Tools
- Build-Setup mit Vite (nur Dev), ausgeliefert als plain HTML/CSS/JS
- Assets: Sprites als SVG/PNG, Soundeffekte via Web Audio API
- GitHub Actions zum automatischen Deployment auf Pages

## Ergebnisse
- Spielbarer Prototyp zum Demonstrieren von Frontend- und Canvas-Skills
- Grundlage für spätere Erweiterungen wie Highscore-System oder mobile Touch-Steuerung
- Erkenntnisse zur Performance-Optimierung von Canvas-Anwendungen
- Dokumentierte Code-Snippets für Schulungen und Blogposts
