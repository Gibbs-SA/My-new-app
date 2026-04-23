import { observeAuth, signInWithGoogle, signOutUser } from './auth.js';
import { saveScore, loadLeaderboard, renderLeaderboard } from './leaderboard.js';
import {
  initGame, startGame, pauseGame, resumeGame,
  setCallbacks, getScore, getLevel, getHighScore, initControls,
  STATE
} from './game.js';
import { unlock as sfxUnlock } from './sounds.js';

// ── Screen helpers ────────────────────────────────────────────────────────

let currentUser   = null;
let isGuest       = false;

const screens = {
  auth:        document.getElementById('auth-screen'),
  menu:        document.getElementById('menu-screen'),
  game:        document.getElementById('game-container'),
  gameover:    document.getElementById('gameover-screen'),
  leaderboard: document.getElementById('leaderboard-screen'),
};

function show(name) {
  Object.entries(screens).forEach(([k, el]) => {
    if (!el) return;
    if (k === name) el.classList.remove('hidden');
    else            el.classList.add('hidden');
  });
}

// ── Firebase auth ─────────────────────────────────────────────────────────

observeAuth(user => {
  currentUser = user;
  const logout = document.getElementById('btn-logout');
  const info   = document.getElementById('user-info');

  if (user) {
    if (info)   info.textContent  = `${user.displayName}`;
    if (logout) logout.classList.remove('hidden');
    if (screens.auth && !screens.auth.classList.contains('hidden')) show('menu');
  } else {
    if (info)   info.textContent  = '';
    if (logout) logout.classList.add('hidden');
  }
});

// ── Button wiring ─────────────────────────────────────────────────────────

document.getElementById('btn-google-login').onclick = async () => {
  try { await signInWithGoogle(); }
  catch (err) { console.error('Login error:', err); }
};

document.getElementById('btn-guest').onclick = () => {
  isGuest = true;
  show('menu');
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('user-info').textContent = 'GUEST';
};

document.getElementById('btn-play').onclick = () => {
  sfxUnlock();
  show('game');
  startGame(1);
};

document.getElementById('btn-play-again').onclick = () => {
  sfxUnlock();
  show('game');
  startGame(1);
};

document.getElementById('btn-leaderboard-menu').onclick = async () => {
  show('leaderboard');
  const entries = await loadLeaderboard(10);
  renderLeaderboard(entries, currentUser?.uid);
};

document.getElementById('btn-logout').onclick = async () => {
  try {
    await signOutUser();
    isGuest = false;
    currentUser = null;
  } catch (e) {}
  show('auth');
};

document.getElementById('btn-back').onclick = () => show('menu');

document.getElementById('btn-leaderboard-go').onclick = async () => {
  show('leaderboard');
  const entries = await loadLeaderboard(10);
  renderLeaderboard(entries, currentUser?.uid);
};

document.getElementById('btn-menu-go').onclick = () => show('menu');

// ── Game callbacks ────────────────────────────────────────────────────────

setCallbacks({
  score: (s, hi) => {
    const el = document.getElementById('hud-score');
    const hiEl = document.getElementById('hud-high');
    if (el)   el.textContent  = s;
    if (hiEl) hiEl.textContent = hi;
  },
  lives: (n) => {
    const el = document.getElementById('hud-lives');
    if (el) el.textContent = '🟡'.repeat(Math.max(0, n));
  },
  level: (l) => {
    const el = document.getElementById('hud-level');
    if (el) el.textContent = l;
  },
  gameover: async (score, highScore) => {
    const fs   = document.getElementById('final-score');
    const best = document.getElementById('new-best-msg');
    if (fs) fs.textContent = score.toLocaleString();

    let isNewBest = false;
    if (!isGuest && currentUser) {
      isNewBest = await saveScore(currentUser, score, getLevel());
    }
    if (best) best.style.display = isNewBest ? 'block' : 'none';

    // Show game over after short delay
    setTimeout(() => show('gameover'), 1500);
  },
});

// ── Canvas & controls init ────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
initGame(canvas);
initControls();

// Portrait lock
if (screen.orientation?.lock) {
  screen.orientation.lock('portrait').catch(() => {});
}

// Pause on tab hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
  else                 resumeGame();
});

// Draw logo on auth screen
_drawLogo();

function _drawLogo() {
  const c = document.getElementById('logo-canvas');
  if (!c) return;
  const cx = c.getContext('2d');
  cx.fillStyle = '#FFD700';
  cx.beginPath();
  cx.moveTo(40, 40);
  cx.arc(40, 40, 36, 0.3, Math.PI * 2 - 0.3);
  cx.closePath();
  cx.fill();
}

// Initial screen
show('auth');
