/**
 * COSMIC DEFENDER - Space Shooter Game
 * 
 * Entwickelt von: Alexander Schneider
 * Website: alexle135.de
 * 
 * Ein modernes HTML5 Canvas Space Shooter Game mit:
 * - Professionelle Sprite-Grafiken
 * - Mehrstufiges Level-System
 * - Powerup-System
 * - Sound-Effekte und Musik
 * - Highscore mit Spielernamen
 */

// ===== KONFIGURATION =====
const CONFIG = {
    author: 'Alexander Schneider',
    domain: 'alexle135.de',
    canvas: {
        width: 800,
        height: 600
    },
    assets: {
        basePath: './assets/',
        // Asset-Pfade für einfache Austauschbarkeit
        player: {
            ship: 'Ships/spaceShips_001.png'
        },
        enemies: {
            basic: 'Enemies/enemyBlack1.png',
            fast: 'Enemies/enemyBlue2.png',
            tank: 'Enemies/enemyRed3.png',
            zigzag: 'Enemies/enemyGreen4.png'
        },
        bullets: {
            player: 'Lasers/laserBlue01.png',
            enemy: 'Lasers/laserRed01.png'
        },
        powerups: {
            shield: 'Power-ups/shield_gold.png',
            rapid: 'Power-ups/bolt_gold.png',
            triple: 'Power-ups/star_gold.png',
            health: 'Power-ups/pill_red.png'
        },
        effects: {
            explosion: 'Effects/',
            background: 'Enjl-Starry Space Background/background_1.png'
        },
        sounds: {
            shoot: 'Audio/laserRetro_001.ogg',
            explosion: 'Audio/explosionCrunch_000.ogg',
            explosionAlt: 'Audio/explosionCrunch_002.ogg',
            powerup: 'Audio/forceField_001.ogg',
            hit: 'Audio/forceField_000.ogg',
            music: 'Audio/spaceEngineLow_004.ogg',
            menuClick: 'Audio/computerNoise_000.ogg',
            levelComplete: 'Audio/doorOpen_001.ogg'
        }
    }
};

// ===== GLOBALE VARIABLEN =====
let canvas, ctx;
let gameState = 'menu'; // menu, name-input, playing, paused, gameover, highscores
let playerName = '';
let score = 0;
let level = 1;
let lives = 3;
let health = 100;
let levelProgress = 0; // 0-100% für Level-Fortschritt
let targetScore = 1000; // Score-Ziel für aktuelles Level

// Combo-System
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
let comboMultiplier = 1;

// Stats für End-Screen
let stats = {
    enemiesDestroyed: 0,
    shotsFired: 0,
    powerupsCollected: 0,
    accuracy: 0,
    totalDamage: 0
};

// Game-Objekte
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let powerups = [];
let stars = [];
let keys = {};

// Visual Effects
let screenShake = 0;
let levelTransition = 0;
let flashEffect = 0;

// Asset-Management
let images = {};
let sounds = {};
let music = null;
let imagesLoaded = 0;
let totalImages = 0;
let soundsEnabled = true;
let musicEnabled = true;
let masterVolume = 0.5;
let musicVolume = 0.3;

// Timing
let lastShot = 0;
let shootDelay = 250;
let frameCount = 0;

// ===== ASSET-LOADER =====
/**
 * Lädt alle benötigten Bilder
 * Diese Funktion macht es einfach, neue Assets hinzuzufügen
 */
