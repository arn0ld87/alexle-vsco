/**
 * @file Manages user input from keyboard and on-screen controls for the game.
 */

export default class InputController {
  constructor() {
    this.state = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
    };
    this.enabled = true;
    this.mobileControls = null;

    this.setupKeyboard();
    this.setupMobile();
    this.setupVisibilityHandlers();
  }

  /**
   * Sets up listeners for keyboard events (Arrow Keys and Spacebar).
   */
  setupKeyboard() {
    const keyMap = {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ' ': 'fire',
    };

    const preventDefaultKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];

    const onKey = (isPressed, e) => {
      if (!this.enabled) return;

      if (preventDefaultKeys.includes(e.key)) {
        e.preventDefault();
      }

      const action = keyMap[e.key];
      if (action) {
        this.state[action] = isPressed;
      }
    };

    window.addEventListener('keydown', (e) => onKey(true, e));
    window.addEventListener('keyup', (e) => onKey(false, e));
  }

  /**
   * Creates and manages on-screen controls for touch devices.
   */
  setupMobile() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;

    // Inject CSS for mobile controls
    if (!document.getElementById('mobile-controls-style')) {
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
          touch-action: manipulation;
          pointer-events: auto;
          transition: all 0.1s ease;
        }
        .mobile-control-btn.pressed {
          background: rgba(0, 255, 255, 0.5);
          border-color: rgba(0, 255, 255, 1);
          transform: scale(0.95);
        }
      `;
      document.head.appendChild(style);
    }

    // Create control elements
    const container = document.createElement('div');
    container.id = 'mobile-controls-container';

    const leftBtn = this.createMobileButton('◀', 'Move Left', 'left');
    const fireBtn = this.createMobileButton('🔥', 'Fire', 'fire');
    const rightBtn = this.createMobileButton('▶', 'Move Right', 'right');

    container.append(leftBtn, fireBtn, rightBtn);
    document.body.appendChild(container);

    this.mobileControls = { container, leftBtn, fireBtn, rightBtn };
  }

  /**
   * Helper to create a single mobile control button.
   * @param {string} text - The text/icon for the button.
   * @param {string} ariaLabel - The ARIA label for accessibility.
   * @param {string} action - The action key in the state to modify.
   * @returns {HTMLButtonElement}
   */
  createMobileButton(text, ariaLabel, action) {
    const button = document.createElement('button');
    button.className = 'mobile-control-btn';
    button.textContent = text;
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute('aria-pressed', 'false');

    this.setupPointerEvents(button, action);
    return button;
  }

  /**
   * Sets up unified pointer events for a button to handle multi-touch.
   * @param {HTMLElement} button - The button element.
   * @param {string} action - The action to trigger.
   */
  setupPointerEvents(button, action) {
    const updateState = (pressed) => {
      if (!this.enabled) return;
      this.state[action] = pressed;
      button.classList.toggle('pressed', pressed);
      button.setAttribute('aria-pressed', String(pressed));
    };

    const onPointerDown = (e) => { e.preventDefault(); updateState(true); };
    const onPointerUp = (e) => { e.preventDefault(); updateState(false); };

    button.addEventListener('pointerdown', onPointerDown, { passive: false });
    button.addEventListener('pointerup', onPointerUp, { passive: false });
    button.addEventListener('pointercancel', onPointerUp, { passive: false });
    button.addEventListener('pointerleave', onPointerUp, { passive: false });
  }

  /**
   * Resets input state when the window loses focus or becomes hidden.
   */
  setupVisibilityHandlers() {
    const resetInput = () => {
      for (const key in this.state) {
        this.state[key] = false;
      }
      if (this.mobileControls) {
        Object.values(this.mobileControls).forEach(el => {
          if (el.classList) {
            el.classList.remove('pressed');
            el.setAttribute('aria-pressed', 'false');
          }
        });
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetInput();
    });
    window.addEventListener('blur', resetInput);
  }

  /**
   * Enables the input controller and shows mobile controls.
   */
  attach() {
    this.enabled = true;
    if (this.mobileControls?.container) {
      this.mobileControls.container.style.display = 'flex';
    }
  }

  /**
   * Disables the input controller, resets state, and hides mobile controls.
   */
  detach() {
    this.enabled = false;
    for (const key in this.state) {
      this.state[key] = false;
    }
    if (this.mobileControls?.container) {
      this.mobileControls.container.style.display = 'none';
    }
  }
}