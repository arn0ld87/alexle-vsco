/**
 * @file The main entry point for the Space Shooter game.
 */

import * as THREE from 'three';
import RenderingEngine from '../engine/rendering.js';
import InputController from '../engine/input.js';
import GameLoop from './loop.js';

// Expose THREE to the global scope for the OrbitControls example, if needed.
// This is not ideal but necessary for some older three.js examples.
window.THREE = THREE;

/**
 * Initializes and starts the game when the DOM is fully loaded.
 */
function main() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('CRITICAL: #app container not found. Game cannot start.');
    return;
  }

  // Check for required HUD elements
  const requiredHud = ['score', 'lives', 'level'];
  for (const id of requiredHud) {
      if (!document.getElementById(id)) {
          console.error(`CRITICAL: HUD element #${id} not found. Game cannot start.`);
          return;
      }
  }

  try {
    // 1. Initialize the core components
    const renderingEngine = new RenderingEngine(appContainer);
    const inputController = new InputController();

    // 2. Create the game loop instance
    const game = new GameLoop(renderingEngine, inputController);

    // 3. Start the game
    game.start();

    // 4. Expose game controls to the window for menus and testing
    window.gameInstance = {
      pause: () => {
        game.state.isPaused = true;
        game.input.detach();
      },
      resume: () => {
        game.state.isPaused = false;
        game.input.attach();
      },
      restart: () => {
        window.location.reload();
      },
      // Expose the game object for testing/debugging purposes
      _getGame: () => game,
      _spawnEnemyAt: (x, z) => game.spawnEnemyAt(x, z),
    };

  } catch (error) {
    console.error("An error occurred during game initialization:", error);
    appContainer.innerHTML = `<div class="error-screen">
      <h2>Game Failed to Load</h2>
      <p>${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>`;
  }
}

// Wait for the DOM to be ready before starting the game
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}