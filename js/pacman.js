import { TILE, COLS, ROWS, getTileSize, pixelToTile, isWall } from './maze.js';

export class Pacman {
  constructor() {
    this.reset();
  }

  reset(level = 1) {
    const ts = getTileSize();
    this.x       = 13.5 * ts;
    this.y       = 23.5 * ts;
    this.dir     = { x: 0,  y: 0 };
    this.nextDir = { x: -1, y: 0 };
    this.baseSpeed  = ts * 0.1263 * speedFactor(level, false);
    this.frightSpeed = ts * 0.1263 * speedFactor(level, true);
    this.speed   = this.baseSpeed;
    this.mouthAngle = 0.25;  // radians
    this.mouthOpen  = true;
    this.animTimer  = 0;
    this.alive      = true;
    this.deathFrame = 0;
    this.dying      = false;
    this.deathTimer = 0;
  }

  setNextDir(dir) {
    this.nextDir = { ...dir };
  }

  update(dt, maze) {
    if (this.dying) {
      this.deathTimer += dt;
      this.deathFrame = Math.min(11, Math.floor(this.deathTimer / 100));
      return;
    }

    const ts = getTileSize();

    // Try to turn if nextDir is different
    if ((this.nextDir.x !== this.dir.x || this.nextDir.y !== this.dir.y)) {
      if (canMove(this.x, this.y, this.nextDir, maze, ts)) {
        this.dir = { ...this.nextDir };
        alignToGrid(this, ts);
      }
    }

    // Move in current direction
    if (this.dir.x !== 0 || this.dir.y !== 0) {
      if (canMove(this.x, this.y, this.dir, maze, ts)) {
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
        alignToGrid(this, ts);
      } else {
        // Snap to tile center when blocked
        const tile = pixelToTile(this.x, this.y);
        this.x = tile.col * ts + ts / 2;
        this.y = tile.row * ts + ts / 2;
      }
    }

    // Tunnel wrap (row 14)
    if (this.x < -ts / 2)          this.x = COLS * ts + ts / 2;
    if (this.x > COLS * ts + ts / 2) this.x = -ts / 2;

    // Mouth animation
    this.animTimer += dt;
    if (this.animTimer >= 60) {
      this.animTimer = 0;
      if (this.mouthOpen) {
        this.mouthAngle -= 0.12;
        if (this.mouthAngle <= 0.02) { this.mouthAngle = 0.02; this.mouthOpen = false; }
      } else {
        this.mouthAngle += 0.12;
        if (this.mouthAngle >= 0.4) { this.mouthAngle = 0.4; this.mouthOpen = true; }
      }
    }
  }

  draw(ctx) {
    const ts = getTileSize();
    const r  = ts * 0.46;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.dying) {
      this._drawDying(ctx, r);
    } else {
      const angle = Math.atan2(this.dir.y, this.dir.x);
      ctx.rotate(angle);
      const mouth = this.mouthAngle;
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#ffa500';
      ctx.shadowBlur = ts * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  _drawDying(ctx, r) {
    const progress = this.deathFrame / 11;
    const openAngle = Math.PI * 0.1 + progress * Math.PI * 1.7;
    const shrink    = 1 - progress * 0.4;
    const rr = r * shrink;

    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#ff8c00';
    ctx.shadowBlur = rr;

    if (progress >= 0.99) {
      // Fully consumed
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.rotate(-Math.PI / 2); // face up for death spin
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rr, openAngle, Math.PI * 2 - openAngle);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  getTile() {
    const ts = getTileSize();
    return { col: Math.floor(this.x / ts), row: Math.floor(this.y / ts) };
  }

  isMoving() {
    return this.dir.x !== 0 || this.dir.y !== 0;
  }
}

function speedFactor(level, frightened) {
  // Speed multipliers by level
  const normal = [0, 0.80, 0.90, 0.90, 0.90, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00];
  const fright  = [0, 0.90, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00];
  const idx = Math.min(level, normal.length - 1);
  return frightened ? fright[idx] : normal[idx];
}

function canMove(x, y, dir, maze, ts) {
  const margin = ts * 0.35;
  const nx = x + dir.x * ts * 0.5;
  const ny = y + dir.y * ts * 0.5;

  // Check the two corners perpendicular to movement
  if (dir.x !== 0) {
    const topRow    = Math.floor((y - margin) / ts);
    const bottomRow = Math.floor((y + margin) / ts);
    const col       = Math.floor(nx / ts);
    return !isWall(maze, col, topRow) && !isWall(maze, col, bottomRow);
  } else {
    const leftCol  = Math.floor((x - margin) / ts);
    const rightCol = Math.floor((x + margin) / ts);
    const row      = Math.floor(ny / ts);
    return !isWall(maze, leftCol, row) && !isWall(maze, rightCol, row);
  }
}

function alignToGrid(pac, ts) {
  // When moving horizontally, snap y to row center
  if (pac.dir.x !== 0) {
    const row    = Math.floor(pac.y / ts);
    const target = row * ts + ts / 2;
    const diff   = target - pac.y;
    if (Math.abs(diff) < pac.speed * 1.5) {
      pac.y += diff * 0.4;
    }
  }
  // When moving vertically, snap x to col center
  if (pac.dir.y !== 0) {
    const col    = Math.floor(pac.x / ts);
    const target = col * ts + ts / 2;
    const diff   = target - pac.x;
    if (Math.abs(diff) < pac.speed * 1.5) {
      pac.x += diff * 0.4;
    }
  }
}

export { canMove };