function loadAssets() {
    const assetList = [
        { key: 'playerShip', path: CONFIG.assets.player.ship },
        { key: 'enemyBasic', path: CONFIG.assets.enemies.basic },
        { key: 'enemyFast', path: CONFIG.assets.enemies.fast },
        { key: 'enemyTank', path: CONFIG.assets.enemies.tank },
        { key: 'enemyZigzag', path: CONFIG.assets.enemies.zigzag },
        { key: 'bulletPlayer', path: CONFIG.assets.bullets.player },
        { key: 'bulletEnemy', path: CONFIG.assets.bullets.enemy },
        { key: 'powerupShield', path: CONFIG.assets.powerups.shield },
        { key: 'powerupRapid', path: CONFIG.assets.powerups.rapid },
        { key: 'powerupTriple', path: CONFIG.assets.powerups.triple },
        { key: 'powerupHealth', path: CONFIG.assets.powerups.health },
        { key: 'background', path: CONFIG.assets.effects.background }
    ];
    
    // Lade Explosions-Frames (Animation mit 8 Frames)
    for (let i = 1; i <= 8; i++) {
        const num = i.toString().padStart(3, '0');
        assetList.push({ 
            key: `explosion${i}`, 
            path: `Effects/spaceEffects_${num}.png` 
        });
    }
    
    totalImages = assetList.length;
    
    assetList.forEach(asset => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            updateLoadingScreen();
        };
        img.onerror = () => {
            console.warn(`Fehler beim Laden: ${asset.path}`);
            imagesLoaded++;
            updateLoadingScreen();
        };
        img.src = CONFIG.assets.basePath + asset.path;
        images[asset.key] = img;
    });
}

/**
 * Lädt alle Sound-Effekte
 * Audio-Dateien werden asynchron geladen
 */
function loadSounds() {
    const soundList = [
        { key: 'shoot', path: CONFIG.assets.sounds.shoot },
        { key: 'explosion', path: CONFIG.assets.sounds.explosion },
        { key: 'explosionAlt', path: CONFIG.assets.sounds.explosionAlt },
        { key: 'powerup', path: CONFIG.assets.sounds.powerup },
        { key: 'hit', path: CONFIG.assets.sounds.hit },
        { key: 'menuClick', path: CONFIG.assets.sounds.menuClick },
        { key: 'levelComplete', path: CONFIG.assets.sounds.levelComplete }
    ];
    
    soundList.forEach(sound => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = CONFIG.assets.basePath + sound.path;
        audio.volume = masterVolume;
        sounds[sound.key] = audio;
    });
    
    // Hintergrundmusik separat laden
    music = new Audio();
    music.preload = 'auto';
    music.src = CONFIG.assets.basePath + CONFIG.assets.sounds.music;
    music.volume = musicVolume;
    music.loop = true;
}

/**
 * Startet die Hintergrundmusik
 */
function startMusic() {
    if (musicEnabled && music) {
        music.play().catch(e => {
            console.log('Music autoplay blocked. Will start on user interaction.');
        });
    }
}

/**
 * Stoppt die Hintergrundmusik
 */
function stopMusic() {
    if (music) {
        music.pause();
        music.currentTime = 0;
    }
}

/**
 * Toggle Sound on/off
 */
function toggleSound() {
    soundsEnabled = !soundsEnabled;
    updateVolumeDisplay();
    playSound('menuClick');
}

/**
 * Toggle Musik on/off
 */
function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        startMusic();
    } else {
        stopMusic();
    }
    updateVolumeDisplay();
}

/**
 * Aktualisiert die Lautstärke-Anzeige im HUD
 */
function updateVolumeDisplay() {
    const soundIcon = document.getElementById('soundIcon');
    const musicIcon = document.getElementById('musicIcon');
    
    if (soundIcon) {
        soundIcon.textContent = soundsEnabled ? '🔊' : '🔇';
    }
    if (musicIcon) {
        musicIcon.textContent = musicEnabled ? '🎵' : '🔇';
    }
}

function updateLoadingScreen() {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('LADE ASSETS...', canvas.width / 2, canvas.height / 2 - 30);
    
    const progress = (imagesLoaded / totalImages) * 100;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2, progress * 3, 20);
    ctx.strokeStyle = '#00ffff';
    ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2, 300, 20);
    
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`${Math.floor(progress)}%`, canvas.width / 2, canvas.height / 2 + 50);
    
    if (imagesLoaded >= totalImages) {
        setTimeout(showMainMenu, 500);
    }
}

// ===== MENÜ-FUNKTIONEN =====
function showMainMenu() {
    gameState = 'menu';
    hideAllMenus();
    document.getElementById('mainMenu').classList.add('active');
}

