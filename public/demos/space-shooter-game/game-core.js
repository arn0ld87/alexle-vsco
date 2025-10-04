// Core game logic extracted from original three-game.js
// Provides startGame(selectedSkin) and installs window.gameInstance & window.applyGameSettings
export function startGame(selectedSkin){
  if(window.__SPACE_SHOOTER_RUNNING__) return;
  window.__SPACE_SHOOTER_RUNNING__=true;
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

  scene.add(new THREE.AmbientLight(0xffffff,1.25));
  const dirLight=new THREE.DirectionalLight(0xffffff,2.2);dirLight.position.set(8,14,6);scene.add(dirLight);
  const rim=new THREE.PointLight(0x44aaff,1.3,60);rim.position.set(0,6,14);scene.add(rim);
  try { const cubeLoader=new THREE.CubeTextureLoader(); cubeLoader.setPath('assets/skybox/'); scene.background=cubeLoader.load(['px.png','nx.png','py.png','ny.png','pz.png','nz.png']); } catch(e){ console.warn('Skybox load failed',e);}    

  // Audio
  const listener=new THREE.AudioListener(); camera.add(listener); const loaderAudio=new THREE.AudioLoader();
  const sndShoot=new THREE.Audio(listener), sndExplosion=new THREE.Audio(listener), sndMusic=new THREE.Audio(listener), sndGameOver=new THREE.Audio(listener);
  loaderAudio.load('Sounds-Music/Shots & Explosions/Laser Shot 1.mp3',b=>{sndShoot.setBuffer(b);sndShoot.setVolume(.35);});
  loaderAudio.load('Sounds-Music/Shots & Explosions/Explosion 1.mp3',b=>{sndExplosion.setBuffer(b);sndExplosion.setVolume(.45);});
  loaderAudio.load("Sounds-Music/Music/He's a plumber (8-bit version).mp3",b=>{sndMusic.setBuffer(b);sndMusic.setLoop(true);sndMusic.setVolume(0);sndMusic.play(); fadeAudio(sndMusic,0.25,1500);});
  loaderAudio.load('Sounds-Music/Music/Game Over Music 1.mp3',b=>{sndGameOver.setBuffer(b);sndGameOver.setLoop(false);sndGameOver.setVolume(.5);});
  function fadeAudio(audio,target,duration){ if(!audio) return; const start=audio.getVolume?audio.getVolume():0; const t0=performance.now(); function step(t){ const k=Math.min(1,(t-t0)/duration); const v=start+(target-start)*k; if(audio.setVolume) audio.setVolume(v); if(k<1) requestAnimationFrame(step);} requestAnimationFrame(step); }

  const gameWidth=40, gameHeight=30;
  const enemies=[], bullets=[], particles=[], powerups=[]; let boss=null; let laserBeam=null;
  let sparkPool=[]; let sparkIndex=0; let sparkPoolTarget=160; let adaptiveSparkEnabled=true;
  function allocateSparks(target){ const geo=new THREE.BoxGeometry(.15,.15,.15); while(sparkPool.length<target){ const mat=new THREE.MeshBasicMaterial({color:0xff3366}); const m=new THREE.Mesh(geo,mat); m.visible=false; m.life=0; m.velocity=new THREE.Vector3(); sparkPool.push(m); scene.add(m);} if(sparkPool.length>target){ for(let i=target;i<sparkPool.length;i++){ sparkPool[i].visible=false; } } }
  function initSparkPool(){ allocateSparks(sparkPoolTarget); }
  function resizeSparkPoolDynamic(frameFPS, laserActive){ if(!adaptiveSparkEnabled) return; if(laserActive){ if(frameFPS>70 && sparkPoolTarget<300){ sparkPoolTarget+=20; allocateSparks(sparkPoolTarget);} else if(frameFPS<50 && sparkPoolTarget>120){ sparkPoolTarget-=20; } } else { if(sparkPoolTarget>200) sparkPoolTarget-=10; } }
  function spawnSparkBurst(position,count,colorHex,baseLife,spread){ for(let i=0;i<count;i++){ const s=sparkPool[sparkIndex]; sparkIndex=(sparkIndex+1)%sparkPoolTarget; if(!s) continue; s.visible=true; s.position.copy(position); s.life=baseLife+Math.random()*baseLife*0.5; if(colorHex) s.material.color.setHex(colorHex); s.velocity.set((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread); } }

  const gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  let player=null, enemyModelA=null, enemyModelB=null, bossModel=null;

  const input={left:false,right:false,up:false,down:false,fire:false};
  const keyDown=e=>{switch(e.key){case'ArrowLeft':case'a':case'A':input.left=true;break;case'ArrowRight':case'd':case'D':input.right=true;break;case'ArrowUp':case'w':case'W':input.up=true;break;case'ArrowDown':case's':case'S':input.down=true;break;case' ':input.fire=true;break;}};
  const keyUp=e=>{switch(e.key){case'ArrowLeft':case'a':case'A':input.left=false;break;case'ArrowRight':case'd':case'D':input.right=false;break;case'ArrowUp':case'w':case'W':input.up=false;break;case'ArrowDown':case's':case'S':input.down=false;break;case' ':input.fire=false;break;}};
  window.addEventListener('keydown',keyDown); window.addEventListener('keyup',keyUp);

  const FIRE_INTERVAL=200; let lastShot=0; const bulletSpeed=.55; const playerSpeed=.28; let targetY=0; const verticalDamp=.08;
  function updateHUD(){ scoreEl.textContent=`PUNKTE: ${state.score}`; livesEl.textContent=`LEBEN: ${state.lives}`; levelEl.textContent=`LEVEL: ${state.level}`; if(enemiesRemainEl) enemiesRemainEl.textContent = `ENEMIES: ${Math.max(0,state.enemiesLeft + enemies.length)}`; }
  function updateBossHUD(){ if(boss){ bossHealth.style.width=`${(boss.health/boss.maxHealth)*100}%`; } }
  function createExplosion(pos){ const geo=new THREE.BoxGeometry(.2,.2,.2); const colors=[0xff0000,0xffff00,0xffa500]; for(let i=0;i<20;i++){ const mat=new THREE.MeshBasicMaterial({color:colors[Math.floor(Math.random()*colors.length)]}); const p=new THREE.Mesh(geo,mat); p.position.copy(pos); p.velocity=new THREE.Vector3((Math.random()-.5)*0.8,(Math.random()-.5)*0.8,(Math.random()-.5)*0.8); p.life=40+Math.random()*30; particles.push(p); scene.add(p);} }
  function shoot(){ if(!player) return; if(sndShoot.isPlaying) sndShoot.stop(); sndShoot.play(); const g=new THREE.SphereGeometry(.3,8,8); const m=new THREE.MeshBasicMaterial({color:0x00ffff}); const b=new THREE.Mesh(g,m); b.position.copy(player.position); b.position.z-=.5; bullets.push(b); scene.add(b); }
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
  function handlePowerupTimer(){ if(state.powerupTimer>0){ state.powerupTimer--; if(uiPowerupBar){ uiPowerupBar.style.width=((state.powerupTimer/600)*100)+'%'; } if(state.powerupTimer<=0){ state.powerup=null; if(laserBeam) laserBeam.visible=false; if(uiPowerup) uiPowerup.style.display='none'; }} }
  function gameOver(){ state.gameState='gameover'; state.paused=true; if(sndMusic.isPlaying){ fadeAudio(sndMusic,0,800); setTimeout(()=>sndMusic.stop(),850);} if(sndGameOver.buffer) sndGameOver.play(); if(window.showGameOver) window.showGameOver(state.score); }
  function restart(){ enemies.forEach(o=>scene.remove(o)); bullets.forEach(o=>scene.remove(o)); particles.forEach(o=>scene.remove(o)); powerups.forEach(o=>scene.remove(o)); if(boss){scene.remove(boss); boss=null;} enemies.length=bullets.length=particles.length=powerups.length=0;
    state.score=0; state.lives=3; state.level=1; state.wave=1; state.gameState='playing'; state.enemiesLeft=0; state.powerup=null; state.powerupTimer=0; state.paused=false; updateHUD(); bossHud.style.display='none'; if(uiPowerup) uiPowerup.style.display='none'; if(player) player.position.set(0,0,5); startWave(); if(sndMusic.buffer){ if(!sndMusic.isPlaying){ sndMusic.setVolume(0); sndMusic.play(); fadeAudio(sndMusic,0.25,1200);} else { sndMusic.setVolume(.25);} } }
  window.gameInstance={ pause:()=>{state.paused=true; if(sndMusic.isPlaying) sndMusic.pause();}, resume:()=>{state.paused=false; if(sndMusic.buffer && !sndMusic.isPlaying) sndMusic.play();}, restart:restart };
  function updateBullets(){ for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.position.z-=bulletSpeed; if(b.position.z<-gameHeight){ scene.remove(b); bullets.splice(i,1);} } }
  function updateEnemies(){ const speed=.05+(state.level-1)*.012; for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; e.position.z+=speed; if(e.userData.type==='sinus'){ e.position.x=Math.sin(e.position.z+e.userData.offset)*(gameWidth/4);} if(e.position.z>gameHeight/2+5){ scene.remove(e); enemies.splice(i,1);} } }
  function updatePowerups(){ const speed=.04; for(let i=powerups.length-1;i>=0;i--){ const p=powerups[i]; p.rotation.y+=.02; p.rotation.x+=.01; p.position.z+=speed; if(p.position.z>gameHeight/2+5){ scene.remove(p); powerups.splice(i,1);} } }
  let lastFrameTime=performance.now(); let fpsSMA=60; const fpsAlpha=0.1; let particleSkip=false; const fpsEl=document.getElementById('fps'); let showFPS=true; let particleQuality='high';
  function updateParticles(frameFPS){ particleSkip = frameFPS < 40 && particleQuality!=='high'; const stepFactor = (particleQuality==='low' ? 2 : (particleQuality==='medium'?1.4:1)); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; if(particleSkip && (i%2===0)) continue; p.position.addScaledVector(p.velocity, 1/stepFactor); p.life-= stepFactor; if(p.life<=0){ scene.remove(p); particles.splice(i,1);} } for(let i=0;i<sparkPoolTarget;i++){ const s=sparkPool[i]; if(!s||!s.visible) continue; if(particleSkip && (i%3===0)) continue; s.position.add(s.velocity); s.life--; if(s.life<=0){ s.visible=false; } } }
  function updateBoss(){ if(!boss) return; const speed=.03; if(boss.position.z<-gameHeight/2+4){ boss.position.z+=speed; } else { boss.position.x=Math.sin(Date.now()*0.001)*(gameWidth/3);} }
  function collisions(){ const boxA=new THREE.Box3(); const boxB=new THREE.Box3(); if(player && state.gameState==='playing'){ const playerBox=boxA.setFromObject(player); for(let i=powerups.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(powerups[i]))){ state.powerup=powerups[i].userData.type; state.powerupTimer=600; if(uiPowerup){ uiPowerup.style.display='block'; uiPowerupName.textContent=state.powerup.toUpperCase(); uiPowerupBar.style.width='100%'; } scene.remove(powerups[i]); powerups.splice(i,1);} } for(let i=enemies.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(enemies[i]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(player.position); scene.remove(enemies[i]); enemies.splice(i,1); state.lives--; updateHUD(); if(state.lives<=0){ gameOver(); } break; } } }
    for(let i=bullets.length-1;i>=0;i--){ boxA.setFromObject(bullets[i]); if(state.gameState==='playing'){ for(let j=enemies.length-1;j>=0;j--){ if(boxA.intersectsBox(boxB.setFromObject(enemies[j]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(enemies[j].position); scene.remove(enemies[j]); enemies.splice(j,1); scene.remove(bullets[i]); bullets.splice(i,1); state.score+=100; updateHUD(); if(state.score>=state.level*1000 && state.gameState==='playing'){ state.gameState='bossfight'; spawnBoss(); } break; } } }
      else if(state.gameState==='bossfight' && boss){ if(boxA.intersectsBox(boxB.setFromObject(boss))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(bullets[i].position); scene.remove(bullets[i]); bullets.splice(i,1); boss.health-=5; updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; state.gameState='playing'; startWave(); updateHUD(); } } }
    }
    if(laserBeam && laserBeam.visible){ const lbox=new THREE.Box3().setFromObject(laserBeam); for(let j=enemies.length-1;j>=0;j--){ if(lbox.intersectsBox(new THREE.Box3().setFromObject(enemies[j]))){ spawnSparkBurst(enemies[j].position,10,0xff3366,18,0.7); createExplosion(enemies[j].position); scene.remove(enemies[j]); enemies.splice(j,1); state.score+=10; updateHUD(); } } if(boss){ const bb=new THREE.Box3().setFromObject(boss); if(lbox.intersectsBox(bb)){ boss.health-=.5; spawnSparkBurst(boss.position,8,0xff8844,20,0.5); updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; state.gameState='playing'; startWave(); updateHUD(); } } } }
  }
  function animate(){ if(state.paused){ renderer.render(scene,camera); requestAnimationFrame(animate); return; }
    if(input.fire && player && state.gameState==='playing'){ if(state.powerup==='laser'){ if(!laserBeam){ const g=new THREE.CylinderGeometry(.1,.1,gameHeight*2,8); const m=new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:.7}); laserBeam=new THREE.Mesh(g,m); scene.add(laserBeam);} laserBeam.visible=true; laserBeam.position.copy(player.position); laserBeam.position.z-=gameHeight; } else { const now=Date.now(); if(now-lastShot>=FIRE_INTERVAL){ shoot(); lastShot=now; } } } else { if(laserBeam) laserBeam.visible=false; }
    const nowT=performance.now(); const dt=nowT-lastFrameTime; lastFrameTime=nowT; const instFPS = 1000/dt; fpsSMA = fpsSMA + fpsAlpha*(instFPS - fpsSMA); if(showFPS && fpsEl){ fpsEl.textContent = 'FPS: '+Math.round(fpsSMA); }
    const laserActive = !!(laserBeam && laserBeam.visible); resizeSparkPoolDynamic(fpsSMA, laserActive);
    updateBullets(); updateEnemies(); updatePowerups(); updateParticles(fpsSMA); updateBoss(); handlePowerupTimer(); collisions();
    if(player && state.gameState!=='gameover'){ if(input.left) player.position.x=Math.max(-gameWidth/2, player.position.x-playerSpeed); if(input.right) player.position.x=Math.min(gameWidth/2, player.position.x+playerSpeed); if(input.up) targetY=Math.min(2,targetY+.12); if(input.down) targetY=Math.max(-2,targetY-.12); targetY*=0.94; player.position.y += (targetY - player.position.y)*verticalDamp; }
    renderer.render(scene,camera); requestAnimationFrame(animate); }
  (function setupTouch(){ const isTouch=('ontouchstart'in window)||navigator.maxTouchPoints>0; if(!isTouch) return; if(document.getElementById('touch-controls')) return; const wrap=document.createElement('div'); wrap.id='touch-controls'; wrap.style.position='fixed'; wrap.style.bottom='10px'; wrap.style.left='50%'; wrap.style.transform='translateX(-50%)'; wrap.style.display='flex'; wrap.style.gap='14px'; wrap.style.zIndex='1200';
    const mkBtn=(label,action)=>{ const b=document.createElement('button'); b.textContent=label; b.style.width='64px'; b.style.height='64px'; b.style.border='2px solid #00ffff'; b.style.background='rgba(0,40,60,0.55)'; b.style.color='#00ffff'; b.style.fontFamily='"Press Start 2P", monospace'; b.style.fontSize='18px'; b.style.borderRadius='10px'; b.style.boxShadow='0 0 8px rgba(0,255,255,0.4)'; b.style.touchAction='none'; b.style.backdropFilter='blur(4px)'; const set=(v)=>{ if(action==='pause'){ return; } input[action]=v; b.style.background=v?'rgba(0,255,255,0.6)':'rgba(0,40,60,0.55)'; }; if(action==='pause'){ b.addEventListener('click',()=>{ if(state.gameState==='gameover') return; if(!state.paused){ window.gameInstance?.pause(); } else { window.gameInstance?.resume(); } }); } else { b.addEventListener('pointerdown',e=>{e.preventDefault();set(true);}); ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();set(false);})); } return b; };
    wrap.appendChild(mkBtn('◀','left')); wrap.appendChild(mkBtn('🔥','fire')); wrap.appendChild(mkBtn('▶','right')); wrap.appendChild(mkBtn('Ⅱ','pause')); document.body.appendChild(wrap); })();
  function onResize(){ camera.aspect=app.clientWidth/app.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(app.clientWidth,app.clientHeight); }
  window.addEventListener('resize',onResize);
  loadModels(); initSparkPool(); updateHUD(); animate();
  window.applyGameSettings = function(opts){ if(!opts) return; if(typeof opts.showFPS==='boolean') { const el=document.getElementById('fps'); if(el) el.style.display=opts.showFPS?'block':'none'; }
    if(opts.particles){ switch(opts.particles){ case 'low': particleQuality='low'; break; case 'medium': particleQuality='medium'; break; default: particleQuality='high'; } }
    if(typeof opts.music==='boolean'){ try { if(opts.music){ if(sndMusic.buffer && !sndMusic.isPlaying){ sndMusic.play(); fadeAudio(sndMusic,0.25,800);} } else { if(sndMusic.isPlaying){ fadeAudio(sndMusic,0,600); setTimeout(()=>sndMusic.stop(),650);} } } catch(e){} }
    showFPS = opts.showFPS !== false; };
}
