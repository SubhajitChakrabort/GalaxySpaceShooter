// --- Game Setup ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const playerNameEl = document.getElementById("player-name");
const playerNameTextEl = document.querySelector(".player-name-text");
const levelInfoEl = document.getElementById("level-info");
const levelTextEl = document.querySelector(".level-text");
// Removed meteorCountEl and bossCountEl
const startScreen = document.getElementById("start-screen");
const victoryScreen = document.getElementById("victory-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const nextLevelBtn = document.getElementById("next-level-btn");
const restartBtn = document.getElementById("restart-btn");
const retryBtn = document.getElementById("retry-btn");
const menuBtn = document.getElementById("menu-btn");
const playerNameInput = document.getElementById("player-name-input");
const failedMeteorCountEl = document.getElementById("failed-meteor-count");
const failedBossCountEl = document.getElementById("failed-boss-count");
const bgMusic = document.getElementById("bg-music");
const backgroundSong = document.getElementById("background-song");

let gameWidth, gameHeight;
let spaceship,
  aliens,
  bullets,
  explosions,
  score,
  gameActive,
  alienTimer,
  alienInterval;
let screenShake = 0;
let flashAlpha = 0;
let slowMotion = 0;
let slowMotionFactor = 1;
let finalBossDefeated = false;
let playerName = "";

// --- Level System Variables ---
let currentLevel = 1;
let meteorDestroyed = 0;
let bossDestroyed = 0;
let totalBossesInLevel = 1;
let totalMeteorsRequired = 35;
let levelConfig = {
  1: { meteors: 35, bosses: 1, difficulty: "easy" },
  2: { meteors: 60, bosses: 2, difficulty: "medium" },
  3: { meteors: 100, bosses: 3, difficulty: "hard" }
};

// --- Boss System Variables ---
let bossThresholds = [];
let bossSpawned = [];
let isBossActive = false;

const finalBossExplosionSound = new Audio("final_boss_explosion.mp3");

// --- Local Storage Functions ---
function savePlayerName(name) {
  localStorage.setItem("galaxyBlasterPlayerName", name);
}

function loadPlayerName() {
  return localStorage.getItem("galaxyBlasterPlayerName") || "";
}

function updatePlayerNameDisplay() {
  if (playerName) {
    playerNameTextEl.textContent = playerName;
    playerNameEl.style.display = "flex";
  } else {
    playerNameEl.style.display = "none";
  }
}

function updateLevelDisplay() {
  levelTextEl.textContent = `Level ${currentLevel}`;
}

// Removed updateProgressDisplay

// --- Load Images ---
const spaceshipImg = new Image();
spaceshipImg.src = "spaceship.png";
const asteroidImg = new Image();
asteroidImg.src = "meteor 1.png";
const bossMeteorImg = new Image();
bossMeteorImg.src = "meteor2.png";
const finalBossImg = new Image();
finalBossImg.src = "Final Boss.png";

// --- Resize Canvas ---
function resizeCanvas() {
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
  canvas.width = gameWidth;
  canvas.height = gameHeight;
}
window.addEventListener("resize", resizeCanvas);

// --- UI Screens ---
function showStartScreen() {
  startScreen.style.display = "flex";
  victoryScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  scoreEl.style.display = "none";
  playerNameEl.style.display = "none";
  levelInfoEl.style.display = "none";
  // meteorCountEl.style.display = "none";
  // bossCountEl.style.display = "none";
  canvas.style.display = "none";
  
  // Load saved name and populate input
  const savedName = loadPlayerName();
  if (savedName) {
    playerNameInput.value = savedName;
  }
}

function showGame() {
  startScreen.style.display = "none";
  victoryScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  scoreEl.style.display = "block";
  updatePlayerNameDisplay();
  levelInfoEl.style.display = "flex";
  // meteorCountEl.style.display = "block";
  // bossCountEl.style.display = "block";
  canvas.style.display = "block";
}

function showVictory() {
  victoryScreen.style.display = "flex";
  scoreEl.style.display = "none";
  playerNameEl.style.display = "none";
  levelInfoEl.style.display = "none";
  // meteorCountEl.style.display = "none";
  // bossCountEl.style.display = "none";
  canvas.style.display = "none";
  
  // Show/hide next level button
  if (currentLevel < 3) {
    nextLevelBtn.style.display = "inline-block";
  } else {
    nextLevelBtn.style.display = "none";
  }
}

function showGameOver() {
  gameOverScreen.style.display = "flex";
  scoreEl.style.display = "none";
  playerNameEl.style.display = "none";
  levelInfoEl.style.display = "none";
  // meteorCountEl.style.display = "none";
  // bossCountEl.style.display = "none";
  canvas.style.display = "none";
  
  // Update failed stats
  failedMeteorCountEl.textContent = meteorDestroyed;
  failedBossCountEl.textContent = bossDestroyed;
}

// --- Game Logic ---
function startGame() {
  // Get player name from input
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    playerName = "Hero";
  }
  
  // Save name to local storage
  savePlayerName(playerName);
  
  // Start with level 1
  currentLevel = 1;
  startLevel(currentLevel);
}