function showNameInput() {
    gameState = 'name-input';
    hideAllMenus();
    document.getElementById('nameInputMenu').classList.add('active');
    document.getElementById('playerNameInput').focus();
    playSound('menuClick');
}

function startGameWithName() {
    const nameInput = document.getElementById('playerNameInput');
    playerName = nameInput.value.trim();
    
    if (playerName === '') {
        alert('Bitte gib einen Namen ein!');
        return;
    }
    
    playSound('menuClick');
    startGame();
}

function startGame() {
    if (playerName === '') {
        showNameInput();
        return;
    }
    
    gameState = 'playing';
    score = 0;
    level = 1;
    lives = 3;
    health = 100;
    levelProgress = 0;
    targetScore = 1000;
    enemies = [];
    bullets = [];
    particles = [];
    powerups = [];
    frameCount = 0;
    
    // Reset Combo & Stats
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    comboMultiplier = 1;
    stats = {
        enemiesDestroyed: 0,
        shotsFired: 0,
        powerupsCollected: 0,
        accuracy: 0,
        totalDamage: 0
    };
    
    // Initialisiere Spieler
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 80,
        width: 50,
        height: 50,
        speed: 5,
        powerup: null,
        powerupTimer: 0,
        trail: []
    };
    
    hideAllMenus();
    updateHUD();
    startMusic();
    
    // Level-Transition-Effekt
    levelTransition = 60;
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseMenu').classList.add('active');
        playSound('menuClick');
        if (music) music.pause();
    }
}

function resumeGame() {
    gameState = 'playing';
    hideAllMenus();
    playSound('menuClick');
    if (musicEnabled && music) music.play();
}

function gameOver() {
    gameState = 'gameover';
    
    // Berechne Accuracy
    stats.accuracy = stats.shotsFired > 0 ? 
        Math.floor((stats.enemiesDestroyed / stats.shotsFired) * 100) : 0;
    
    // Update Display
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('finalPlayerName').textContent = playerName;
    document.getElementById('finalCombo').textContent = maxCombo;
    document.getElementById('finalEnemies').textContent = stats.enemiesDestroyed;
    document.getElementById('finalAccuracy').textContent = stats.accuracy + '%';
    document.getElementById('finalPowerups').textContent = stats.powerupsCollected;
    
    document.getElementById('gameOverMenu').classList.add('active');
    saveHighscore();
    stopMusic();
    playSound('explosionAlt');
    
    // Screen Shake Effekt
    screenShake = 20;
}

function backToMain() {
    gameState = 'menu';
    hideAllMenus();
    showMainMenu();
    stopMusic();
    playSound('menuClick');
}

function nextLevel() {
    level++;
    targetScore = level * 1000;
    levelProgress = 0;
    enemies = [];
    bullets = [];
    particles = [];
    powerups = [];
    health = Math.min(100, health + 20);
    
    // Reset Combo für neues Level
    combo = 0;
    comboTimer = 0;
    
    hideAllMenus();
    gameState = 'playing';
    updateHUD();
    playSound('levelComplete');
    
    // Level-Transition mit Flash
    levelTransition = 60;
    flashEffect = 30;
}

function hideAllMenus() {
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
    });
}

// ===== HIGHSCORE-SYSTEM =====
function saveHighscore() {
    let highscores = JSON.parse(localStorage.getItem('cosmicDefenderHighscores') || '[]');
    highscores.push({ 
        name: playerName,
        score: score, 
        level: level, 
        date: new Date().toISOString() 
    });
    highscores.sort((a, b) => b.score - a.score);
    highscores = highscores.slice(0, 10);
    localStorage.setItem('cosmicDefenderHighscores', JSON.stringify(highscores));
}

