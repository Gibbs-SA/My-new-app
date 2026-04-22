import { TILE, COLS, ROWS, getTileSize, isWallForGhost } from './maze.js';

export const MODE = {
  HOUSE:      'HOUSE',
  LEAVING:    'LEAVING',
  SCATTER:    'SCATTER',
  CHASE:      'CHASE',
  FRIGHTENED: 'FRIGHTENED',
  EATEN:      'EATEN',
};

// Scatter/Chase phase durations (ms) – level 1 timing
const PHASES = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity];

// Intersections where ghosts may NOT turn upward (classic restriction)
const NO_UP_TILES = [
  {col:12, row:12}, {col:15, row:12},
  {col:12, row:15}, {col:15, row:15},
];

const DIRS = [
  { x:  0, y: -1 }, // up
  { x:  0, y:  1 }, // down
  { x: -1, y:  0 }, // left
  { x:  1, y:  0 }, // right
];

export class Ghost {
  constructor(name, color, homeCol, homeRow, scatterTarget, dotLimit) {
    this.name          = name;
    this.color         = color;
    this.homeCol       = homeCol;
    this.homeRow       = homeRow;
    this.scatterTarget = scatterTarget;
    this.dotLimit      = dotLimit;

    this.reset();
  }

  reset() {
    const ts = getTileSize();
    this.x          = this.homeCol * ts + ts / 2;
    this.y          = this.homeRow * ts + ts / 2;
    this.dir        = { x: 0, y: -1 };
    this.mode       = MODE.HOUSE;
    this.prevMode   = MODE.SCATTER;
    this.frightTimer = 0;
    this.flashTimer  = 0;
    this.flashing    = false;
    this.dotCounter  = 0;
    this.bounceDir   = 1; // for house bobbing
    this.atTileCenter = false;
    this.pendingReverse = false;

    // Blinky starts outside immediately
    if (this.name === 'blinky') {
      this.x   = 13.5 * ts;
      this.y   = 11   * ts;
      this.dir = { x: -1, y: 0 };
      this.mode = MODE.SCATTER;
    }
  }

  setPhase(phase) {
    if (this.mode === MODE.FRIGHTENED || this.mode === MODE.EATEN ||
        this.mode === MODE.HOUSE      || this.mode === MODE.LEAVING) return;
    if (this.mode !== phase) {
      this.pendingReverse = true;
    }
    this.mode = phase;
  }

  activateFrightened(duration) {
    if (this.mode === MODE.EATEN || this.mode === MODE.HOUSE || this.mode === MODE.LEAVING) return;
    this.prevMode    = this.mode;
    this.mode        = MODE.FRIGHTENED;
    this.frightTimer = duration;
    this.flashing    = false;
    this.pendingReverse = true;
  }

  endFrightened() {
    if (this.mode !== MODE.FRIGHTENED) return;
    this.mode = this.prevMode;
    this.flashing = false;
  }

  update(dt, maze, pacman, blinky) {
    const ts    = getTileSize();
    const speed = this._speed(ts);

    if (this.mode === MODE.HOUSE) {
      this._bobInHouse(dt, ts);
      return;
    }

    if (this.mode === MODE.LEAVING) {
      this._leaveHouse(dt, ts, maze);
      return;
    }

    if (this.mode === MODE.FRIGHTENED) {
      this.frightTimer -= dt;
      if (this.frightTimer <= 2000) this.flashing = Math.floor(Date.now() / 250) % 2 === 0;
      if (this.frightTimer <= 0)    this.endFrightened();
    }

    // Move
    this.x += this.dir.x * speed;
    this.y += this.dir.y * speed;

    // Tunnel wrap
    if (this.x < -ts)         this.x = COLS * ts;
    if (this.x > COLS * ts)   this.x = -ts;

    // At tile center: choose next direction
    if (this._reachedCenter(ts)) {
      this._snapCenter(ts);
      const target = this._computeTarget(pacman, blinky);
      this._chooseDir(maze, target);
    }
  }

  _bobInHouse(dt, ts) {
    const speed = ts * 0.03;
    this.y += this.bounceDir * speed;
    const topBound    = (13 * ts + ts / 2) - ts * 0.6;
    const bottomBound = (15 * ts + ts / 2) + ts * 0.6;
    if (this.y <= topBound)    this.bounceDir =  1;
    if (this.y >= bottomBound) this.bounceDir = -1;
  }