function startLevel(level) {
  if (level > 3) {
    // Game completed - restart from level 1
    currentLevel = 1;
    level = 1;
  }
  
  currentLevel = level;
  const config = levelConfig[level];
  
  // Set level requirements
  totalMeteorsRequired = config.meteors;
  totalBossesInLevel = config.bosses;
  
  // Reset game state
  resizeCanvas();
  spaceship = {
    x: gameWidth / 2,
    y: gameHeight - 100,
    w: 120,
    h: 120,
    speed: 10,
  };
  aliens = [];
  bullets = [];
  explosions = [];
  score = 0;
  meteorDestroyed = 0;
  bossDestroyed = 0;
  gameActive = true;
  alienTimer = 0;
  alienInterval = 60;
  finalBossDefeated = false;

  // Set boss thresholds for this level
  if (level === 1) {
    bossThresholds = [20];
  } else if (level === 2) {
    bossThresholds = [27, 54];
  } else if (level === 3) {
    bossThresholds = [33, 66, 99];
  }
  bossSpawned = bossThresholds.map(() => false);
  isBossActive = false;

  // Update displays
  updateLevelDisplay();
  // updateProgressDisplay();

  showGame();
  bgMusic.currentTime = 0;
  bgMusic.pause();
  backgroundSong.currentTime = 0;
  backgroundSong.play();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameActive = false;
  bgMusic.pause();
  backgroundSong.pause();
  
  // Check if level is completed
  if (meteorDestroyed >= totalMeteorsRequired && bossDestroyed >= totalBossesInLevel) {
    // Level completed successfully
    showVictory();
  } else {
    // Level failed
    showGameOver();
  }
}

// --- Drawing Functions ---
function drawSpaceship() {
  ctx.save();
  ctx.translate(spaceship.x, spaceship.y);
  if (spaceshipImg.complete && spaceshipImg.naturalWidth > 0) {
    ctx.drawImage(
      spaceshipImg,
      -spaceship.w / 2,
      -spaceship.h / 2,
      spaceship.w,
      spaceship.h
    );
  }
  ctx.restore();
}