function showHighscores() {
    const highscores = JSON.parse(localStorage.getItem('cosmicDefenderHighscores') || '[]');
    const list = document.getElementById('highscoreList');
    list.innerHTML = '';
    
    if (highscores.length === 0) {
        list.innerHTML = '<div class="highscore-entry">Noch keine Highscores!</div>';
    } else {
        highscores.forEach((hs, index) => {
            const entry = document.createElement('div');
            entry.className = 'highscore-entry';
            entry.textContent = `${index + 1}. ${hs.name} - ${hs.score} Punkte (Level ${hs.level})`;
            list.appendChild(entry);
        });
    }
    
    hideAllMenus();
    document.getElementById('highscoreMenu').classList.add('active');
    playSound('menuClick');
}

// ===== HUD-UPDATE =====
function updateHUD() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('levelDisplay').textContent = level;
    document.getElementById('livesDisplay').textContent = lives;
    document.getElementById('playerNameDisplay').textContent = playerName;
    document.getElementById('healthFill').style.width = health + '%';
    
    // Level-Fortschritt berechnen
    levelProgress = Math.min(100, (score % targetScore) / targetScore * 100);
    document.getElementById('levelProgressFill').style.width = levelProgress + '%';
    
    // Combo-Display
    if (combo > 1) {
        document.getElementById('comboDisplay').style.display = 'block';
        document.getElementById('comboCount').textContent = combo;
        document.getElementById('comboMultiplier').textContent = comboMultiplier.toFixed(1) + 'x';
    } else {
        document.getElementById('comboDisplay').style.display = 'none';
    }
}

// ===== SPIELER-STEUERUNG =====
function updatePlayer() {
    if (!player) return;
    
    // Bewegung
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    
    // Trail-Effekt für Spieler
    player.trail.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        life: 10,
        size: 3
    });
    
    if (player.trail.length > 15) {
        player.trail.shift();
    }
    
    // Powerup-Timer
    if (player.powerupTimer > 0) {
        player.powerupTimer--;
        if (player.powerupTimer === 0) {
            player.powerup = null;
            shootDelay = 250;
        }
    }
}

function shoot() {
    if (!player) return;
    
    const now = Date.now();
    if (now - lastShot < shootDelay) return;
    
    lastShot = now;
    playSound('shoot');
    stats.shotsFired++;
    
    if (player.powerup === 'triple') {
        bullets.push(
            { x: player.x + 20, y: player.y, width: 10, height: 30, speed: 8, damage: 1, type: 'player' },
            { x: player.x + 10, y: player.y, width: 10, height: 30, speed: 8, damage: 1, angle: -0.2, type: 'player' },
            { x: player.x + 30, y: player.y, width: 10, height: 30, speed: 8, damage: 1, angle: 0.2, type: 'player' }
        );
    } else {
        bullets.push({ 
            x: player.x + 20, 
            y: player.y, 
            width: 10, 
            height: 30, 
            speed: 8, 
            damage: 1,
            type: 'player',
            trail: []
        });
    }
}

// ===== SOUND-SYSTEM =====
/**
 * Spielt einen Sound-Effekt ab
 * Erstellt einen Clone für gleichzeitige Sounds
 */
function playSound(soundKey) {
    if (!soundsEnabled || !sounds[soundKey]) return;
    
    try {
        const sound = sounds[soundKey].cloneNode();
        sound.volume = masterVolume;
        sound.play().catch(e => {
            // Autoplay wurde blockiert - beim ersten User-Klick starten
            console.log('Sound play blocked:', e);
        });
    } catch (e) {
        console.log('Sound error:', e);
    }
}

/**
 * Spielt einen zufälligen Sound aus einer Kategorie
 */
function playRandomSound(sounds) {
    if (!soundsEnabled) return;
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    playSound(randomSound);
}

// ===== INPUT-HANDLING =====
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shoot();
    }
    
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') {
        e.preventDefault();
        pauseGame();
    } else if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'paused') {
        e.preventDefault();
        resumeGame();
    }
    
    // Enter in Name-Eingabe
    if (e.key === 'Enter' && gameState === 'name-input') {
        e.preventDefault();
        startGameWithName();
    }
    
    // Sound-Toggle mit 'M' (Mute)
    if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
    }
    
    // Musik-Toggle mit 'N'
    if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        toggleMusic();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ===== INITIALISIERUNG =====
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Sterne generieren
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 1
        });
    }
    
    loadAssets();
    loadSounds();
}

