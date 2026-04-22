export const TILE = { EMPTY: 0, WALL: 1, DOT: 2, PELLET: 3, DOOR: 4, HOUSE: 5 };
export const COLS = 28;
export const ROWS = 31;
export const TOTAL_DOTS = 244;

// 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost door, 5=ghost house interior
export const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1], // 1
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1], // 2
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1], // 3
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1], // 4
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // 5
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1], // 6
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1], // 7
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1], // 8
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1], // 9
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1], // 10
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1], // 11
  [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1], // 12
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1], // 13
  [0,0,0,0,0,0,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,0,0,0,0,0,0], // 14 tunnel
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1], // 15
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1], // 16
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1], // 17
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1], // 18
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1], // 19
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1], // 20
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1], // 21
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1], // 22
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1], // 23
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1], // 24
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1], // 25
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1], // 26
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1], // 27
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1], // 28
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // 29
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 30
];

// Deep copy maze for active game state
export function createMaze() {
  return MAZE_TEMPLATE.map(row => [...row]);
}

let _tileSize = 0;

export function setTileSize(ts) { _tileSize = ts; }
export function getTileSize()   { return _tileSize; }

export function tileToPixel(col, row) {
  return { x: col * _tileSize + _tileSize / 2, y: row * _tileSize + _tileSize / 2 };
}

export function pixelToTile(x, y) {
  return { col: Math.floor(x / _tileSize), row: Math.floor(y / _tileSize) };
}

export function isWall(maze, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  const t = maze[row][col];
  return t === TILE.WALL || t === TILE.DOOR;
}

export function isWallForGhost(maze, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  return maze[row][col] === TILE.WALL;
}

// ── Drawing ──────────────────────────────────────────────────────────────────

export function drawMaze(ctx, maze, timestamp) {
  const ts = _tileSize;
  const W  = COLS * ts;
  const H  = ROWS * ts;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Draw walls
  ctx.save();
  ctx.strokeStyle = '#2121de';
  ctx.lineWidth   = Math.max(1, ts * 0.12);
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.shadowColor = '#0000ff';
  ctx.shadowBlur  = ts * 0.6;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (maze[r][c] === TILE.WALL) {
        drawWallCell(ctx, maze, c, r, ts);
      }
    }
  }
  ctx.restore();

  // Draw ghost house door
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (maze[r][c] === TILE.DOOR) {
        const x = c * ts;
        const y = r * ts;
        ctx.fillStyle = '#ffb8ff';
        ctx.fillRect(x, y + ts * 0.4, ts, ts * 0.2);
      }
    }
  }

  // Draw dots and pellets
  const pulse = 0.7 + 0.3 * Math.sin(timestamp / 300);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c * ts + ts / 2;
      const cy = r * ts + ts / 2;
      if (maze[r][c] === TILE.DOT) {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.5, ts * 0.12), 0, Math.PI * 2);
        ctx.fill();
      } else if (maze[r][c] === TILE.PELLET) {
        ctx.fillStyle = `rgba(255,184,174,${pulse})`;
        ctx.shadowColor = '#ffb8ae';
        ctx.shadowBlur  = ts * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, ts * 0.28), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawWallCell(ctx, maze, c, r, ts) {
  const x  = c * ts;
  const y  = r * ts;
  const r2 = ts * 0.5; // corner radius

  const up    = isNeighborWall(maze, c, r - 1);
  const down  = isNeighborWall(maze, c, r + 1);
  const left  = isNeighborWall(maze, c - 1, r);
  const right = isNeighborWall(maze, c + 1, r);

  const ulCorner = isNeighborWall(maze, c - 1, r - 1);
  const urCorner = isNeighborWall(maze, c + 1, r - 1);
  const dlCorner = isNeighborWall(maze, c - 1, r + 1);
  const drCorner = isNeighborWall(maze, c + 1, r + 1);

  ctx.fillStyle = '#000010';
  ctx.fillRect(x, y, ts, ts);

  const offset = ctx.lineWidth / 2;

  // Draw connecting lines to neighbors
  const mx = x + ts / 2;
  const my = y + ts / 2;

  if (up)    drawLine(ctx, mx, my, mx, y - offset);
  if (down)  drawLine(ctx, mx, my, mx, y + ts + offset);
  if (left)  drawLine(ctx, mx, my, x - offset, my);
  if (right) drawLine(ctx, mx, my, x + ts + offset, my);

  // Corners: draw arc when two perpendicular neighbors are walls but diagonal is not
  if (up && right && !urCorner)   drawCornerArc(ctx, x + ts, y,      r2, Math.PI, Math.PI * 1.5);
  if (up && left  && !ulCorner)   drawCornerArc(ctx, x,      y,      r2, Math.PI * 1.5, Math.PI * 2);
  if (down && right && !drCorner) drawCornerArc(ctx, x + ts, y + ts, r2, Math.PI * 0.5, Math.PI);
  if (down && left  && !dlCorner) drawCornerArc(ctx, x,      y + ts, r2, 0, Math.PI * 0.5);

  // Isolated or end-cap dots
  if (!up && !down && !left && !right) {
    ctx.beginPath();
    ctx.arc(mx, my, ts * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCornerArc(ctx, cx, cy, r, startAngle, endAngle) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.stroke();
}

function isNeighborWall(maze, c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return maze[r][c] === TILE.WALL;
}

// ── Resize helper ─────────────────────────────────────────────────────────────

export function computeTileSize() {
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const availH = Math.floor(vh * 0.90); // canvas = 90% of screen
  const byW    = Math.floor(vw / COLS);
  const byH    = Math.floor(availH / ROWS);
  return Math.max(6, Math.min(byW, byH));
}
