/**
 * @file Manages the main game loop, state, and entity orchestration.
 */

import * as THREE from 'three';
import { Player, Enemy, Boss, Bullet, Powerup, Particle } from './entities.js';
import { sweptSphereCollision } from '../engine/collision.js';

export default class GameLoop {
  constructor(renderingEngine, inputController) {
    this.renderer = renderingEngine;
    this.input = inputController;
    this.scene = renderingEngine.scene;

    this.state = {
      score: 0,
      lives: 3,
      level: 1,
      isPaused: false,
      isGameOver: false,
      gameState: 'playing', // playing, bossfight
    };

    this.boss = null;

    this.gameBounds = { width: 40, height: 30 };

    this.player = new Player();
    this.player.position.set(0, 0, 10);
    this.scene.add(this.player);

    this.enemies = [];
    this.powerups = [];

    this.particlePool = [];
    this.particlePoolSize = 200;
    this.nextParticleIndex = 0;

    this.bulletPool = [];
    this.bulletPoolSize = 50;
    this.nextBulletIndex = 0;
    this.activeBullets = [];

    this.enemySpawnTimer = 0;
    this.powerupSpawnTimer = 0;
    this.lastShotTime = 0;
    this.fireRate = 200; // ms

    // For fixed timestep
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.fixedDeltaTime = 1 / 60;

    this.animationFrameId = null;

    this.createParticlePool();
    this.createBulletPool();
  }

  /**
   * Creates and pre-populates the bullet pool for reuse.
   */
  createBulletPool() {
    for (let i = 0; i < this.bulletPoolSize; i++) {
      const bullet = new Bullet();
      bullet.visible = false;
      this.bulletPool.push(bullet);
      this.scene.add(bullet);
    }
  }

  /**
   * Creates and pre-populates the particle pool for reuse.
   */
  createParticlePool() {
    for (let i = 0; i < this.particlePoolSize; i++) {
      const particle = new Particle();
      particle.visible = false;
      this.particlePool.push(particle);
      this.scene.add(particle);
    }
  }

  /**
   * Starts the game loop.
   */
  start() {
    this.updateHUD();
    this.input.attach();
    this.loop(performance.now());
  }

