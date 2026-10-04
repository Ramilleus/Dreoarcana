/* ===================================================================
 * Dreoarcana Arcana — the sound of a spell
 *
 * "Pre-cast: low whirring, deep hum intensifying with charge.
 *  Cast: resonant pulse tied to element used.
 *  Post-cast: momentary stillness or ringing."   — Melfyrium, Sensory Effects
 *
 * Scored like an anime spell: a magic circle drawing itself (a choir
 * swelling on a bright chord, a rising sweep, bells climbing the scale),
 * the activation (a sub drop under a bright "shing" and a bell chord),
 * the element itself, then glitter falling through a stereo echo into a
 * long, airy hall.
 *
 *   Tier        → key and depth: bigger workings sit lower and hit harder
 *   Intent      → the mode: Lydian wonder, warm major, dorian, dark
 *                 phrygian, whole-tone strange
 *   Conversion  → the charge: steady, a slow chant, or a hard snap
 *   Form        → the release transient (whoosh, ring, bloom, beam…)
 *   Size        → the size of the hall
 *   Effects     → one voice each, with its element's character
 *   Flow nodes  → repeats (Split), echoes (Echo), a longer charge (Delay),
 *                 drive (Amplifier), rotation (Orbit), a wider hall (Field),
 *                 a final crash (Collapse)
 *   Outcome     → critical blooms; failure fizzles; fumble tears
 *   Heat        → a hiss in the charge, crackling when it would overheat
 *
 * Each spell is seeded from its build, so it always sounds like itself.
 * Web Audio only — no Foundry globals. `schedule()` writes the whole
 * sound into any AudioContext, so the same code plays live and renders
 * to a file through an OfflineAudioContext.
 * =================================================================== */

import { normalizeBuild, evaluateSpell, EFFECTS, DAMAGE_TYPES, hashString as hashOf, buildShapeKey } from "./rules.js";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Key by tier: the bigger the working, the deeper it sits. */
const TIER_ROOT = { 1: 196, 2: 174.6, 3: 146.8, 4: 123.5, 5: 98 };
const TIER_GAIN = { 1: 0.6, 2: 0.72, 3: 0.84, 4: 0.95, 5: 1.05 };

/* Intent → the mode the spell is scored in (semitones). */
const MODES = {
  Defensive: [0, 2, 4, 6, 7, 9, 11],   // Lydian: wonder, the classic magic-circle colour
  Support:   [0, 2, 4, 5, 7, 9, 11],   // major: warm, healing
  Utility:   [0, 2, 3, 5, 7, 9, 10],   // dorian: clever, a little cool
  Offensive: [0, 1, 4, 5, 7, 8, 10],   // phrygian dominant: dramatic, dangerous
  Creation:  [0, 2, 4, 6, 8, 10]       // whole-tone: strange, dreamlike
};
const DARK = new Set(["Necrotic", "Poison", "Ghost Flame", "Rotting Sickness"]);
const DARK_MODE = [0, 1, 3, 5, 6, 8, 10];  // locrian-ish: wrongness

/* Conversion → the charge. */
const CONVERSION_CHARGE = {
  Base:      { time: 1.1,  chant: 0,   drive: 0 },
  Ritual:    { time: 2.1,  chant: 4.5, drive: 0 },
  Overdrive: { time: 0.55, chant: 0,   drive: 0.7 }
};

/* Size → the hall (seconds of reverb). */
const SIZE_SPACE = { 1: 1.6, 2: 2.2, 3: 2.9, 4: 3.6, 5: 4.4 };

/* A small seeded random source, so each spell has its own figure. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* -------------------------------------------------------------------
 * Buffers
 * ----------------------------------------------------------------- */

function noiseBuffer(ctx, seconds = 2) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A bright, decorrelated stereo hall with a short pre-delay, darkening as it decays. */
function hall(ctx, seconds) {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const pre = Math.floor(ctx.sampleRate * 0.02);
  const fade = ctx.sampleRate * 0.01;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const k = (i - pre) / (len - pre);
      lp += ((Math.random() * 2 - 1) - lp) * (0.9 - 0.75 * k);
      d[i] = lp * Math.pow(1 - k, 2.2) * Math.min(1, (i - pre) / fade);
    }
  }
  return buf;
}

function shaper(ctx, amount) {
  const n = 1024, curve = new Float32Array(n), k = amount * 60;
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)); }
  const ws = ctx.createWaveShaper(); ws.curve = curve; ws.oversample = "2x";
  return ws;
}

/* -------------------------------------------------------------------
 * Voices. Every one takes the scene `S` and a destination node.
 * ----------------------------------------------------------------- */

function env(gain, t0, peak, attack, hold, release, from = 0.0001) {
  const g = gain.gain;
  g.setValueAtTime(from, t0);
  g.linearRampToValueAtTime(peak, t0 + attack);
  g.setValueAtTime(peak, t0 + attack + hold);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

function tone(S, dest, { type = "sine", freq, to = null, t0, attack = 0.01, hold = 0, release = 0.3, level = 0.3, detune = 0 }) {
  const { ctx } = S;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + attack + hold + release);
  const g = ctx.createGain(); env(g, t0, level, attack, hold, release);
  o.connect(g); g.connect(dest);
  o.start(t0); o.stop(t0 + attack + hold + release + 0.05);
}

function burst(S, dest, { t0, attack = 0.005, hold = 0, release = 0.3, level = 0.3, filter = "bandpass", freq = 1000, to = null, q = 1 }) {
  const { ctx } = S;
  const src = ctx.createBufferSource(); src.buffer = S.noise; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + attack + hold + release);
  const g = ctx.createGain(); env(g, t0, level, attack, hold, release);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t0, Math.random() * 1.5); src.stop(t0 + attack + hold + release + 0.05);
}

