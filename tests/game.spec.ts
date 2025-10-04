import { test, expect } from '@playwright/test';

test.describe('Space Shooter Game', () => {
  test('should load, start, and register a hit', async ({ page }) => {
    // 1. Navigate to the game's page
    await page.goto('/demos/space-shooter-game/');

    // 2. Start the game by progressing through menus
    await page.getByRole('button', { name: 'SPIEL STARTEN' }).click();
    await page.getByRole('heading', { name: 'Wähle deinen Charakter' }).waitFor();
    await page.getByRole('img', { name: 'Alex' }).click();

    // 3. Wait for the game canvas to be visible
    await page.locator('#app canvas').waitFor();

    // 4. Get the game instance from the window object
    const getGame = () => page.evaluate(() => (window as any).gameInstance._getGame());

    // 5. Wait for an enemy to spawn
    await expect(async () => {
      const game = await getGame();
      expect(game.enemies.length).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 }); // Wait up to 10s for an enemy

    const gameBeforeHit = await getGame();
    const initialScore = gameBeforeHit.state.score;

    // 6. Fire a bullet
    // We can't easily simulate a keypress to the game's window,
    // so we'll call the fire method directly for this smoke test.
    await page.evaluate(() => (window as any).gameInstance._getGame().fireBullet());

    // 7. Wait for a collision to occur and score to update
    await expect(async () => {
      const game = await getGame();
      expect(game.state.score).toBeGreaterThan(initialScore);
    }).toPass({ timeout: 5000 });

    const gameAfterHit = await getGame();
    expect(gameAfterHit.state.score).toBe(initialScore + 100);
  });
});