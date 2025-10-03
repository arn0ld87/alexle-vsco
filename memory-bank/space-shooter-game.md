# Cosmic Defender - Space Shooter Game (PixiJS)

## Projekt-Übersicht
Professionelles Browser-basiertes Arcade-Spiel mit PixiJS/WebGL. Vollständiges Spiel mit Charakterauswahl, Menüs, Levels, Sound und Highscores.

## Technische Details
- **Technologie**: PixiJS 7.4.0, WebGL, Vanilla JavaScript, CSS3
- **Audio**: MP3-Musik und Sound-Effekte aus Retro-Sound-Pack
- **Build-Setup**: Astro Static Site, ausgeliefert als plain HTML
- **Deployment**: GitHub Actions zum automatischen Deployment
- **Avatare**: Minecraft-Skins (Alex & Micha) für Charakterauswahl

## Avatar-System
Das Spiel bietet zwei spielbare Charaktere:

### Alex
- **Avatar**: Minecraft-Skin (alex-skin.png)
- **Farbe**: Neon-Grün (`#00ff88`)
- **Eigenschaften**: Schnelle Allround-Pilotin mit erhöhter Feuerrate
- **Stats**: 
  - Feuerrate: 200ms
  - Geschwindigkeit: 5.5
  - Health: 100
  - Leben: 3

### Micha
- **Avatar**: Minecraft-Skin (micha-skin.png)
- **Farbe**: Orange (`#ff8800`)
- **Eigenschaften**: Tankiger Captain mit zusätzlicher Schildenergie
- **Stats**:
  - Feuerrate: 280ms
  - Geschwindigkeit: 4.2
  - Health: 130
  - Leben: 4

## Audio-System

### Hintergrundmusik
- **Hauptmusik**: "He's a plumber (8-bit version).mp3" (3.9 MB)
  - Super Mario-artiger 8-bit Retro-Soundtrack
  - Geloopt während des Spiels
- **Alternative**: "Let Me See Ya Bounce.mp3" (1.8 MB)
  - Elektronischer Dance-Track
  - Für zukünftige Events nutzbar

### Sound-Effekte
- **Laser-Schüsse**: Laser Shot 1 & 3
- **Explosionen**: Explosion 1 & 2 (verschiedene Größen)
- **Powerups**: Coins 1 (chiptune-artiger Effekt)
- **Treffer**: Blop 1
- **Menu-Klicks**: Single Bleep
- **Level Complete**: Up 5 (Sweep-Sound)
- **Game Over**: Game Over Music 1 (8-bit Melodie)

### Verfügbare Sound-Kategorien
Der `Sounds-Music/` Ordner enthält:
- **Alarms, Rings & Sirens** (9 Sounds)
- **Blips & Beeps** (18 Sounds)
- **Movement, Jump & Drop** (15 Sounds)
- **Music** (10 Tracks inkl. 3 Game Over Melodien)
- **Noise & Engine** (8 Sounds)
- **Score Sounds** (8 Sounds)
- **Shots & Explosions** (9 Sounds)
- **Sweeps** (10 Sounds)
- **Transformation** (20 Sounds)

## Design-System Integration
Das Spiel nutzt ein Retro-Arcade Design mit Neon-Ästhetik:

### Farbschema
- **Hintergrund**: `#0a0e27` (Dunkelblau) und `#000` (Schwarz für Canvas)
- **Neon-Cyan**: `#00ffff` (HUD, Rahmen)
- **Neon-Magenta**: `#ff00ff` (Buttons)
- **Neon-Gelb**: `#ffff00` (Scores)
- **Neon-Grün**: `#00ff88` (Alex Avatar)
- **Orange**: `#ff8800` (Micha Avatar)
- **Rot**: `#ff0000` (Gegner, Gefahr)
- **Grün**: `#00ff00` (Health, Bonus)

### Typografie
- **Schriftart**: 'Press Start 2P' (Pixel-Perfect Retro-Font)
- **Text-Shadow**: Neon-Glow-Effekte für authentisches Arcade-Feeling
- **Pixelated Rendering**: Crisp Graphics ohne Anti-Aliasing

### UI-Elemente
- **Menü-Container**: Semi-transparentes Dunkelblau mit Neon-Cyan Border
- **Buttons**: 3D-Effekt mit Hover-Animationen und Scale-Transform
- **HUD**: Neon-Text mit Glow-Schatten
- **Health-Bar**: Gradient mit dynamischer Farbänderung

## Dateistruktur
```
public/demos/space-shooter-game/
├── index.html (Haupt-HTML mit PixiJS-Einbindung)
├── pixi-game.js (Spiellogik mit PixiJS)
├── assets/ (Sprites, Backgrounds)
├── assets-reserve/ (Backup-Assets)
└── Sounds-Music/ (Komplettes Retro-Sound-Pack)
    ├── Music/ (10 Tracks inkl. Game Over)
    ├── Shots & Explosions/ (9 Sounds)
    ├── Blips & Beeps/ (18 Sounds)
    ├── Score Sounds/ (8 Sounds)
    └── ... (weitere Kategorien)

public/avatars/
├── alex-skin.png (922 KB)
└── micha-skin.png (1.0 MB)
```

## Verlinkung
- **Demo-Link**: `/demos/space-shooter-game/index.html`
- **Projektseite**: `/projekte/space-shooter-game/`
- **Content-Definition**: `src/content/projects/space-shooter-game.md`

## Spielfeatures