// ===== GEGNER-SYSTEM =====
/**
 * Spawnt neue Gegner basierend auf Level-Schwierigkeit
 */
function spawnEnemy() {
    const types = ['basic', 'fast', 'tank', 'zigzag'];
    const weights = [50, 30, 15, 5 + level * 2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let type = 'basic';
    
    for (let i = 0; i < types.length; i++) {
        if (random < weights[i]) {
            type = types[i];
            break;
        }
        random -= weights[i];
    }
    
    const enemy = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 2 + level * 0.3,
        health: 1,
        type: type,
        zigzagTimer: 0,
        spriteKey: 'enemyBasic'
    };
    
    switch(type) {
        case 'fast':
            enemy.speed *= 1.8;
            enemy.spriteKey = 'enemyFast';
            enemy.width = 40;
            enemy.height = 40;
            break;
        case 'tank':
            enemy.health = 3;
            enemy.speed *= 0.6;
            enemy.spriteKey = 'enemyTank';
            enemy.width = 60;
            enemy.height = 60;
            break;
        case 'zigzag':
            enemy.spriteKey = 'enemyZigzag';
            enemy.width = 45;
            enemy.height = 45;
            break;
        default:
            enemy.width = 50;
            enemy.height = 50;
    }
    
    enemies.push(enemy);
}

/**
 * Aktualisiert alle Gegner-Positionen und -Verhalten
 */
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Zigzag-Bewegung
        if (enemy.type === 'zigzag') {
            enemy.zigzagTimer += 0.1;
            enemy.x += Math.sin(enemy.zigzagTimer) * 3;
        }
        
        enemy.y += enemy.speed;
        
        // Kollision mit Spieler
        if (player && checkCollision(enemy, player)) {
            health -= 10;
            playSound('hit');
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemies.splice(index, 1);
            
            if (health <= 0) {
                lives--;
                if (lives <= 0) {
                    gameOver();
                } else {
                    health = 100;
                }
            }
            updateHUD();
        }
        
        // Entfernen wenn außerhalb
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });
}

// ===== GESCHOSS-SYSTEM =====
/**
 * Aktualisiert alle Geschosse
 */
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.angle) {
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
        }
        
        // Trail für Geschosse
        if (!bullet.trail) bullet.trail = [];
        bullet.trail.push({
            x: bullet.x + bullet.width / 2,
            y: bullet.y + bullet.height / 2,
            life: 5
        });
        if (bullet.trail.length > 8) {
            bullet.trail.shift();
        }
        
        // Kollision mit Gegnern (nur Spieler-Geschosse)
        if (bullet.type === 'player') {
            enemies.forEach((enemy, enemyIndex) => {
                if (checkCollision(bullet, enemy)) {
                    enemy.health -= bullet.damage;
                    bullets.splice(index, 1);
                    
                    if (enemy.health <= 0) {
                        const points = enemy.type === 'tank' ? 50 : enemy.type === 'fast' ? 30 : 20;
                        
                        // Combo-System
                        combo++;
                        comboTimer = 180; // 3 Sekunden
                        if (combo > maxCombo) maxCombo = combo;
                        
                        // Combo-Multiplikator
                        comboMultiplier = 1 + (combo * 0.1);
                        const bonusPoints = Math.floor(points * level * comboMultiplier);
                        score += bonusPoints;
                        
                        // Stats
                        stats.enemiesDestroyed++;
                        stats.totalDamage += bullet.damage;
                        
                        // Floating Score Text
                        createFloatingText(
                            enemy.x + enemy.width / 2, 
                            enemy.y, 
                            '+' + bonusPoints,
                            combo > 5 ? '#ffff00' : '#00ffff'
                        );
                        
                        // Variiere Explosions-Sound
                        playRandomSound(['explosion', 'explosionAlt']);
                        
                        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        enemies.splice(enemyIndex, 1);
                        
                        // Powerup-Drop Chance
                        if (Math.random() < 0.15) {
                            spawnPowerup(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        
                        updateHUD();
                    }
                }
            });
        }
        
        // Entfernen wenn außerhalb
        if (bullet.y < -20 || bullet.y > canvas.height + 20) {
            bullets.splice(index, 1);
        }
    });
    
    // Combo-Timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            comboMultiplier = 1;
            updateHUD();
        }
    }
}

