# Space Shooter Game - Smoke Test Checklist

## Prerequisites
- Start dev server: `pnpm run dev`
- Navigate to: http://localhost:4321/demos/space-shooter-game/
- Open browser DevTools Console and Network tabs

## Test Execution

### 1. ✓ Start without console errors
**Action**: Load the game page  
**Expected**: Console shows no red error messages  
**Check**: Browser DevTools Console tab  
**Pass Criteria**: Zero unhandled errors, warnings OK

### 2. ✓ No 404s
**Action**: Observe network requests during load  
**Expected**: All assets return 200 status  
**Check**: DevTools Network tab, filter by status:404  
**Pass Criteria**: 
- `three-game.js` loads (200)
- All 4 `.glb` models load (200)
- Skybox textures load (6 PNGs, all 200)
- Sound files load (2 MP3s, all 200)
- No 404 errors in list

### 3. ✓ Player visible
**Action**: Click "SPIEL STARTEN" → Select character (Alex or Micha)  
**Expected**: Ship model appears in center of screen  
**Check**: Visual confirmation of 3D ship model  
**Pass Criteria**: Player ship clearly visible against space background

### 4. ✓ Movement works
**Action**: Press Left Arrow and Right Arrow keys  
**Expected**: Ship moves horizontally across screen  
**Check**: Ship position changes smoothly  
**Pass Criteria**: Responsive movement in both directions, stays within bounds

### 5. ✓ Fire works
**Action**: Press and hold Spacebar  
**Expected**: Bright cyan projectiles shoot upward from ship  
**Check**: Visible bullets moving away from player  
**Pass Criteria**: 
- Bullets appear on Spacebar press
- Rate-limited to ~200ms between shots
- Bullets are visible (cyan, emissive glow)
- "Laser Shot" sound plays (if audio enabled)

### 6. ✓ Enemies spawn
**Action**: Wait 2-3 seconds after game starts  
**Expected**: Red enemy ships appear at top, move downward  
**Check**: Enemy models visible and moving  
**Pass Criteria**: 
- Enemies spawn periodically
- Different enemy types visible (standard + sinus movement)
- Enemies properly lit and visible

### 7. ✓ HUD updates
**Action**: Shoot and destroy enemies  
**Expected**: "PUNKTE" increases by 100 per enemy  
**Check**: Top-left HUD displays score, lives, level  
**Pass Criteria**: 
- Score increases on enemy destruction
- Lives decrease on collision
- Level advances after 1000 points (boss fight triggers)

### 8. ✓ Pause works
**Action**: Press ESC key during gameplay  
**Expected**: Pause menu appears, game freezes  
**Action**: Press ESC again OR click "WEITERSPIELEN"  
**Expected**: Game resumes from exact state  
**Pass Criteria**: 
- ESC toggles pause/resume
- Game state preserved during pause
- Menu overlay fully visible

### 9. ✓ Restart works
**Action**: Open pause menu → Click "NEU STARTEN"  
**Expected**: Game resets to initial state  
**Check**: Score = 0, Lives = 3, Level = 1, player at center  
**Pass Criteria**: 
- All counters reset
- Player position reset to (0, 0, 5)
- All enemies/bullets cleared
- New enemies start spawning

### 10. ✓ Resize OK
**Action**: Resize browser window (drag corner or use DevTools device emulation)  
**Expected**: Canvas scales proportionally, no distortion  
**Check**: Game remains playable at different sizes  
**Pass Criteria**: 
- Camera aspect ratio updates
- Renderer size adjusts
- No black bars or stretched graphics
- Controls still responsive

## Additional Checks

### Performance
- **FPS**: Should maintain 60fps on desktop (check with Chrome FPS meter)
- **Mobile**: Should run at 30-60fps on iPhone/Android
- **Memory**: No leaks (check DevTools Performance Monitor during 5min play)

### Console Clean
**Check after 5 minutes of gameplay:**
- No repeated error messages
- No "undefined" or "null" warnings in game logic
- Asset load warnings OK (only if files truly missing)

### Edge Cases
- **Boss Fight**: Reach 1000 points, boss appears with health bar at top
- **Game Over**: Lose all 3 lives, game over screen appears with final score
- **Powerup**: Collect purple cube, laser beam activates temporarily
- **Mobile Controls**: On touch device, on-screen buttons appear and work

## Known Non-Issues (Ignore)
- "DevTools failed to load source map" warnings (external libraries)
- Skybox edge seams (expected with cube mapping)
- Slight physics jank at very high speeds (acceptable)

## Failure Actions
If any test fails:
1. Check browser console for specific error message
2. Verify network tab shows which asset failed (404)
3. Confirm correct Three.js version loaded (r128)
4. Test in incognito mode (eliminate cache issues)
5. Check file paths match exactly (case-sensitive)

## Environment Tested
- macOS Darwin
- Node.js + pnpm
- Astro dev server on localhost:4321
- Chrome/Safari/Firefox browsers
- Three.js r128 from CDN

## Success Criteria
**All 10 tests must pass** for game to be considered "reliably working"
