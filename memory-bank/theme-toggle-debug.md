# Theme-Toggle Problem - Technische Details

## Problem-Beschreibung
Theme-Toggle Button wechselt nur das Icon (Mond/Sonne), aber der Hintergrund und die Text-Farben ändern sich nicht.

## Aktueller Code

### JavaScript (ThemeToggle.astro)
```javascript
function setTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === DARK;

  // Remove all theme classes
  root.classList.remove(DARK, LIGHT);
  root.classList.add(theme);
  
  // Also set data-theme attribute for better CSS targeting
  root.setAttribute('data-theme', theme);

  const darkIcon = document.getElementById('theme-icon-dark');
  const lightIcon = document.getElementById('theme-icon-light');

  if (darkIcon && lightIcon) {
    if (isDark) {
      darkIcon.classList.remove('hidden');
      lightIcon.classList.add('hidden');
    } else {
      darkIcon.classList.add('hidden');
      lightIcon.classList.remove('hidden');
    }
  }

  localStorage.setItem(STORAGE_KEY, theme);
}
```

### CSS (tailwind.css)
```css
/* Dark mode styles */
html.dark body {
  background-color: #0b0c10;
  color: #f3f4f6;
}

/* Light mode styles */
html.light body {
  background-color: #f9fafb;
  color: #111827;
}
```

## Debugging-Ergebnisse

### Browser-Konsole Output
```
Initial classes: dark
Initial body background: rgb(3, 7, 18)
After toggle - classes: light
After toggle - body background: rgb(3, 7, 18)  // Bleibt dunkel!
```

### Problem-Analyse
1. **JavaScript funktioniert**: Klassen werden korrekt gesetzt (`dark` → `light`)
2. **CSS greift nicht**: Hintergrund bleibt `rgb(3, 7, 18)` (entspricht `#0b0c10`)
3. **CSS-Selektoren**: `html.dark body` und `html.light body` werden nicht angewendet

## Mögliche Lösungsansätze

### 1. CSS-Spezifität erhöhen
```css
html.dark body {
  background-color: #0b0c10 !important;
  color: #f3f4f6 !important;
}

html.light body {
  background-color: #f9fafb !important;
  color: #111827 !important;
}
```

### 2. CSS-Variablen verwenden
```css
:root {
  --bg-color: #0b0c10;
  --text-color: #f3f4f6;
}

html.light {
  --bg-color: #f9fafb;
  --text-color: #111827;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

### 3. Data-Attribute verwenden
```css
[data-theme="dark"] body {
  background-color: #0b0c10;
  color: #f3f4f6;
}

[data-theme="light"] body {
  background-color: #f9fafb;
  color: #111827;
}
```

### 4. Tailwind dark: Präfixe
```css
body {
  @apply bg-surface text-gray-100 dark:bg-surface dark:text-gray-100;
  @apply light:bg-gray-50 light:text-gray-900;
}
```

## Empfohlene Lösung
CSS-Variablen verwenden, da sie am flexibelsten und wartbarsten sind.