/** A struck bell: FM, bright at the strike, mellowing as it rings. */
function bell(S, dest, { freq, t0, level = 0.2, decay = 1.4, ratio = 3.5, index = 1.6 }) {
  const { ctx } = S;
  const car = ctx.createOscillator(); car.type = "sine"; car.frequency.value = freq;
  const mod = ctx.createOscillator(); mod.type = "sine"; mod.frequency.value = freq * ratio;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(freq * index, t0);
  mg.gain.exponentialRampToValueAtTime(Math.max(0.01, freq * 0.02), t0 + decay * 0.5);
  mod.connect(mg); mg.connect(car.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(level, t0 + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  car.connect(g); g.connect(dest);
  car.start(t0); mod.start(t0); car.stop(t0 + decay + 0.05); mod.stop(t0 + decay + 0.05);
}

/** A choir pad: detuned saws through vowel formants, with a little vibrato. */
function choir(S, dest, { freqs, t0, attack = 0.6, hold = 0.2, release = 0.8, level = 0.2, vowel = "ah" }) {
  const { ctx } = S;
  const FORMANTS = { ah: [[800, 1], [1150, 0.6], [2900, 0.25]], oo: [[350, 1], [600, 0.5], [2400, 0.15]], ee: [[300, 0.8], [2300, 0.6], [3000, 0.3]] }[vowel];
  const sum = ctx.createGain(); sum.gain.value = 1;
  const out = ctx.createGain(); env(out, t0, level, attack, hold, release);
  for (const [f, a] of FORMANTS) {
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 5;
    const g = ctx.createGain(); g.gain.value = a * 2.4;
    sum.connect(bp); bp.connect(g); g.connect(out);
  }
  out.connect(dest);
  const end = t0 + attack + hold + release + 0.05;
  const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
  const vg = ctx.createGain(); vg.gain.value = 6; vib.connect(vg);
  for (const f of freqs) for (const det of [-11, 0, 11]) {
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det;
    vg.connect(o.detune);
    const g = ctx.createGain(); g.gain.value = 0.12 / freqs.length;
    o.connect(g); g.connect(sum);
    o.start(t0); o.stop(end);
  }
  vib.start(t0); vib.stop(end);
}

/** A sub drop: the weight of the activation. */
function subDrop(S, dest, { t0, from = 140, to = 36, dur = 0.6, level = 0.8 }) {
  tone(S, dest, { type: "sine", freq: from, to, t0, attack: 0.004, release: dur, level });
}

/** A noise sweep: the "whoosh" of power gathering or released. */
function sweep(S, dest, { t0, dur = 1, from = 300, to = 8000, level = 0.25, q = 2.5, attack = null }) {
  burst(S, dest, { t0, attack: attack ?? dur * 0.85, release: dur * 0.15 + 0.08, level, filter: "bandpass", freq: from, to, q });
}

/** A zap: a saw diving in pitch, buzzing. */
function zap(S, dest, { t0, from = 3200, to = 180, dur = 0.22, level = 0.3 }) {
  const { ctx } = S;
  const o = ctx.createOscillator(); o.type = "sawtooth";
  o.frequency.setValueAtTime(from, t0); o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const am = ctx.createOscillator(); am.type = "square"; am.frequency.value = 55;
  const amg = ctx.createGain(); amg.gain.value = 0.5; am.connect(amg);
  const g = ctx.createGain(); env(g, t0, level, 0.002, 0, dur);
  amg.connect(g.gain);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
  o.connect(hp); hp.connect(g); g.connect(dest);
  o.start(t0); am.start(t0); o.stop(t0 + dur + 0.05); am.stop(t0 + dur + 0.05);
}

/** Glitter: little bells falling (or rising) through the mode — "kira kira". */
function glitter(S, { t0, count = 10, span = 1.2, level = 0.12, octave = 3, falling = true }) {
  for (let i = 0; i < count; i++) {
    const deg = falling ? Math.floor((count - i) * 0.7 + S.rand() * 3) : Math.floor(i * 0.7 + S.rand() * 3);
    const t = t0 + span * (i / count) + S.rand() * 0.03;
    bell(S, S.ch((S.rand() * 2 - 1) * 0.85, 0.55, 0.45), { freq: S.note(deg, octave), t0: t, level: level * (1 - i / (count * 1.4)), decay: 0.9 + S.rand() * 0.6, ratio: 3.5 + S.rand(), index: 1.1 });
  }
}

/* -------------------------------------------------------------------
 * Element and effect voices — "a resonant pulse tied to the element".
 * Each takes (S, t, L).
 * ----------------------------------------------------------------- */
const ch = (S, pan = 0, verb = 0.35, echo = 0) => S.ch(pan, verb, echo);

const PULSES = {
  Fire: (S, t, L) => {
    sweep(S, ch(S, -0.3), { t0: t - 0.05, dur: 0.6, from: 3000, to: 250, level: L * 0.5, q: 0.8, attack: 0.04 });
    burst(S, ch(S, 0, 0.3), { t0: t, attack: 0.03, hold: 0.25, release: 0.9, level: L * 0.35, filter: "lowpass", freq: 900, to: 300 });
    for (let i = 0; i < 10; i++) burst(S, ch(S, S.rand() * 1.6 - 0.8, 0.2), { t0: t + 0.08 + i * 0.09 + S.rand() * 0.04, release: 0.03, level: L * 0.3, filter: "highpass", freq: 2500 + S.rand() * 2500, q: 1.5 });
    subDrop(S, ch(S, 0, 0.1), { t0: t, from: 110, to: 45, dur: 0.7, level: L * 0.5 });
  },
  Lightning: (S, t, L) => {
    for (let i = 0; i < 3; i++) zap(S, ch(S, i % 2 ? 0.6 : -0.6, 0.35, 0.3), { t0: t + i * 0.07, from: 4200 - i * 600, to: 160, dur: 0.18 + i * 0.05, level: L * 0.32 });
    burst(S, ch(S, 0, 0.4), { t0: t, attack: 0.001, release: 0.22, level: L * 0.8, filter: "highpass", freq: 2800 });
    burst(S, ch(S, 0, 0.5), { t0: t + 0.05, release: 0.9, level: L * 0.35, filter: "lowpass", freq: 300, to: 80 });
  },
  Frost: (S, t, L) => {
    for (let i = 0; i < 8; i++) bell(S, ch(S, (i % 2 ? 1 : -1) * 0.6, 0.6, 0.4), { freq: S.note(i * 2, 3) * 1.004, t0: t + i * 0.035, level: L * 0.16, decay: 2.2, ratio: 2.76, index: 1.2 });
    burst(S, ch(S, 0, 0.6), { t0: t, attack: 0.05, release: 1.4, level: L * 0.16, filter: "highpass", freq: 7000 });
  },
  Wind: (S, t, L) => {
    sweep(S, ch(S, -0.7, 0.4), { t0: t - 0.2, dur: 0.7, from: 300, to: 2400, level: L * 0.5, q: 1.6 });
    sweep(S, ch(S, 0.7, 0.4), { t0: t + 0.3, dur: 0.7, from: 2400, to: 400, level: L * 0.4, q: 1.6, attack: 0.1 });
    tone(S, ch(S, 0, 0.5), { type: "sine", freq: S.note(4, 3), to: S.note(0, 3), t0: t, attack: 0.2, release: 0.8, level: L * 0.08 });
  },
  Thunder: (S, t, L) => {
    subDrop(S, ch(S, 0, 0.2), { t0: t, from: 90, to: 28, dur: 1.6, level: L * 1.0 });
    burst(S, ch(S, 0, 0.6), { t0: t + 0.02, release: 2.0, level: L * 0.5, filter: "lowpass", freq: 260, to: 70 });
    burst(S, ch(S, 0, 0.4), { t0: t, attack: 0.002, release: 0.15, level: L * 0.5, filter: "highpass", freq: 2000 });
  },
  Acid: (S, t, L) => {
    for (let i = 0; i < 12; i++) tone(S, ch(S, S.rand() * 1.4 - 0.7, 0.3), { type: "sine", freq: 300 + S.rand() * 900, to: 900 + S.rand() * 900, t0: t + i * 0.06, attack: 0.005, release: 0.07, level: L * 0.22 });
    burst(S, ch(S), { t0: t, attack: 0.05, release: 1.0, level: L * 0.16, filter: "bandpass", freq: 3500, q: 2 });
  },
  Necrotic: (S, t, L) => {
    burst(S, ch(S, 0, 0.6), { t0: t - 0.5, attack: 0.5, release: 0.04, level: L * 0.4, filter: "bandpass", freq: 400, to: 3000, q: 1 });   // reverse swell
    choir(S, ch(S, 0, 0.6), { freqs: [S.root, S.root * Math.pow(2, 6 / 12), S.root * Math.pow(2, 13 / 12)], t0: t, attack: 0.08, hold: 0.3, release: 1.6, level: L * 0.4, vowel: "oo" });
    subDrop(S, ch(S, 0, 0.2), { t0: t, from: 70, to: 35, dur: 1.0, level: L * 0.5 });
  },
  Poison: (S, t, L) => {
    for (let i = 0; i < 8; i++) tone(S, ch(S, S.rand() * 1.4 - 0.7, 0.4), { type: "sine", freq: 200 + S.rand() * 300, to: 120, t0: t + i * 0.09, attack: 0.01, release: 0.14, level: L * 0.2 });
    bell(S, ch(S, -0.4, 0.5), { freq: S.note(0, 2), t0: t, level: L * 0.16, decay: 1.4 });
    bell(S, ch(S, 0.4, 0.5), { freq: S.note(0, 2) * Math.pow(2, 1 / 12), t0: t + 0.03, level: L * 0.16, decay: 1.4 });
  },
  Prismatic: (S, t, L) => {
    for (let i = 0; i < 14; i++) bell(S, ch(S, -0.9 + (i / 13) * 1.8, 0.55, 0.35), { freq: S.note(i, 2), t0: t + i * 0.045, level: L * 0.15, decay: 1.6, ratio: 3.5, index: 1.4 });
  },
  Force: (S, t, L) => {
    subDrop(S, ch(S, 0, 0.15), { t0: t, from: 220, to: 40, dur: 0.45, level: L * 0.9 });
    burst(S, ch(S, 0, 0.3), { t0: t, release: 0.16, level: L * 0.45, filter: "lowpass", freq: 1500 });
    sweep(S, ch(S, 0, 0.4), { t0: t - 0.25, dur: 0.3, from: 400, to: 3000, level: L * 0.25, q: 1.5 });
  },
  Slashing: (S, t, L) => {
    sweep(S, ch(S, -0.5, 0.3), { t0: t - 0.12, dur: 0.18, from: 1500, to: 9000, level: L * 0.6, q: 2, attack: 0.15 });
    for (const m of [8, 10.1, 13.4]) bell(S, ch(S, 0.5, 0.5, 0.3), { freq: S.root * m, t0: t, level: L * 0.12, decay: 1.2, ratio: 2.4, index: 0.8 });
  },
  Bludgeoning: (S, t, L) => {
    subDrop(S, ch(S, 0, 0.1), { t0: t, from: 130, to: 45, dur: 0.35, level: L * 0.9 });
    burst(S, ch(S, 0, 0.2), { t0: t, release: 0.1, level: L * 0.5, filter: "lowpass", freq: 600 });
  },
  Piercing: (S, t, L) => {
    tone(S, ch(S, 0.3, 0.4, 0.4), { type: "sine", freq: 3200, to: 900, t0: t, attack: 0.002, release: 0.3, level: L * 0.3 });
    burst(S, ch(S, 0, 0.2), { t0: t, release: 0.05, level: L * 0.35, filter: "highpass", freq: 5000 });
  },
  Radiant: (S, t, L) => {
    choir(S, ch(S, 0, 0.7), { freqs: S.chord(2), t0: t, attack: 0.05, hold: 0.4, release: 1.8, level: L * 0.42, vowel: "ah" });
    S.chord(3).forEach((f, i) => bell(S, ch(S, i % 2 ? 0.5 : -0.5, 0.6, 0.3), { freq: f, t0: t + i * 0.03, level: L * 0.16, decay: 2.2 }));
  },
  // named effects
  Barrier: (S, t, L) => {
    choir(S, ch(S, 0, 0.7), { freqs: S.chord(1), t0: t, attack: 0.15, hold: 0.6, release: 1.6, level: L * 0.36, vowel: "oo" });
    S.chord(3).forEach((f, i) => bell(S, ch(S, i % 2 ? 0.7 : -0.7, 0.6, 0.35), { freq: f, t0: t + 0.05 + i * 0.06, level: L * 0.12, decay: 2.6, ratio: 2.0, index: 0.9 }));
  },
  Shield: (S, t, L) => {
    bell(S, ch(S, 0, 0.6, 0.3), { freq: S.note(0, 3), t0: t, level: L * 0.35, decay: 2.2, ratio: 2.0, index: 1.4 });
    S.chord(2).forEach((f, i) => bell(S, ch(S, i % 2 ? 0.5 : -0.5, 0.6), { freq: f, t0: t + 0.02, level: L * 0.12, decay: 1.8 }));
    burst(S, ch(S, 0, 0.3), { t0: t, release: 0.08, level: L * 0.3, filter: "highpass", freq: 4000 });
  },
  "Timed Reanimation": (S, t, L) => {
    burst(S, ch(S, 0, 0.5), { t0: t, attack: 0.3, hold: 0.3, release: 1.2, level: L * 0.25, filter: "lowpass", freq: 500 });
    choir(S, ch(S, 0, 0.6), { freqs: [S.root * 0.5, S.root * 0.5 * Math.pow(2, 3 / 12)], t0: t, attack: 0.4, hold: 0.4, release: 1.2, level: L * 0.3, vowel: "oo" });
  },
  "Sustained Reanimation": (S, t, L) => {
    choir(S, ch(S, 0, 0.6), { freqs: [S.root * 0.5, S.root * 0.5 * Math.pow(2, 6 / 12)], t0: t, attack: 0.5, hold: 0.7, release: 1.4, level: L * 0.32, vowel: "oo" });
    burst(S, ch(S, 0, 0.5), { t0: t, attack: 0.5, hold: 0.6, release: 1.4, level: L * 0.2, filter: "lowpass", freq: 450 });
  },
  "Control Dead": (S, t, L) => {
    choir(S, ch(S, -0.3, 0.6), { freqs: [S.root * 0.75, S.root * 0.75 * Math.pow(2, 1 / 12)], t0: t, attack: 0.15, hold: 0.5, release: 1.0, level: L * 0.3, vowel: "oo" });
    burst(S, ch(S, 0.3, 0.4), { t0: t, attack: 0.2, hold: 0.4, release: 0.8, level: L * 0.15, filter: "bandpass", freq: 300, q: 3 });
  },
  "Create Golem": (S, t, L) => {
    for (let i = 0; i < 4; i++) { subDrop(S, ch(S, 0, 0.2), { t0: t + i * 0.2, from: 110 - i * 10, to: 50, dur: 0.18, level: L * 0.55 }); burst(S, ch(S, (i % 2 ? 1 : -1) * 0.4, 0.3), { t0: t + i * 0.2, release: 0.05, level: L * 0.3, filter: "highpass", freq: 2200 }); }
    bell(S, ch(S, 0, 0.6), { freq: S.note(4, 2), t0: t + 0.85, level: L * 0.2, decay: 1.8 });
  },
  "Create Homunculus": (S, t, L) => {
    for (let i = 0; i < 6; i++) bell(S, ch(S, -0.6 + i * 0.24, 0.5, 0.3), { freq: S.note(i, 3), t0: t + i * 0.08, level: L * 0.16, decay: 0.6, ratio: 1.5, index: 2 });
  },
  "Create Sentry": (S, t, L) => {
    tone(S, ch(S, -0.3), { type: "square", freq: S.note(0, 2), t0: t, release: 0.12, level: L * 0.16 });
    tone(S, ch(S, 0.3), { type: "square", freq: S.note(4, 2), t0: t + 0.18, release: 0.12, level: L * 0.16 });
    bell(S, ch(S, 0, 0.6, 0.4), { freq: S.note(0, 4), t0: t + 0.4, level: L * 0.2, decay: 1.4 });
  },
  "Create Watcher": (S, t, L) => {
    tone(S, ch(S, 0, 0.7, 0.4), { type: "sine", freq: S.note(0, 3), to: S.note(4, 3), t0: t, attack: 0.3, hold: 0.2, release: 1.0, level: L * 0.18 });
    glitter(S, { t0: t + 0.2, count: 6, span: 0.6, level: L * 0.08, octave: 4, falling: false });
  },
  "Heighten Senses": (S, t, L) => {
    [0, 2, 4, 6].forEach((d, i) => bell(S, ch(S, i % 2 ? 0.6 : -0.6, 0.6, 0.4), { freq: S.note(d, 3), t0: t + i * 0.12, level: L * 0.14, decay: 1.4 }));
  },
  "Create Sound": (S, t, L) => { tone(S, ch(S, 0, 0.5, 0.5), { type: "triangle", freq: S.note(0, 2), to: S.note(4, 2), t0: t, attack: 0.05, hold: 0.2, release: 0.5, level: L * 0.25 }); },
  "Create Mirage": (S, t, L) => {
    S.chord(3).forEach((f, i) => tone(S, ch(S, i % 2 ? 0.8 : -0.8, 0.7, 0.5), { type: "sine", freq: f, t0: t + i * 0.04, attack: 0.3, hold: 0.4, release: 1.2, level: L * 0.12, detune: 9 * (i % 2 ? 1 : -1) }));
  },
  "Create Smell": (S, t, L) => { burst(S, ch(S, 0, 0.5), { t0: t, attack: 0.3, hold: 0.2, release: 0.9, level: L * 0.2, filter: "bandpass", freq: 700, q: 2 }); },
  "Create Touch": (S, t, L) => {
    bell(S, ch(S, 0, 0.5), { freq: S.note(0, 2), t0: t, level: L * 0.2, decay: 1.0, ratio: 1.0, index: 0.6 });
    burst(S, ch(S, 0, 0.3), { t0: t + 0.1, release: 0.15, level: L * 0.12, filter: "lowpass", freq: 900 });
  }
};

/** A stable voice for a custom effect, chosen by its key. */
function customPulse(key) {
  const h = hashOf(key);
  return (S, t, L) => {
    const degs = [[0, 2, 4], [0, 3, 5], [1, 4, 6], [0, 4, 7]][h % 4];
    degs.forEach((d, i) => bell(S, ch(S, (i - 1) * 0.6, 0.6, 0.3), { freq: S.note(d, 3), t0: t + i * 0.06, level: L * 0.18, decay: 1.2 + (h % 5) * 0.2, ratio: 2 + (h % 3) * 0.75 }));
    if (h % 3 === 0) sweep(S, ch(S, 0, 0.4), { t0: t - 0.15, dur: 0.3, from: 600, to: 4000, level: L * 0.25 });
  };
}

function pulseFor(entry) {
  if (entry.element) {
    const d = DAMAGE_TYPES[entry.element];
    if (d?.compound) return (S, t, L) => { (PULSES[d.compound[0]] ?? PULSES.Force)(S, t, L * 0.7); (PULSES[d.compound[1]] ?? PULSES.Radiant)(S, t + 0.04, L * 0.7); };
    return PULSES[entry.element] ?? PULSES.Force;
  }
  return PULSES[entry.effect] ?? customPulse(entry.effect);
}

/* -------------------------------------------------------------------
 * Form → the release transient
 * ----------------------------------------------------------------- */
const RELEASES = {
  "Self":              (S, t, L) => { choir(S, ch(S, 0, 0.6), { freqs: S.chord(1), t0: t - 0.1, attack: 0.1, hold: 0.2, release: 1.0, level: L * 0.3 }); },
  "Touch":             (S, t, L) => { bell(S, ch(S, 0, 0.5), { freq: S.note(0, 3), t0: t, level: L * 0.28, decay: 1.2 }); },
  "Projectile":        (S, t, L) => { sweep(S, ch(S, -0.6, 0.3, 0.3), { t0: t - 0.3, dur: 0.38, from: 500, to: 5000, level: L * 0.45, q: 1.4 }); },
  "Cone 30":           (S, t, L) => { burst(S, ch(S, 0, 0.5), { t0: t, attack: 0.02, hold: 0.15, release: 0.8, level: L * 0.5, filter: "lowpass", freq: 4000, to: 400 }); },
  "Blade":             (S, t, L) => { sweep(S, ch(S, 0.5, 0.3), { t0: t - 0.1, dur: 0.14, from: 2000, to: 9000, level: L * 0.5, attack: 0.12 }); [8, 10.1, 13.4].forEach((m, i) => bell(S, ch(S, 0.2 * i, 0.5, 0.3), { freq: S.root * m, t0: t, level: L * 0.12, decay: 1.4 - i * 0.2, ratio: 2.4, index: 0.8 })); },
  "Square":            (S, t, L) => { choir(S, ch(S, 0, 0.6), { freqs: S.chord(1).slice(0, 3), t0: t, attack: 0.05, hold: 0.3, release: 0.8, level: L * 0.25, vowel: "oo" }); },
  "Circle":            (S, t, L) => { S.chord(2).forEach((f, i) => bell(S, ch(S, Math.sin(i * 1.6) * 0.8, 0.6, 0.35), { freq: f, t0: t + i * 0.09, level: L * 0.16, decay: 2.0 })); },
  "Pyramid":           (S, t, L) => { [0, 2, 4, 7].forEach((d, i) => bell(S, ch(S, 0, 0.5, 0.3), { freq: S.note(d, 3), t0: t + i * 0.05, level: L * 0.16, decay: 1.4 })); },
  "Cylinder":          (S, t, L) => { tone(S, ch(S, 0, 0.5), { type: "sawtooth", freq: S.note(0, 1), t0: t, attack: 0.05, hold: 0.9, release: 0.6, level: L * 0.14 }); burst(S, ch(S, 0, 0.5), { t0: t, attack: 0.05, hold: 0.9, release: 0.6, level: L * 0.2, filter: "bandpass", freq: 1800, q: 2 }); },
  "Halo":              (S, t, L) => { for (let i = 0; i < 8; i++) bell(S, ch(S, Math.sin(i * 0.8) * 0.9, 0.55, 0.3), { freq: S.note((i % 4) * 2, 3), t0: t + i * 0.1, level: L * 0.13, decay: 1.0 }); },
  "Sphere":            (S, t, L) => { subDrop(S, ch(S, 0, 0.3), { t0: t, from: 160, to: 30, dur: 1.4, level: L * 0.7 }); burst(S, ch(S, 0, 0.7), { t0: t, attack: 0.04, release: 1.6, level: L * 0.4, filter: "lowpass", freq: 5000, to: 200 }); },
  "Construct / Field": (S, t, L) => { for (let i = 0; i < 5; i++) bell(S, ch(S, -0.8 + i * 0.4, 0.4), { freq: S.note(i, 2), t0: t + i * 0.1, level: L * 0.16, decay: 0.5, ratio: 1.5, index: 2.2 }); choir(S, ch(S, 0, 0.7), { freqs: S.chord(1), t0: t + 0.5, attack: 0.2, hold: 0.4, release: 1.2, level: L * 0.25 }); }
};

/* -------------------------------------------------------------------
 * The whole sound
 * ----------------------------------------------------------------- */

/**
 * Write the spell into `ctx`, starting at `t0`. Returns the total length
 * in seconds.
 * @param {AudioContext|OfflineAudioContext} ctx
 * @param {object} build
 * @param {object} [opts]
 * @param {number} [opts.t0]             start time in ctx seconds
 * @param {number} [opts.volume=1]       master level
 * @param {string} [opts.outcome]        "critical" | "success" | "failure" | "fumble"
 * @param {boolean} [opts.overheat]      the cast would push Heat past capacity
 * @param {AudioNode} [opts.destination] defaults to ctx.destination
 */
export function schedule(ctx, build, { t0 = null, volume = 1, outcome = "success", overheat = false, destination = null } = {}) {
  const b = normalizeBuild(build);
  const ev = evaluateSpell(b);
  const tier = ev.tier.tier;
  const root = TIER_ROOT[tier] ?? 146.8;
  const L = TIER_GAIN[tier] ?? 0.8;
  const start = t0 ?? ctx.currentTime + 0.05;
  const has = (n) => b.utilities.find(u => u.node === n) ?? null;
  const dark = b.effects.some(x => DARK.has(x.element) || /Reanimation|Control Dead/.test(x.effect));
  const scale = dark ? DARK_MODE : (MODES[b.intent] ?? MODES.Defensive);

  /* ---- the mixing desk ------------------------------------------
     voices → bus → air (high shelf) → glue compressor → limiter → out
     sends:  a long, bright hall, and a stereo ping-pong echo */
  const outNode = destination ?? ctx.destination;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
  limiter.connect(outNode);
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -18; glue.knee.value = 10; glue.ratio.value = 3.5; glue.attack.value = 0.01; glue.release.value = 0.25;
  glue.connect(limiter);
  const air = ctx.createBiquadFilter(); air.type = "highshelf"; air.frequency.value = 7000; air.gain.value = 4;
  const master = ctx.createGain(); master.gain.value = clamp(volume, 0, 1) * 0.55;
  master.connect(air); air.connect(glue);

  let spaceLen = SIZE_SPACE[b.size] ?? 2.2;
  if (has("Field")) spaceLen *= 1.5;
  const verb = ctx.createConvolver(); verb.buffer = hall(ctx, spaceLen);
  const verbIn = ctx.createGain(); verbIn.gain.value = 1;
  const verbHp = ctx.createBiquadFilter(); verbHp.type = "highpass"; verbHp.frequency.value = 220;   // keep the low end dry
  const verbOut = ctx.createGain(); verbOut.gain.value = 0.55;
  verbIn.connect(verbHp); verbHp.connect(verb); verb.connect(verbOut); verbOut.connect(master);

  const echoTime = clamp(60 / (110 + tier * 8) / 2, 0.16, 0.3);
  const echoIn = ctx.createGain(); echoIn.gain.value = 1;
  const echoHp = ctx.createBiquadFilter(); echoHp.type = "highpass"; echoHp.frequency.value = 900;
  const dL = ctx.createDelay(1), dR = ctx.createDelay(1); dL.delayTime.value = echoTime; dR.delayTime.value = echoTime;
  const fbL = ctx.createGain(), fbR = ctx.createGain(); fbL.gain.value = 0.42; fbR.gain.value = 0.42;
  const pL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (pL.pan) pL.pan.value = -0.85;
  const pR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (pR.pan) pR.pan.value = 0.85;
  const echoOut = ctx.createGain(); echoOut.gain.value = 0.5;
  echoIn.connect(echoHp); echoHp.connect(dL); dL.connect(fbL); fbL.connect(dR); dR.connect(fbR); fbR.connect(dL);
  dL.connect(pL); dR.connect(pR); pL.connect(echoOut); pR.connect(echoOut); echoOut.connect(master); echoOut.connect(verbIn);

  // everything plays into `bus`; Amplifier drives it, Orbit turns it
  const bus = ctx.createGain(); bus.gain.value = 1;
  let busOut = bus;
  const amp = has("Amplifier");
  if (amp) { const ws = shaper(ctx, 0.18 * amp.level); bus.connect(ws); busOut = ws; bus.gain.value = 1 + 0.1 * amp.level; }
  if (has("Orbit") && ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner(); const lfo = ctx.createOscillator(); lfo.frequency.value = 0.9;
    const lg = ctx.createGain(); lg.gain.value = 0.8; lfo.connect(lg); lg.connect(pan.pan);
    busOut.connect(pan); busOut = pan; lfo.start(start); lfo.stop(start + 12);
  }
  busOut.connect(master);

  // The scene every voice works in.
  const S = {
    ctx, root, scale,
    noise: noiseBuffer(ctx),
    rand: seeded(hashOf(buildShapeKey(b) + b.name)),
    /** A note of the spell's mode: degree (any integer), octaves above the root. */
    note(deg, octave = 0) {
      const n = scale.length, d = ((deg % n) + n) % n, o = octave + Math.floor(deg / n);
      return root * Math.pow(2, (scale[d] + 12 * o) / 12);
    },
    /** The spell's chord (1-3-5-7-9) some octaves up. */
    chord(octave = 1) { return [0, 2, 4, 6, 8].map(d => this.note(d, octave)); },
    /** A voice's channel: panned, with sends to the hall and the echo. */
    ch(pan = 0, verbSend = 0.35, echoSend = 0) {
      const g = ctx.createGain(); g.gain.value = 1;
      let node = g;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); node = p; }
      node.connect(bus);
      if (verbSend) { const s = ctx.createGain(); s.gain.value = verbSend; node.connect(s); s.connect(verbIn); }
      if (echoSend) { const s = ctx.createGain(); s.gain.value = echoSend; node.connect(s); s.connect(echoIn); }
      return g;
    }
  };

  /* ---- 1. the magic circle: the charge ---- */
  const conv = CONVERSION_CHARGE[b.conversion] ?? CONVERSION_CHARGE.Base;
  const delayNode = has("Delay");
  const charge = conv.time + clamp(ev.complexity * 0.05, 0, 0.8) + (delayNode ? clamp(delayNode.count * 0.2, 0, 1.0) : 0);
  const tR = start + charge;
  {
    // the deep hum, intensifying ("low whirring, deep hum intensifying with charge")
    const hum = S.ch(0, 0.15);
    const humG = ctx.createGain(); humG.connect(hum);
    humG.gain.setValueAtTime(0.0001, start);
    humG.gain.exponentialRampToValueAtTime(L * 0.3, tR - 0.02);
    humG.gain.exponentialRampToValueAtTime(0.0001, tR + 0.15);
    let humDest = humG;
    if (conv.drive) { const ws = shaper(ctx, conv.drive); ws.connect(humG); humDest = ws; }
    for (const [ratio, lvl] of [[0.5, 0.6], [1, 0.4], [1.5, 0.15]]) {
      const o = ctx.createOscillator(); o.type = ratio === 1 ? "triangle" : "sine";
      o.frequency.setValueAtTime(root * ratio * 0.9, start);
      o.frequency.exponentialRampToValueAtTime(root * ratio, tR);
      const g = ctx.createGain(); g.gain.value = lvl;
      if (conv.chant) {   // Ritual: the chant pulses the hum
        const lfo = ctx.createOscillator(); lfo.frequency.value = conv.chant;
        const lg = ctx.createGain(); lg.gain.value = lvl * 0.5; lfo.connect(lg); lg.connect(g.gain);
        lfo.start(start); lfo.stop(tR + 0.2);
      }
      o.connect(g); g.connect(humDest); o.start(start); o.stop(tR + 0.2);
    }

    // the choir swelling on the spell's chord
    choir(S, S.ch(0, 0.6), { freqs: S.chord(1).slice(0, 4), t0: start, attack: charge * 0.9, hold: 0.05, release: 0.6, level: L * (outcome === "failure" ? 0.22 : 0.3), vowel: conv.chant ? "oo" : "ah" });

    // power gathering: a rising sweep, and a pitch riser for big or driven workings
    sweep(S, S.ch(0, 0.4), { t0: start, dur: charge, from: 250, to: conv.drive ? 9000 : 6500, level: L * (conv.drive ? 0.4 : 0.28), q: 2.2 });
    if (tier >= 3 || conv.drive) tone(S, S.ch(0, 0.4), { type: "sawtooth", freq: root, to: root * 4, t0: start, attack: charge, release: 0.05, level: L * 0.05 });

    // the circle drawing itself: bells climbing the mode, faster as it fills
    const steps = Math.round(clamp(6 + tier * 2 + (conv.chant ? 4 : 0), 6, 18));
    for (let i = 0; i < steps; i++) {
      const k = i / steps;
      const t = start + charge * (1 - Math.pow(1 - k, 1.7)) * 0.95;
      bell(S, S.ch(i % 2 ? 0.55 : -0.55, 0.45, 0.35), { freq: S.note(i, 2), t0: t, level: L * (0.07 + 0.08 * k), decay: 0.7 + k * 0.6, ratio: 3.5, index: 1.3 });
    }

    // Heat: a hiss under it all
    const heatLevel = clamp(ev.heat / 140, 0.015, 0.25);
    burst(S, S.ch(0, 0.1), { t0: start, attack: charge, release: 0.2, level: heatLevel * 0.45, filter: "highpass", freq: 6000 });
  }

  /* ---- 2. the activation ---- */
  let end = tR + 0.5;
  if (outcome === "failure") {
    // the circle breaks: everything slides down and fizzles
    tone(S, S.ch(0, 0.4), { type: "sawtooth", freq: root * 2, to: root * 0.5, t0: tR, attack: 0.01, release: 0.6, level: L * 0.12 });
    burst(S, S.ch(0, 0.5), { t0: tR, attack: 0.02, release: 1.1, level: L * 0.3, filter: "highpass", freq: 3000, to: 900 });
    bell(S, S.ch(-0.4, 0.6, 0.3), { freq: S.note(4, 2), t0: tR + 0.05, level: L * 0.14, decay: 1.2 });
    bell(S, S.ch(0.4, 0.6, 0.3), { freq: S.note(3, 2) * Math.pow(2, -1 / 12), t0: tR + 0.25, level: L * 0.12, decay: 1.4 });
    end = tR + 1.8;
  } else if (outcome === "fumble") {
    // Flux: the conversion tears loose
    const tear = S.ch(0, 0.5, 0.3);
    const ws = shaper(ctx, 1.0); ws.connect(tear);
    tone(S, ws, { type: "sawtooth", freq: root, to: root * 0.25, t0: tR, attack: 0.005, release: 1.2, level: L * 0.45 });
    tone(S, ws, { type: "square", freq: root * Math.pow(2, 6 / 12), to: root * 3, t0: tR, attack: 0.01, release: 0.9, level: L * 0.25 });
    subDrop(S, S.ch(0, 0.2), { t0: tR, from: 90, to: 25, dur: 1.2, level: L * 0.8 });
    burst(S, S.ch(0, 0.5), { t0: tR, attack: 0.005, release: 1.5, level: L * 0.55, filter: "bandpass", freq: 1500, to: 150, q: 0.8 });
    for (let i = 0; i < 14; i++) zap(S, S.ch(S.rand() * 2 - 1, 0.4), { t0: tR + 0.1 + i * 0.08, from: 1500 + S.rand() * 4000, to: 200, dur: 0.06, level: L * 0.16 });
    end = tR + 2.2;
  } else {
    const crit = outcome === "critical" ? 1.2 : 1;
    // the strike: a sub drop under a bright "shing"
    subDrop(S, S.ch(0, 0.15), { t0: tR, from: 150 - tier * 8, to: 34, dur: 0.5 + tier * 0.12, level: L * 0.75 * crit });
    burst(S, S.ch(0, 0.3), { t0: tR, attack: 0.001, release: 0.35, level: L * 0.4 * crit, filter: "highpass", freq: 3500 });
    burst(S, S.ch(0, 0.3), { t0: tR, attack: 0.002, release: 0.12, level: L * 0.35, filter: "lowpass", freq: 1200 });
    // the chord rings out on bells
    S.chord(2).forEach((f, i) => bell(S, S.ch((i - 2) * 0.35, 0.6, 0.3), { freq: f, t0: tR + i * 0.012, level: L * 0.13 * crit, decay: 2.4, ratio: 3.5, index: 1.5 }));
    (RELEASES[b.form] ?? RELEASES.Projectile)(S, tR, L * crit);

    // one voice per effect; Split repeats them, Echo echoes them
    const split = has("Split"), echo = has("Echo");
    const repeats = 1 + (split ? clamp(split.count, 1, 5) : 0) + (echo ? 2 : 0);
    const gap = echo && !split ? 0.34 : 0.15;
    const per = L * crit * (b.effects.length > 3 ? 0.7 : 1);
    b.effects.forEach((fx, i) => {
      const pulse = pulseFor(fx);
      for (let k = 0; k < repeats; k++) {
        const t = tR + 0.06 + i * 0.08 + k * gap * (1 + i * 0.1);
        pulse(S, t, per * Math.pow(0.72, k));
        end = Math.max(end, t + 1.8);
      }
    });

    // Collapse: everything ends violently
    if (has("Collapse")) {
      const tC = end - 0.8;
      subDrop(S, S.ch(0, 0.3), { t0: tC, from: root, to: 28, dur: 0.9, level: L * 0.8 });
      burst(S, S.ch(0, 0.5), { t0: tC, release: 0.8, level: L * 0.5, filter: "lowpass", freq: 3000, to: 100 });
      end = tC + 1.2;
    }

    /* ---- 3. the aftermath: glitter falling, then the hall ---- */
    glitter(S, { t0: tR + 0.25, count: Math.round(8 + tier * 2) + (outcome === "critical" ? 8 : 0), span: 1.0 + tier * 0.15, level: L * 0.1 * crit, octave: 3 });
    if (outcome === "critical") {
      glitter(S, { t0: tR + 0.4, count: 10, span: 1.4, level: L * 0.08, octave: 4 });
      choir(S, S.ch(0, 0.8), { freqs: S.chord(2), t0: tR + 0.05, attack: 0.2, hold: 0.5, release: 1.8, level: L * 0.25 });
    }
    burst(S, S.ch(0, 0.6), { t0: tR + 0.1, attack: 0.05, release: spaceLen * 0.6, level: L * 0.05, filter: "highpass", freq: 9000 });   // the air shimmering
    if (overheat) { // crackling from the caster's own body
      for (let i = 0; i < 10; i++) burst(S, S.ch(S.rand() * 1.2 - 0.6, 0.2), { t0: tR + 0.2 + i * 0.13, release: 0.03, level: L * 0.25, filter: "highpass", freq: 3500 + S.rand() * 2000 });
    }
    end = Math.max(end, tR + 1.4 + spaceLen * 0.5);
  }

  return end - start + spaceLen * 0.6;
}