// ===== POWERUP-SYSTEM =====
/**
 * Spawnt ein zufälliges Powerup
 */
function spawnPowerup(x, y) {
    const types = ['shield', 'rapid', 'triple', 'health'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerups.push({
        x: x - 15,
        y: y,
        width: 30,
        height: 30,
        type: type,
        speed: 2,
        spriteKey: `powerup${type.charAt(0).toUpperCase() + type.slice(1)}`
    });
}

/**
 * Aktualisiert alle Powerups
 */
function updatePowerups() {
    powerups.forEach((powerup, index) => {
        powerup.y += powerup.speed;
        
        // Powerup Trail-Effekt
        if (!powerup.trail) powerup.trail = [];
        powerup.trail.push({
            x: powerup.x + powerup.width / 2,
            y: powerup.y + powerup.height / 2,
            life: 20,
            color: getPowerupColor(powerup.type)
        });
        if (powerup.trail.length > 10) {
            powerup.trail.shift();
        }
        
        if (player && checkCollision(powerup, player)) {
            playSound('powerup');
            powerups.splice(index, 1);
            stats.powerupsCollected++;
            
            // Visual Feedback
            flashEffect = 15;
            createPowerupCollectEffect(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.type);
            
            switch(powerup.type) {
                case 'shield':
                    health = 100;
                    createFloatingText(player.x + player.width / 2, player.y, 'SHIELD!', '#00ffff');
                    break;
                case 'rapid':
                    shootDelay = 100;
                    player.powerup = 'rapid';
                    player.powerupTimer = 300;
                    createFloatingText(player.x + player.width / 2, player.y, 'RAPID FIRE!', '#ffff00');
                    break;
                case 'triple':
                    player.powerup = 'triple';
                    player.powerupTimer = 300;
                    createFloatingText(player.x + player.width / 2, player.y, 'TRIPLE SHOT!', '#ff00ff');
                    break;
                case 'health':
                    lives++;
                    createFloatingText(player.x + player.width / 2, player.y, '+1 LIFE!', '#00ff00');
                    break;
            }
            updateHUD();
        }
        
        if (powerup.y > canvas.height) {
            powerups.splice(index, 1);
        }
    });
    
    // Powerup-Timer
    if (player && player.powerupTimer > 0) {
        player.powerupTimer--;
        if (player.powerupTimer === 0) {
            player.powerup = null;
            shootDelay = 250;
        }
    }
}

/**
 * Gibt Farbe für Powerup-Typ zurück
 */
function getPowerupColor(type) {
    const colors = {
        shield: '#00ffff',
        rapid: '#ffff00',
        triple: '#ff00ff',
        health: '#00ff00'
    };
    return colors[type] || '#ffffff';
}

/**
 * Erstellt Sammel-Effekt für Powerup
 */
function createPowerupCollectEffect(x, y, type) {
    const color = getPowerupColor(type);
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40,
            size: Math.random() * 4 + 2,
            color: color
        });
    }
}

// ===== PARTIKEL & EXPLOSIONEN =====
/**
 * Erstellt eine Explosion mit animierten Sprites
 */
function createExplosion(x, y) {
    particles.push({
        x: x,
        y: y,
        frame: 1,
        maxFrames: 8,
        scale: 1 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
    });
    
    // Zusätzliche Partikel für Effekt
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            size: Math.random() * 3 + 1,
            color: ['#ff0000', '#ff6600', '#ffff00', '#ffffff'][Math.floor(Math.random() * 4)]
        });
    }
}

/**
 * Aktualisiert alle Partikel und Explosionen
 */
