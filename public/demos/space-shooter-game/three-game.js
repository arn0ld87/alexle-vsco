(function () {
  // ===== DOM Elements =====
  const appContainer = document.getElementById('app');
  const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    const bossHudEl = document.getElementById('boss-hud');
    const bossHealthEl = document.getElementById('boss-health');
  
    // ===== Game State =====
      const state = {
        score: 0,
        lives: 3,
        level: 1,
        gameState: 'playing', // playing, bossfight, gameover, paused
        powerup: null, // e.g., 'laser'
        powerupTimer: 0,
        isPaused: false,
        animationId: null,
      };
    // ===== Scene Setup =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, appContainer.clientWidth / appContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(appContainer.clientWidth, appContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    appContainer.appendChild(renderer.domElement);
    
    // Ensure canvas fills the container
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
  
    // ===== Audio =====
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioLoader = new THREE.AudioLoader();
    const shootSound = new THREE.Audio(listener);
    const explosionSound = new THREE.Audio(listener);
  
    audioLoader.load('Sounds-Music/Shots & Explosions/Laser Shot 1.mp3', (buffer) => {
      shootSound.setBuffer(buffer);
      shootSound.setVolume(0.3);
    });
    audioLoader.load('Sounds-Music/Shots & Explosions/Explosion 1.mp3', (buffer) => {
      explosionSound.setBuffer(buffer);
      explosionSound.setVolume(0.4);
    });
  
    // ===== Lighting & Skybox =====
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
  
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('assets/skybox/');
    const textureCube = cubeTextureLoader.load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
    scene.background = textureCube;
  
    // ===== Game Area =====
    const gameWidth = 20;
    const gameHeight = 15;
  
  // ===== Game Objects =====
  let player = null;
  let enemyModel = null;
  let enemyModel2 = null;
  let bossModel = null;
  let boss = null;
  let laserBeam = null;
  const enemies = [];
  const bullets = [];
  const particles = [];
  const powerups = [];
  const loader = new THREE.GLTFLoader();
  const playerSpeed = 0.2;
  const bulletSpeed = 0.5;
  state.lastShotTime = 0;

  // ===== HUD =====
  function updateHUD() {
    scoreEl.textContent = `PUNKTE: ${state.score}`;
    livesEl.textContent = `LEBEN: ${state.lives}`;
    levelEl.textContent = `LEVEL: ${state.level}`;
  }

  function updateBossHUD() {
    if (boss) {
      const healthPercent = (boss.health / boss.maxHealth) * 100;
      bossHealthEl.style.width = `${healthPercent}%`;
    }
  }

  // ===== Core Functions =====
  function createExplosion(position) {
    const particleCount = 20;
    const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const colors = [0xff0000, 0xffff00, 0xffa500];
    for (let i = 0; i < particleCount; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      particle.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
      particle.lifetime = Math.random() * 50 + 30;
      particles.push(particle);
      scene.add(particle);
    }
  }

  function shoot() {
    if (!player) return;
    if (shootSound.isPlaying) shootSound.stop();
    shootSound.play();

    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(player.position);
    bullet.position.z -= 0.5;
    scene.add(bullet);
    bullets.push(bullet);
  }

  function spawnEnemy() {
    if (!enemyModel || !enemyModel2) return;

    let modelToClone;
    const enemyType = Math.random() > 0.7 ? 'sinus' : 'standard';

    if (enemyType === 'sinus') {
      modelToClone = enemyModel2;
    } else {
      modelToClone = enemyModel;
    }

    const enemy = modelToClone.clone();
    enemy.userData = { type: enemyType, sinusOffset: Math.random() * Math.PI * 2 };

    enemy.position.x = (Math.random() - 0.5) * gameWidth;
    enemy.position.z = -gameHeight / 2 - 5;
    scene.add(enemy);
    enemies.push(enemy);
  }

  function spawnBoss() {
    if (!bossModel) return;

    boss = bossModel.clone();
    boss.position.set(0, 0, -gameHeight / 2 - 10);
    boss.health = 100 * state.level;
    boss.maxHealth = boss.health;
    
    bossHudEl.style.display = 'block';
    updateBossHUD();

    scene.add(boss);
  }

  function spawnPowerup() {
    const powerupGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const powerupMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.5 });
    const powerup = new THREE.Mesh(powerupGeometry, powerupMaterial);

    powerup.userData = { type: 'laser' };
    powerup.position.x = (Math.random() - 0.5) * gameWidth;
    powerup.position.z = -gameHeight / 2 - 5;

    scene.add(powerup);
    powerups.push(powerup);
  }

  let spawnInterval = null;
  function adjustSpawning() {
    if (spawnInterval) clearInterval(spawnInterval);
    const spawnRate = Math.max(500, 2000 - (state.level * 150));
    spawnInterval = setInterval(spawnEnemy, spawnRate);
  }

  function startGameSpawning() {
    adjustSpawning();
    setInterval(spawnPowerup, 15000); // Spawn powerup every 15 seconds
  }

  // Load models and start game
  loader.load('assets/space-kit/Models/GLTF format/craft_speederA.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(0.5, 0.5, 0.5);
    player.rotation.x = Math.PI / 2;
    scene.add(player);

    // Load and apply selected player skin
    if (window.selectedPlayerSkin) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(window.selectedPlayerSkin, (texture) => {
        player.traverse((child) => {
          if (child.isMesh && child.material) {
            // Assuming the player model uses a MeshStandardMaterial or similar
            // that can accept a map texture.
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        });
      });
    }

    loader.load('assets/space-kit/Models/GLTF format/craft_miner.glb', (gltf) => {
      enemyModel = gltf.scene;
      enemyModel.scale.set(0.4, 0.4, 0.4);
      enemyModel.rotation.x = Math.PI / 2;

      loader.load('assets/space-kit/Models/GLTF format/craft_cargoB.glb', (gltf) => {
        bossModel = gltf.scene;
        bossModel.scale.set(1, 1, 1);
        bossModel.rotation.x = Math.PI / 2;
        
        loader.load('assets/space-kit/Models/GLTF format/craft_speederD.glb', (gltf) => {
          enemyModel2 = gltf.scene;
          enemyModel2.scale.set(0.4, 0.4, 0.4);
          enemyModel2.rotation.x = Math.PI / 2;
          startGameSpawning();
        });
      });
    });
  }, undefined, (error) => {
    console.error('Model loading error:', error);
    player = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    scene.add(player);
  });

  // ===== Input =====
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // Mobile Controls
  const leftBtn = document.getElementById('move-left');
  const rightBtn = document.getElementById('move-right');
  const fireBtn = document.getElementById('fire');

  leftBtn.addEventListener('touchstart', () => { keys['ArrowLeft'] = true; }, { passive: true });
  leftBtn.addEventListener('touchend', () => { keys['ArrowLeft'] = false; });
  rightBtn.addEventListener('touchstart', () => { keys['ArrowRight'] = true; }, { passive: true });
  rightBtn.addEventListener('touchend', () => { keys['ArrowRight'] = false; });
  fireBtn.addEventListener('touchstart', () => { keys[' '] = true; }, { passive: true });
  fireBtn.addEventListener('touchend', () => { keys[' '] = false; });

  // ===== Render Loop =====
  function animate() {
    state.animationId = requestAnimationFrame(animate);
    
    // Skip game logic if paused
    if (state.isPaused) {
      renderer.render(scene, camera);
      return;
    }

    // Shooting Logic
    if (keys[' '] && player) {
      if (state.powerup === 'laser') {
        if (!laserBeam) {
          const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, gameHeight * 2, 8);
          const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 });
          laserBeam = new THREE.Mesh(beamGeometry, beamMaterial);
          scene.add(laserBeam);
        }
        laserBeam.visible = true;
        laserBeam.position.copy(player.position);
        laserBeam.position.z -= gameHeight; // Position it in front
      } else {
        if (Date.now() > state.lastShotTime + 250) {
          shoot();
          state.lastShotTime = Date.now();
        }
      }
    } else {
      if (laserBeam) laserBeam.visible = false;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.position.z -= bulletSpeed;
      if (bullet.position.z < -gameHeight) {
        scene.remove(bullet);
        bullets.splice(i, 1);
      }
    }

    // Update enemies
    const enemySpeed = 0.05 + (state.level - 1) * 0.01;
    if (state.gameState === 'playing') {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.position.z += enemySpeed;
        if (enemy.userData.type === 'sinus') {
          enemy.position.x = Math.sin(enemy.position.z + enemy.userData.sinusOffset) * (gameWidth / 4);
        }
        if (enemy.position.z > gameHeight / 2 + 5) {
          scene.remove(enemy);
          enemies.splice(i, 1);
        }
      }
    }

    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      powerup.rotation.y += 0.02;
      powerup.rotation.x += 0.01;
      powerup.position.z += enemySpeed * 0.8;
      if (powerup.position.z > gameHeight / 2 + 5) {
        scene.remove(powerup);
        powerups.splice(i, 1);
      }
    }

    // Player-Powerup Collision
    if (player) {
      const playerBox = new THREE.Box3().setFromObject(player);
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const powerupBox = new THREE.Box3().setFromObject(powerup);
        if (playerBox.intersectsBox(powerupBox)) {
          state.powerup = powerup.userData.type;
          state.powerupTimer = 600;
          scene.remove(powerup);
          powerups.splice(i, 1);
        }
      }
    }

    // Powerup Timer
    if (state.powerupTimer > 0) {
      state.powerupTimer--;
      if (state.powerupTimer <= 0) {
        state.powerup = null;
      }
    }

    // Boss logic
    if (state.gameState === 'bossfight' && boss) {
      if (boss.position.z < -gameHeight / 2 + 4) {
        boss.position.z += enemySpeed * 0.5;
      } else {
        boss.position.x = Math.sin(Date.now() * 0.001) * (gameWidth / 3);
      }
    }

    // Collision Detection
    const bulletBox = new THREE.Box3();
    const enemyBox = new THREE.Box3();
    const playerBox = new THREE.Box3();
    // Laser damage
    if (laserBeam && laserBeam.visible) {
      const laserBox = new THREE.Box3().setFromObject(laserBeam);
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        enemyBox.setFromObject(enemy);
        if (laserBox.intersectsBox(enemyBox)) {
          createExplosion(enemy.position);
          scene.remove(enemy);
          enemies.splice(j, 1);
          state.score += 10;
          updateHUD();
        }
      }
      if (boss) {
        const bossBox = new THREE.Box3().setFromObject(boss);
        if (laserBox.intersectsBox(bossBox)) {
          boss.health -= 0.5;
          updateBossHUD();
        }
      }
    }

    // Player-Enemy Collision
    if (player && state.gameState === 'playing') {
      playerBox.setFromObject(player);
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        enemyBox.setFromObject(enemy);
        if (playerBox.intersectsBox(enemyBox)) {
          createExplosion(player.position);
          if (explosionSound.isPlaying) explosionSound.stop();
          explosionSound.play();
          state.lives--;
          updateHUD();
          
          // Remove the enemy that hit the player
          scene.remove(enemy);
          enemies.splice(j, 1);
          
          // Check for game over
          if (state.lives <= 0) {
            state.gameState = 'gameover';
            if (window.showGameOver) {
              window.showGameOver(state.score);
            }
            return; // Stop the game loop
          }
        }
      }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bulletBox.setFromObject(bullet);

      // vs Enemies
      if (state.gameState === 'playing') {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          enemyBox.setFromObject(enemy);
          if (bulletBox.intersectsBox(enemyBox)) {
            createExplosion(enemy.position);
            if (explosionSound.isPlaying) explosionSound.stop();
            explosionSound.play();
            state.score += 100;

            if (state.gameState === 'playing' && state.score >= state.level * 1000) {
              state.gameState = 'bossfight';
              clearInterval(spawnInterval);
              enemies.forEach(e => scene.remove(e));
              enemies.length = 0;
              spawnBoss();
            }

            updateHUD();
            scene.remove(bullet);
            bullets.splice(i, 1);
            scene.remove(enemy);
            enemies.splice(j, 1);
            break;
          }
        }
      }
      // vs Boss
      else if (state.gameState === 'bossfight' && boss) {
        const bossBox = new THREE.Box3().setFromObject(boss);
        if (bulletBox.intersectsBox(bossBox)) {
          createExplosion(bullet.position);
          if (explosionSound.isPlaying) explosionSound.stop();
          explosionSound.play();
          boss.health -= 5;
          updateBossHUD();

          scene.remove(bullet);
          bullets.splice(i, 1);

          if (boss.health <= 0) {
            createExplosion(boss.position);
            scene.remove(boss);
            boss = null;
            bossHudEl.style.display = 'none';
            state.level++;
            state.gameState = 'playing';
            adjustSpawning();
            updateHUD();
          }
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.position.add(particle.velocity);
      particle.lifetime--;
      if (particle.lifetime <= 0) {
        scene.remove(particle);
        particles.splice(i, 1);
      }
    }

    // Player Movement
    if (player) {
      if (keys['ArrowLeft']) {
        player.position.x = Math.max(-gameWidth / 2, player.position.x - playerSpeed);
      }
      if (keys['ArrowRight']) {
        player.position.x = Math.min(gameWidth / 2, player.position.x + playerSpeed);
      }
      if (keys['ArrowUp']) {
        player.position.z = Math.max(-gameHeight / 2, player.position.z - playerSpeed);
      }
      if (keys['ArrowDown']) {
        player.position.z = Math.min(gameHeight / 2, player.position.z + playerSpeed);
      }
    }

    renderer.render(scene, camera);
  }

  // ===== Window Resize Handler =====
  function onWindowResize() {
    camera.aspect = appContainer.clientWidth / appContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(appContainer.clientWidth, appContainer.clientHeight);
  }
  window.addEventListener('resize', onWindowResize, false);

  // ===== Game Control Functions =====
  function pause() {
    state.isPaused = true;
  }
  
  function resume() {
    state.isPaused = false;
  }
  
  function restart() {
    // Reset game state
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    state.gameState = 'playing';
    state.powerup = null;
    state.powerupTimer = 0;
    state.isPaused = false;
    
    // Clear all game objects
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    particles.forEach(particle => scene.remove(particle));
    powerups.forEach(powerup => scene.remove(powerup));
    
    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;
    powerups.length = 0;
    
    // Remove boss if exists
    if (boss) {
      scene.remove(boss);
      boss = null;
      bossHudEl.style.display = 'none';
    }
    
    // Reset player position
    if (player) {
      player.position.set(0, 0, 0);
    }
    
    // Restart spawning
    if (spawnInterval) clearInterval(spawnInterval);
    adjustSpawning();
    
    // Update HUD
    updateHUD();
  }
  
  // Expose game control functions globally
  window.gameInstance = {
    pause: pause,
    resume: resume,
    restart: restart
  };

  // Start Game
  updateHUD();
  animate();
})();
