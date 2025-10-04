# Changelog

All notable changes to this project will be documented in this file.

## [2025-10-04] - Refactor, Fixes, and Enhancements

### Added
- **Space Shooter:**
  - Complete architectural refactor from a single script to a modular ES module structure (`engine`, `game`, `utils`).
  - Implemented object pooling for bullets and explosion particles to improve performance and reduce garbage collection.
  - Added a progressive difficulty curve where enemy speed and spawn rates increase with the level.
  - Added invulnerability frames for the player after taking damage, with a visual blinking effect.
  - Added WASD controls as an alternative to arrow keys for player movement.
  - Re-implemented the boss battle, which triggers at a score threshold and includes a dedicated health bar.
- **Testing:**
  - Set up a Playwright E2E testing suite from scratch.
  - Added E2E tests for theme persistence, ensuring no "flash of unstyled content."
  - Added E2E tests for the contact form, covering successful submission and client-side validation.
  - Added a smoke test for the Space Shooter game to verify the core gameplay loop.
- **Documentation:**
  - Created this `CHANGELOG.md` to track project changes.

### Changed
- **Space Shooter:**
  - Collision detection now uses a more accurate swept-sphere test to prevent "tunneling" of fast-moving objects.
  - Player and enemy models are now correctly oriented to face forward, ensuring projectiles work as expected.
- **Theme Toggle:**
  - Replaced the client-side theme toggle logic with a blocking inline script (`ThemeLoader.astro`) that runs in the `<head>` to prevent FOUC. The toggle component is now simpler and only handles state changes.

### Fixed
- **Contact Form:**
  - Fixed a crash on submission by implementing a new client-side script that intercepts the `submit` event.
  - The new script performs validation (non-empty fields, valid email format) and provides clear UI feedback for pending, success, and error states.
- **Space Shooter:**
  - Corrected model orientation and projectile vectors, making gameplay functional and responsive.
  - Stabilized physics and updates by moving to a fixed timestep game loop.