import {
  TILE, COLS, ROWS, TOTAL_DOTS,
  createMaze, setTileSize, getTileSize,
  computeTileSize, drawMaze, pixelToTile
} from './maze.js';
import { Pacman } from './pacman.js';
import { Ghost, MODE, createGhosts } from './ghost.js';
import * as SFX from './sounds.js';

// ── State ─────────────────────────────────────────────────────────────────

export const STATE = {
  IDLE:      'IDLE',
  STARTING:  'STARTING',
  PLAYING:   'PLAYING',
  DYING:     'DYING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
};

let canvas, ctx;
let state = STATE.IDLE;
let maze, pacman, ghosts;

let score        = 0;
let highScore    = 0;
let lives        = 3;
let level        = 1;
let dotsLeft     = TOTAL_DOTS;
let ghostCombo   = 0;
let extraLifeGiven = false;

let phaseIndex = 0;
let phaseTimer = 0;
const PHASES = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity];

let stateTimer = 0;
let flashFrame = 0;
let flashTimer = 0;

const FRIGHT_DURATION = [0,6000,5000,4000,3000,2000,5000,2000,2000,1000,5000];

const scorePopups = [];
let raf;
let lastTime = 0;
const FIXED_STEP = 1000 / 60;
let accumulator = 0;

// Fruit
let fruitActive = false;
let fruitTimer  = 0;
const FRUIT_SCORES = [0,100,300,500,700,1000,2000,3000,5000];

// ── Init ──────────────────────────────────────────────────────────────────

