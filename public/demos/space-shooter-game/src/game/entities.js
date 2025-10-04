/**
 * @file Defines the game entities: Player, Enemy, Bullet, and Powerup.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// --- Base Class for all Game Objects ---
class GameObject extends THREE.Object3D {
  constructor() {
    super();
    this.userData.radius = 1; // Default bounding radius
    this.userData.health = 1;
    this.userData.isDead = false;
  }

  /**
   * Sets the model for the game object, ensuring correct orientation and scale.
   * @param {string} url - Path to the GLTF model.
   * @param {THREE.Vector3} scale - The scale to apply to the model.
   */
  async loadModel(url, scale = new THREE.Vector3(1, 1, 1)) {
    try {
      const gltf = await loader.loadAsync(url);
      const model = gltf.scene;

      // Standardize orientation: models should face -Z
      model.rotation.set(0, Math.PI, 0);
      model.scale.copy(scale);

      this.add(model);

      // Enhance materials for better visibility
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.metalness = 0.3;
          child.material.roughness = 0.5;
          child.material.needsUpdate = true;
        }
      });

    } catch (error) {
      console.error(`Failed to load model from ${url}:`, error);
      // Use fallback geometry if loading fails
      this.add(this.createFallback());
    }
  }

  /**
   * Creates a simple geometric shape as a fallback if a model fails to load.
   * @returns {THREE.Mesh}
   */
  createFallback() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
    return new THREE.Mesh(geometry, material);
  }

  update(dt) {
    // Base update logic (can be overridden by subclasses)
  }
}

// --- Player Class ---
export class Player extends GameObject {
  constructor() {
    super();
    this.userData.radius = 1.5;
    this.userData.health = 3;
    this.speed = 15; // units per second
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.loadModel('../assets/space-kit/Models/GLTF format/craft_speederA.glb', new THREE.Vector3(2.5, 2.5, 2.5));
  }

  createFallback() {
    const geometry = new THREE.ConeGeometry(1.5, 3.0, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    const fallback = new THREE.Mesh(geometry, material);
    fallback.rotation.x = Math.PI / 2; // Point forward
    return fallback;
  }

  update(dt, input, gameBounds) {
    // Handle invulnerability
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= dt;
      // Blinking effect
      this.visible = Math.floor(this.invulnerabilityTimer * 10) % 2 === 0;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.visible = true;
      }
    }

    // Movement
    if (input.state.left) {
      this.position.x -= this.speed * dt;
    }
    if (input.state.right) {
      this.position.x += this.speed * dt;
    }
    // Clamp position to game bounds
    this.position.x = THREE.MathUtils.clamp(this.position.x, -gameBounds.width / 2, gameBounds.width / 2);
  }
}

// --- Enemy Class ---
export class Enemy extends GameObject {
  constructor(type = 'standard', position = new THREE.Vector3(0, 0, 0)) {
    super();
    this.userData.radius = 1.5;
    this.userData.type = type;
    this.baseSpeed = 3; // units per second
    this.sinusoidOffset = Math.random() * Math.PI * 2;
    this.position.copy(position);

    const modelUrl = type === 'sinus'
      ? '../assets/space-kit/Models/GLTF format/craft_speederD.glb'
      : '../assets/space-kit/Models/GLTF format/craft_miner.glb';
    this.loadModel(modelUrl, new THREE.Vector3(2.0, 2.0, 2.0));
  }

  createFallback() {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
    return new THREE.Mesh(geometry, material);
  }

  update(dt, gameBounds, level = 1) {
    const speed = this.baseSpeed + (level - 1) * 0.5; // Speed increases with each level
    this.position.z += speed * dt;

    if (this.userData.type === 'sinus') {
      this.position.x = Math.sin(this.position.z * 0.5 + this.sinusoidOffset) * (gameBounds.width / 4);
    }

    if (this.position.z > gameBounds.height / 2 + 5) {
        this.userData.isDead = true;
    }
  }
}

// --- Bullet Class ---
export class Bullet extends GameObject {
    constructor() {
      super();
      this.userData.radius = 0.3;
      this.velocity = new THREE.Vector3();
      this.userData.prev = new THREE.Vector3();

      const bulletGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const bulletMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.0,
      });
      this.add(new THREE.Mesh(bulletGeometry, bulletMaterial));
    }

    initialize(position, velocity) {
        this.position.copy(position);
        this.userData.prev.copy(position);
        this.velocity.copy(velocity);
        this.userData.isDead = false;
        this.visible = true;
    }

    update(dt, gameBounds) {
      if (!this.visible) return;

      this.userData.prev.copy(this.position);
      this.position.addScaledVector(this.velocity, dt);

      if (this.position.z < -gameBounds.height / 2) {
        this.userData.isDead = true;
        this.visible = false;
      }
    }
}

// --- Powerup Class ---
export class Powerup extends GameObject {
    constructor(position) {
        super();
        this.userData.radius = 1.0;
        this.userData.type = 'laser'; // Example powerup type
        this.position.copy(position);
        this.speed = 2;

        const powerupGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const powerupMaterial = new THREE.MeshStandardMaterial({
          color: 0xff00ff,
          emissive: 0xff00ff,
          emissiveIntensity: 1.0,
          metalness: 0.5,
          roughness: 0.3,
        });
        this.add(new THREE.Mesh(powerupGeometry, powerupMaterial));
    }

    update(dt, gameBounds) {
        this.position.z += this.speed * dt;
        this.rotation.y += 1 * dt;
        this.rotation.x += 0.5 * dt;

        if (this.position.z > gameBounds.height / 2 + 5) {
            this.userData.isDead = true;
        }
    }
}

// --- Boss Class ---
export class Boss extends GameObject {
  constructor() {
    super();
    this.userData.radius = 4.0;
    this.userData.health = 500;
    this.userData.maxHealth = 500;
    this.loadModel('../assets/space-kit/Models/GLTF format/craft_cargoB.glb', new THREE.Vector3(4.0, 4.0, 4.0));
  }

  update(dt, gameBounds) {
    // Simple movement pattern: move into view, then sway side to side
    if (this.position.z < -gameBounds.height / 2 + 10) {
        this.position.z += 2 * dt;
    } else {
        this.position.x = Math.sin(Date.now() * 0.0005) * (gameBounds.width / 3);
    }
  }
}

// --- Particle Class (for effects) ---
export class Particle extends GameObject {
    constructor() {
        super();
        this.userData.radius = 0; // Particles don't collide
        const particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
        this.add(new THREE.Mesh(particleGeometry, particleMaterial));

        this.lifetime = 0;
        this.velocity = new THREE.Vector3();
    }

    initialize(position, velocity, lifetime, color) {
        this.position.copy(position);
        this.velocity.copy(velocity);
        this.lifetime = lifetime;
        if (this.children[0] && this.children[0].material) {
            this.children[0].material.color.set(color);
        }
        this.userData.isDead = false;
        this.visible = true;
    }

    update(dt) {
        this.position.addScaledVector(this.velocity, dt);
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.userData.isDead = true;
            this.visible = false;
        }
    }
}