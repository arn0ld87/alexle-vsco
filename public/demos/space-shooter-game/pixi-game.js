/* Cosmic Defender – PixiJS/WebGL Port (Option B)
 * Ziel: Komplettport inkl. HUD/Menüs/Particles in Pixi, scharfe Sprites, stabile Performance
 * Hinweis: Iterative Umsetzung – Kernfeatures enthalten, erweiterbar
 */

(async function () {
  // ===== App Setup =====
  const appContainer = document.getElementById('app');
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    background: '#000000',
    antialias: false,
    powerPreference: 'high-performance',
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });
  appContainer.appendChild(app.view);

  // Scharfe Pixel: Nearest-Neighbor
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

  // ===== Assets =====
  const ASSET_BASE = '../space-shooter-canvas/assets/';
  const paths = {
    background: ASSET_BASE + 'Enjl-Starry Space Background/background_1.png',
    player: ASSET_BASE + 'Ships/spaceShips_001.png',
    enemies: {
      basic: ASSET_BASE + 'Enemies/enemyBlack1.png',
      fast: ASSET_BASE + 'Enemies/enemyBlue2.png',
      tank: ASSET_BASE + 'Enemies/enemyRed3.png',
      zigzag: ASSET_BASE + 'Enemies/enemyGreen4.png',
    },
    bullets: {
      player: ASSET_BASE + 'Lasers/laserBlue01.png',
      enemy: ASSET_BASE + 'Lasers/laserRed01.png',
    },
    powerups: {
      shield: ASSET_BASE + 'Power-ups/shield_gold.png',
      rapid: ASSET_BASE + 'Power-ups/bolt_gold.png',
      triple: ASSET_BASE + 'Power-ups/star_gold.png',
      health: ASSET_BASE + 'Power-ups/pill_red.png',
    },
    effects: Array.from({ length: 8 }, (_, i) =>
      ASSET_BASE + `Effects/spaceEffects_${String(i + 1).padStart(3, '0')}.png`
    ),
    sounds: {
      shoot: ASSET_BASE + 'Audio/laserRetro_001.ogg',
      explosion: ASSET_BASE + 'Audio/explosionCrunch_000.ogg',
      explosionAlt: ASSET_BASE + 'Audio/explosionCrunch_002.ogg',
      powerup: ASSET_BASE + 'Audio/forceField_001.ogg',
      hit: ASSET_BASE + 'Audio/forceField_000.ogg',
      music: ASSET_BASE + 'Audio/spaceEngineLow_004.ogg',
      menuClick: ASSET_BASE + 'Audio/computerNoise_000.ogg',
      levelComplete: ASSET_BASE + 'Audio/doorOpen_001.ogg',
    },
  };

  // Preload
  const textures = await PIXI.Assets.load({
    background: paths.background,
    player: paths.player,
    enemyBasic: paths.enemies.basic,
    enemyFast: paths.enemies.fast,
    enemyTank: paths.enemies.tank,
    enemyZigzag: paths.enemies.zigzag,
    bulletPlayer: paths.bullets.player,
    bulletEnemy: paths.bullets.enemy,
    powerupShield: paths.powerups.shield,
    powerupRapid: paths.powerups.rapid,
    powerupTriple: paths.powerups.triple,
    powerupHealth: paths.powerups.health,
    ...Object.fromEntries(paths.effects.map((p, i) => [
      `explosion${i + 1}`, p,
    ])),
  });

  // ===== Audio (HTMLAudio, clone-on-play) =====
  const audio = {};
  function loadAudio() {
    for (const [key, url] of Object.entries(paths.sounds)) {
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      audio[key] = a;
    }
  }
  loadAudio();
  let soundsEnabled = true;
  let musicEnabled = true;
  let musicNode = null;
  function playSound(key, vol = 0.5) {
    if (!soundsEnabled || !audio[key]) return;
    try {
      const n = audio[key].cloneNode();
      n.volume = vol;
      n.play().catch(() => {});
    } catch {}
  }
  function startMusic(vol = 0.3) {
    if (!musicEnabled) return;
    if (!musicNode) {
      musicNode = audio.music.cloneNode();
      musicNode.loop = true;
      musicNode.volume = vol;
    }
    musicNode.play().catch(() => {});
  }
  function stopMusic() { if (musicNode) { musicNode.pause(); musicNode.currentTime = 0; } }

  // ===== Game State =====
  const state = {
    gameState: 'menu', // 'menu'|'name'|'playing'|'paused'|'gameover'|'highscores'|'levelcomplete'
    playerName: '',
    score: 0,
    level: 1,
    lives: 3,
    health: 100,
    targetScore: 1000,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    comboMultiplier: 1,
    stats: { enemiesDestroyed: 0, shotsFired: 0, powerupsCollected: 0, accuracy: 0, totalDamage: 0 },
    frame: 0,
    lastShot: 0,
    shootDelay: 250,
    levelTransition: 0,
    flashEffect: 0,
    screenShake: 0,
  };

  // ===== Stage Layers =====
  const world = new PIXI.Container();
  const fxLayer = new PIXI.Container();
  const uiLayer = new PIXI.Container();
  app.stage.addChild(world, fxLayer, uiLayer);

  // For screen shake
  const camera = new PIXI.Container();
  world.addChild(camera);

  // ===== Background + Stars =====
  const bg = new PIXI.Sprite(textures.background);
  bg.width = app.screen.width; bg.height = app.screen.height;
  camera.addChild(bg);

  const stars = new Array(100).fill(0).map(() => {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff, 0.8).drawRect(0, 0, 2, 2).endFill();
    g.x = Math.random() * app.screen.width;
    g.y = Math.random() * app.screen.height;
    g.speed = 1 + Math.random() * 2;
    camera.addChild(g);
    return g;
  });

  // ===== Player =====
  const player = new PIXI.Sprite(textures.player);
  player.width = 50; player.height = 50;
  player.x = app.screen.width / 2 - 25;
  player.y = app.screen.height - 80;
  player.roundPixels = true;
  player.powerup = null;
  player.powerupTimer = 0;
  camera.addChild(player);

  // ===== Groups =====
  const enemies = [];
  const bullets = [];
  const powerups = [];

  // ===== UI (HUD) =====
  const hud = new PIXI.Container(); uiLayer.addChild(hud);
  const hudLeft = new PIXI.Container(); hudLeft.x = 10; hudLeft.y = 10; hud.addChild(hudLeft);
  const hudRight = new PIXI.Container(); hudRight.x = app.screen.width - 150; hudRight.y = 10; hud.addChild(hudRight);

  function makeLabel(text, size = 10, color = 0x00ffff) {
    const t = new PIXI.Text(text, { fontFamily: 'Press Start 2P', fontSize: size, fill: color, dropShadow: true, dropShadowColor: '#001111', dropShadowDistance: 1 });
    t.roundPixels = true;
    return t;
  }

  const playerLabel = makeLabel('SPIELER: ---'); hudLeft.addChild(playerLabel);
  const scoreLabel = makeLabel('PUNKTE: 0'); scoreLabel.y = 14; hudLeft.addChild(scoreLabel);
  const levelLabel = makeLabel('LEVEL: 1'); levelLabel.y = 28; hudLeft.addChild(levelLabel);
  const livesLabel = makeLabel('LEBEN: 3'); livesLabel.y = 42; hudLeft.addChild(livesLabel);

  const brand1 = makeLabel('alexle135.de', 8, 0xffff00); hudRight.addChild(brand1);
  const brand2 = makeLabel('COSMIC DEFENDER', 6, 0xffff00); brand2.y = 12; hudRight.addChild(brand2);
  const soundToggle = makeLabel('🔊 SOUND', 8, 0xffff00); soundToggle.y = 28; soundToggle.interactive = true; soundToggle.eventMode = 'static'; hudRight.addChild(soundToggle);
  const musicToggle = makeLabel('🎵 MUSIK', 8, 0xffff00); musicToggle.y = 42; musicToggle.interactive = true; musicToggle.eventMode = 'static'; hudRight.addChild(musicToggle);
  soundToggle.on('pointertap', () => { soundsEnabled = !soundsEnabled; playSound('menuClick', 0.4); updateHud(); });
  musicToggle.on('pointertap', () => { musicEnabled = !musicEnabled; if (musicEnabled) startMusic(); else stopMusic(); updateHud(); });

  // Bars
  const healthBar = new PIXI.Graphics(); uiLayer.addChild(healthBar);
  const progressBar = new PIXI.Graphics(); uiLayer.addChild(progressBar);

  function drawBars() {
    // Health (bottom 20px)
    const w = 250, h = 20, x = app.screen.width / 2 - w / 2, y = app.screen.height - 20 - 10;
    healthBar.clear();
    healthBar.lineStyle(2, 0x00ffff, 1);
    healthBar.beginFill(0x333333, 1).drawRect(x, y, w, h).endFill();
    const hw = Math.max(0, Math.min(1, state.health / 100)) * w;
    const grad = new PIXI.Graphics();
    grad.beginFill(0x00ff00).drawRect(0, 0, hw, h).endFill();
    // gradient via tint not trivial in Graphics; keep solid for now
    healthBar.addChild(grad); grad.x = x; grad.y = y;

    // Progress (above health)
    const py = y - 30;
    progressBar.clear();
    progressBar.lineStyle(2, 0xffff00, 1);
    progressBar.beginFill(0x333333, 1).drawRect(x, py, w, h).endFill();
    const p = Math.min(1, ((state.score % state.targetScore) / state.targetScore));
    const pf = new PIXI.Graphics();
    pf.beginFill(0x00ffff).drawRect(0, 0, p * w, h).endFill();
    progressBar.addChild(pf); pf.x = x; pf.y = py;
  }

  function updateHud() {
    playerLabel.text = `SPIELER: ${state.playerName || '---'}`;
    scoreLabel.text = `PUNKTE: ${state.score}`;
    levelLabel.text = `LEVEL: ${state.level}`;
    livesLabel.text = `LEBEN: ${state.lives}`;
    soundToggle.text = `${soundsEnabled ? '🔊' : '🔇'} SOUND`;
    musicToggle.text = `${musicEnabled ? '🎵' : '🔇'} MUSIK`;
    drawBars();
  }

  // Combo UI
  const comboContainer = new PIXI.Container(); uiLayer.addChild(comboContainer);
  comboContainer.x = app.screen.width / 2; comboContainer.y = 20; comboContainer.visible = false;
  const comboCount = new PIXI.Text('COMBO: 0', { fontFamily: 'Press Start 2P', fontSize: 20, fill: 0xffff00 }); comboCount.anchor.set(0.5, 0); comboContainer.addChild(comboCount);
  const comboMult = new PIXI.Text('1.0x', { fontFamily: 'Press Start 2P', fontSize: 14, fill: 0x00ffff }); comboMult.anchor.set(0.5, 0); comboMult.y = 22; comboContainer.addChild(comboMult);

  // ===== Menus (Pixi UI) =====
  function makeButton(label, onClick) {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.beginFill(0x00ffff).drawRoundedRect(0, 0, 260, 40, 6).endFill();
    g.tint = 0x00aaff;
    const t = new PIXI.Text(label, { fontFamily: 'Press Start 2P', fontSize: 12, fill: 0x000000 });
    t.x = 130 - t.width / 2; t.y = 10;
    c.addChild(g, t);
    c.interactive = true; c.eventMode = 'static';
    c.on('pointertap', () => { playSound('menuClick', 0.4); onClick(); });
    c.on('pointerover', () => { c.scale.set(1.03); });
    c.on('pointerout', () => { c.scale.set(1.0); });
    return c;
  }

  function makePanel(width = 400, height = 300) {
    const p = new PIXI.Graphics();
    p.lineStyle(3, 0x00ffff, 1).beginFill(0x0a0e27, 0.95).drawRoundedRect(-width/2, -height/2, width, height, 8).endFill();
    return p;
  }

  const center = { x: app.screen.width/2, y: app.screen.height/2 };

  const mainMenu = new PIXI.Container(); uiLayer.addChild(mainMenu); mainMenu.visible = false; mainMenu.position.set(center.x, center.y);
  mainMenu.addChild(makePanel());
  const title = new PIXI.Text('COSMIC\nDEFENDER', { fontFamily: 'Press Start 2P', fontSize: 28, fill: 0x00ffff, align: 'center' }); title.anchor.set(0.5); title.y = -100; mainMenu.addChild(title);
  const startBtn = makeButton('SPIEL STARTEN', () => showNameInput()); startBtn.y = -10; startBtn.x = -130; mainMenu.addChild(startBtn);
  const hsBtn = makeButton('HIGHSCORES', () => showHighscores()); hsBtn.y = 50; hsBtn.x = -130; mainMenu.addChild(hsBtn);

  const nameMenu = new PIXI.Container(); uiLayer.addChild(nameMenu); nameMenu.visible = false; nameMenu.position.set(center.x, center.y);
  nameMenu.addChild(makePanel());
  const nameTitle = new PIXI.Text('WILLKOMMEN, PILOT!', { fontFamily: 'Press Start 2P', fontSize: 20, fill: 0xff00ff }); nameTitle.anchor.set(0.5); nameTitle.y = -100; nameMenu.addChild(nameTitle);
  const namePrompt = new PIXI.Text('Gib deinen Namen ein:', { fontFamily: 'Press Start 2P', fontSize: 12, fill: 0xffffff }); namePrompt.anchor.set(0.5); namePrompt.y = -50; nameMenu.addChild(namePrompt);
  const inputBg = new PIXI.Graphics(); inputBg.lineStyle(2, 0x00ffff).beginFill(0x000000, 0.5).drawRoundedRect(-150, -20, 300, 40, 6).endFill(); inputBg.y = -10; nameMenu.addChild(inputBg);
  const nameText = new PIXI.Text('', { fontFamily: 'Press Start 2P', fontSize: 14, fill: 0x00ffff }); nameText.anchor.set(0.5); nameText.y = -10; nameMenu.addChild(nameText);
  const goBtn = makeButton("LOS GEHT'S!", () => startGame()); goBtn.y = 50; goBtn.x = -130; nameMenu.addChild(goBtn);
  const backBtn = makeButton('ZURÜCK', () => backToMain()); backBtn.y = 110; backBtn.x = -130; nameMenu.addChild(backBtn);

  const pauseMenu = new PIXI.Container(); uiLayer.addChild(pauseMenu); pauseMenu.visible = false; pauseMenu.position.set(center.x, center.y);
  pauseMenu.addChild(makePanel());
  const pauseTitle = new PIXI.Text('PAUSIERT', { fontFamily: 'Press Start 2P', fontSize: 20, fill: 0xff00ff }); pauseTitle.anchor.set(0.5); pauseTitle.y = -60; pauseMenu.addChild(pauseTitle);
  const resumeBtn = makeButton('WEITERSPIELEN', () => resumeGame()); resumeBtn.y = -10; resumeBtn.x = -130; pauseMenu.addChild(resumeBtn);
  const homeBtn = makeButton('HAUPTMENÜ', () => backToMain()); homeBtn.y = 50; homeBtn.x = -130; pauseMenu.addChild(homeBtn);

  const gameOverMenu = new PIXI.Container(); uiLayer.addChild(gameOverMenu); gameOverMenu.visible = false; gameOverMenu.position.set(center.x, center.y);
  gameOverMenu.addChild(makePanel());
  const goTitle = new PIXI.Text('GAME OVER', { fontFamily: 'Press Start 2P', fontSize: 20, fill: 0xff00ff }); goTitle.anchor.set(0.5); goTitle.y = -100; gameOverMenu.addChild(goTitle);
  const goStats = new PIXI.Text('', { fontFamily: 'Press Start 2P', fontSize: 10, fill: 0xffffff, align: 'left' }); goStats.anchor.set(0.5); goStats.y = 0; gameOverMenu.addChild(goStats);
  const againBtn = makeButton('NOCHMAL SPIELEN', () => showNameInput()); againBtn.y = 70; againBtn.x = -130; gameOverMenu.addChild(againBtn);
  const goHomeBtn = makeButton('HAUPTMENÜ', () => backToMain()); goHomeBtn.y = 130; goHomeBtn.x = -130; gameOverMenu.addChild(goHomeBtn);

  const levelCompleteMenu = new PIXI.Container(); uiLayer.addChild(levelCompleteMenu); levelCompleteMenu.visible = false; levelCompleteMenu.position.set(center.x, center.y);
  levelCompleteMenu.addChild(makePanel());
  const lcTitle = new PIXI.Text('LEVEL ABGESCHLOSSEN!', { fontFamily: 'Press Start 2P', fontSize: 18, fill: 0x00ffff }); lcTitle.anchor.set(0.5); lcTitle.y = -40; levelCompleteMenu.addChild(lcTitle);
  const lcBonus = new PIXI.Text('BONUS: 0', { fontFamily: 'Press Start 2P', fontSize: 12, fill: 0xffff00 }); lcBonus.anchor.set(0.5); lcBonus.y = 0; levelCompleteMenu.addChild(lcBonus);
  const nextBtn = makeButton('NÄCHSTES LEVEL', () => nextLevel()); nextBtn.y = 50; nextBtn.x = -130; levelCompleteMenu.addChild(nextBtn);

  const highscoreMenu = new PIXI.Container(); uiLayer.addChild(highscoreMenu); highscoreMenu.visible = false; highscoreMenu.position.set(center.x, center.y);
  highscoreMenu.addChild(makePanel());
  const hsTitle = new PIXI.Text('HIGHSCORES', { fontFamily: 'Press Start 2P', fontSize: 20, fill: 0xff00ff }); hsTitle.anchor.set(0.5); hsTitle.y = -120; highscoreMenu.addChild(hsTitle);
  const hsList = new PIXI.Text('', { fontFamily: 'Press Start 2P', fontSize: 10, fill: 0xffff00 }); hsList.anchor.set(0.5, 0); hsList.y = -90; highscoreMenu.addChild(hsList);
  const hsBack = makeButton('ZURÜCK', () => backToMain()); hsBack.y = 110; hsBack.x = -130; highscoreMenu.addChild(hsBack);

  function hideAllMenus() { mainMenu.visible = nameMenu.visible = pauseMenu.visible = gameOverMenu.visible = levelCompleteMenu.visible = highscoreMenu.visible = false; }
  function showMainMenu() { state.gameState = 'menu'; hideAllMenus(); mainMenu.visible = true; }
  function showNameInput() { state.gameState = 'name'; hideAllMenus(); nameMenu.visible = true; }

  function backToMain() { state.gameState = 'menu'; hideAllMenus(); mainMenu.visible = true; stopMusic(); playSound('menuClick', 0.4); }

  function showHighscores() {
    const highscores = JSON.parse(localStorage.getItem('cosmicDefenderHighscores') || '[]');
    if (!highscores.length) {
      hsList.text = 'Noch keine Highscores!';
    } else {
      hsList.text = highscores.map((hs, i) => `${i+1}. ${hs.name} - ${hs.score} Punkte (Level ${hs.level})`).join('\n');
    }
    state.gameState = 'highscores'; hideAllMenus(); highscoreMenu.visible = true; playSound('menuClick', 0.4);
  }

  // Name input via keyboard into Pixi text
  window.addEventListener('keydown', (e) => {
    if (state.gameState !== 'name') return;
    if (e.key === 'Enter') { startGame(); return; }
    if (e.key === 'Backspace') { state.playerName = state.playerName.slice(0, -1); nameText.text = state.playerName; return; }
    if (e.key.length === 1 && state.playerName.length < 20) {
      state.playerName += e.key;
      nameText.text = state.playerName.toUpperCase();
    }
  });

  function saveHighscore() {
    let highscores = JSON.parse(localStorage.getItem('cosmicDefenderHighscores') || '[]');
    highscores.push({ name: state.playerName, score: state.score, level: state.level, date: new Date().toISOString() });
    highscores.sort((a, b) => b.score - a.score); highscores = highscores.slice(0, 10);
    localStorage.setItem('cosmicDefenderHighscores', JSON.stringify(highscores));
  }

  function startGame() {
    if (!state.playerName) return;
    state.gameState = 'playing';
    state.score = 0; state.level = 1; state.lives = 3; state.health = 100; state.targetScore = 1000;
    state.combo = 0; state.comboTimer = 0; state.maxCombo = 0; state.comboMultiplier = 1;
    state.stats = { enemiesDestroyed: 0, shotsFired: 0, powerupsCollected: 0, accuracy: 0, totalDamage: 0 };
    player.x = app.screen.width / 2 - 25; player.y = app.screen.height - 80; player.powerup = null; player.powerupTimer = 0;
    enemies.splice(0, enemies.length); bullets.splice(0, bullets.length); powerups.splice(0, powerups.length);
    hideAllMenus(); updateHud(); startMusic(); state.levelTransition = 60;
  }

  function pauseGame() { if (state.gameState === 'playing') { state.gameState = 'paused'; hideAllMenus(); pauseMenu.visible = true; playSound('menuClick', 0.4); if (musicNode) musicNode.pause(); } }
  function resumeGame() { state.gameState = 'playing'; hideAllMenus(); playSound('menuClick', 0.4); if (musicEnabled && musicNode) musicNode.play(); }

  function gameOver() {
    state.gameState = 'gameover';
    state.stats.accuracy = state.stats.shotsFired > 0 ? Math.floor((state.stats.enemiesDestroyed / state.stats.shotsFired) * 100) : 0;
    goStats.text = [
      `PILOT: ${state.playerName}`,
      `ENDPUNKTZAHL: ${state.score}`,
      `ERREICHTES LEVEL: ${state.level}`,
      `MAX COMBO: ${state.maxCombo}x`,
      `Gegner zerstört: ${state.stats.enemiesDestroyed}`,
      `Trefferquote: ${state.stats.accuracy}%`,
      `Powerups gesammelt: ${state.stats.powerupsCollected}`,
    ].join('\n');
    hideAllMenus(); gameOverMenu.visible = true; stopMusic(); playSound('explosionAlt', 0.6); state.screenShake = 20;
    saveHighscore();
  }

  function nextLevel() {
    state.level++; state.targetScore = state.level * 1000; state.health = Math.min(100, state.health + 20);
    enemies.splice(0, enemies.length); bullets.splice(0, bullets.length); powerups.splice(0, powerups.length);
    hideAllMenus(); state.gameState = 'playing'; updateHud(); playSound('levelComplete', 0.5); state.levelTransition = 60; state.flashEffect = 30;
  }

  // ===== Input =====
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && state.gameState === 'playing') { e.preventDefault(); shoot(); }
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape')) {
      if (state.gameState === 'playing') pauseGame(); else if (state.gameState === 'paused') resumeGame();
    }
    if (e.key === 'm' || e.key === 'M') { soundsEnabled = !soundsEnabled; updateHud(); playSound('menuClick', 0.4); }
    if (e.key === 'n' || e.key === 'N') { musicEnabled = !musicEnabled; if (musicEnabled) startMusic(); else stopMusic(); updateHud(); }
  });
  window.addEventListener('keyup', (e) => keys[e.key] = false);

  // ===== Enemies / Bullets / Powerups =====
  function spawnEnemy() {
    const types = ['basic', 'fast', 'tank', 'zigzag'];
    const weights = [50, 30, 15, 5 + state.level * 2];
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random() * total, type = 'basic';
    for (let i=0;i<types.length;i++){ if (r < weights[i]) { type = types[i]; break; } r -= weights[i]; }

    const texKey = { basic:'enemyBasic', fast:'enemyFast', tank:'enemyTank', zigzag:'enemyZigzag' }[type];
    const s = new PIXI.Sprite(textures[texKey]);
    s.width = 50; s.height = 50; s.roundPixels = true; s.type = type; s.health = 1; s.zigzagTimer = 0;
    s.x = Math.random() * (app.screen.width - s.width);
    s.y = -50; s.speed = 2 + state.level * 0.3;
    if (type==='fast'){ s.speed*=1.8; s.width=40; s.height=40; }
    if (type==='tank'){ s.speed*=0.6; s.health=3; s.width=60; s.height=60; }
    if (type==='zigzag'){ s.width=45; s.height=45; }
    camera.addChild(s); enemies.push(s);
  }

  function shoot() {
    if (performance.now() - state.lastShot < state.shootDelay) return;
    state.lastShot = performance.now(); state.stats.shotsFired++; playSound('shoot', 0.5);

    const mkBullet = (xOff=20, angle=0) => {
      const b = new PIXI.Sprite(textures.bulletPlayer); b.width=10; b.height=30; b.x = player.x + xOff; b.y = player.y; b.speed = -8; b.angleRad = angle; b.roundPixels = true; camera.addChild(b); bullets.push(b);
    };
    if (player.powerup === 'triple') { mkBullet(20, 0); mkBullet(10, -0.2); mkBullet(30, 0.2); } else { mkBullet(); }
  }

  function spawnPowerup(x, y) {
    const types = ['shield', 'rapid', 'triple', 'health'];
    const type = types[Math.floor(Math.random()*types.length)];
    const key = { shield:'powerupShield', rapid:'powerupRapid', triple:'powerupTriple', health:'powerupHealth' }[type];
    const p = new PIXI.Sprite(textures[key]); p.type = type; p.width=30; p.height=30; p.x=x-15; p.y=y; p.speed=2; p.roundPixels=true; camera.addChild(p); powerups.push(p);
  }

  // ===== Explosions (AnimatedSprite) =====
  const explosionFrames = paths.effects.map((_, i) => textures[`explosion${i+1}`]);
  function createExplosion(x, y) {
    const anim = new PIXI.AnimatedSprite(explosionFrames);
    anim.animationSpeed = 0.5; anim.loop = false; anim.anchor.set(0.5); anim.x = x; anim.y = y; anim.scale.set(1+Math.random()*0.5);
    anim.onComplete = () => { fxLayer.removeChild(anim); anim.destroy({ children: true }); };
    fxLayer.addChild(anim); anim.play();
    // fire particles (simple)
    for (let i=0;i<15;i++) {
      const g = new PIXI.Graphics();
      g.beginFill([0xff0000,0xff6600,0xffff00,0xffffff][Math.floor(Math.random()*4)]).drawRect(0,0,3,3).endFill();
      g.x = x; g.y = y; g.vx = (Math.random()-0.5)*6; g.vy = (Math.random()-0.5)*6; g.life = 30; fxLayer.addChild(g);
    }
  }

  function createFloatingText(x, y, text, color = 0xffff00) {
    const t = new PIXI.Text(text, { fontFamily: 'Press Start 2P', fontSize: 12, fill: color });
    t.anchor.set(0.5);
    t.x = x; t.y = y; t.life = 60; fxLayer.addChild(t);
  }

  // ===== Game Loop =====
  app.ticker.add((delta) => {
    // Screen shake
    world.x = 0; world.y = 0;
    if (state.screenShake > 0) {
      world.x = (Math.random()-0.5)*state.screenShake;
      world.y = (Math.random()-0.5)*state.screenShake;
      state.screenShake *= 0.9; if (state.screenShake < 0.5) state.screenShake = 0;
    }

    // Stars motion
    stars.forEach((s)=>{ s.y += s.speed*delta; if (s.y > app.screen.height){ s.y=0; s.x = Math.random()*app.screen.width; } });

    // Update FX particles
    for (let i=fxLayer.children.length-1;i>=0;i--) {
      const c = fxLayer.children[i];
      if (c instanceof PIXI.Graphics && c.life) {
        c.x += c.vx; c.y += c.vy; c.vy += 0.1; c.life--; c.alpha = c.life/30;
        if (c.life<=0) { fxLayer.removeChild(c); }
      } else if (c instanceof PIXI.Text && c.life) {
        c.y -= 1; c.life--; c.alpha = c.life/60; if (c.life<=0) { fxLayer.removeChild(c); c.destroy(); }
      }
    }

    if (state.gameState === 'playing') {
      state.frame++;
      // Move player
      if (keys['ArrowLeft']) player.x = Math.max(0, player.x - 5*delta);
      if (keys['ArrowRight']) player.x = Math.min(app.screen.width - player.width, player.x + 5*delta);
      if (keys['ArrowUp']) player.y = Math.max(0, player.y - 5*delta);
      if (keys['ArrowDown']) player.y = Math.min(app.screen.height - player.height, player.y + 5*delta);

      // Powerup visual indicator
      if (player.powerup) {
        const pulseSize = 2 + Math.sin(state.frame * 0.2) * 2;
        if (!player.powerupBorder) {
          player.powerupBorder = new PIXI.Graphics();
          camera.addChild(player.powerupBorder);
        }
        player.powerupBorder.clear();
        player.powerupBorder.lineStyle(2, 0xffff00, 1);
        player.powerupBorder.drawRect(player.x - pulseSize, player.y - pulseSize, player.width + pulseSize*2, player.height + pulseSize*2);
        
        // Powerup timer bar
        const timerWidth = player.width;
        const timerPercent = player.powerupTimer / 300;
        player.powerupBorder.beginFill(0x000000, 0.5).drawRect(player.x, player.y - 8, timerWidth, 4).endFill();
        player.powerupBorder.beginFill(0xffff00, 1).drawRect(player.x, player.y - 8, timerWidth * timerPercent, 4).endFill();
      } else if (player.powerupBorder) {
        camera.removeChild(player.powerupBorder);
        player.powerupBorder = null;
      }

      // Bullets
      for (let i=bullets.length-1;i>=0;i--) {
        const b = bullets[i];
        b.y += b.speed*delta; if (b.angleRad) b.x += Math.sin(b.angleRad)*8*delta;
        if (b.y < -40) { camera.removeChild(b); bullets.splice(i,1); }
      }

      // Enemies
      for (let i=enemies.length-1;i>=0;i--) {
        const e = enemies[i];
        if (e.type==='zigzag'){ e.zigzagTimer += 0.1*delta; e.x += Math.sin(e.zigzagTimer)*3; }
        e.y += e.speed*delta;
        
        // Tank health bar
        if (e.type==='tank' && e.health > 1) {
          if (!e.healthBar) {
            e.healthBar = new PIXI.Graphics();
            camera.addChild(e.healthBar);
          }
          e.healthBar.clear();
          e.healthBar.lineStyle(1, 0x00ff00, 1);
          e.healthBar.beginFill(0xff0000, 1).drawRect(e.x, e.y - 8, e.width, 4).endFill();
          e.healthBar.beginFill(0x00ff00, 1).drawRect(e.x, e.y - 8, (e.width / 3) * e.health, 4).endFill();
        }
        
        // Collision with player
        if (hit(e, player)) {
          state.health -= 10; playSound('hit', 0.5); createExplosion(e.x+e.width/2, e.y+e.height/2); 
          if (e.healthBar) { camera.removeChild(e.healthBar); }
          camera.removeChild(e); enemies.splice(i,1);
          if (state.health <= 0) { state.lives--; if (state.lives<=0) gameOver(); else state.health = 100; }
          updateHud();
        }
        if (e.y > app.screen.height + 60) { 
          if (e.healthBar) { camera.removeChild(e.healthBar); }
          camera.removeChild(e); enemies.splice(i,1); 
        }
      }

      // Bullet vs enemy
      for (let i=bullets.length-1;i>=0;i--) {
        const b = bullets[i];
        for (let j=enemies.length-1;j>=0;j--) {
          const e = enemies[j];
          if (hit(b,e)) {
            e.health -= 1; camera.removeChild(b); bullets.splice(i,1);
            if (e.health<=0) {
              const basePoints = (e.type==='tank')?50:(e.type==='fast')?30:20;
              state.combo++; state.comboTimer = 180; state.maxCombo = Math.max(state.maxCombo, state.combo);
              state.comboMultiplier = 1 + state.combo*0.1; const bonus = Math.floor(basePoints * state.level * state.comboMultiplier);
              state.score += bonus; state.stats.enemiesDestroyed++;
              playSound(Math.random()<0.5?'explosion':'explosionAlt', 0.5);
              createExplosion(e.x+e.width/2, e.y+e.height/2);
              createFloatingText(e.x+e.width/2, e.y, `+${bonus}`, state.combo>5?0xffff00:0x00ffff);
              if (Math.random()<0.15) spawnPowerup(e.x+e.width/2, e.y+e.height/2);
              if (e.healthBar) { camera.removeChild(e.healthBar); }
              camera.removeChild(e); enemies.splice(j,1);
              updateHud();
            }
            break;
          }
        }
      }

      // Powerups
      for (let i=powerups.length-1;i>=0;i--) {
        const p = powerups[i]; 
        p.y += p.speed*delta;
        // Pulsing effect
        const pulseScale = 1 + Math.sin(state.frame * 0.1) * 0.15;
        p.scale.set(pulseScale);
        // Rotation
        p.rotation += 0.05 * delta;
        
        if (hit(p, player)) {
          playSound('powerup', 0.5); state.stats.powerupsCollected++;
          state.flashEffect = 15;
          const names = { shield:'SHIELD!', rapid:'RAPID FIRE!', triple:'TRIPLE SHOT!', health:'+1 LIFE!' };
          const colors = { shield:0x00ffff, rapid:0xffff00, triple:0xff00ff, health:0x00ff00 };
          createFloatingText(player.x+player.width/2, player.y, names[p.type], colors[p.type]);
          
          if (p.type==='shield'){ state.health = 100; }
          if (p.type==='rapid'){ state.shootDelay = 100; player.powerup='rapid'; player.powerupTimer=300; }
          if (p.type==='triple'){ player.powerup='triple'; player.powerupTimer=300; }
          if (p.type==='health'){ state.lives++; }
          camera.removeChild(p); powerups.splice(i,1); updateHud();
        } else if (p.y > app.screen.height + 40) { camera.removeChild(p); powerups.splice(i,1); }
      }

      // Powerup timer
      if (player.powerupTimer>0){ player.powerupTimer--; if (player.powerupTimer===0){ player.powerup=null; state.shootDelay=250; } }

      // Combo timer
      if (state.comboTimer>0){ state.comboTimer--; if (state.comboTimer===0){ state.combo=0; state.comboMultiplier=1; } }

      // Combo UI
      if (state.combo>1){ comboContainer.visible=true; comboCount.text = `COMBO: ${state.combo}`; comboMult.text = `${state.comboMultiplier.toFixed(1)}x`; } else { comboContainer.visible=false; }

      // Spawn
      const spawnRate = Math.max(30, 90 - state.level*5);
      if (state.frame % Math.floor(spawnRate) === 0 && state.levelTransition===0) spawnEnemy();

      // Level complete
      if (state.score >= state.level * state.targetScore) {
        state.gameState = 'paused'; lcBonus.text = `BONUS: ${state.level*500}`; state.score += state.level*500; levelCompleteMenu.visible = true; updateHud();
      }
    }

    // Flash overlay
    if (state.flashEffect>0){
      // Simple white flash via full-screen Graphics
      if (!uiLayer.flash){
        const f = uiLayer.flash = new PIXI.Graphics(); uiLayer.addChild(f);
      }
      uiLayer.flash.clear(); uiLayer.flash.beginFill(0xffffff, Math.min(0.3, state.flashEffect/30*0.3)).drawRect(0,0,app.screen.width, app.screen.height).endFill();
      state.flashEffect--; if (state.flashEffect===0){ uiLayer.flash.clear(); }
    }

    // Level transition text
    if (state.levelTransition>0){
      if (!uiLayer.levelText){
        const t = uiLayer.levelText = new PIXI.Text('', { fontFamily: 'Press Start 2P', fontSize: 40, fill: 0x00ffff }); t.anchor.set(0.5); t.x = app.screen.width/2; t.y = app.screen.height/2; uiLayer.addChild(t);
      }
      uiLayer.levelText.alpha = state.levelTransition/60; uiLayer.levelText.text = `LEVEL ${state.level}`; state.levelTransition--; if (state.levelTransition===0){ uiLayer.levelText.text=''; }
    }
  });

  function hit(a,b){ return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }

  // Start
  updateHud(); showMainMenu();
})();
