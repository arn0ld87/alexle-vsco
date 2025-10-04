/**
 * @file Manages the Three.js scene, camera, renderer, and lighting.
 */

import * as THREE from 'three';

export default class RenderingEngine {
  constructor(appContainer) {
    if (!appContainer) {
      throw new Error('A valid DOM element must be provided for the renderer.');
    }
    this.appContainer = appContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.listener = null;

    this.init();
  }

  /**
   * Initializes the core rendering components.
   */
  init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, this.appContainer.clientWidth / this.appContainer.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setSize(this.appContainer.clientWidth, this.appContainer.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.appContainer.appendChild(this.renderer.domElement);

    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    // Audio Listener
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Lighting
    this.setupLighting();

    // Skybox
    this.setupSkybox();

    // Resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /**
   * Sets up the scene's lighting.
   */
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 10, 10);
    this.scene.add(pointLight);
  }

  /**
   * Sets up the scene's skybox.
   */
  setupSkybox() {
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('../assets/skybox/'); // Adjusted path relative to index.html
    const textureCube = cubeTextureLoader.load(
      ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
      () => {},
      undefined,
      (err) => console.warn('Skybox failed to load:', err)
    );
    this.scene.background = textureCube;
  }

  /**
   * Handles window resize events to keep the viewport correct.
   */
  onWindowResize() {
    this.camera.aspect = this.appContainer.clientWidth / this.appContainer.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.appContainer.clientWidth, this.appContainer.clientHeight);
  }

  /**
   * Renders the scene from the camera's perspective.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}