  _leaveHouse(dt, ts, maze) {
    const exitX = 13.5 * ts;
    const exitY = 11   * ts;
    const speed = ts * 0.05;

    // Move toward exit: first align x, then move y
    if (Math.abs(this.x - exitX) > 1) {
      this.x += (this.x < exitX ? 1 : -1) * speed;
    } else {
      this.x = exitX;
      this.y -= speed;
    }

    if (this.y <= exitY) {
      this.y   = exitY;
      this.dir = { x: -1, y: 0 };
      this.mode = this.prevMode === MODE.FRIGHTENED ? MODE.SCATTER : this.prevMode;
      if (this.mode !== MODE.SCATTER && this.mode !== MODE.CHASE) this.mode = MODE.SCATTER;
    }
  }

  _reachedCenter(ts) {
    const cx = Math.round(this.x / ts) * ts + ts / 2;
    const cy = Math.round(this.y / ts) * ts + ts / 2;
    const dist = Math.hypot(this.x - cx, this.y - cy);
    return dist < this._speed(ts) * 1.5;
  }

  _snapCenter(ts) {
    this.x = Math.round(this.x / ts) * ts + ts / 2;
    this.y = Math.round(this.y / ts) * ts + ts / 2;
  }

  _speed(ts) {
    switch (this.mode) {
      case MODE.FRIGHTENED: return ts * 0.040;
      case MODE.EATEN:      return ts * 0.150;
      default:
        // Slow in tunnel row 14
        if (Math.floor(this.y / ts) === 14) return ts * 0.040;
        return ts * 0.075;
    }
  }

  _computeTarget(pacman, blinky) {
    const ts = getTileSize();
    const pm = { col: Math.floor(pacman.x / ts), row: Math.floor(pacman.y / ts) };
    const pd = pacman.dir;

    if (this.mode === MODE.SCATTER)    return this.scatterTarget;
    if (this.mode === MODE.EATEN)      return { col: 13, row: 12 };
    if (this.mode === MODE.FRIGHTENED) return null; // random

    // CHASE
    switch (this.name) {
      case 'blinky':
        return pm;

      case 'pinky': {
        // 4 tiles ahead + classic overflow bug on UP
        let col = pm.col + pd.x * 4;
        let row = pm.row + pd.y * 4;
        if (pd.y === -1) col -= 4; // overflow bug
        return { col, row };
      }

      case 'inky': {
        // Pivot = 2 tiles ahead of Pac-Man
        let pc = pm.col + pd.x * 2;
        let pr = pm.row + pd.y * 2;
        if (pd.y === -1) pc -= 2; // overflow bug
        const bc = Math.floor(blinky.x / ts);
        const br = Math.floor(blinky.y / ts);
        return { col: pc * 2 - bc, row: pr * 2 - br };
      }

      case 'clyde': {
        const dc = Math.floor(this.x / ts);
        const dr = Math.floor(this.y / ts);
        const dist = Math.hypot(pm.col - dc, pm.row - dr);
        return dist > 8 ? pm : this.scatterTarget;
      }
    }
    return pm;
  }

