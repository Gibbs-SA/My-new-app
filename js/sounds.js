let _ctx = null;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function unlock() {
  ac(); // create context on first user gesture
}

// ── Waka-waka ──────────────────────────────────────────────────────────────

let _wakaToggle = false;
export function playWaka() {
  try {
    const a = ac();
    const osc  = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'square';
    const t = a.currentTime;
    const [f0, f1] = _wakaToggle ? [572, 420] : [470, 350];
    _wakaToggle = !_wakaToggle;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + 0.05);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t); osc.stop(t + 0.07);
  } catch(e) {}
}

// ── Power pellet ───────────────────────────────────────────────────────────

export function playPowerPellet() {
  try {
    const a = ac();
    const t = a.currentTime;
    const osc  = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.16);
  } catch(e) {}
}

// ── Frightened mode siren ──────────────────────────────────────────────────

let _frightenedNodes = null;

export function startFrightened() {
  stopFrightened();
  try {
    const a   = ac();
    const osc = a.createOscillator();
    const lfo = a.createOscillator();
    const lfoGain = a.createGain();
    const masterGain = a.createGain();

    lfo.frequency.value  = 6;
    lfoGain.gain.value   = 80;
    masterGain.gain.value = 0.12;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(masterGain);
    masterGain.connect(a.destination);

    osc.type = 'square';
    osc.frequency.value = 260;

    lfo.start(); osc.start();
    _frightenedNodes = { osc, lfo, masterGain };
  } catch(e) {}
}

export function stopFrightened() {
  if (!_frightenedNodes) return;
  try {
    _frightenedNodes.osc.stop();
    _frightenedNodes.lfo.stop();
  } catch(e) {}
  _frightenedNodes = null;
}

export function setFrightenedFlash(flashing) {
  if (!_frightenedNodes) return;
  try {
    _frightenedNodes.masterGain.gain.value = flashing ? 0.18 : 0.12;
  } catch(e) {}
}

// ── Ghost eaten ────────────────────────────────────────────────────────────

export function playGhostEaten() {
  try {
    const a = ac();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    let t = a.currentTime;
    for (const freq of notes) {
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain); gain.connect(a.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
      osc.start(t); osc.stop(t + 0.07);
      t += 0.055;
    }
  } catch(e) {}
}

// ── Pac-Man death ──────────────────────────────────────────────────────────

export function playDeath() {
  stopFrightened();
  stopSiren();
  try {
    const a   = ac();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'sawtooth';
    const t = a.currentTime;
    osc.frequency.setValueAtTime(960, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 1.2);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    osc.start(t); osc.stop(t + 1.4);
  } catch(e) {}
}

// ── Game start jingle ──────────────────────────────────────────────────────

export function playGameStart(onEnd) {
  try {
    const a = ac();
    const melody = [
      {f:494,d:0.10},{f:988,d:0.10},{f:740,d:0.10},{f:622,d:0.10},
      {f:988,d:0.20},{f:740,d:0.20},{f:622,d:0.40},
      {f:523,d:0.10},{f:1047,d:0.10},{f:784,d:0.10},{f:659,d:0.10},
      {f:1047,d:0.20},{f:784,d:0.20},{f:659,d:0.40},
    ];
    let t = a.currentTime + 0.05;
    for (const { f, d } of melody) {
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain); gain.connect(a.destination);
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d - 0.01);
      osc.start(t); osc.stop(t + d);
      t += d;
    }
    const totalMs = (t - a.currentTime) * 1000;
    if (onEnd) setTimeout(onEnd, totalMs);
    return totalMs;
  } catch(e) {
    if (onEnd) setTimeout(onEnd, 4000);
    return 4000;
  }
}

// ── Extra life ─────────────────────────────────────────────────────────────

export function playExtraLife() {
  try {
    const a = ac();
    const notes = [784, 988, 1319]; // G5 B5 E6
    let t = a.currentTime;
    for (const f of notes) {
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain); gain.connect(a.destination);
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.start(t); osc.stop(t + 0.14);
      t += 0.1;
    }
  } catch(e) {}
}

// ── Fruit pickup ───────────────────────────────────────────────────────────

export function playFruit() {
  try {
    const a = ac();
    const notes = [523,659,784,1047,784,1047];
    let t = a.currentTime;
    for (const f of notes) {
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain); gain.connect(a.destination);
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.start(t); osc.stop(t + 0.08);
      t += 0.06;
    }
  } catch(e) {}
}

// ── Level clear ────────────────────────────────────────────────────────────

export function playLevelClear() {
  try {
    const a = ac();
    const notes = [784,1047,1319,1568];
    let t = a.currentTime;
    for (const f of notes) {
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain); gain.connect(a.destination);
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t); osc.stop(t + 0.2);
      t += 0.15;
    }
  } catch(e) {}
}

// ── Background siren ───────────────────────────────────────────────────────

let _sirenOsc  = null;
let _sirenGain = null;

export function startSiren() {
  stopSiren();
  try {
    const a = ac();
    _sirenOsc  = a.createOscillator();
    _sirenGain = a.createGain();
    _sirenOsc.connect(_sirenGain);
    _sirenGain.connect(a.destination);
    _sirenOsc.type = 'sawtooth';
    _sirenOsc.frequency.value = 220;
    _sirenGain.gain.value     = 0.04;
    _sirenOsc.start();
  } catch(e) {}
}

export function updateSiren(dotsRemaining, total) {
  if (!_sirenOsc) return;
  try {
    const fraction = dotsRemaining / total;
    _sirenOsc.frequency.value = 220 + (1 - fraction) * 330;
  } catch(e) {}
}

export function stopSiren() {
  if (!_sirenOsc) return;
  try { _sirenOsc.stop(); } catch(e) {}
  _sirenOsc = null; _sirenGain = null;
}
