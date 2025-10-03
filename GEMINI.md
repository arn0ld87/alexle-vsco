# GEMINI.md

## Project Overview

This is a personal website for Alexander Schneider, built as a static site using [Astro](https://astro.build/) and styled with [Tailwind CSS](https://tailwindcss.com/). The content is managed through Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/), which allows for a structured way to manage content like projects, services, and skills. The site also features a "KI-Nachrichten" (AI News) section, which is populated by an RSS feed scraper, and several interactive demos, including the "Cosmic Defender" space shooter game.

**Key Technologies:**

*   **Framework:** Astro
*   **Styling:** Tailwind CSS
*   **Content:** Astro Content Collections (Markdown and JSON)
*   **CMS:** Decap CMS with Cloudflare Worker for GitHub OAuth
*   **Deployment:** GitHub Actions with rsync to a Contabo server.

## Building and Running

*   **Prerequisites:**
    *   Node.js 20+
    *   pnpm

*   **Development:**
    ```bash
    pnpm install
    pnpm run dev
    ```
    The development server will be available at `http://localhost:4321`.

*   **Build:**
    ```bash
    pnpm run build
    ```

*   **Preview:**
    ```bash
    pnpm run preview
    ```

## Development Conventions

*   **Content Management:** Content is managed through Astro's Content Collections and is editable via the Decap CMS interface at `/admin/`.
    *   **Projects:** `src/content/projects/*.md`
    *   **About:** `src/content/about/about.md`
    *   **Services:** `src/content/services/services.json`
    *   **Skills:** `src/content/skills/skills.json`
    *   **Legal:** `src/content/legal/*.md`
*   **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g., `feat:`, `fix:`, `docs:`, `perf:`).
*   **Styling:** Adhere to the existing design system. Use Tailwind CSS utility classes.
*   **TypeScript:** The project uses TypeScript in strict mode.
*   **Performance:** Maintain a high performance standard (LCP < 1.8s on mobile). Avoid heavy third-party libraries in the critical path.
*   **Accessibility (A11y):** Ensure high contrast, proper focus management, and use of ARIA attributes.

## Deployment

Deployment is automated via GitHub Actions. Pushing to the `main` branch triggers the `.github/workflows/deploy.yml` workflow. This workflow builds the Astro project and then uses `rsync` to synchronize the `dist/` directory with the web server on Contabo. The process takes approximately 2 minutes.

## Key Features

### KI-News Portal
The "KI-Nachrichten" section is populated by a Node.js script that scrapes RSS feeds from various tech news sources (e.g., Heise, Golem, TechCrunch).
*   **Scraper Script:** `scripts/scrape-ki-news.js`
*   **Update Workflow:** The `.github/workflows/ki-news-update.yml` action runs the scraper periodically (every 8 hours) and commits the updated news to the repository.
*   **Content File:** The scraped news are stored in `src/content/ki-news/index.json`.

### Cosmic Defender Game
An interactive, retro-style space shooter game is integrated as a project demo.
*   **Location:** `public/demos/space-shooter-game/`
*   **Technology:** It is built with PixiJS/WebGL.
*   **Features:** Includes character selection (using Minecraft skins as avatars), a complete retro sound pack, multiple enemy types, power-ups, and a highscore system.