  _chooseDir(maze, target) {
    const ts   = getTileSize();
    const col  = Math.round(this.x / ts - 0.5);
    const row  = Math.round(this.y / ts - 0.5);

    const candidates = DIRS.filter(d => {
      // No reversing
      if (d.x === -this.dir.x && d.y === -this.dir.y) return false;
      // Enforce pendingReverse only once
      const nextCol = col + d.x;
      const nextRow = row + d.y;
      if (isWallForGhost(maze, nextCol, nextRow)) return false;
      // Ghost door: only EATEN ghosts may re-enter through door
      if (maze[nextRow]?.[nextCol] === TILE.DOOR && this.mode !== MODE.EATEN) return false;
      // No UP at restricted intersections
      if (d.y === -1 && this.mode !== MODE.FRIGHTENED && this.mode !== MODE.EATEN) {
        if (NO_UP_TILES.some(t => t.col === col && t.row === row)) return false;
      }
      return true;
    });

    if (this.pendingReverse) {
      this.pendingReverse = false;
      const rev = { x: -this.dir.x, y: -this.dir.y };
      const revOk = candidates.some(d => d.x === rev.x && d.y === rev.y);
      if (revOk) { this.dir = rev; return; }
    }

    if (candidates.length === 0) return;

    if (this.mode === MODE.FRIGHTENED || target === null) {
      this.dir = candidates[Math.floor(Math.random() * candidates.length)];
      return;
    }

    // EATEN: returning to house
    if (this.mode === MODE.EATEN) {
      // Once at door tile, transition back to HOUSE
      if (col === 13 && row === 12) {
        this.mode = MODE.HOUSE;
        this.bounceDir = 1;
        this.x = 13.5 * getTileSize();
        this.y = 14   * getTileSize();
        this.dir = { x: 0, y: 1 };
        // Start leaving sequence
        setTimeout(() => {
          if (this.mode === MODE.HOUSE) this.mode = MODE.LEAVING;
        }, 2000);
        return;
      }
    }

    // Pick candidate that minimizes distance to target
    let best = null, bestDist = Infinity;
    for (const d of candidates) {
      const nc = col + d.x;
      const nr = row + d.y;
      const dist = (nc - target.col) ** 2 + (nr - target.row) ** 2;
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    if (best) this.dir = best;
  }

  draw(ctx) {
    const ts = getTileSize();
    const r  = ts * 0.46;
    const x  = this.x;
    const y  = this.y;

    const isFrightened = this.mode === MODE.FRIGHTENED;
    const isEaten      = this.mode === MODE.EATEN;

    if (!isEaten) {
      const bodyColor = isFrightened
        ? (this.flashing ? '#ffffff' : '#0000cc')
        : this.color;

      ctx.fillStyle = bodyColor;
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur  = ts * 0.4;

      // Ghost body: semicircle top + rectangular body + scallop bottom
      ctx.beginPath();
      ctx.arc(x, y - r * 0.1, r, Math.PI, 0);
      ctx.lineTo(x + r, y + r * 0.9);

      // Three scallops
      const scW = (r * 2) / 3;
      for (let i = 2; i >= 0; i--) {
        const cx = x + r - (i + 0.5) * scW;
        ctx.arc(cx, y + r * 0.9, scW / 2, 0, Math.PI, true);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      if (isFrightened) {
        // Wavy mouth
        ctx.strokeStyle = this.flashing ? '#0000cc' : '#ffffff';
        ctx.lineWidth   = ts * 0.08;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.2, y + r * 0.3, x, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.2, y - r * 0.1, x + r * 0.4, y + r * 0.1);
        ctx.stroke();
        // Scared eyes
        ctx.fillStyle = this.flashing ? '#0000cc' : '#ff0000';
        ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
      } else {
        drawEyes(ctx, x, y, r, this.dir);
      }
    } else {
      // Eaten: draw eyes only
      drawEyes(ctx, x, y, r, this.dir);
    }
  }

  getTile() {
    const ts = getTileSize();
    return { col: Math.floor(this.x / ts), row: Math.floor(this.y / ts) };
  }
}

function drawEyes(ctx, x, y, r, dir) {
  const eyeOffX = r * 0.35;
  const eyeOffY = r * 0.05;
  const eyeR    = r * 0.25;
  const pupilR  = r * 0.13;
  const pupilOffX = dir.x * eyeR * 0.5;
  const pupilOffY = dir.y * eyeR * 0.5;

  for (let side of [-1, 1]) {
    const ex = x + side * eyeOffX;
    const ey = y - eyeOffY;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(ex, ey, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath(); ctx.arc(ex + pupilOffX, ey + pupilOffY, pupilR, 0, Math.PI * 2); ctx.fill();
  }
}

export function createGhosts() {
  return [
    new Ghost('blinky', '#FF0000', 13, 11, { col: 25, row: -3 }, 0),
    new Ghost('pinky',  '#FFB8FF', 13, 13, { col:  2, row: -3 }, 0),
    new Ghost('inky',   '#00FFFF', 11, 13, { col: 27, row: 31 }, 30),
    new Ghost('clyde',  '#FFB852', 15, 13, { col:  0, row: 31 }, 60),
  ];
}