### Core Gameplay
- **Entity-System**: Spieler, Gegner, Projektile, Powerups, Partikel
- **PixiJS Rendering**: WebGL mit pixelated sprites
- **Kollisionsabfragen**: AABB-Hitboxen und präzise Kollisionserkennung
- **Steuerung**: Pfeiltasten (Bewegung), Leertaste (Schießen), P (Pause)
- **Charakterauswahl**: 2 spielbare Charaktere mit unterschiedlichen Stats

### Gegnertypen
1. **Basic Enemy**: Standard-Gegner, 20 Punkte
2. **Fast Enemy**: 1.8x Geschwindigkeit, 30 Punkte
3. **Tank Enemy**: 3 Leben, langsam, 50 Punkte
4. **Zigzag Enemy**: Sinusförmige Bewegung, trickreich
5. **Shooter Enemy**: Schießt zurück, gefährlich

### Powerup-System
- **Shield** (Gold): Stellt Health auf 100% wieder her
- **Rapid Fire** (Gold): Erhöht Feuerrate für 5 Sekunden
- **Triple Shot** (Gold): Drei Schüsse gleichzeitig für 5 Sekunden
- **Health** (Rot): Stellt 30% Health wieder her

### Menü-System
1. **Main Menu**: Spielstart, Highscores, Branding
2. **Name Input**: Spielername mit Keyboard-Eingabe
3. **Character Select**: Auswahl zwischen Alex und Micha mit Vorschau
4. **Pause Menu**: Resume, Zurück zum Hauptmenü
5. **Game Over**: Statistiken, Score, Replay-Option
6. **Level Complete**: Bonus-Berechnung, Nächstes Level
7. **Highscores**: Top-Scores mit LocalStorage

### Level-System
- **Progression**: Jedes Level erhöht Schwierigkeit
- **Scoring**: Score × Level-Multiplikator
- **Enemy Spawn**: Schnellere Spawn-Rate mit jedem Level
- **Level Complete**: Bei 1000 × Level Punkten
- **Bonus**: 500 × Level am Ende jedes Levels

### Visual Effects
- **Starfield**: Parallax-Scrolling Sternenhimmel
- **Partikel-System**: Explosions-Effekte mit PixiJS
- **Neon-Glow**: Box-Shadow für Arcade-Look
- **Screen Shake**: Bei großen Explosionen
- **Flash Effect**: Level-Übergänge
- **Combo-System**: Visuelles Feedback bei Kombos

## Performance-Optimierungen
- PixiJS WebGL-Rendering für maximale Performance
- Nearest-Neighbor Scaling für scharfe Pixel-Art
- Effiziente Sprite-Verwaltung
- Objekt-Pooling für Bullets und Particles
- Asset-Loading mit Error-Handling
- Optimierte Kollisionserkennung

## SEO & Accessibility
- **Structured Data**: Breadcrumb-Navigation
- **Meta-Tags**: Vollständige SEO-Optimierung
- **Accessibility**: Keyboard-Navigation
- **Canonical URL**: Korrekte Verlinkung

## Deployment-Status
- ✅ PixiJS-Port vollständig implementiert
- ✅ Charakterauswahl mit Minecraft-Skins
- ✅ Komplettes Retro-Sound-Pack integriert
- ✅ Hintergrundmusik ("He's a plumber" 8-bit)
- ✅ Game Over-Musik implementiert
- ✅ Alle Sound-Effekte ersetzt (MP3 statt OGG)
- ✅ Weiterleitungs-Loop behoben
- ✅ Avatar-Bilder in public/avatars/ verschoben
- ✅ Build erfolgreich

## Technische Highlights
- **PixiJS 7.4.0**: Moderne WebGL-Rendering-Engine
- **Retro-Sound-Pack**: 100+ professionelle 8-bit Sounds
- **Charaktersystem**: Vollständig anpassbare Spieler-Stats
- **MP3-basierte Musik**: Loop-fähige Hintergrundmusik
- **Minecraft-Integration**: Custom Avatare aus Minecraft-Skins
- **Zero Build Dependencies**: Läuft direkt im Browser

## Nächste Schritte
- Weitere Charaktere hinzufügen (optional)
- Alternative Musik-Tracks für verschiedene Level
- Boss-Kämpfe mit spezieller Musik (optional)
- Mobile Touch-Steuerung (optional)
- Weitere Sound-Effekte aus dem Pack nutzen

## Update Log

### Version 3.0 (2025-10-03)
- **Avatar-System**: Alex und Micha Minecraft-Skins integriert
- **Sound-Upgrade**: Komplettes Retro-Sound-Pack integriert
- **Hintergrundmusik**: "He's a plumber (8-bit version)" als Loop
- **Game Over-Musik**: Dedizierte Game Over-Melodie
- **Sound-Effekte**: Alle OGG durch hochwertige MP3 ersetzt
- **Bug-Fix**: Weiterleitungs-Loop bei `/demos/space-shooter-game/` behoben
- **Charakterauswahl**: Visuell aufgewertet mit großen Avatar-Vorschauen
- **Code-Cleanup**: Synthetische Chiptune-Musik entfernt

### Version 2.0 (2025-10-03)
- **PixiJS-Port**: Von Canvas zu PixiJS/WebGL migriert
- **Charakterauswahl**: System mit 2 verschiedenen Charakteren
- **Retro-Design**: Neon-Ästhetik mit Pixel-Art
- **Vollständiges Menü-System** implementiert
- **5 verschiedene Gegnertypen** mit AI
- **Powerup-System** mit 4 verschiedenen Powerups
- **Level-Progression** mit steigender Schwierigkeit
- **Highscore-System** mit Top 10

