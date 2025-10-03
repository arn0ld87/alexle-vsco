# Cosmic Defender - Space Shooter Game

## Projekt-Übersicht
Professionelles Browser-basiertes Arcade-Spiel mit HTML5 Canvas und Vanilla JavaScript. Vollständiges Spiel mit Menüs, Levels, Sound und Highscores.

## Technische Details
- **Technologie**: HTML5 Canvas, Vanilla JavaScript, CSS3, Web Audio API
- **Build-Setup**: Astro Static Site, ausgeliefert als plain HTML
- **Audio**: Prozedurales Sound-System mit Web Audio API (keine externen Dateien)
- **Deployment**: GitHub Actions zum automatischen Deployment

## Design-System Integration
Das Spiel nutzt ein Retro-Arcade Design mit Neon-Ästhetik:

### Farbschema
- **Hintergrund**: `#0a0e27` (Dunkelblau) und `#000` (Schwarz für Canvas)
- **Neon-Cyan**: `#00ffff` (Spieler, HUD, Rahmen)
- **Neon-Magenta**: `#ff00ff` (Buttons, Powerups)
- **Neon-Gelb**: `#ffff00` (Schüsse, Scores)
- **Rot**: `#ff0000` (Gegner, Gefahr)
- **Grün**: `#00ff00` (Health, Bonus)

### Typografie
- **Schriftart**: 'Press Start 2P' (Pixel-Perfect Retro-Font)
- **Text-Shadow**: Neon-Glow-Effekte für authentisches Arcade-Feeling
- **Pixelated Rendering**: Crisp Graphics ohne Anti-Aliasing

### UI-Elemente
- **Menü-Container**: Semi-transparentes Dunkelblau mit Neon-Cyan Border
- **Buttons**: Gradient mit 3D-Effekt und Hover-Animationen
- **HUD**: Neon-Text mit Glow-Schatten
- **Health-Bar**: Gradient von Grün über Gelb zu Rot

## Dateistruktur
```
public/demos/space-shooter-game/
└── index.html (vollständiges Spiel mit integriertem Design)
```

## Verlinkung
- **Demo-Link**: `/demos/space-shooter-game/`
- **Projektseite**: `/projekte/space-shooter-game/`
- **Content-Definition**: `src/content/projects/space-shooter-game.md`

## Spielfeatures

### Core Gameplay
- **Entity-System**: Spieler, Gegner, Projektile, Powerups, Partikel
- **Canvas-Rendering**: requestAnimationFrame mit crisp pixel rendering
- **Kollisionsabfragen**: AABB-Hitboxen und präzise Kollisionserkennung
- **Steuerung**: Pfeiltasten (Bewegung), Leertaste (Schießen), P (Pause)

### Gegnertypen
1. **Basic Enemy** (Rot): Standard-Gegner, 20 Punkte
2. **Fast Enemy** (Gelb): 1.8x Geschwindigkeit, 30 Punkte
3. **Tank Enemy** (Magenta): 3 Leben, langsam, 50 Punkte
4. **Zigzag Enemy** (Cyan): Sinusförmige Bewegung, trickreich

### Powerup-System
- **Shield** (Cyan): Stellt Health auf 100% wieder her
- **Rapid Fire** (Gelb): Erhöht Feuerrate für 5 Sekunden
- **Triple Shot** (Magenta): Drei Schüsse gleichzeitig für 5 Sekunden
- **Extra Life** (Grün): +1 Leben

### Menü-System
1. **Main Menu**: Start, Highscores, Controls
2. **Pause Menu**: Resume, Back to Main
3. **Game Over**: Score, Level, Replay
4. **Level Complete**: Bonus-Berechnung, Next Level
5. **Highscores**: Top 10 Scores mit LocalStorage

### Sound-Effekte (Prozedural)
- **Schuss**: 800Hz Square Wave
- **Explosion**: 100Hz Sawtooth (tiefer Bass)
- **Powerup**: 1200Hz → 1600Hz Melodie
- **Hit**: 200Hz Triangle Wave
- Alle Sounds via Web Audio API ohne externe Dateien

### Level-System
- **Progression**: Jedes Level erhöht Schwierigkeit
- **Scoring**: Score × Level-Multiplikator
- **Enemy Spawn**: Schnellere Spawn-Rate mit jedem Level
- **Level Complete**: Bei 1000 × Level Punkten
- **Bonus**: 500 × Level am Ende jedes Levels

### Visual Effects
- **Starfield**: Parallax-Scrolling Sternenhimmel
- **Partikel-System**: 20 Partikel pro Explosion
- **Neon-Glow**: Box-Shadow und Text-Shadow für Arcade-Look
- **Pulsing Powerups**: Animierte Ringe um Powerups
- **Health-Bar**: Farbverlauf basierend auf aktueller Health

## Performance-Optimierungen
- Effiziente Canvas-Rendering-Pipeline mit pixelated rendering
- Optimierte Kollisionserkennung (nur aktive Entities)
- Minimale DOM-Manipulationen (nur HUD-Updates)
- Objekt-Pooling für Partikel und Bullets
- RequestAnimationFrame für optimale FPS
- Web Audio API für latenzfreie Sound-Effekte

## SEO & Accessibility
- **Structured Data**: Breadcrumb-Navigation
- **Meta-Tags**: Vollständige SEO-Optimierung
- **Accessibility**: ARIA-Labels und Keyboard-Navigation
- **Canonical URL**: Korrekte Verlinkung

## Deployment-Status
- ✅ Komplett neu entwickelt mit allen Features
- ✅ Retro-Arcade Design implementiert
- ✅ Sound-System vollständig funktional
- ✅ Menü-System mit 5 verschiedenen Screens
- ✅ Level-Progression mit steigender Schwierigkeit
- ✅ Powerup-System mit 4 verschiedenen Types
- ✅ Highscore-System mit LocalStorage
- ✅ 4 verschiedene Gegnertypen mit AI
- ✅ Partikel-Effekte und Animationen
- ✅ Build erfolgreich
- ✅ Demo-Server läuft auf Port 4322

## Technische Highlights
- **~500 Zeilen optimiertes JavaScript**: Komplett neu geschrieben
- **Zero Dependencies**: Keine externen Libraries
- **Prozedurales Audio**: Web Audio API statt Sound-Dateien
- **LocalStorage Persistenz**: Highscores bleiben erhalten
- **Crisp Pixel Art**: image-rendering: pixelated für scharfe Grafik
- **Responsive**: Funktioniert auf verschiedenen Bildschirmgrößen

## Nächste Schritte
- Live-Deployment testen (automatisch via GitHub Actions)
- Performance auf verschiedenen Geräten testen
- Eventuell Mobile Touch-Steuerung hinzufügen
- Weitere Gegnertypen und Boss-Kämpfe (optional)
- Zusätzliche Powerups und Waffen-Upgrades (optional)

## Update Log
### Version 2.0 (2024-12-19)
- **Komplette Neuentwicklung** des gesamten Games
- Retro-Arcade Design mit Neon-Ästhetik
- Vollständiges Menü-System implementiert
- 4 verschiedene Gegnertypen mit AI
- Powerup-System mit 4 verschiedenen Powerups
- Prozedurales Sound-System via Web Audio API
- Level-Progression mit steigender Schwierigkeit
- Highscore-System mit Top 10
- Partikel-Effekte für Explosionen
- Crisp Pixel-Art Rendering
- ~500 Zeilen optimiertes JavaScript