/**
 * Play the spell now. Returns the length in seconds, or 0 if audio is
 * unavailable. `ctx` should be an unlocked AudioContext (Foundry's
 * game.audio.context, once the user has clicked something).
 */
export async function playSpell(build, { ctx = null, volume = 1, outcome = "success", overheat = false } = {}) {
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  const context = ctx ?? (AC ? new AC() : null);
  if (!context) return 0;
  if (context.state === "suspended") {
    // resume() never settles while the browser is still waiting for a user
    // gesture, so don't hang on it: give it a moment, then carry on or bow out.
    try { await Promise.race([context.resume(), new Promise(r => setTimeout(r, 400))]); } catch { /* still locked */ }
    if (context.state === "suspended") return 0;
  }
  try { return schedule(context, build, { volume, outcome, overheat }); }
  catch (err) { console.warn("Dreoarcana | Arcana: sound failed:", err); return 0; }
}

/** Render the spell to a 16-bit stereo WAV Blob (a successful cast). */
export async function renderSpellWav(build, { volume = 1, outcome = "success", sampleRate = 44100 } = {}) {
  const OAC = globalThis.OfflineAudioContext ?? globalThis.webkitOfflineAudioContext;
  if (!OAC) throw new Error("Offline audio rendering is not available in this browser.");
  // First pass: a scratch context just to learn the length.
  const probe = new OAC(2, sampleRate, sampleRate);
  const seconds = schedule(probe, build, { t0: 0, volume, outcome });
  const ctx = new OAC(2, Math.ceil(sampleRate * (seconds + 0.2)), sampleRate);
  schedule(ctx, build, { t0: 0, volume, outcome });
  const buffer = await ctx.startRendering();
  return new Blob([encodeWav(buffer)], { type: "audio/wav" });
}

function encodeWav(buffer) {
  const ch = buffer.numberOfChannels, len = buffer.length, rate = buffer.sampleRate;
  const bytes = 44 + len * ch * 2;
  const out = new ArrayBuffer(bytes), v = new DataView(out);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, bytes - 8, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const s = clamp(chans[c][i], -1, 1);
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
  }
  return out;
}

/** A short line describing the sound, for tooltips and the sheet. */
export function describeSound(build) {
  const b = normalizeBuild(build);
  const ev = evaluateSpell(b);
  const mode = { Defensive: "Lydian", Support: "major", Utility: "dorian", Offensive: "phrygian", Creation: "whole-tone" }[b.intent] ?? "Lydian";
  const conv = { Base: "a choir swelling", Ritual: "a slow chant", Overdrive: "a hard, driven snap" }[b.conversion];
  const fx = b.effects.map(x => x.element ?? (EFFECTS[x.effect]?.label ?? x.effect)).join(", ") || "nothing";
  return `${ev.tier.name}: ${conv} in ${mode} as the circle draws itself, then a ${b.form} release with ${fx}, glitter falling${b.size >= 3 ? " through a wide hall" : ""}.`;
}
