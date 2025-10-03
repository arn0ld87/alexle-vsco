/* Cosmic Defender – PixiJS/WebGL Minimal Port
 * Ziel: Nachweisbar schärfere, stabile Sprites durch WebGL-Renderer
 * Hinweis: Minimaler Proof-of-Concept – nutzt vorhandene Assets
 */

(async function () {
  const appContainer = document.getElementById('app');
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    background: '#000000',
    antialias: false,
    powerPreference: 'high-performance',
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  appContainer.appendChild(app.view);

  // Scharfe Pixel: Nearest-Neighbor
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

  const ASSET_BASE = '../space-shooter-game/assets/';
  const paths = {
    background: ASSET_BASE + 'Enjl-Starry Space Background/background_1.png',
    player: ASSET_BASE + 'Ships/spaceShips_001.png',
    enemy: ASSET_BASE + 'Enemies/enemyBlack1.png',
    bullet: ASSET_BASE + 'Lasers/laserBlue01.png',
  };

  // Pixi v7 Asset-Loader
  const [bgTx, playerTx, enemyTx, bulletTx] = await Promise.all([
    PIXI.Assets.load(paths.background),
    PIXI.Assets.load(paths.player),
    PIXI.Assets.load(paths.enemy),
    PIXI.Assets.load(paths.bullet),
  ]);

  // Background
  const bg = new PIXI.Sprite(bgTx);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  // Simple star overlay for motion
  const stars = new Array(100).fill(0).map(() => {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff, 0.8).drawRect(0, 0, 2, 2).endFill();
    g.x = Math.random() * app.screen.width;
    g.y = Math.random() * app.screen.height;
    g.speed = 1 + Math.random() * 2;
    app.stage.addChild(g);
    return g;
  });

  // Player
  const player = new PIXI.Sprite(playerTx);
  player.width = 50; player.height = 50;
  player.x = app.screen.width / 2 - 25;
  player.y = app.screen.height - 80;
  player.roundPixels = true; // runde Subpixel -> scharfe Kanten
  app.stage.addChild(player);

  // Enemy
  const enemies = [];
  function spawnEnemy() {
    const s = new PIXI.Sprite(enemyTx);
    s.width = 50; s.height = 50;
    s.x = Math.random() * (app.screen.width - 50);
    s.y = -50;
    s.speed = 2.5;
    s.roundPixels = true;
    app.stage.addChild(s);
    enemies.push(s);
  }

  // Bullets
  const bullets = [];
  function shoot() {
    const b = new PIXI.Sprite(bulletTx);
    b.width = 10; b.height = 30;
    b.x = player.x + 20;
    b.y = player.y;
    b.speed = -8;
    b.roundPixels = true;
    app.stage.addChild(b);
    bullets.push(b);
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  let lastShot = 0;
  let frame = 0;

  app.ticker.add((delta) => {
    frame++;

    // Move stars
    stars.forEach((s) => {
      s.y += s.speed * delta;
      if (s.y > app.screen.height) {
        s.y = 0;
        s.x = Math.random() * app.screen.width;
      }
    });

    // Player movement
    if (keys['ArrowLeft']) player.x = Math.max(0, player.x - 5 * delta);
    if (keys['ArrowRight']) player.x = Math.min(app.screen.width - player.width, player.x + 5 * delta);
    if (keys['ArrowUp']) player.y = Math.max(0, player.y - 5 * delta);
    if (keys['ArrowDown']) player.y = Math.min(app.screen.height - player.height, player.y + 5 * delta);

    // Shoot
    if (keys[' '] && performance.now() - lastShot > 250) {
      shoot();
      lastShot = performance.now();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.speed * delta * 1;
      if (b.y < -40) {
        app.stage.removeChild(b);
        bullets.splice(i, 1);
      }
    }

    // Spawn enemies
    if (frame % 60 === 0) spawnEnemy();

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.speed * delta;
      if (e.y > app.screen.height + 60) {
        app.stage.removeChild(e);
        enemies.splice(i, 1);
      }
    }
  });
})();