  /**
   * Stops the game loop.
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input.detach();
  }

  /**
   * The main game loop function, called via requestAnimationFrame.
   * @param {number} currentTime - The current timestamp from performance.now().
   */
  loop(currentTime) {
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    if (this.state.isPaused || this.state.isGameOver) {
      this.renderer.render();
      return;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Update the game with a fixed timestep for physics stability
    while (this.accumulator >= this.fixedDeltaTime) {
      this.update(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    this.renderer.render();
  }

  /**
   * Updates the state of all game objects.
   * @param {number} dt - The fixed delta time.
   */
  update(dt) {
    this.handleInput(dt);
    this.spawnObjects(dt);

    // Update all entities
    this.player.update(dt, this.input, this.gameBounds);
    if (this.state.gameState === 'playing') {
      this.enemies.forEach(e => e.update(dt, this.gameBounds, this.state.level));
    }
    if (this.boss) {
      this.boss.update(dt, this.gameBounds);
    }
    this.powerups.forEach(p => p.update(dt, this.gameBounds));
    this.activeBullets.forEach(b => b.update(dt, this.gameBounds));
    this.particlePool.forEach(p => { if(p.visible) p.update(dt) });

    this.handleCollisions();

    // Clean up dead objects
    this.cleanupDeadObjects();
  }

  /**
   * Handles player input, like firing bullets.
   */
  handleInput() {
    const now = performance.now();
    if (this.input.state.fire && (now - this.lastShotTime > this.fireRate)) {
      this.lastShotTime = now;
      this.fireBullet();
    }
  }

  /**
   * Manages spawning of enemies and powerups based on timers.
   * @param {number} dt - Delta time.
   */
  spawnObjects(dt) {
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      const spawnRate = Math.max(0.5, 2 - this.state.level * 0.15);
      this.enemySpawnTimer = spawnRate;
      this.spawnEnemy();
    }

    this.powerupSpawnTimer -= dt;
    if (this.powerupSpawnTimer <= 0) {
        this.powerupSpawnTimer = 15; // Spawn every 15 seconds
        this.spawnPowerup();
    }
  }

  /**
   * Fires a bullet from the player using the object pool.
   */
  fireBullet() {
    const bullet = this.bulletPool[this.nextBulletIndex];

    if (bullet) {
      const forward = new THREE.Vector3(0, 0, -1); // Player always faces -Z
      const muzzleOffset = 2.0;
      const bulletSpeed = 40;

      const spawnPos = this.player.position.clone().addScaledVector(forward, muzzleOffset);
      const velocity = forward.clone().multiplyScalar(bulletSpeed);

      bullet.initialize(spawnPos, velocity);
      this.activeBullets.push(bullet);
    }

    this.nextBulletIndex = (this.nextBulletIndex + 1) % this.bulletPoolSize;
  }

  /**
   * Creates a new enemy and adds it to the scene.
   */
  spawnEnemy() {
    const x = (Math.random() - 0.5) * this.gameBounds.width;
    const z = -this.gameBounds.height / 2 - 5;
    const type = Math.random() > 0.7 ? 'sinus' : 'standard';

    const enemy = new Enemy(type, new THREE.Vector3(x, 0, z));
    this.enemies.push(enemy);
    this.scene.add(enemy);
  }

  spawnEnemyAt(x, z) {
    const type = 'standard';
    const enemy = new Enemy(type, new THREE.Vector3(x, 0, z));
    this.enemies.push(enemy);
    this.scene.add(enemy);
  }

  /**
   * Spawns the boss, clears other enemies, and changes the game state.
   */
  spawnBoss() {
    // Clear existing enemies
    this.enemies.forEach(enemy => this.scene.remove(enemy));
    this.enemies = [];

    this.state.gameState = 'bossfight';
    this.boss = new Boss();
    this.boss.position.set(0, 0, -this.gameBounds.height);
    this.scene.add(this.boss);

    document.getElementById('boss-hud').style.display = 'block';
    this.updateBossHUD();
  }

  /**
   * Creates a new powerup and adds it to the scene.
   */
  spawnPowerup() {
    const x = (Math.random() - 0.5) * this.gameBounds.width;
    const z = -this.gameBounds.height / 2 - 5;

    const powerup = new Powerup(new THREE.Vector3(x, 0, z));
    this.powerups.push(powerup);
    this.scene.add(powerup);
  }

  /**
   * Checks for and handles collisions between game objects.
   */
  handleCollisions() {
    // Bullets vs Enemies
    for (const bullet of this.activeBullets) {
      for (const enemy of this.enemies) {
        if (sweptSphereCollision(bullet, enemy)) {
          bullet.userData.isDead = true;
          enemy.userData.isDead = true;
          this.state.score += 100;
          this.updateHUD();
          this.createExplosion(enemy.position);

          // Check if it's time to spawn the boss
          if (this.state.gameState === 'playing' && this.state.score >= this.state.level * 1000) {
            this.spawnBoss();
          }
        }
      }
    }

    // Bullets vs Boss
    if (this.boss) {
      for (const bullet of this.activeBullets) {
        if (sweptSphereCollision(bullet, this.boss)) {
          bullet.userData.isDead = true;
          this.boss.userData.health -= 5; // Each bullet does 5 damage
          this.updateBossHUD();
          this.createExplosion(bullet.position);

          if (this.boss.userData.health <= 0) {
            this.state.score += 5000; // Bonus for defeating the boss
            this.createExplosion(this.boss.position);
            this.scene.remove(this.boss);
            this.boss = null;
            document.getElementById('boss-hud').style.display = 'none';

            // Advance to the next level
            this.state.level++;
            this.state.gameState = 'playing';
            this.enemySpawnTimer = 3; // Give player a 3-second break
            this.updateHUD();
          }
        }
      }
    }

    // Player vs Enemies
    if (!this.player.isInvulnerable) {
      for (const enemy of this.enemies) {
        if (sweptSphereCollision(this.player, enemy)) {
          enemy.userData.isDead = true;
          this.state.lives--;
          this.updateHUD();
          this.createExplosion(this.player.position);

          if (this.state.lives > 0) {
            this.player.isInvulnerable = true;
            this.player.invulnerabilityTimer = 2.0; // 2 seconds of invulnerability
          } else {
            this.gameOver();
          }
          break; // Only process one hit per frame
        }
      }
    }

    // Player vs Powerups
    for (const powerup of this.powerups) {
        if (sweptSphereCollision(this.player, powerup)) {
            powerup.userData.isDead = true;
            // TODO: Implement powerup effect
            console.log('Powerup collected!');
        }
    }
  }

  /**
   * Removes dead non-pooled objects and deactivates pooled objects.
   */
  cleanupDeadObjects() {
    // Handle non-pooled objects (enemies, powerups) by removing them
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].userData.isDead) {
        this.scene.remove(this.enemies[i]);
        this.enemies.splice(i, 1);
      }
    }
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      if (this.powerups[i].userData.isDead) {
        this.scene.remove(this.powerups[i]);
        this.powerups.splice(i, 1);
      }
    }

    // For pooled objects (bullets), just remove them from the active list
    this.activeBullets = this.activeBullets.filter(b => !b.userData.isDead);
  }

  /**
   * Creates a particle explosion effect at a given position using the object pool.
   * @param {THREE.Vector3} position - The center of the explosion.
   */
  createExplosion(position) {
    const particleCount = 20;
    const colors = [0xff0000, 0xffff00, 0xffa500];

    for (let i = 0; i < particleCount; i++) {
      const particle = this.particlePool[this.nextParticleIndex];

      if (particle) {
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        const lifetime = Math.random() * 0.5 + 0.3; // seconds
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.initialize(position, velocity, lifetime, color);
      }

      this.nextParticleIndex = (this.nextParticleIndex + 1) % this.particlePoolSize;
    }
  }

  /**
   * Updates the on-screen HUD elements.
   */
  updateHUD() {
    document.getElementById('score').textContent = `PUNKTE: ${this.state.score}`;
    document.getElementById('lives').textContent = `LEBEN: ${this.state.lives}`;
    document.getElementById('level').textContent = `LEVEL: ${this.state.level}`;
  }

  /**
   * Updates the boss health bar on the HUD.
   */
  updateBossHUD() {
    if (this.boss) {
      const healthPercent = (this.boss.userData.health / this.boss.userData.maxHealth) * 100;
      document.getElementById('boss-health').style.width = `${healthPercent}%`;
    }
  }

  /**
   * Handles the game over state.
   */
  gameOver() {
    this.state.isGameOver = true;
    this.input.detach();
    if (window.showGameOver) {
        window.showGameOver(this.state.score);
    }
    console.log("Game Over!");
  }
}