function updateParticles() {
    particles.forEach((particle, index) => {
        if (particle.frame !== undefined) {
            // Explosions-Animation
            particle.frame += 0.5;
            if (particle.frame >= particle.maxFrames) {
                particles.splice(index, 1);
            }
        } else if (particle.text) {
            // Floating Text
            particle.y -= 1;
            particle.life--;
            if (particle.life <= 0) {
                particles.splice(index, 1);
            }
        } else {
            // Normale Partikel
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Schwerkraft
            particle.life--;
            
            if (particle.life <= 0) {
                particles.splice(index, 1);
            }
        }
    });
}

/**
 * Erstellt Floating Score/Text
 */
function createFloatingText(x, y, text, color = '#ffff00') {
    particles.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 60,
        size: 12
    });
}

// ===== KOLLISIONSERKENNUNG =====
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// ===== RENDERING =====
function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.globalAlpha = 0.8;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        ctx.globalAlpha = 1;
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

/**
 * Zeichnet den Spieler mit Sprite und Trail
 */
function drawPlayer() {
    if (!player) return;
    
    // Spieler-Trail
    ctx.globalAlpha = 0.3;
    player.trail.forEach((trail, index) => {
        const alpha = trail.life / 10;
        ctx.fillStyle = player.powerup ? '#ffff00' : '#00ffff';
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillRect(trail.x - trail.size / 2, trail.y, trail.size, trail.size);
        trail.life--;
    });
    ctx.globalAlpha = 1;
    
    // Spieler-Schiff
    if (images.playerShip && images.playerShip.complete) {
        ctx.drawImage(images.playerShip, player.x, player.y, player.width, player.height);
        
        // Powerup-Indikator mit Animation
        if (player.powerup) {
            const pulseSize = 2 + Math.sin(frameCount * 0.2) * 2;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                player.x - pulseSize, 
                player.y - pulseSize, 
                player.width + pulseSize * 2, 
                player.height + pulseSize * 2
            );
            
            // Powerup-Timer-Bar
            const timerWidth = player.width;
            const timerPercent = player.powerupTimer / 300;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(player.x, player.y - 8, timerWidth, 4);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(player.x, player.y - 8, timerWidth * timerPercent, 4);
        }
    }
}

/**
 * Zeichnet alle Gegner mit Sprites
 */
function drawEnemies() {
    enemies.forEach(enemy => {
        const sprite = images[enemy.spriteKey];
        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Health-Bar für Tanks
            if (enemy.type === 'tank' && enemy.health > 1) {
                const barWidth = enemy.width;
                const barHeight = 4;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(enemy.x, enemy.y - 8, barWidth, barHeight);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(enemy.x, enemy.y - 8, (barWidth / 3) * enemy.health, barHeight);
            }
        }
    });
}

/**
 * Zeichnet alle Geschosse mit Sprites und Trail
 */
