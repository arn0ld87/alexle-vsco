(function () { return; /* legacy implementation disabled after refactor */
  // ===== DOM Elements =====
  const appContainer = document.getElementById('app');
  const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    const bossHudEl = document.getElementById('boss-hud');
    const bossHealthEl = document.getElementById('boss-health');
  
  // ✅ FIX: Check if critical DOM elements exist before continuing
  if (!appContainer) {
    console.error('Critical Error: #app container not found. Game cannot initialize.');
    return;
  }
  
  if (!scoreEl || !livesEl || !levelEl) {
    console.error('Critical Error: HUD elements not found. Game cannot initialize.');
    return;
  }
  
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
    
    // ✅ CRITICAL FIX: Position camera to see the game
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);
    
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
    // ✅ VISIBILITY FIX: Increased lighting for better ship visibility
    scene.add(new THREE.AmbientLight(0xffffff, 1.2)); // Increased from 0.6 to 1.2
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increased from 1 to 2.0
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    
    // Add additional point light for better visibility
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);
  
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('assets/skybox/');
    const textureCube = cubeTextureLoader.load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
    scene.background = textureCube;
  
    // ===== Game Area =====
    const gameWidth = 40;  // Increased from 20 to match larger canvas
    const gameHeight = 30; // Increased from 15 to match larger canvas
  
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
  
  // ✅ CRITICAL FIX: Check if GLTFLoader is available
  const loader = window.THREE && THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  
  const playerSpeed = 0.2;
  const bulletSpeed = 0.5;
  
  // Fire rate limiting
  const FIRE_INTERVAL_MS = 200;
  let lastShotAt = 0;

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

    // ✅ VISIBILITY FIX: Larger, brighter bullets
    const bulletGeometry = new THREE.SphereGeometry(0.3, 8, 8); // Increased from 0.1 to 0.3
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.0
    });
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
    // ✅ VISIBILITY FIX: Larger, brighter powerups
    const powerupGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2); // Increased from 0.5
    const powerupMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff00ff, 
      emissive: 0xff00ff, 
      emissiveIntensity: 1.0, // Increased from 0.5
      metalness: 0.5,
      roughness: 0.3
    });
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

  // ===== Fallback: Create simple geometric objects if models don't load =====
  function createSimplePlayer() {
    // ✅ VISIBILITY FIX: Larger and brighter fallback geometry
    const geometry = new THREE.ConeGeometry(1.5, 3.0, 3); // Increased from 0.5, 1.5
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00, 
      emissive: 0x00ff00, 
      emissiveIntensity: 0.8, // Increased from 0.3
      metalness: 0.3,
      roughness: 0.4
    });
    player = new THREE.Mesh(geometry, material);
    player.rotation.x = Math.PI;
    player.position.set(0, 0, 5); // Moved forward (was 0, 0, 0)
    scene.add(player);
  }

  function createSimpleEnemyModel() {
    // ✅ VISIBILITY FIX: Larger and brighter fallback geometry
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Increased from 0.8
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, 
      emissive: 0xff0000, 
      emissiveIntensity: 0.8, // Increased from 0.3
      metalness: 0.3,
      roughness: 0.4
    });
    const enemy = new THREE.Mesh(geometry, material);
    enemy.rotation.x = Math.PI / 2;
    return enemy;
  }

  // Load models and start game (with fallback)
  if (loader) {
    loader.load(
      'assets/space-kit/Models/GLTF format/craft_speederA.glb',
      // Success callback
      (gltf) => {
        player = gltf.scene;
        
        // ✅ VISIBILITY FIX: Larger scale and better positioning
        player.scale.set(2.5, 2.5, 2.5); // Increased from 0.5 to 2.5 (5x larger)
        player.rotation.x = Math.PI / 2;
        player.position.set(0, 0, 5); // Moved forward from origin
        
        // ✅ VISIBILITY FIX: Enhance materials for better visibility
        player.traverse((child) => {
          if (child.isMesh && child.material) {
            // Make materials brighter and more visible
            child.material.emissive = new THREE.Color(0x0088ff);
            child.material.emissiveIntensity = 0.4;
            child.material.metalness = 0.3;
            child.material.roughness = 0.5;
            child.material.needsUpdate = true;
          }
        });
        
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
          
          // ✅ VISIBILITY FIX: Larger enemy ships
          enemyModel.scale.set(2.0, 2.0, 2.0); // Increased from 0.4 to 2.0 (5x larger)
          enemyModel.rotation.x = Math.PI / 2;
          
          // ✅ VISIBILITY FIX: Enhance enemy materials
          enemyModel.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.emissive = new THREE.Color(0xff0000);
              child.material.emissiveIntensity = 0.5;
              child.material.metalness = 0.3;
              child.material.roughness = 0.5;
              child.material.needsUpdate = true;
            }
          });

          loader.load('assets/space-kit/Models/GLTF format/craft_cargoB.glb', (gltf) => {
            bossModel = gltf.scene;
            
            // ✅ VISIBILITY FIX: Larger boss
            bossModel.scale.set(4.0, 4.0, 4.0); // Increased from 1 to 4
            bossModel.rotation.x = Math.PI / 2;
            
            // ✅ VISIBILITY FIX: Enhance boss materials
            bossModel.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.emissive = new THREE.Color(0xff6600);
                child.material.emissiveIntensity = 0.6;
                child.material.metalness = 0.4;
                child.material.roughness = 0.4;
                child.material.needsUpdate = true;
              }
            });
            
            loader.load('assets/space-kit/Models/GLTF format/craft_speederD.glb', (gltf) => {
              enemyModel2 = gltf.scene;
              
              // ✅ VISIBILITY FIX: Larger enemy variant
              enemyModel2.scale.set(2.0, 2.0, 2.0); // Increased from 0.4 to 2.0
              enemyModel2.rotation.x = Math.PI / 2;
              
              // ✅ VISIBILITY FIX: Enhance materials
              enemyModel2.traverse((child) => {
                if (child.isMesh && child.material) {
                  child.material.emissive = new THREE.Color(0xff4400);
                  child.material.emissiveIntensity = 0.5;
                  child.material.metalness = 0.3;
                  child.material.roughness = 0.5;
                  child.material.needsUpdate = true;
                }
              });
              
              startGameSpawning();
            }, undefined, (error) => {
              console.error('Failed to load enemy model 2, using simple geometry:', error);
              enemyModel2 = createSimpleEnemyModel();
              startGameSpawning();
            });
          }, undefined, (error) => {
            console.error('Failed to load boss model, using simple geometry:', error);
            bossModel = createSimpleEnemyModel();
            bossModel.scale.set(4, 4, 4); // Larger fallback boss
            startGameSpawning();
          });
        }, undefined, (error) => {
          console.error('Failed to load enemy model, using simple geometry:', error);
          enemyModel = createSimpleEnemyModel();
          enemyModel2 = createSimpleEnemyModel();
          startGameSpawning();
        });
      },
      // Progress callback
      undefined,
      // Error callback
      (error) => {
        console.error('Failed to load player model, using simple geometry:', error);
        // Fallback to simple geometry
        createSimplePlayer();
        enemyModel = createSimpleEnemyModel();
        enemyModel2 = createSimpleEnemyModel();
        startGameSpawning();
      }
    );
  } else {
    // GLTFLoader not available, use simple geometry
    console.warn('GLTFLoader not available, using simple geometry');
    createSimplePlayer();
    enemyModel = createSimpleEnemyModel();
    enemyModel2 = createSimpleEnemyModel();
    startGameSpawning();
  }

  // ===== Input Controller =====
  class InputController {
    constructor() {
      this.state = {
        left: false,
        right: false,
        fire: false
      };
      this.enabled = true;
      this.mobileControls = null;
      this.setupKeyboard();
      this.setupMobile();
      this.setupVisibilityHandlers();
    }

    setupKeyboard() {
      const preventKeys = [' ', 'ArrowLeft', 'ArrowRight'];
      
      window.addEventListener('keydown', (e) => {
        if (!this.enabled) return;
        
        // Prevent scrolling on Space and Arrow keys
        if (preventKeys.includes(e.key)) {
          e.preventDefault();
        }
        
        if (e.key === 'ArrowLeft') this.state.left = true;
        if (e.key === 'ArrowRight') this.state.right = true;
        if (e.key === ' ') this.state.fire = true;
      });

      window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') this.state.left = false;
        if (e.key === 'ArrowRight') this.state.right = false;
        if (e.key === ' ') this.state.fire = false;
      });
    }

    setupMobile() {
      // Only create on touch devices
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (!isTouchDevice) return;

      // Inject CSS
      const style = document.createElement('style');
      style.id = 'mobile-controls-style';
      style.textContent = `
        #mobile-controls-container {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 120px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          padding: env(safe-area-inset-bottom, 0) env(safe-area-inset-right, 0) 0 env(safe-area-inset-left, 0);
          pointer-events: none;
        }
        .mobile-control-btn {
          width: 30%;
          height: 90px;
          background: rgba(0, 255, 255, 0.2);
          border: 3px solid rgba(0, 255, 255, 0.6);
          border-radius: 12px;
          color: #00ffff;
          font-family: 'Press Start 2P', monospace;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          touch-action: none;
          pointer-events: auto;
          transition: all 0.1s ease;
        }
        .mobile-control-btn.pressed {
          background: rgba(0, 255, 255, 0.5);
          border-color: rgba(0, 255, 255, 1);
          transform: scale(0.95);
        }
        .mobile-control-btn:active {
          background: rgba(0, 255, 255, 0.5);
        }
      `;
      document.head.appendChild(style);

      // Create controls
      const container = document.createElement('div');
      container.id = 'mobile-controls-container';

      const leftBtn = document.createElement('button');
      leftBtn.className = 'mobile-control-btn';
      leftBtn.textContent = '◀';
      leftBtn.setAttribute('aria-label', 'Move Left');
      leftBtn.setAttribute('aria-pressed', 'false');

      const fireBtn = document.createElement('button');
      fireBtn.className = 'mobile-control-btn';
      fireBtn.textContent = '🔥';
      fireBtn.setAttribute('aria-label', 'Fire');
      fireBtn.setAttribute('aria-pressed', 'false');

      const rightBtn = document.createElement('button');
      rightBtn.className = 'mobile-control-btn';
      rightBtn.textContent = '▶';
      rightBtn.setAttribute('aria-label', 'Move Right');
      rightBtn.setAttribute('aria-pressed', 'false');

      container.appendChild(leftBtn);
      container.appendChild(fireBtn);
      container.appendChild(rightBtn);
      document.body.appendChild(container);

      this.mobileControls = { container, leftBtn, fireBtn, rightBtn };

      // Setup pointer events for multi-touch support
      this.setupPointerEvents(leftBtn, 'left');
      this.setupPointerEvents(rightBtn, 'right');
      this.setupPointerEvents(fireBtn, 'fire');
    }

    setupPointerEvents(button, action) {
      // ✅ FIX: Check if button exists before adding listeners
      if (!button) {
        console.warn(`setupPointerEvents: button is null for action "${action}"`);
        return;
      }

      const updateState = (pressed) => {
        if (!this.enabled) return;
        this.state[action] = pressed;
        button.classList.toggle('pressed', pressed);
        button.setAttribute('aria-pressed', pressed.toString());
      };

      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        updateState(true);
      }, { passive: false });

      button.addEventListener('pointerup', (e) => {
        e.preventDefault();
        updateState(false);
      }, { passive: false });

      button.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        updateState(false);
      }, { passive: false });

      button.addEventListener('pointerleave', (e) => {
        e.preventDefault();
        updateState(false);
      }, { passive: false });
    }

    setupVisibilityHandlers() {
      // Reset input on visibility change or blur
      const resetInput = () => {
        this.state.left = false;
        this.state.right = false;
        this.state.fire = false;
        if (this.mobileControls) {
          [this.mobileControls.leftBtn, this.mobileControls.rightBtn, this.mobileControls.fireBtn].forEach(btn => {
            btn.classList.remove('pressed');
            btn.setAttribute('aria-pressed', 'false');
          });
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) resetInput();
      });

      window.addEventListener('blur', resetInput);
    }

    attach() {
      this.enabled = true;
      if (this.mobileControls) {
        this.mobileControls.container.style.display = 'flex';
      }
    }

    detach() {
      this.enabled = false;
      this.state.left = false;
      this.state.right = false;
      this.state.fire = false;
      if (this.mobileControls) {
        this.mobileControls.container.style.display = 'none';
        [this.mobileControls.leftBtn, this.mobileControls.rightBtn, this.mobileControls.fireBtn].forEach(btn => {
          btn.classList.remove('pressed');
          btn.setAttribute('aria-pressed', 'false');
        });
      }
    }
  }

  const input = new InputController();

  // ===== Render Loop =====
  function animate() {
    state.animationId = requestAnimationFrame(animate);
    
    // Skip game logic if paused
    if (state.isPaused) {
      renderer.render(scene, camera);
      return;
    }

    // Shooting Logic with rate limiting
    if (input.state.fire && player && state.gameState === 'playing') {
      if (state.powerup === 'laser') {
        // Laser powerup: continuous beam
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
        // Regular shooting with rate limit
        const now = Date.now();
        if (now - lastShotAt >= FIRE_INTERVAL_MS) {
          shoot();
          lastShotAt = now;
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

    // Player Movement - Horizontal only, clamped to game bounds
    if (player && state.gameState === 'playing') {
      if (input.state.left) {
        player.position.x = Math.max(-gameWidth / 2, player.position.x - playerSpeed);
      }
      if (input.state.right) {
        player.position.x = Math.min(gameWidth / 2, player.position.x + playerSpeed);
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
    input.detach();
  }
  
  function resume() {
    state.isPaused = false;
    input.attach();
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
    
    // Re-enable input
    input.attach();
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

// === Refactored Space Shooter Core ===
// Starts only when window.startSpaceShooterGame(skinPath) is called from index.html character selection.
// Uses existing assets & sounds; minimal inline comments per requirements.
window.startSpaceShooterGame = window.startSpaceShooterGame || function(selectedSkin){
  if (window.__SPACE_SHOOTER_RUNNING__) return; // prevent duplicate init
  window.__SPACE_SHOOTER_RUNNING__ = true;

  const THREE = window.THREE;
  const app = document.getElementById('app');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const levelEl = document.getElementById('level');
  const enemiesRemainEl = document.getElementById('enemies-remaining');
  const bossHud = document.getElementById('boss-hud');
  const bossHealth = document.getElementById('boss-health');
  if(!THREE||!app||!scoreEl||!livesEl||!levelEl){console.error('Missing core elements');return;}

  const state = { score:0, lives:3, level:1, wave:1, enemiesLeft:0, gameState:'playing', powerup:null, powerupTimer:0, paused:false };
  const uiPowerup = document.getElementById('powerup-indicator');
  const uiPowerupName = document.getElementById('powerup-name');
  const uiPowerupBar = document.getElementById('powerup-bar');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, app.clientWidth/app.clientHeight, 0.1, 1000);
  camera.position.set(0,15,20); camera.lookAt(0,0,0);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(app.clientWidth, app.clientHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  app.appendChild(renderer.domElement);
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';

  // Lights (brighter & rim)
  scene.add(new THREE.AmbientLight(0xffffff,1.25));
  const dirLight=new THREE.DirectionalLight(0xffffff,2.2);dirLight.position.set(8,14,6);scene.add(dirLight);
  const rim=new THREE.PointLight(0x44aaff,1.3,60);rim.position.set(0,6,14);scene.add(rim);

  // Skybox
  try { const cubeLoader=new THREE.CubeTextureLoader(); cubeLoader.setPath('assets/skybox/'); scene.background=cubeLoader.load(['px.png','nx.png','py.png','ny.png','pz.png','nz.png']); } catch(e){ console.warn('Skybox load failed',e);}    

  // Audio
  const listener=new THREE.AudioListener(); camera.add(listener); const loaderAudio=new THREE.AudioLoader();
  const sndShoot=new THREE.Audio(listener), sndExplosion=new THREE.Audio(listener), sndMusic=new THREE.Audio(listener), sndGameOver=new THREE.Audio(listener);
  loaderAudio.load('Sounds-Music/Shots & Explosions/Laser Shot 1.mp3',b=>{sndShoot.setBuffer(b);sndShoot.setVolume(.35);});
  loaderAudio.load('Sounds-Music/Shots & Explosions/Explosion 1.mp3',b=>{sndExplosion.setBuffer(b);sndExplosion.setVolume(.45);});
  loaderAudio.load("Sounds-Music/Music/He's a plumber (8-bit version).mp3",b=>{sndMusic.setBuffer(b);sndMusic.setLoop(true);sndMusic.setVolume(0);sndMusic.play(); fadeAudio(sndMusic,0.25,1500);});
  loaderAudio.load('Sounds-Music/Music/Game Over Music 1.mp3',b=>{sndGameOver.setBuffer(b);sndGameOver.setLoop(false);sndGameOver.setVolume(.5);});

  function fadeAudio(audio,target,duration){ if(!audio) return; const start=audio.getVolume?audio.getVolume():0; const t0=performance.now(); function step(t){ const k=Math.min(1,(t-t0)/duration); const v=start+(target-start)*k; if(audio.setVolume) audio.setVolume(v); if(k<1) requestAnimationFrame(step);} requestAnimationFrame(step); }

  // Game bounds
  const gameWidth=40, gameHeight=30;

  // Containers
  const enemies=[], bullets=[], particles=[], powerups=[]; let boss=null; let laserBeam=null;
  // Adaptive spark particle pool
  let sparkPool=[]; let sparkIndex=0; let sparkPoolTarget=160; let adaptiveSparkEnabled=true;
  function allocateSparks(target){ const geo=new THREE.BoxGeometry(.15,.15,.15); while(sparkPool.length<target){ const mat=new THREE.MeshBasicMaterial({color:0xff3366}); const m=new THREE.Mesh(geo,mat); m.visible=false; m.life=0; m.velocity=new THREE.Vector3(); sparkPool.push(m); scene.add(m);} if(sparkPool.length>target){ // shrink lazily by hiding extras
      for(let i=target;i<sparkPool.length;i++){ sparkPool[i].visible=false; }
    }
  }
  function initSparkPool(){ allocateSparks(sparkPoolTarget); }
  function resizeSparkPoolDynamic(frameFPS, laserActive){ if(!adaptiveSparkEnabled) return; if(laserActive){ if(frameFPS>70 && sparkPoolTarget<300){ sparkPoolTarget+=20; allocateSparks(sparkPoolTarget);} else if(frameFPS<50 && sparkPoolTarget>120){ sparkPoolTarget-=20; }
    } else { if(sparkPoolTarget>200) sparkPoolTarget-=10; }
  }
  function spawnSparkBurst(position,count,colorHex,baseLife,spread){ for(let i=0;i<count;i++){ const s=sparkPool[sparkIndex]; sparkIndex=(sparkIndex+1)%sparkPoolTarget; if(!s) continue; s.visible=true; s.position.copy(position); s.life=baseLife+Math.random()*baseLife*0.5; if(colorHex) s.material.color.setHex(colorHex); s.velocity.set((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread); } }

  // Models
  const gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  let player=null, enemyModelA=null, enemyModelB=null, bossModel=null;

  // Input
  const input={left:false,right:false,up:false,down:false,fire:false};
  const keyDown=e=>{switch(e.key){case'ArrowLeft':case'a':case'A':input.left=true;break;case'ArrowRight':case'd':case'D':input.right=true;break;case'ArrowUp':case'w':case'W':input.up=true;break;case'ArrowDown':case's':case'S':input.down=true;break;case' ':input.fire=true;break;}};
  const keyUp=e=>{switch(e.key){case'ArrowLeft':case'a':case'A':input.left=false;break;case'ArrowRight':case'd':case'D':input.right=false;break;case'ArrowUp':case'w':case'W':input.up=false;break;case'ArrowDown':case's':case'S':input.down=false;break;case' ':input.fire=false;break;}};
  window.addEventListener('keydown',keyDown); window.addEventListener('keyup',keyUp);

  // Rates & timers
  const FIRE_INTERVAL=200; let lastShot=0; const bulletSpeed=.55; const playerSpeed=.28; let targetY=0; const verticalDamp=.08;

  function updateHUD(){
    scoreEl.textContent=`PUNKTE: ${state.score}`;
    livesEl.textContent=`LEBEN: ${state.lives}`;
    levelEl.textContent=`LEVEL: ${state.level}`;
    if(enemiesRemainEl) enemiesRemainEl.textContent = `ENEMIES: ${Math.max(0,state.enemiesLeft + enemies.length)}`;
  }
  function updateBossHUD(){ if(boss){ bossHealth.style.width=`${(boss.health/boss.maxHealth)*100}%`; } }

  function createExplosion(pos){ const geo=new THREE.BoxGeometry(.2,.2,.2); const colors=[0xff0000,0xffff00,0xffa500]; for(let i=0;i<20;i++){ const mat=new THREE.MeshBasicMaterial({color:colors[Math.floor(Math.random()*colors.length)]}); const p=new THREE.Mesh(geo,mat); p.position.copy(pos); p.velocity=new THREE.Vector3((Math.random()-.5)*0.8,(Math.random()-.5)*0.8,(Math.random()-.5)*0.8); p.life=40+Math.random()*30; particles.push(p); scene.add(p);} }

  function shoot(){ if(!player) return; if(sndShoot.isPlaying) sndShoot.stop(); sndShoot.play(); const g=new THREE.SphereGeometry(.3,8,8); const m=new THREE.MeshBasicMaterial({color:0x00ffff,emissive:0x00ffff,emissiveIntensity:1}); const b=new THREE.Mesh(g,m); b.position.copy(player.position); b.position.z-=.5; bullets.push(b); scene.add(b); }

  function spawnEnemy(){ if(!enemyModelA||!enemyModelB) return; const type=Math.random()>0.7?'sinus':'standard'; const base=(type==='sinus'?enemyModelB:enemyModelA).clone(); base.userData={type,offset:Math.random()*Math.PI*2}; base.position.x=(Math.random()-.5)*gameWidth; base.position.z=-gameHeight/2-5; enemies.push(base); scene.add(base);}    

  function spawnBoss(){ if(!bossModel) return; boss=bossModel.clone(); boss.position.set(0,0,-gameHeight/2-12); boss.health=100*state.level; boss.maxHealth=boss.health; bossHud.style.display='block'; updateBossHUD(); scene.add(boss); }

  function spawnPowerup(){ const g=new THREE.BoxGeometry(1.2,1.2,1.2); const m=new THREE.MeshStandardMaterial({color:0xff00ff,emissive:0xff00ff,emissiveIntensity:1,metalness:.5,roughness:.3}); const p=new THREE.Mesh(g,m); p.userData={type:'laser'}; p.position.x=(Math.random()-.5)*gameWidth; p.position.z=-gameHeight/2-5; powerups.push(p); scene.add(p); }
  const powerupInterval=setInterval(()=>{ if(state.gameState==='playing') spawnPowerup(); },16000);

  function startWave(){ const count=8+(state.level-1)*2; state.enemiesLeft=count; updateHUD(); const waveTimer=setInterval(()=>{ if(state.gameState!=='playing'){clearInterval(waveTimer);return;} if(state.enemiesLeft<=0){ clearInterval(waveTimer); if(state.score>=state.level*1000){ state.gameState='bossfight'; spawnBoss(); } return; } spawnEnemy(); state.enemiesLeft--; updateHUD(); }, Math.max(250,900-state.level*80)); }

  function applyPlayerSkin(){ if(!selectedSkin||!player) return; const texLoader=new THREE.TextureLoader(); texLoader.load(selectedSkin,tex=>{ player.traverse(c=>{ if(c.isMesh && c.material){ c.material.map=tex; c.material.needsUpdate=true; }}); }); }

  function loadModels(){ if(!gltfLoader){ createFallbackPlayer(); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemy(); bossModel=createSimpleEnemy(); startWave(); return; }
    gltfLoader.load('assets/space-kit/Models/GLTF format/craft_speederA.glb',g=>{ player=g.scene; player.scale.set(2.5,2.5,2.5); player.rotation.x=Math.PI/2; player.position.set(0,0,5); enhance(player,0x0088ff,.5); scene.add(player); applyPlayerSkin();
      gltfLoader.load('assets/space-kit/Models/GLTF format/craft_miner.glb',g2=>{ enemyModelA=g2.scene; enemyModelA.scale.set(2,2,2); enemyModelA.rotation.x=Math.PI/2; enhance(enemyModelA,0xff0000,.6);
        gltfLoader.load('assets/space-kit/Models/GLTF format/craft_speederD.glb',g3=>{ enemyModelB=g3.scene; enemyModelB.scale.set(2,2,2); enemyModelB.rotation.x=Math.PI/2; enhance(enemyModelB,0xff4400,.6);
          gltfLoader.load('assets/space-kit/Models/GLTF format/craft_cargoB.glb',g4=>{ bossModel=g4.scene; bossModel.scale.set(4,4,4); bossModel.rotation.x=Math.PI/2; enhance(bossModel,0xff6600,.7); startWave(); },undefined,e=>{console.warn('Boss load fail',e); bossModel=createSimpleEnemy(); bossModel.scale.set(4,4,4); startWave();});
        },undefined,e=>{console.warn('EnemyB load fail',e); enemyModelB=createSimpleEnemy(); startWave();});
      },undefined,e=>{console.warn('EnemyA load fail',e); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemy(); startWave();});
    },undefined,e=>{console.warn('Player load fail',e); createFallbackPlayer(); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemy(); startWave();});
  }

  function enhance(root,color,emissiveIntensity){ root.traverse(c=>{ if(c.isMesh&&c.material){ c.material.emissive=new THREE.Color(color); c.material.emissiveIntensity=emissiveIntensity; c.material.metalness=.35; c.material.roughness=.5; c.material.needsUpdate=true; }}); }
  function createFallbackPlayer(){ const geo=new THREE.ConeGeometry(1.5,3,3); const mat=new THREE.MeshStandardMaterial({color:0x00ff00,emissive:0x00ff00,emissiveIntensity:.8}); player=new THREE.Mesh(geo,mat); player.rotation.x=Math.PI; player.position.set(0,0,5); scene.add(player); }
  function createSimpleEnemy(){ const geo=new THREE.BoxGeometry(1.5,1.5,1.5); const mat=new THREE.MeshStandardMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:.7}); const m=new THREE.Mesh(geo,mat); m.rotation.x=Math.PI/2; return m; }

  // Powerup effect (laser)
  function handlePowerupTimer(){ if(state.powerupTimer>0){ state.powerupTimer--; if(uiPowerupBar){ uiPowerupBar.style.width=((state.powerupTimer/600)*100)+'%'; } if(state.powerupTimer<=0){ state.powerup=null; if(laserBeam) laserBeam.visible=false; if(uiPowerup) uiPowerup.style.display='none'; }} }

  function gameOver(){ state.gameState='gameover'; state.paused=true; if(sndMusic.isPlaying){ fadeAudio(sndMusic,0,800); setTimeout(()=>sndMusic.stop(),850);} if(sndGameOver.buffer) sndGameOver.play(); if(window.showGameOver) window.showGameOver(state.score); }

  function restart(){ // exposed via window.gameInstance
    // clear objects
    enemies.forEach(o=>scene.remove(o)); bullets.forEach(o=>scene.remove(o)); particles.forEach(o=>scene.remove(o)); powerups.forEach(o=>scene.remove(o)); if(boss){scene.remove(boss); boss=null;} enemies.length=bullets.length=particles.length=powerups.length=0;
  state.score=0; state.lives=3; state.level=1; state.wave=1; state.gameState='playing'; state.enemiesLeft=0; state.powerup=null; state.powerupTimer=0; state.paused=false; updateHUD(); bossHud.style.display='none'; if(uiPowerup) uiPowerup.style.display='none'; if(player) player.position.set(0,0,5); startWave(); if(sndMusic.buffer){ if(!sndMusic.isPlaying){ sndMusic.setVolume(0); sndMusic.play(); fadeAudio(sndMusic,0.25,1200);} else { sndMusic.setVolume(.25);} } }

  window.gameInstance={ pause:()=>{state.paused=true; if(sndMusic.isPlaying) sndMusic.pause();}, resume:()=>{state.paused=false; if(sndMusic.buffer && !sndMusic.isPlaying) sndMusic.play();}, restart:restart };

  function updateBullets(){ for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.position.z-=bulletSpeed; if(b.position.z<-gameHeight){ scene.remove(b); bullets.splice(i,1);} } }
  function updateEnemies(){ const speed=.05+(state.level-1)*.012; for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; e.position.z+=speed; if(e.userData.type==='sinus'){ e.position.x=Math.sin(e.position.z+e.userData.offset)*(gameWidth/4);} if(e.position.z>gameHeight/2+5){ scene.remove(e); enemies.splice(i,1);} } }
  function updatePowerups(){ const speed=.04; for(let i=powerups.length-1;i>=0;i--){ const p=powerups[i]; p.rotation.y+=.02; p.rotation.x+=.01; p.position.z+=speed; if(p.position.z>gameHeight/2+5){ scene.remove(p); powerups.splice(i,1);} } }
  // Frame-time smoothing for FPS + adaptive particle skipping
  let lastFrameTime=performance.now(); let fpsSMA=60; const fpsAlpha=0.1; let particleSkip=false; const fpsEl=document.getElementById('fps'); let showFPS=true; let particleQuality='high';
  function updateParticles(frameFPS){ // explosion particles
    particleSkip = frameFPS < 40 && particleQuality!=='high';
    const stepFactor = (particleQuality==='low' ? 2 : (particleQuality==='medium'?1.4:1));
    for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; if(particleSkip && (i%2===0)) continue; p.position.addScaledVector(p.velocity, 1/stepFactor); p.life-= stepFactor; if(p.life<=0){ scene.remove(p); particles.splice(i,1);} }
    // sparks
    for(let i=0;i<sparkPoolTarget;i++){ const s=sparkPool[i]; if(!s||!s.visible) continue; if(particleSkip && (i%3===0)) continue; s.position.add(s.velocity); s.life--; if(s.life<=0){ s.visible=false; } }
  }
  function updateBoss(){ if(!boss) return; const speed=.03; if(boss.position.z<-gameHeight/2+4){ boss.position.z+=speed; } else { boss.position.x=Math.sin(Date.now()*0.001)*(gameWidth/3);} }

  function collisions(){ const boxA=new THREE.Box3(); const boxB=new THREE.Box3(); if(player && state.gameState==='playing'){ const playerBox=boxA.setFromObject(player); // player vs powerups
      for(let i=powerups.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(powerups[i]))){ state.powerup=powerups[i].userData.type; state.powerupTimer=600; if(uiPowerup){ uiPowerup.style.display='block'; uiPowerupName.textContent=state.powerup.toUpperCase(); uiPowerupBar.style.width='100%'; } scene.remove(powerups[i]); powerups.splice(i,1);} }
      // player vs enemies
      for(let i=enemies.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(enemies[i]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(player.position); scene.remove(enemies[i]); enemies.splice(i,1); state.lives--; updateHUD(); if(state.lives<=0){ gameOver(); } break; } }
  }
    // bullets vs enemies
    for(let i=bullets.length-1;i>=0;i--){ boxA.setFromObject(bullets[i]); if(state.gameState==='playing'){ for(let j=enemies.length-1;j>=0;j--){ if(boxA.intersectsBox(boxB.setFromObject(enemies[j]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(enemies[j].position); scene.remove(enemies[j]); enemies.splice(j,1); scene.remove(bullets[i]); bullets.splice(i,1); state.score+=100; updateHUD(); if(state.score>=state.level*1000 && state.gameState==='playing'){ state.gameState='bossfight'; spawnBoss(); } break; } } }
      else if(state.gameState==='bossfight' && boss){ if(boxA.intersectsBox(boxB.setFromObject(boss))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(bullets[i].position); scene.remove(bullets[i]); bullets.splice(i,1); boss.health-=5; updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; state.gameState='playing'; startWave(); updateHUD(); } } }
    }
    // laser beam
  if(laserBeam && laserBeam.visible){ const lbox=new THREE.Box3().setFromObject(laserBeam); for(let j=enemies.length-1;j>=0;j--){ if(lbox.intersectsBox(new THREE.Box3().setFromObject(enemies[j]))){ spawnSparkBurst(enemies[j].position,10,0xff3366,18,0.7); createExplosion(enemies[j].position); scene.remove(enemies[j]); enemies.splice(j,1); state.score+=10; updateHUD(); } } if(boss){ const bb=new THREE.Box3().setFromObject(boss); if(lbox.intersectsBox(bb)){ boss.health-=.5; spawnSparkBurst(boss.position,8,0xff8844,20,0.5); updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; state.gameState='playing'; startWave(); updateHUD(); } } } }
  }

  function animate(){ if(state.paused){ renderer.render(scene,camera); requestAnimationFrame(animate); return; }
    // shooting
    if(input.fire && player && state.gameState==='playing'){ if(state.powerup==='laser'){ if(!laserBeam){ const g=new THREE.CylinderGeometry(.1,.1,gameHeight*2,8); const m=new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:.7}); laserBeam=new THREE.Mesh(g,m); scene.add(laserBeam);} laserBeam.visible=true; laserBeam.position.copy(player.position); laserBeam.position.z-=gameHeight; } else { const now=Date.now(); if(now-lastShot>=FIRE_INTERVAL){ shoot(); lastShot=now; } } } else { if(laserBeam) laserBeam.visible=false; }

  // FPS calc
  const nowT=performance.now(); const dt=nowT-lastFrameTime; lastFrameTime=nowT; const instFPS = 1000/dt; fpsSMA = fpsSMA + fpsAlpha*(instFPS - fpsSMA); if(showFPS && fpsEl){ fpsEl.textContent = 'FPS: '+Math.round(fpsSMA); }
  const laserActive = !!(laserBeam && laserBeam.visible);
  resizeSparkPoolDynamic(fpsSMA, laserActive);

  updateBullets(); updateEnemies(); updatePowerups(); updateParticles(fpsSMA); updateBoss(); handlePowerupTimer(); collisions();

    // player movement
    if(player && state.gameState!=='gameover'){ if(input.left) player.position.x=Math.max(-gameWidth/2, player.position.x-playerSpeed); if(input.right) player.position.x=Math.min(gameWidth/2, player.position.x+playerSpeed); if(input.up) targetY=Math.min(2,targetY+.12); if(input.down) targetY=Math.max(-2,targetY-.12); targetY*=0.94; player.position.y += (targetY - player.position.y)*verticalDamp; }

    renderer.render(scene,camera); requestAnimationFrame(animate); }

  // --- Mobile Touch Controls (simple overlay) ---
  (function setupTouch(){ const isTouch=('ontouchstart'in window)||navigator.maxTouchPoints>0; if(!isTouch) return; if(document.getElementById('touch-controls')) return; const wrap=document.createElement('div'); wrap.id='touch-controls'; wrap.style.position='fixed'; wrap.style.bottom='10px'; wrap.style.left='50%'; wrap.style.transform='translateX(-50%)'; wrap.style.display='flex'; wrap.style.gap='14px'; wrap.style.zIndex='1200';
    const mkBtn=(label,action)=>{ const b=document.createElement('button'); b.textContent=label; b.style.width='64px'; b.style.height='64px'; b.style.border='2px solid #00ffff'; b.style.background='rgba(0,40,60,0.55)'; b.style.color='#00ffff'; b.style.fontFamily='"Press Start 2P", monospace'; b.style.fontSize='18px'; b.style.borderRadius='10px'; b.style.boxShadow='0 0 8px rgba(0,255,255,0.4)'; b.style.touchAction='none'; b.style.backdropFilter='blur(4px)';
      const set=(v)=>{ if(action==='pause'){ return; } input[action]=v; b.style.background=v?'rgba(0,255,255,0.6)':'rgba(0,40,60,0.55)'; };
      if(action==='pause'){
        b.addEventListener('click',()=>{ if(state.gameState==='gameover') return; if(!state.paused){ window.gameInstance?.pause(); } else { window.gameInstance?.resume(); } });
      } else {
        b.addEventListener('pointerdown',e=>{e.preventDefault();set(true);});
        ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();set(false);}));
      }
      return b; };
    wrap.appendChild(mkBtn('◀','left')); wrap.appendChild(mkBtn('🔥','fire')); wrap.appendChild(mkBtn('▶','right')); wrap.appendChild(mkBtn('Ⅱ','pause')); document.body.appendChild(wrap); })();

  function onResize(){ camera.aspect=app.clientWidth/app.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(app.clientWidth,app.clientHeight); }
  window.addEventListener('resize',onResize);

  loadModels();
  initSparkPool();
  updateHUD();
  animate();
};

// Settings bridge
window.applyGameSettings = function(opts){ if(!opts) return; if(typeof opts.showFPS==='boolean') { const el=document.getElementById('fps'); if(el) el.style.display=opts.showFPS?'block':'none'; }
  if(opts.particles){ switch(opts.particles){ case 'low': particleQuality='low'; break; case 'medium': particleQuality='medium'; break; default: particleQuality='high'; } }
  if(typeof opts.music==='boolean'){ try { const THREE=window.THREE; /* reuse existing audio ref if accessible */ } catch(e){} }
  showFPS = opts.showFPS !== false;
};