function drawAlien(alien) {
  ctx.save();
  ctx.translate(alien.x, alien.y);
  if (alien.isFinalBoss) {
    if (finalBossImg.complete && finalBossImg.naturalWidth > 0) {
      ctx.drawImage(
        finalBossImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  } else if (alien.isBoss) {
    if (bossMeteorImg.complete && bossMeteorImg.naturalWidth > 0) {
      ctx.drawImage(
        bossMeteorImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  } else {
    if (asteroidImg.complete && asteroidImg.naturalWidth > 0) {
      ctx.drawImage(
        asteroidImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  }
  ctx.restore();
}

function drawBullet(bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#00eaff";
  ctx.shadowColor = "#0055ff";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawExplosion(explosion) {
  ctx.save();
  ctx.translate(explosion.x, explosion.y);
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate(((Math.PI * 2) / 8) * i);
    ctx.beginPath();
    ctx.arc(0, explosion.radius, explosion.radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = explosion.color;
    ctx.globalAlpha = explosion.alpha;
    ctx.fill();
    ctx.restore();
  }
  // Center sparkle
  ctx.beginPath();
  ctx.arc(0, 0, explosion.radius / 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = explosion.alpha * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Spawning ---
function spawnAlien() {
  // Boss spawn logic based on meteorDestroyed
  let bossToSpawn = -1;
  for (let i = 0; i < bossThresholds.length; i++) {
    if (!bossSpawned[i] && meteorDestroyed >= bossThresholds[i] && !isBossActive) {
      bossToSpawn = i;
      break;
    }
  }
  if (bossToSpawn !== -1) {
    // Spawn boss
    const size = 200;
    const x = gameWidth / 2;
    const y = -100;
    const speed = 0.7;
    const color = "#ff00ff";
    aliens.push({ x, y, size, speed, color, isFinalBoss: true, hp: 10 });
    isBossActive = true;
    bossSpawned[bossToSpawn] = true;
    return;
  }
  // Only spawn regular meteors if no boss is active
  if (!isBossActive) {
    const size = 64 + Math.random() * 64;
    const x = size + Math.random() * (gameWidth - size * 2);
    const y = -size;
    const speed = 1 + Math.random() * 1.2;
    const color = "#fff";
    aliens.push({ x, y, size, speed, color });
  }
}

// Add this helper to show a CSS explosion overlay
function showBossExplosionOverlay() {
  let overlay = document.createElement("div");
  overlay.id = "boss-explosion-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "1000";
  overlay.style.background =
    "radial-gradient(circle at 50% 50%, #fff 0%, #ff00ff 30%, #ff4444 60%, transparent 100%)";
  overlay.style.opacity = "0.85";
  overlay.style.transition = "opacity 0.4s cubic-bezier(0.4,0,0.2,1)";
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 400);
  }, 500);
}

// --- Main Game Loop ---
function gameLoop() {
  if (!gameActive) return;
  
  // Handle slow motion
  if (slowMotion > 0) {
    slowMotion--;
    slowMotionFactor = 0.25;
  } else {
    slowMotionFactor = 1;
  }
  
  // Screen shake effect
  if (screenShake > 0) {
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
    screenShake -= 1.5;
    if (screenShake < 0) screenShake = 0;
  }
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw spaceship
  drawSpaceship();

  // Draw and update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed * slowMotionFactor;
    drawBullet(b);
    if (b.y < -40) bullets.splice(i, 1);
  }

  // Draw and update aliens
  for (let i = aliens.length - 1; i >= 0; i--) {
    const a = aliens[i];
    a.y += a.speed * slowMotionFactor;
    drawAlien(a);
    if (a.y > gameHeight + a.size) aliens.splice(i, 1);
  }

  // Collisions (bullets vs aliens)
  for (let i = aliens.length - 1; i >= 0; i--) {
    const a = aliens[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.size * 0.8) {
        if (a.isFinalBoss) {
          a.hp--;
          bullets.splice(j, 1);
          screenShake = Math.max(screenShake, 8);
          flashAlpha = Math.max(flashAlpha, 0.15);
          if (a.hp <= 0) {
            bossDestroyed++;
            // updateProgressDisplay();
            explosions.push({
              x: a.x,
              y: a.y,
              radius: a.size / 2,
              color: a.color,
              alpha: 1,
            });
            aliens.splice(i, 1);
            showBossExplosionOverlay();
            isBossActive = false;
            // Check if level is completed after boss defeat
            if (meteorDestroyed >= totalMeteorsRequired && bossDestroyed >= totalBossesInLevel) {
              setTimeout(() => {
                endGame();
              }, 500);
              return;
            }
          }
          break;
        } else {
          meteorDestroyed++;
          // updateProgressDisplay();
          explosions.push({
            x: a.x,
            y: a.y,
            radius: a.size / 2,
            color: a.color,
            alpha: 1,
          });
          aliens.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          // Check if level is completed after meteor defeat
          if (meteorDestroyed >= totalMeteorsRequired && bossDestroyed >= totalBossesInLevel) {
            setTimeout(() => {
              endGame();
            }, 500);
            return;
          }
        }
        break;
      }
    }
  }

  // Draw and update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.radius += 2 * slowMotionFactor;
    ex.alpha -= 0.04 * slowMotionFactor;
    drawExplosion(ex);
    if (ex.alpha <= 0) explosions.splice(i, 1);
  }
  
  // White flash effect
  if (flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    ctx.restore();
    flashAlpha -= 0.04;
    if (flashAlpha < 0) flashAlpha = 0;
  }
  if (screenShake > 0) ctx.restore();

  // Score
  scoreEl.textContent = "Score: " + score;

  // Spawn aliens
  alienTimer++;
  if (alienTimer > alienInterval) {
    spawnAlien();
    alienTimer = 0;
    if (alienInterval > 20) alienInterval -= 0.5;
  }

  requestAnimationFrame(gameLoop);
}

// --- Controls ---
function moveSpaceship(x) {
  if (!spaceship) return;
  spaceship.x = Math.max(40, Math.min(gameWidth - 40, x));
}

canvas.addEventListener("pointermove", (e) => {
  if (!gameActive) return;
  let x = e.touches ? e.touches[0].clientX : e.clientX;
  moveSpaceship(x);
});

canvas.addEventListener("touchmove", (e) => {
  if (!gameActive) return;
  let x = e.touches[0].clientX;
  moveSpaceship(x);
});

function shoot() {
  if (!gameActive) return;
  bullets.push({ x: spaceship.x, y: spaceship.y - 50, speed: 12 });
  const sfx = new Audio("bullet_sound.mp3");
  sfx.volume = 0.5;
  sfx.play();
}

canvas.addEventListener("pointerdown", shoot);
canvas.addEventListener("touchstart", shoot);

// Add Enter key support for name input
playerNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startGame();
  }
});

// Button event handlers
startBtn.onclick = startGame;
nextLevelBtn.onclick = () => startLevel(currentLevel + 1);
restartBtn.onclick = () => {
  if (currentLevel >= 3) {
    // If level 3 is completed, restart from level 1
    startLevel(1);
  } else {
    startLevel(currentLevel);
  }
};
retryBtn.onclick = () => startLevel(currentLevel);
menuBtn.onclick = showStartScreen;

showStartScreen();
resizeCanvas();