function drawBullets() {
    bullets.forEach(bullet => {
        // Bullet Trail
        if (bullet.trail) {
            ctx.globalAlpha = 0.5;
            bullet.trail.forEach((trail, index) => {
                const alpha = trail.life / 5;
                ctx.fillStyle = '#00ffff';
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillRect(trail.x - 2, trail.y - 2, 4, 4);
                trail.life--;
            });
            ctx.globalAlpha = 1;
        }
        
        // Bullet Sprite
        if (images.bulletPlayer && images.bulletPlayer.complete) {
            ctx.save();
            ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
            if (bullet.angle) {
                ctx.rotate(bullet.angle);
            }
            
            // Glow-Effekt
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            
            ctx.drawImage(images.bulletPlayer, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    });
}

/**
 * Zeichnet alle Powerups mit Sprites und Trail
 */
function drawPowerups() {
    powerups.forEach(powerup => {
        // Powerup Trail
        if (powerup.trail) {
            ctx.globalAlpha = 0.3;
            powerup.trail.forEach((trail, index) => {
                const alpha = trail.life / 20;
                ctx.fillStyle = trail.color;
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, 5, 0, Math.PI * 2);
                ctx.fill();
                trail.life--;
            });
            ctx.globalAlpha = 1;
        }
        
        const sprite = images[powerup.spriteKey];
        if (sprite && sprite.complete) {
            // Pulsing-Effekt
            const scale = 1 + Math.sin(frameCount * 0.1) * 0.15;
            const width = powerup.width * scale;
            const height = powerup.height * scale;
            const x = powerup.x - (width - powerup.width) / 2;
            const y = powerup.y - (height - powerup.height) / 2;
            
            // Rotation
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(frameCount * 0.05);
            
            // Glow-Effekt
            ctx.shadowBlur = 15;
            ctx.shadowColor = getPowerupColor(powerup.type);
            
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
            // Outer Glow Ring
            ctx.strokeStyle = getPowerupColor(powerup.type);
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.2;
            ctx.beginPath();
            ctx.arc(
                powerup.x + powerup.width / 2, 
                powerup.y + powerup.height / 2, 
                powerup.width / 2 + 5 + Math.sin(frameCount * 0.1) * 3, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });
}

/**
 * Zeichnet alle Partikel und Explosionen
 */
function drawParticles() {
    particles.forEach(particle => {
        if (particle.frame !== undefined) {
            // Explosions-Animation
            const frameNum = Math.floor(particle.frame);
            const explosionSprite = images[`explosion${frameNum}`];
            
            if (explosionSprite && explosionSprite.complete) {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.scale(particle.scale, particle.scale);
                const size = 64;
                ctx.drawImage(explosionSprite, -size / 2, -size / 2, size, size);
                ctx.restore();
            }
        } else if (particle.text) {
            // Floating Text
            ctx.save();
            ctx.font = particle.size + 'px "Press Start 2P"';
            ctx.fillStyle = particle.color;
            ctx.textAlign = 'center';
            ctx.globalAlpha = particle.life / 60;
            
            // Text-Shadow für bessere Lesbarkeit
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#000000';
            
            ctx.fillText(particle.text, particle.x, particle.y);
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        } else {
            // Normale Partikel mit Glow
            ctx.save();
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            
            // Glow-Effekt
            ctx.shadowBlur = 5;
            ctx.shadowColor = particle.color;
            
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    });
}

// ===== HAUPT-GAME-LOOP =====
function gameLoop() {
    // Screen Shake Effekt
    ctx.save();
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
    
    // Hintergrund
    if (images.background && images.background.complete) {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    drawStars();
    
    if (gameState === 'playing') {
        frameCount++;
        
        // Update
        updatePlayer();
        updateEnemies();
        updateBullets();
        updatePowerups();
        updateParticles();
        
        // Spawn-System
        const spawnRate = Math.max(30, 90 - level * 5);
        if (frameCount % spawnRate === 0 && levelTransition === 0) {
            spawnEnemy();
        }
        
        // Render
        drawParticles();
        drawEnemies();
        drawBullets();
        drawPowerups();
        drawPlayer();
        
        // Level-Check
        if (score >= level * targetScore) {
            gameState = 'paused';
            document.getElementById('levelBonus').textContent = level * 500;
            score += level * 500;
            document.getElementById('levelCompleteMenu').classList.add('active');
        }
        
        updateHUD();
    } else {
        // Auch im Pause-Modus rendern
        drawParticles();
        drawEnemies();
        drawBullets();
        drawPowerups();
        drawPlayer();
    }
    
    // Flash-Effekt (Level Complete, Powerup, etc.)
    if (flashEffect > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashEffect / 30 * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashEffect--;
    }
    
    // Level-Transition-Effekt
    if (levelTransition > 0) {
        ctx.fillStyle = '#00ffff';
        ctx.font = '40px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.globalAlpha = levelTransition / 60;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        
        ctx.fillText(`LEVEL ${level}`, canvas.width / 2, canvas.height / 2);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        levelTransition--;
    }
    
    ctx.restore();
    
    requestAnimationFrame(gameLoop);
}

// Start
window.addEventListener('load', () => {
    init();
    gameLoop();
});
