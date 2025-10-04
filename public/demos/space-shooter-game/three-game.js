(function () {
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
    
    // ✅ VISIBILITY FIX: Enable sRGB and tone mapping
    renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    renderer.setSize(appContainer.clientWidth, appContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // Cap to 1.75 for performance
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
  
    // ✅ FIX: Correct path to sound files
    audioLoader.load('./Sounds-Music/Shots & Explosions/Laser Shot 1.mp3', (buffer) => {
      shootSound.setBuffer(buffer);
      shootSound.setVolume(0.3);
    }, undefined, (err) => console.warn('Sound load failed:', err));
    audioLoader.load('./Sounds-Music/Shots & Explosions/Explosion 1.mp3', (buffer) => {
      explosionSound.setBuffer(buffer);
      explosionSound.setVolume(0.4);
    }, undefined, (err) => console.warn('Sound load failed:', err));
  
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
    // ✅ FIX: Correct path to skybox
    cubeTextureLoader.setPath('./assets/skybox/');
    const textureCube = cubeTextureLoader.load(
      ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
      undefined,
      undefined,
      (err) => console.warn('Skybox load failed:', err)
    );
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
    // ✅ FIX: Correct path to model files
    loader.load(
      './assets/space-kit/Models/GLTF format/craft_speederA.glb',
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

        loader.load('./assets/space-kit/Models/GLTF format/craft_miner.glb', (gltf) => {
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

          loader.load('./assets/space-kit/Models/GLTF format/craft_cargoB.glb', (gltf) => {
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
            
            loader.load('./assets/space-kit/Models/GLTF format/craft_speederD.glb', (gltf) => {
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
      player.position.set(0, 0, 5); // ✅ FIX: Match initial forward position
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