export function initGame(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

export function resize() {
  const ts = computeTileSize();
  setTileSize(ts);
  const dpr = window.devicePixelRatio || 1;
  const logW = COLS * ts;
  const logH = ROWS * ts;
  canvas.width  = logW * dpr;
  canvas.height = logH * dpr;
  canvas.style.width  = logW + 'px';
  canvas.style.height = logH + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// ── Public API ────────────────────────────────────────────────────────────

export let onScoreUpdate   = () => {};
export let onLivesUpdate   = () => {};
export let onGameOver      = () => {};
export let onLevelUpdate   = () => {};

export function setCallbacks(cb) {
  onScoreUpdate = cb.score   || onScoreUpdate;
  onLivesUpdate = cb.lives   || onLivesUpdate;
  onGameOver    = cb.gameover || onGameOver;
  onLevelUpdate = cb.level   || onLevelUpdate;
}

export function getScore()  { return score; }
export function getLevel()  { return level; }
export function getHighScore() { return highScore; }

export function startGame(lvl = 1) {
  level = lvl;
  score = 0;
  lives = 3;
  extraLifeGiven = false;
  highScore = Math.max(highScore, parseInt(localStorage.getItem('pacman_hi') || '0'));
  _initLevel();
  if (raf) cancelAnimationFrame(raf);
  lastTime = 0;
  raf = requestAnimationFrame(_loop);
}

export function pauseGame() {
  if (state === STATE.PLAYING) state = STATE.IDLE;
}

export function resumeGame() {
  if (state === STATE.IDLE) { state = STATE.PLAYING; lastTime = 0; }
}

// ── Level init ────────────────────────────────────────────────────────────

function _initLevel() {
  maze         = createMaze();
  pacman       = new Pacman();
  pacman.reset(level);
  ghosts       = createGhosts();
  ghosts.forEach(g => g.reset());

  dotsLeft   = _countDots();
  ghostCombo = 0;
  phaseIndex = 0;
  phaseTimer = 0;
  fruitActive = false;
  fruitTimer  = 0;
  scorePopups.length = 0;

  state      = STATE.STARTING;
  stateTimer = 0;

  onScoreUpdate(score, highScore);
  onLivesUpdate(lives);
  onLevelUpdate(level);

  SFX.playGameStart(() => {
    if (state === STATE.STARTING) {
      state = STATE.PLAYING;
      SFX.startSiren();
    }
  });
}

function _countDots() {
  let n = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (maze[r][c] === TILE.DOT || maze[r][c] === TILE.PELLET) n++;
  return n;
}

// ── Game loop ─────────────────────────────────────────────────────────────

function _loop(ts) {
  raf = requestAnimationFrame(_loop);

  if (!lastTime) { lastTime = ts; }
  const dt = Math.min(ts - lastTime, 100);
  lastTime = ts;

  if (state === STATE.PLAYING) {
    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      _update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
  } else if (state === STATE.STARTING) {
    stateTimer += dt;
  } else if (state === STATE.DYING) {
    _updateDying(dt);
  } else if (state === STATE.LEVEL_CLEAR) {
    _updateLevelClear(dt);
  }

  _render(ts);
}

// ── Update ────────────────────────────────────────────────────────────────

function _update(dt) {
  // Phase timer (scatter/chase)
  phaseTimer += dt;
  const phaseDur = PHASES[phaseIndex];
  if (phaseTimer >= phaseDur && phaseDur !== Infinity) {
    phaseTimer -= phaseDur;
    phaseIndex++;
    const newPhase = phaseIndex % 2 === 0 ? MODE.SCATTER : MODE.CHASE;
    ghosts.forEach(g => g.setPhase(newPhase));
  }

  const blinky = ghosts[0];

  // Update entities
  pacman.update(dt, maze);
  ghosts.forEach(g => g.update(dt, maze, pacman, blinky));

  // Dot eating
  _checkDotEat();

  // Ghost dot counter → release from house
  ghosts.forEach(g => {
    if (g.mode === MODE.HOUSE && g.dotCounter >= g.dotLimit) {
      g.mode = MODE.LEAVING;
    }
  });

  // Fruit logic
  if (!fruitActive && (dotsLeft === 174 || dotsLeft === 74)) {
    fruitActive = true;
    fruitTimer  = 9000;
  }
  if (fruitActive) {
    fruitTimer -= dt;
    if (fruitTimer <= 0) fruitActive = false;
    // Pac-Man eats fruit
    const ts2  = getTileSize();
    const fruitCol = 13;
    const fruitRow = 17;
    const fx = fruitCol * ts2 + ts2 / 2;
    const fy = fruitRow * ts2 + ts2 / 2;
    const dx = pacman.x - fx;
    const dy = pacman.y - fy;
    if (Math.hypot(dx, dy) < ts2 * 0.8) {
      const pts = FRUIT_SCORES[Math.min(level, FRUIT_SCORES.length - 1)];
      score += pts;
      fruitActive = false;
      scorePopups.push({ x: fx, y: fy, val: pts, born: performance.now() });
      SFX.playFruit();
    }
  }

  // Pac-Man / Ghost collision
  _checkGhostCollision();

  // Extra life
  if (!extraLifeGiven && score >= 10000) {
    extraLifeGiven = true;
    lives++;
    SFX.playExtraLife();
    onLivesUpdate(lives);
  }

  // Level complete
  if (dotsLeft <= 0) {
    state = STATE.LEVEL_CLEAR;
    stateTimer = 0;
    flashFrame = 0;
    flashTimer = 0;
    SFX.stopSiren();
    SFX.stopFrightened();
    SFX.playLevelClear();
  }

  SFX.updateSiren(dotsLeft, TOTAL_DOTS);
  onScoreUpdate(score, highScore);
}

function _checkDotEat() {
  const ts = getTileSize();
  const tile = pixelToTile(pacman.x, pacman.y);
  const { col, row } = tile;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

  const cell = maze[row][col];
  if (cell === TILE.DOT) {
    maze[row][col] = TILE.EMPTY;
    score   += 10;
    dotsLeft--;
    // Increment ghost counters for ghosts still in house
    ghosts.forEach(g => { if (g.mode === MODE.HOUSE) g.dotCounter++; });
    SFX.playWaka();
  } else if (cell === TILE.PELLET) {
    maze[row][col] = TILE.EMPTY;
    score    += 50;
    dotsLeft--;
    ghostCombo = 0;
    const dur = FRIGHT_DURATION[Math.min(level, FRIGHT_DURATION.length - 1)];
    ghosts.forEach(g => g.activateFrightened(dur));
    SFX.stopSiren();
    SFX.playPowerPellet();
    SFX.startFrightened();
  }
}

function _checkGhostCollision() {
  const ts = getTileSize();
  for (const ghost of ghosts) {
    if (ghost.mode === MODE.EATEN) continue;
    const dx   = pacman.x - ghost.x;
    const dy   = pacman.y - ghost.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= ts * 0.72) continue;

    if (ghost.mode === MODE.FRIGHTENED) {
      ghostCombo++;
      const pts = 200 * Math.pow(2, ghostCombo - 1);
      score += pts;
      scorePopups.push({ x: ghost.x, y: ghost.y, val: pts, born: performance.now() });
      ghost.mode = MODE.EATEN;
      SFX.playGhostEaten();
      // Check if all frightened ghosts now eaten → resume siren
      const anyFrightened = ghosts.some(g => g.mode === MODE.FRIGHTENED);
      if (!anyFrightened) { SFX.stopFrightened(); SFX.startSiren(); }
    } else if (ghost.mode === MODE.CHASE || ghost.mode === MODE.SCATTER) {
      _killPacman();
      return;
    }
  }
}

function _killPacman() {
  state = STATE.DYING;
  stateTimer = 0;
  pacman.dying = true;
  SFX.stopSiren();
  SFX.stopFrightened();
  SFX.playDeath();
}

function _updateDying(dt) {
  stateTimer += dt;
  pacman.update(dt, maze);

  if (stateTimer >= 1500) {
    lives--;
    onLivesUpdate(lives);

    if (lives <= 0) {
      state = STATE.GAME_OVER;
      highScore = Math.max(highScore, score);
      localStorage.setItem('pacman_hi', String(highScore));
      onGameOver(score, highScore);
    } else {
      // Respawn
      pacman.reset(level);
      ghosts = createGhosts();
      state = STATE.STARTING;
      stateTimer = 0;
      SFX.playGameStart(() => {
        if (state === STATE.STARTING) {
          state = STATE.PLAYING;
          SFX.startSiren();
        }
      });
    }
  }
}

function _updateLevelClear(dt) {
  flashTimer += dt;
  if (flashTimer >= 200) {
    flashTimer = 0;
    flashFrame++;
  }
  if (flashFrame >= 8) {
    level++;
    _initLevel();
  }
}

// ── Render ────────────────────────────────────────────────────────────────

function _render(timestamp) {
  const ts = getTileSize();
  const W  = COLS * ts;
  const H  = ROWS * ts;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Maze (flash white/blue on level clear)
  if (state === STATE.LEVEL_CLEAR && flashFrame > 0) {
    const flashColor = flashFrame % 2 === 0 ? '#ffffff' : '#2121de';
    ctx.save();
    ctx.strokeStyle = flashColor;
    ctx.lineWidth   = Math.max(1, ts * 0.12);
    ctx.lineJoin    = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = flashColor; ctx.shadowBlur = ts * 0.6;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (maze[r][c] === TILE.WALL) _drawWallFlash(ctx, c, r, ts);
    ctx.restore();
  } else {
    drawMaze(ctx, maze, timestamp);
  }

  // Fruit
  if (fruitActive) {
    const fc = 13, fr = 17;
    const fx = fc * ts + ts / 2, fy = fr * ts + ts / 2;
    ctx.font      = `${ts * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fruits = ['🍒','🍓','🍊','🍋','🍎','🍈','🔔','🔑','🍒'];
    ctx.fillText(fruits[Math.min(level, fruits.length - 1)], fx, fy);
  }

  // Entities (hide during starting countdown)
  const showEntities = state !== STATE.LEVEL_CLEAR;
  if (showEntities) {
    pacman.draw(ctx);
    if (state !== STATE.DYING || stateTimer < 500) {
      ghosts.forEach(g => g.draw(ctx));
    }
  }

  // Score popups
  _renderPopups(timestamp);

  // READY! text during starting
  if (state === STATE.STARTING) {
    ctx.fillStyle = '#FFD700';
    ctx.font      = `bold ${ts * 0.9}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('READY!', W / 2, 20 * ts + ts / 2);
  }
}

function _renderPopups(timestamp) {
  const ts = getTileSize();
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const p = scorePopups[i];
    const age = performance.now() - p.born;
    if (age > 900) { scorePopups.splice(i, 1); continue; }
    const alpha  = 1 - age / 900;
    const offset = age * 0.025;
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.font      = `bold ${ts * 0.7}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.val, p.x, p.y - offset);
  }
}

function _drawWallFlash(ctx, c, r, ts) {
  // Simplified flash draw (no neighbor checks needed)
  const x = c * ts + ts / 2;
  const y = r * ts + ts / 2;
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.3, 0, Math.PI * 2);
  ctx.stroke();
}

// ── D-Pad controls ────────────────────────────────────────────────────────

export function initControls() {
  const map = {
    'dpad-up':    { x:  0, y: -1 },
    'dpad-down':  { x:  0, y:  1 },
    'dpad-left':  { x: -1, y:  0 },
    'dpad-right': { x:  1, y:  0 },
  };

  for (const [id, dir] of Object.entries(map)) {
    const btn = document.getElementById(id);
    if (!btn) continue;

    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      btn.classList.add('pressed');
      SFX.unlock();
      if (pacman) pacman.setNextDir(dir);
    }, { passive: false });

    btn.addEventListener('touchend', () => btn.classList.remove('pressed'));
    btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'));

    // Keyboard fallback
    btn.addEventListener('mousedown', () => {
      SFX.unlock();
      if (pacman) pacman.setNextDir(dir);
    });
  }

  document.addEventListener('keydown', e => {
    const keyMap = {
      ArrowUp:    { x:  0, y: -1 },
      ArrowDown:  { x:  0, y:  1 },
      ArrowLeft:  { x: -1, y:  0 },
      ArrowRight: { x:  1, y:  0 },
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      SFX.unlock();
      if (pacman) pacman.setNextDir(keyMap[e.key]);
    }
  });
}
