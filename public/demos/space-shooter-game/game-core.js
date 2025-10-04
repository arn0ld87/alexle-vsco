// Enhanced core game: waves HUD, difficulty curve, persistence, boss attack patterns, enemy pooling
export function startGame(selectedSkin){
  if(window.__SPACE_SHOOTER_RUNNING__) return; window.__SPACE_SHOOTER_RUNNING__=true;
  const THREE=window.THREE; const app=document.getElementById('app'); const scoreEl=document.getElementById('score'); const livesEl=document.getElementById('lives'); const levelEl=document.getElementById('level'); const enemiesRemainEl=document.getElementById('enemies-remaining'); const bossHud=document.getElementById('boss-hud'); const bossHealth=document.getElementById('boss-health');
  if(!THREE||!app||!scoreEl||!livesEl||!levelEl){ console.error('Missing core elements'); return; }
  // Persistence
  const savedHigh=parseInt(localStorage.getItem('spaceShooterHighScore')||'0',10); const savedLevel=parseInt(localStorage.getItem('spaceShooterLastLevel')||'1',10);
  const state={ score:0, highScore:savedHigh, lives:3, level:Math.max(1,savedLevel), wave:1, wavesTotal:1, enemiesLeft:0, gameState:'playing', powerup:null, powerupTimer:0, paused:false, spawning:false, wavesCompleted:0, enemiesSpawnedInWave:0, playerHitCooldown:0 };
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
  const enemies=[], bullets=[], particles=[], powerups=[], enemyBullets=[]; let boss=null; let laserBeam=null; let bossLaser=null; let bossLaserPhase=0; let bossLaserTimer=0;
  // Pools
  const enemyPool=[]; function acquireEnemy(model){ if(enemyPool.length){ const e=enemyPool.pop(); e.visible=true; return e; } return model.clone(); }
  function releaseEnemy(e){ e.visible=false; scene.remove(e); enemyPool.push(e); }
  const bulletPool=[]; function acquireBullet(){ if(bulletPool.length){ const b=bulletPool.pop(); b.visible=true; return b; } const g=new THREE.SphereGeometry(.3,8,8); const m=new THREE.MeshBasicMaterial({color:0x00ffff}); return new THREE.Mesh(g,m); }
  function releaseBullet(b){ b.visible=false; scene.remove(b); bulletPool.push(b); }
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
  function updateHUD(){ scoreEl.textContent=`PUNKTE: ${state.score} (HI ${state.highScore})`; livesEl.textContent=`LEBEN: ${state.lives}`; levelEl.textContent=`LEVEL: ${state.level} WAVE: ${state.wave}/${state.wavesTotal}`; if(enemiesRemainEl) enemiesRemainEl.textContent=`ENEMIES: ${Math.max(0,state.enemiesLeft+enemies.length)}`; }
  function updateBossHUD(){ if(boss){ bossHealth.style.width=`${(boss.health/boss.maxHealth)*100}%`; } }
  function createExplosion(pos){ const geo=new THREE.BoxGeometry(.2,.2,.2); const colors=[0xff0000,0xffff00,0xffa500]; for(let i=0;i<20;i++){ const mat=new THREE.MeshBasicMaterial({color:colors[Math.floor(Math.random()*colors.length)]}); const p=new THREE.Mesh(geo,mat); p.position.copy(pos); p.velocity=new THREE.Vector3((Math.random()-.5)*0.8,(Math.random()-.5)*0.8,(Math.random()-.5)*0.8); p.life=40+Math.random()*30; particles.push(p); scene.add(p);} }
  function shoot(){ if(!player) return; if(sndShoot.isPlaying) sndShoot.stop(); sndShoot.play(); const b=acquireBullet(); b.position.copy(player.position); b.position.z-=.5; bullets.push(b); scene.add(b); }
  function spawnEnemy(){ if(!enemyModelA||!enemyModelB) return; const lvl=state.level; const r=Math.random(); let type='standard'; if(r>0.8) type='sinus'; if(lvl>2 && r<0.15) type='fast'; if(lvl>3 && r>=0.15 && r<0.3) type='zigzag'; if(lvl>4 && r>=0.3 && r<0.45) type='shooter'; const model=(type==='sinus'||type==='zigzag')?enemyModelB:enemyModelA; const base=acquireEnemy(model); base.userData={type,offset:Math.random()*Math.PI*2,zigDir:(Math.random()>0.5?1:-1)}; base.position.x=(Math.random()-.5)*gameWidth; base.position.z=-gameHeight/2-5; base.position.y=0; enemies.push(base); scene.add(base);}    
  const LEVEL_CONFIG=[
    { waves:3, enemiesPerWave:8, bossHealth:150 },
    { waves:3, enemiesPerWave:10, bossHealth:220 },
    { waves:4, enemiesPerWave:12, bossHealth:300 },
    { waves:4, enemiesPerWave:14, bossHealth:380 },
    { waves:5, enemiesPerWave:16, bossHealth:480 }
  ];
  function getLevelConfig(lvl){ if(lvl<=LEVEL_CONFIG.length) return LEVEL_CONFIG[lvl-1]; const base=LEVEL_CONFIG[LEVEL_CONFIG.length-1]; const scale=lvl-LEVEL_CONFIG.length+1; return { waves: base.waves+Math.floor(scale/2), enemiesPerWave: base.enemiesPerWave+2*scale, bossHealth: Math.round(base.bossHealth*(1+0.15*scale)) }; }
  function spawnBoss(){ if(!bossModel) return; const cfg=getLevelConfig(state.level); boss=bossModel.clone(); boss.position.set(0,0,-gameHeight/2-12); boss.health=cfg.bossHealth; boss.maxHealth=boss.health; bossHud.style.display='block'; updateBossHUD(); scene.add(boss); bossLaserTimer=0; bossLaserPhase=0; }
  function spawnPowerup(){ const g=new THREE.BoxGeometry(1.2,1.2,1.2); const m=new THREE.MeshStandardMaterial({color:0xff00ff,emissive:0xff00ff,emissiveIntensity:1,metalness:.5,roughness:.3}); const p=new THREE.Mesh(g,m); p.userData={type:'laser'}; p.position.x=(Math.random()-.5)*gameWidth; p.position.z=-gameHeight/2-5; powerups.push(p); scene.add(p); }
  const powerupInterval=setInterval(()=>{ if(state.gameState==='playing') spawnPowerup(); },16000);
  function startLevel(){ state.wave=1; state.wavesCompleted=0; startWave(); }
  function startWave(){ const cfg=getLevelConfig(state.level); state.wavesTotal=cfg.waves; state.gameState='playing'; state.enemiesLeft=cfg.enemiesPerWave; state.enemiesSpawnedInWave=0; updateHUD(); state.spawning=true; const interval=Math.max(160, 780 - state.level*55); const waveTimer=setInterval(()=>{ if(state.gameState!=='playing'){ clearInterval(waveTimer); return; } if(state.enemiesSpawnedInWave>=cfg.enemiesPerWave){ state.spawning=false; clearInterval(waveTimer); checkWaveCompletion(); return; } spawnEnemy(); state.enemiesSpawnedInWave++; updateHUD(); }, interval); }
  function checkWaveCompletion(){ if(enemies.length>0) return; const cfg=getLevelConfig(state.level); state.wavesCompleted++; if(state.wavesCompleted < cfg.waves){ state.wave++; startWave(); } else { state.gameState='bossfight'; spawnBoss(); } }
  function applyPlayerSkin(){ if(!selectedSkin||!player) return; const texLoader=new THREE.TextureLoader(); texLoader.load(selectedSkin,tex=>{ player.traverse(c=>{ if(c.isMesh && c.material){ c.material.map=tex; c.material.needsUpdate=true; }}); }); }
  function loadModels(){ if(!gltfLoader){ createFallbackPlayer(); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemyAlt(); bossModel=createBossFallback(); startLevel(); return; }
    gltfLoader.load('assets/space-kit/Models/GLTF format/craft_speederA.glb',g=>{ player=g.scene; player.scale.set(2.5,2.5,2.5); player.rotation.x=Math.PI/2; player.position.set(0,0,5); enhance(player,0x0088ff,.5); scene.add(player); applyPlayerSkin();
      gltfLoader.load('assets/space-kit/Models/GLTF format/craft_miner.glb',g2=>{ enemyModelA=g2.scene; enemyModelA.scale.set(2,2,2); enemyModelA.rotation.x=Math.PI/2; enhance(enemyModelA,0xff0000,.6);
        gltfLoader.load('assets/space-kit/Models/GLTF format/craft_speederD.glb',g3=>{ enemyModelB=g3.scene; enemyModelB.scale.set(2,2,2); enemyModelB.rotation.x=Math.PI/2; enhance(enemyModelB,0xff4400,.6);
          gltfLoader.load('assets/space-kit/Models/GLTF format/craft_cargoB.glb',g4=>{ bossModel=g4.scene; bossModel.scale.set(4,4,4); bossModel.rotation.x=Math.PI/2; enhance(bossModel,0xff6600,.7); startLevel(); },undefined,e=>{console.warn('Boss load fail',e); bossModel=createBossFallback(); startLevel();});
        },undefined,e=>{console.warn('EnemyB load fail',e); enemyModelB=createSimpleEnemyAlt(); startLevel();});
      },undefined,e=>{console.warn('EnemyA load fail',e); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemyAlt(); startLevel();});
    },undefined,e=>{console.warn('Player load fail',e); createFallbackPlayer(); enemyModelA=createSimpleEnemy(); enemyModelB=createSimpleEnemyAlt(); startLevel();});
  }
  function enhance(root,color,emissiveIntensity){ root.traverse(c=>{ if(c.isMesh&&c.material){ c.material.emissive=new THREE.Color(color); c.material.emissiveIntensity=emissiveIntensity; c.material.metalness=.35; c.material.roughness=.5; c.material.needsUpdate=true; }}); }
  function createFallbackPlayer(){
    const group=new THREE.Group();
    const hull=new THREE.CapsuleGeometry(0.9,1.8,12,20);
    const hullMat=new THREE.MeshStandardMaterial({color:0x1188ff, emissive:0x1166aa, emissiveIntensity:.9, metalness:.6, roughness:.35});
    const hullMesh=new THREE.Mesh(hull,hullMat); hullMesh.rotation.x=Math.PI/2; group.add(hullMesh);
    const wingGeo=new THREE.BoxGeometry(2.4,0.12,0.8);
    const wingMat=new THREE.MeshStandardMaterial({color:0x0dddee, emissive:0x0aaacc, emissiveIntensity:.7, metalness:.5, roughness:.4});
    const leftWing=new THREE.Mesh(wingGeo, wingMat); leftWing.position.set(0,0,-0.5); group.add(leftWing);
    const finGeo=new THREE.ConeGeometry(0.4,0.9,16); const finMat=new THREE.MeshStandardMaterial({color:0xffffff, emissive:0x3399ff, emissiveIntensity:.5});
    const fin=new THREE.Mesh(finGeo,finMat); fin.rotation.x=Math.PI; fin.position.set(0,0,1.2); group.add(fin);
    group.scale.set(1.6,1.6,1.6); group.position.set(0,0,5); player=group; scene.add(group);
  }
  function createSimpleEnemy(){
    const group=new THREE.Group();
    const core=new THREE.CylinderGeometry(0.55,0.85,1.4,18,1,true);
    const coreMat=new THREE.MeshStandardMaterial({color:0xaa1111, emissive:0x660000, emissiveIntensity:.8, metalness:.5, roughness:.5});
    const coreMesh=new THREE.Mesh(core,coreMat); coreMesh.rotation.z=Math.PI/2; group.add(coreMesh);
    const nose=new THREE.ConeGeometry(0.55,0.9,18); const noseMat=new THREE.MeshStandardMaterial({color:0xff3333, emissive:0xaa0000, emissiveIntensity:.7});
    const noseMesh=new THREE.Mesh(nose,noseMat); noseMesh.rotation.z=Math.PI/2; noseMesh.position.x=0.7; group.add(noseMesh);
    const tail=new THREE.CylinderGeometry(0.3,0.5,0.6,14); const tailMat=new THREE.MeshStandardMaterial({color:0x552222, emissive:0x331111, emissiveIntensity:.4});
    const tailMesh=new THREE.Mesh(tail,tailMat); tailMesh.rotation.z=Math.PI/2; tailMesh.position.x=-0.85; group.add(tailMesh);
    const wing=new THREE.BoxGeometry(0.15,1.4,0.6); const wingMat=new THREE.MeshStandardMaterial({color:0xff5555, emissive:0x991111, emissiveIntensity:.6});
    const w1=new THREE.Mesh(wing,wingMat); w1.position.set(-0.1,0.0,0.55); group.add(w1); const w2=w1.clone(); w2.position.z=-0.55; group.add(w2);
    group.rotation.x=Math.PI/2; return group;
  }
  function createSimpleEnemyAlt(){
    const group=createSimpleEnemy(); group.traverse(o=>{ if(o.isMesh){ o.material=colorize(o.material,0xff8800,0xaa4400); }}); return group;
  }
  function createBossFallback(){
    const group=new THREE.Group();
    const body=new THREE.TorusGeometry(2.2,0.5,24,48); const bodyMat=new THREE.MeshStandardMaterial({color:0x993300, emissive:0xff6600, emissiveIntensity:.6, metalness:.7, roughness:.35});
    const bodyMesh=new THREE.Mesh(body,bodyMat); bodyMesh.rotation.x=Math.PI/2; group.add(bodyMesh);
    const core=new THREE.SphereGeometry(0.9,24,24); const coreMat=new THREE.MeshStandardMaterial({color:0xffaa00, emissive:0xff6600, emissiveIntensity:.9});
    const coreMesh=new THREE.Mesh(core,coreMat); coreMesh.position.set(0,0,0); group.add(coreMesh);
    for(let i=0;i<6;i++){ const spoke=new THREE.BoxGeometry(0.3,0.3,2.8); const spokeMat=new THREE.MeshStandardMaterial({color:0xcc5500, emissive:0xaa3300, emissiveIntensity:.5}); const s=new THREE.Mesh(spoke,spokeMat); s.position.z=0; s.rotation.y=(i/6)*Math.PI*2; s.position.x=Math.cos(s.rotation.y)*1.4; s.position.y=Math.sin(s.rotation.y)*1.4; group.add(s);}    
    group.scale.set(1.4,1.4,1.4); group.rotation.x=Math.PI/2; return group;
  }
  function colorize(mat, color, emissive){ const m=mat.clone(); m.color=new THREE.Color(color); m.emissive=new THREE.Color(emissive); return m; }
  function handlePowerupTimer(){ if(state.powerupTimer>0){ state.powerupTimer--; if(uiPowerupBar){ uiPowerupBar.style.width=((state.powerupTimer/600)*100)+'%'; } if(state.powerupTimer<=0){ state.powerup=null; if(laserBeam) laserBeam.visible=false; if(uiPowerup) uiPowerup.style.display='none'; }} }
  function gameOver(){ state.gameState='gameover'; state.paused=true; if(sndMusic.isPlaying){ fadeAudio(sndMusic,0,800); setTimeout(()=>sndMusic.stop(),850);} if(sndGameOver.buffer) sndGameOver.play(); if(window.showGameOver) window.showGameOver(state.score); }
  function restart(){ enemies.forEach(o=>scene.remove(o)); bullets.forEach(o=>scene.remove(o)); enemyBullets.forEach(o=>scene.remove(o)); particles.forEach(o=>scene.remove(o)); powerups.forEach(o=>scene.remove(o)); if(boss){scene.remove(boss); boss=null;} enemies.length=bullets.length=enemyBullets.length=particles.length=powerups.length=0; bossLaserPhase=0; if(bossLaser){ bossLaser.visible=false; }
    state.score=0; state.lives=3; state.level=1; state.wave=1; state.gameState='playing'; state.enemiesLeft=0; state.powerup=null; state.powerupTimer=0; state.paused=false; state.spawning=false; state.wavesCompleted=0; state.enemiesSpawnedInWave=0; state.playerHitCooldown=0; updateHUD(); bossHud.style.display='none'; if(uiPowerup) uiPowerup.style.display='none'; if(player) player.position.set(0,0,5); startLevel(); if(sndMusic.buffer){ if(!sndMusic.isPlaying){ sndMusic.setVolume(0); sndMusic.play(); fadeAudio(sndMusic,0.25,1200);} else { sndMusic.setVolume(.25);} } }
  window.gameInstance={ pause:()=>{state.paused=true; if(sndMusic.isPlaying) sndMusic.pause();}, resume:()=>{state.paused=false; if(sndMusic.buffer && !sndMusic.isPlaying) sndMusic.play();}, restart:restart };
  function updateBullets(){ for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.position.z-=bulletSpeed; if(b.position.z<-gameHeight){ releaseBullet(b); bullets.splice(i,1);} } }
  function updateEnemyBullets(){ for(let i=enemyBullets.length-1;i>=0;i--){ const eb=enemyBullets[i]; eb.position.add(eb.userData.vel); if(eb.position.z>gameHeight/2+8||Math.abs(eb.position.x)>gameWidth||Math.abs(eb.position.y)>15){ scene.remove(eb); enemyBullets.splice(i,1);} } }
  function updateEnemies(){ const baseSpeed=.05+(state.level-1)*.012; for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; let speed=baseSpeed; if(e.userData.type==='fast') speed*=1.9; e.position.z+=speed; if(e.userData.type==='sinus'){ e.position.x=Math.sin(e.position.z*0.9+e.userData.offset)*(gameWidth/4);} else if(e.userData.type==='zigzag'){ e.position.x+=0.35*e.userData.zigDir; if(Math.abs(e.position.x)>(gameWidth/2-2)) e.userData.zigDir*=-1; } if(e.position.z>gameHeight/2+5){ releaseEnemy(e); enemies.splice(i,1);} } }
  let lastEnemyShot=0; function enemyFire(now){ if(enemies.length===0||!player) return; const interval=Math.max(600,2200 - state.level*180); if(now-lastEnemyShot<interval) return; lastEnemyShot=now; const shooters=enemies.filter(e=> e.userData.type==='shooter' || state.level>3); if(shooters.length===0) return; const src=shooters[Math.floor(Math.random()*shooters.length)]; const dir=new THREE.Vector3().subVectors(player.position, src.position).normalize().multiplyScalar(0.22+state.level*0.005); const g=new THREE.SphereGeometry(.25,8,8); const m=new THREE.MeshBasicMaterial({color:0xff5533}); const eb=new THREE.Mesh(g,m); eb.position.copy(src.position); eb.userData={vel:dir}; enemyBullets.push(eb); scene.add(eb); }
  function updatePowerups(){ const speed=.04; for(let i=powerups.length-1;i>=0;i--){ const p=powerups[i]; p.rotation.y+=.02; p.rotation.x+=.01; p.position.z+=speed; if(p.position.z>gameHeight/2+5){ scene.remove(p); powerups.splice(i,1);} } }
  let lastFrameTime=performance.now(); let fpsSMA=60; const fpsAlpha=0.1; let particleSkip=false; const fpsEl=document.getElementById('fps'); let showFPS=true; let particleQuality='high';
  function updateParticles(frameFPS){ particleSkip = frameFPS < 40 && particleQuality!=='high'; const stepFactor = (particleQuality==='low' ? 2 : (particleQuality==='medium'?1.4:1)); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; if(particleSkip && (i%2===0)) continue; p.position.addScaledVector(p.velocity, 1/stepFactor); p.life-= stepFactor; if(p.life<=0){ scene.remove(p); particles.splice(i,1);} } for(let i=0;i<sparkPoolTarget;i++){ const s=sparkPool[i]; if(!s||!s.visible) continue; if(particleSkip && (i%3===0)) continue; s.position.add(s.velocity); s.life--; if(s.life<=0){ s.visible=false; } } }
  function updateBoss(){ if(!boss) return; const speed=.03; if(boss.position.z<-gameHeight/2+4) boss.position.z+=speed; else boss.position.x=Math.sin(Date.now()*0.001)*(gameWidth/3); bossLaserTimer++; if(bossLaserTimer%240===0){ const shots=12+Math.min(12,state.level*2); for(let i=0;i<shots;i++){ const a=(i/shots)*Math.PI*2; const g=new THREE.SphereGeometry(.28,8,8); const m=new THREE.MeshBasicMaterial({color:0xffaa33}); const eb=new THREE.Mesh(g,m); eb.position.copy(boss.position); eb.userData={vel:new THREE.Vector3(Math.cos(a)*0.18,0,Math.sin(a)*0.18+0.05)}; enemyBullets.push(eb); scene.add(eb);} }
    if(!bossLaser){ const cyl=new THREE.CylinderGeometry(0.8,0.8,gameHeight*1.6,16); const mat=new THREE.MeshBasicMaterial({color:0xff0044,transparent:true,opacity:0}); bossLaser=new THREE.Mesh(cyl,mat); bossLaser.rotation.x=Math.PI/2; bossLaser.visible=false; scene.add(bossLaser); }
    if(bossLaserTimer%600===0){ bossLaserPhase=1; bossLaser.visible=true; bossLaser.material.opacity=0.15; bossLaser.position.copy(boss.position); bossLaser.position.z-=gameHeight*0.4; }
    if(bossLaserPhase===1){ bossLaser.material.opacity=Math.min(0.6,bossLaser.material.opacity+0.02); if(bossLaser.material.opacity>=0.5) bossLaserPhase=2; }
    else if(bossLaserPhase===2){ if(bossLaserTimer%600>120) bossLaserPhase=3; }
    else if(bossLaserPhase===3){ bossLaser.material.opacity-=0.03; if(bossLaser.material.opacity<=0.05){ bossLaser.visible=false; bossLaserPhase=0; } }
  }
  function collisions(){ const boxA=new THREE.Box3(); const boxB=new THREE.Box3(); if(player && state.gameState!=='gameover'){ const playerBox=boxA.setFromObject(player); if(state.playerHitCooldown>0) state.playerHitCooldown--; for(let i=powerups.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(powerups[i]))){ state.powerup=powerups[i].userData.type; state.powerupTimer=600; if(uiPowerup){ uiPowerup.style.display='block'; uiPowerupName.textContent=state.powerup.toUpperCase(); uiPowerupBar.style.width='100%'; } scene.remove(powerups[i]); powerups.splice(i,1);} } for(let i=enemies.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(enemies[i]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(player.position); releaseEnemy(enemies[i]); enemies.splice(i,1); if(state.playerHitCooldown<=0){ state.lives--; state.playerHitCooldown=90; updateHUD(); if(state.lives<=0){ gameOver(); } } break; } } for(let i=enemyBullets.length-1;i>=0;i--){ if(playerBox.intersectsBox(boxB.setFromObject(enemyBullets[i]))){ scene.remove(enemyBullets[i]); enemyBullets.splice(i,1); if(state.playerHitCooldown<=0){ state.lives--; state.playerHitCooldown=90; updateHUD(); if(state.lives<=0){ gameOver(); } } break; } } if(bossLaser && bossLaser.visible && bossLaserPhase===2 && state.playerHitCooldown<=0){ const lbox=new THREE.Box3().setFromObject(bossLaser); if(lbox.intersectsBox(playerBox)){ state.lives--; state.playerHitCooldown=90; updateHUD(); if(state.lives<=0){ gameOver(); } } } }
    for(let i=bullets.length-1;i>=0;i--){ boxA.setFromObject(bullets[i]); if(state.gameState==='playing'){ for(let j=enemies.length-1;j>=0;j--){ if(boxA.intersectsBox(boxB.setFromObject(enemies[j]))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(enemies[j].position); releaseEnemy(enemies[j]); enemies.splice(j,1); releaseBullet(bullets[i]); bullets.splice(i,1); state.score+=100; if(state.score>state.highScore){ state.highScore=state.score; localStorage.setItem('spaceShooterHighScore', state.highScore.toString()); } updateHUD(); break; } } } else if(state.gameState==='bossfight' && boss){ if(boxA.intersectsBox(boxB.setFromObject(boss))){ if(sndExplosion.isPlaying) sndExplosion.stop(); sndExplosion.play(); createExplosion(bullets[i].position); releaseBullet(bullets[i]); bullets.splice(i,1); boss.health-=5; updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; localStorage.setItem('spaceShooterLastLevel', state.level.toString()); state.gameState='playing'; startLevel(); updateHUD(); } } } }
    if(laserBeam && laserBeam.visible){ const lbox=new THREE.Box3().setFromObject(laserBeam); for(let j=enemies.length-1;j>=0;j--){ if(lbox.intersectsBox(new THREE.Box3().setFromObject(enemies[j]))){ spawnSparkBurst(enemies[j].position,10,0xff3366,18,0.7); createExplosion(enemies[j].position); releaseEnemy(enemies[j]); enemies.splice(j,1); state.score+=10; if(state.score>state.highScore){ state.highScore=state.score; localStorage.setItem('spaceShooterHighScore', state.highScore.toString()); } updateHUD(); } } if(boss){ const bb=new THREE.Box3().setFromObject(boss); if(lbox.intersectsBox(bb)){ boss.health-=.5; spawnSparkBurst(boss.position,8,0xff8844,20,0.5); updateBossHUD(); if(boss.health<=0){ createExplosion(boss.position); scene.remove(boss); boss=null; bossHud.style.display='none'; state.level++; localStorage.setItem('spaceShooterLastLevel', state.level.toString()); state.gameState='playing'; startLevel(); updateHUD(); } } } }
    if(state.spawning===false && state.gameState==='playing' && enemies.length===0){ checkWaveCompletion(); }
  }
  function animate(){ if(state.paused){ renderer.render(scene,camera); requestAnimationFrame(animate); return; }
    if(input.fire && player && state.gameState==='playing'){ if(state.powerup==='laser'){ if(!laserBeam){ const g=new THREE.CylinderGeometry(.1,.1,gameHeight*2,8); const m=new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:.7}); laserBeam=new THREE.Mesh(g,m); scene.add(laserBeam);} laserBeam.visible=true; laserBeam.position.copy(player.position); laserBeam.position.z-=gameHeight; } else { const now=Date.now(); if(now-lastShot>=FIRE_INTERVAL){ shoot(); lastShot=now; } } } else { if(laserBeam) laserBeam.visible=false; }
    const nowT=performance.now(); const dt=nowT-lastFrameTime; lastFrameTime=nowT; const instFPS = 1000/dt; fpsSMA = fpsSMA + fpsAlpha*(instFPS - fpsSMA); if(showFPS && fpsEl){ fpsEl.textContent = 'FPS: '+Math.round(fpsSMA); }
    const laserActive = !!(laserBeam && laserBeam.visible); resizeSparkPoolDynamic(fpsSMA, laserActive);
  updateBullets(); updateEnemyBullets(); updateEnemies(); enemyFire(Date.now()); updatePowerups(); updateParticles(fpsSMA); updateBoss(); handlePowerupTimer(); collisions();
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
