# Design-System Integration Guidelines

## Homepage Design-System

### Farbschema
- **Hintergrund**: `#0b0c10` (surface DEFAULT)
- **Subtiler Hintergrund**: `#11131a` (surface subtle)
- **Text**: `#f3f4f6` (gray-100)
- **Sekundärer Text**: `#d1d5db` (gray-300)
- **Akzente**: `#60a5fa` (blue-400)
- **Hover-Akzente**: `#93c5fd` (blue-300)
- **Warnung**: `#ef4444` (red-500)
- **Erfolg**: `#fbbf24` (yellow-400)

### Typografie
- **Schriftarten**: Inter, IBM Plex Sans, system-ui
- **Titel**: font-weight: 600, letter-spacing: -0.025em
- **UI-Elemente**: font-weight: 500
- **Text**: font-weight: 400, line-height: 1.6

### Komponenten
- **card-glass**: 
  - border-radius: 16px
  - border: 1px solid rgba(255, 255, 255, 0.1)
  - background: rgba(255, 255, 255, 0.05)
  - backdrop-filter: blur(8px)

### Buttons
- **Primär**: Gradient-Hintergrund mit Hover-Effekten
- **Sekundär**: Transparenter Hintergrund mit Border
- **Hover**: transform: translateY(-1px), erhöhte Box-Shadow

### Spacing
- Konsistente Abstände mit Tailwind-Klassen
- gap: 24px für Container-Abstände
- padding: 8px-32px je nach Kontext

## Integration in Projekte
1. HTML-Klasse `dark` für Dark Mode
2. Tailwind CSS Konfiguration anpassen
3. Konsistente Farbpalette verwenden
4. Glassmorphism-Effekte für moderne Optik
5. Responsive Design mit Tailwind-Breakpoints
