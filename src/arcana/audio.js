/* ===================================================================
 * Dreoarcana Arcana — the sound of a spell
 *
 * "Pre-cast: low whirring, deep hum intensifying with charge.
 *  Cast: resonant pulse tied to element used.
 *  Post-cast: momentary stillness or ringing."   — Melfyrium, Sensory Effects
 *
 * Every spell's sound is synthesised from its build, so it needs no
 * sample files and changes when the build does:
 *
 *   Tier        → how deep the hum sits and how loud the working is
 *   Intent      → the hum's timbre (bite, stable fifth, warm third, …)
 *   Conversion  → the charge: smooth, slow and chanting, or fast and driven
 *   Form        → the release transient (whoosh, ring, bloom, beam…)
 *   Size        → how long the space rings afterwards
 *   Effects     → one resonant pulse each, with its element's character
 *   Flow nodes  → repeats (Split), echoes (Echo), delay, saturation (Amplifier),
 *                 rotation (Orbit), a longer space (Field), a final crash (Collapse)
 *   Outcome     → success releases; failure fizzles; fumble tears
 *   Heat        → a rising hiss, crackling when it would overheat
 *
 * Web Audio only — no Foundry globals. `schedule()` writes the whole
 * sound into any AudioContext, so the same code plays live and renders
 * to a file through an OfflineAudioContext.
 * =================================================================== */

import { normalizeBuild, evaluateSpell, EFFECTS, DAMAGE_TYPES, hashString as hashOf } from "./rules.js";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Hum root by tier — the bigger the working, the deeper it sits. */
const TIER_ROOT = { 1: 196, 2: 147, 3: 110, 4: 82.4, 5: 55 };
const TIER_GAIN = { 1: 0.55, 2: 0.7, 3: 0.85, 4: 1.0, 5: 1.15 };

/* Intent → partials of the hum as [ratio, level, wave]. */
const INTENT_VOICES = {
  Offensive: [[1, 1, "sawtooth"], [1.5, 0.35, "square"], [2.01, 0.2, "sawtooth"]],
  Defensive: [[1, 1, "sine"], [1.5, 0.6, "sine"], [2, 0.35, "triangle"]],
  Utility:   [[1, 1, "triangle"], [1.005, 0.6, "triangle"], [2.5, 0.15, "sine"]],
  Support:   [[1, 1, "sine"], [1.25, 0.55, "sine"], [2, 0.3, "sine"], [3, 0.12, "sine"]],
  Creation:  [[1, 1, "sawtooth"], [2, 0.5, "triangle"], [3, 0.3, "sine"], [4, 0.2, "sine"], [5, 0.12, "sine"]]
};

/* Conversion → charge time in seconds and its manner. */
const CONVERSION_CHARGE = {
  Base:      { time: 0.9,  tremolo: 0,   drive: 0 },
  Ritual:    { time: 1.7,  tremolo: 3.5, drive: 0 },
  Overdrive: { time: 0.35, tremolo: 0,   drive: 0.8 }
};

/* Size → reverb length. */
const SIZE_SPACE = { 1: 0.5, 2: 0.9, 3: 1.4, 4: 2.2, 5: 3.2 };

/* -------------------------------------------------------------------
 * Small synthesis helpers
 * ----------------------------------------------------------------- */

function noiseBuffer(ctx, seconds = 2) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function impulse(ctx, seconds, decay = 3) {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function shaper(ctx, amount) {
  const n = 1024, curve = new Float32Array(n), k = amount * 60;
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)); }
  const ws = ctx.createWaveShaper(); ws.curve = curve; ws.oversample = "2x";
  return ws;
}

/** An envelope on a gain node: attack, hold, release. */
function env(gain, t0, peak, attack, hold, release, from = 0.0001) {
  const g = gain.gain;
  g.setValueAtTime(from, t0);
  g.linearRampToValueAtTime(peak, t0 + attack);
  g.setValueAtTime(peak, t0 + attack + hold);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

/** A tone: oscillator → gain → dest, with optional pitch glide. */
function tone(ctx, dest, { type = "sine", freq, to = null, t0, attack = 0.01, hold = 0, release = 0.3, level = 0.3, detune = 0 }) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + attack + hold + release);
  const g = ctx.createGain(); env(g, t0, level, attack, hold, release);
  o.connect(g); g.connect(dest);
  o.start(t0); o.stop(t0 + attack + hold + release + 0.05);
}

/** A burst of filtered noise. */
function burst(ctx, dest, noise, { t0, attack = 0.005, hold = 0, release = 0.3, level = 0.3, filter = "bandpass", freq = 1000, to = null, q = 1 }) {
  const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + attack + hold + release);
  const g = ctx.createGain(); env(g, t0, level, attack, hold, release);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t0); src.stop(t0 + attack + hold + release + 0.05);
}

/* -------------------------------------------------------------------
 * Element and effect pulses — "a resonant pulse tied to the element"
 * Each takes (ctx, dest, noise, t, root, level).
 * ----------------------------------------------------------------- */
const PULSES = {
  Fire:        (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, release: 0.9, level: L * 0.5, filter: "bandpass", freq: 900, to: 300, q: 0.7 });
                                       for (let i = 0; i < 7; i++) burst(c, d, n, { t0: t + 0.05 + i * 0.11 + (hashOf(i) % 40) / 1000, release: 0.05, level: L * 0.35, filter: "highpass", freq: 2500, q: 2 });
                                       tone(c, d, { type: "sawtooth", freq: r * 0.5, to: r * 0.3, t0: t, release: 0.8, level: L * 0.18 }); },
  Lightning:   (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.002, release: 0.18, level: L * 0.9, filter: "highpass", freq: 3000 });
                                       burst(c, d, n, { t0: t + 0.02, release: 0.5, level: L * 0.4, filter: "lowpass", freq: 400 });
                                       tone(c, d, { type: "square", freq: 120, t0: t, release: 0.25, level: L * 0.2 }); },
  Frost:       (c, d, n, t, r, L) => { [4, 5, 6, 7.5].forEach((m, i) => tone(c, d, { type: "sine", freq: r * m * 1.01, t0: t + i * 0.04, attack: 0.02, release: 1.6, level: L * 0.16 }));
                                       burst(c, d, n, { t0: t, release: 0.6, level: L * 0.12, filter: "highpass", freq: 6000 }); },
  Wind:        (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.15, hold: 0.2, release: 0.8, level: L * 0.5, filter: "bandpass", freq: 400, to: 1400, q: 1.2 }); },
  Thunder:     (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: 60, to: 35, t0: t, attack: 0.01, release: 1.4, level: L * 0.9 });
                                       burst(c, d, n, { t0: t + 0.03, release: 1.3, level: L * 0.5, filter: "lowpass", freq: 250, to: 90 }); },
  Acid:        (c, d, n, t, r, L) => { for (let i = 0; i < 9; i++) tone(c, d, { type: "sine", freq: 500 + (hashOf(i * 7) % 900), to: 250, t0: t + i * 0.07, release: 0.12, level: L * 0.22 });
                                       burst(c, d, n, { t0: t, release: 0.7, level: L * 0.15, filter: "bandpass", freq: 1800, q: 3 }); },
  Necrotic:    (c, d, n, t, r, L) => { tone(c, d, { type: "sawtooth", freq: r * 0.5, t0: t, attack: 0.05, release: 1.3, level: L * 0.25, detune: -30 });
                                       tone(c, d, { type: "sawtooth", freq: r * 0.5, t0: t, attack: 0.05, release: 1.3, level: L * 0.25, detune: 30 });
                                       burst(c, d, n, { t0: t, attack: 0.1, release: 1.0, level: L * 0.2, filter: "lowpass", freq: 600 }); },
  Poison:      (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.05, release: 1.1, level: L * 0.35, filter: "bandpass", freq: 2200, to: 900, q: 4 });
                                       tone(c, d, { type: "triangle", freq: r * 1.5, to: r * 1.2, t0: t, release: 0.9, level: L * 0.15 }); },
  Prismatic:   (c, d, n, t, r, L) => { [1, 1.25, 1.5, 2, 2.5, 3].forEach((m, i) => tone(c, d, { type: "sine", freq: r * 2 * m, t0: t + i * 0.05, attack: 0.02, release: 0.9, level: L * 0.16 })); },
  Force:       (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: 180, to: 40, t0: t, attack: 0.005, release: 0.35, level: L * 0.9 });
                                       burst(c, d, n, { t0: t, release: 0.12, level: L * 0.3, filter: "lowpass", freq: 900 }); },
  Slashing:    (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.01, release: 0.22, level: L * 0.6, filter: "bandpass", freq: 2500, to: 6000, q: 1.5 }); },
  Bludgeoning: (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: 120, to: 50, t0: t, release: 0.3, level: L * 0.8 }); burst(c, d, n, { t0: t, release: 0.08, level: L * 0.4, filter: "lowpass", freq: 500 }); },
  Piercing:    (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: 2400, to: 1800, t0: t, attack: 0.003, release: 0.4, level: L * 0.35 }); burst(c, d, n, { t0: t, release: 0.06, level: L * 0.3, filter: "highpass", freq: 5000 }); },
  Radiant:     (c, d, n, t, r, L) => { [2, 3, 4.2, 5.4].forEach((m, i) => tone(c, d, { type: "sine", freq: r * m, t0: t + i * 0.02, attack: 0.01, release: 1.8 - i * 0.2, level: L * (0.3 - i * 0.05) })); },
  // named effects
  Barrier:               (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r * 2, t0: t, attack: 0.08, hold: 0.3, release: 1.2, level: L * 0.35 }); tone(c, d, { type: "sine", freq: r * 3, t0: t + 0.05, attack: 0.08, hold: 0.3, release: 1.0, level: L * 0.2 }); },
  Shield:                (c, d, n, t, r, L) => { tone(c, d, { type: "triangle", freq: r * 2, t0: t, attack: 0.005, release: 0.9, level: L * 0.4 }); burst(c, d, n, { t0: t, release: 0.05, level: L * 0.25, filter: "highpass", freq: 3000 }); },
  "Timed Reanimation":     (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.2, hold: 0.3, release: 1.2, level: L * 0.25, filter: "lowpass", freq: 500 }); tone(c, d, { type: "sine", freq: r * 0.5, to: r, t0: t, attack: 0.3, release: 1.2, level: L * 0.3 }); },
  "Sustained Reanimation": (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.3, hold: 0.6, release: 1.4, level: L * 0.25, filter: "lowpass", freq: 450 }); tone(c, d, { type: "sawtooth", freq: r * 0.5, t0: t, attack: 0.4, hold: 0.5, release: 1.2, level: L * 0.18 }); },
  "Control Dead":          (c, d, n, t, r, L) => { tone(c, d, { type: "sawtooth", freq: r * 0.75, t0: t, attack: 0.1, hold: 0.4, release: 1.0, level: L * 0.2, detune: -15 }); burst(c, d, n, { t0: t, attack: 0.2, hold: 0.4, release: 0.8, level: L * 0.15, filter: "bandpass", freq: 300, q: 3 }); },
  "Create Golem":          (c, d, n, t, r, L) => { for (let i = 0; i < 4; i++) { tone(c, d, { type: "square", freq: 90 - i * 8, t0: t + i * 0.18, release: 0.12, level: L * 0.3 }); burst(c, d, n, { t0: t + i * 0.18, release: 0.04, level: L * 0.3, filter: "highpass", freq: 2000 }); } },
  "Create Homunculus":     (c, d, n, t, r, L) => { for (let i = 0; i < 5; i++) tone(c, d, { type: "square", freq: 300 + i * 90, t0: t + i * 0.09, release: 0.08, level: L * 0.18 }); },
  "Create Sentry":         (c, d, n, t, r, L) => { tone(c, d, { type: "square", freq: 220, t0: t, release: 0.15, level: L * 0.25 }); tone(c, d, { type: "square", freq: 330, t0: t + 0.2, release: 0.15, level: L * 0.25 }); tone(c, d, { type: "sine", freq: 880, t0: t + 0.45, attack: 0.02, release: 0.6, level: L * 0.2 }); },
  "Create Watcher":        (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r * 4, to: r * 6, t0: t, attack: 0.3, hold: 0.2, release: 0.8, level: L * 0.22 }); },
  "Heighten Senses":       (c, d, n, t, r, L) => { [3, 4, 5, 6].forEach((m, i) => tone(c, d, { type: "sine", freq: r * m, t0: t + i * 0.12, attack: 0.15, release: 0.5, level: L * 0.16 })); },
  "Create Sound":          (c, d, n, t, r, L) => { tone(c, d, { type: "triangle", freq: 440, to: 660, t0: t, attack: 0.05, hold: 0.2, release: 0.4, level: L * 0.3 }); },
  "Create Mirage":         (c, d, n, t, r, L) => { [1, 1.26, 1.5].forEach((m, i) => tone(c, d, { type: "sine", freq: r * 3 * m, t0: t + i * 0.03, attack: 0.25, hold: 0.3, release: 0.9, level: L * 0.16, detune: 6 })); },
  "Create Smell":          (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.3, hold: 0.2, release: 0.9, level: L * 0.2, filter: "bandpass", freq: 700, q: 2 }); },
  "Create Touch":          (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r * 2, t0: t, attack: 0.2, release: 0.5, level: L * 0.25 }); burst(c, d, n, { t0: t + 0.1, release: 0.15, level: L * 0.12, filter: "lowpass", freq: 900 }); }
};

/** A stable pulse for a custom effect, chosen by its key. */
function customPulse(key) {
  const h = hashOf(key);
  const wave = ["sine", "triangle", "square", "sawtooth"][h % 4];
  const mults = [[2, 3], [1.5, 2.5], [2, 2.5, 3], [3, 4.5]][(h >> 2) % 4];
  return (c, d, n, t, r, L) => {
    mults.forEach((m, i) => tone(c, d, { type: wave, freq: r * m, t0: t + i * 0.05, attack: 0.02, release: 0.6 + (h % 5) * 0.15, level: L * 0.22 }));
    if (h % 3 === 0) burst(c, d, n, { t0: t, release: 0.3, level: L * 0.2, filter: "bandpass", freq: 800 + (h % 1500), q: 2 });
  };
}

function pulseFor(entry) {
  if (entry.element) {
    const d = DAMAGE_TYPES[entry.element];
    if (d?.compound) return (c, dst, n, t, r, L) => { (PULSES[d.compound[0]] ?? PULSES.Force)(c, dst, n, t, r, L * 0.7); (PULSES[d.compound[1]] ?? PULSES.Radiant)(c, dst, n, t + 0.04, r, L * 0.7); };
    return PULSES[entry.element] ?? PULSES.Force;
  }
  return PULSES[entry.effect] ?? customPulse(entry.effect);
}

/* -------------------------------------------------------------------
 * Form → the release transient
 * ----------------------------------------------------------------- */
const RELEASES = {
  "Self":              (c, d, n, t, r, L) => tone(c, d, { type: "sine", freq: r * 2, to: r * 3, t0: t, attack: 0.2, release: 0.6, level: L * 0.25 }),
  "Touch":             (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r * 2, t0: t, attack: 0.01, release: 0.25, level: L * 0.3 }); },
  "Projectile":        (c, d, n, t, r, L) => { burst(c, d, n, { t0: t - 0.15, attack: 0.05, release: 0.35, level: L * 0.35, filter: "bandpass", freq: 600, to: 2400, q: 1.5 }); },
  "Cone 30":           (c, d, n, t, r, L) => { burst(c, d, n, { t0: t, attack: 0.02, hold: 0.1, release: 0.6, level: L * 0.45, filter: "lowpass", freq: 2500, to: 400 }); },
  "Blade":             (c, d, n, t, r, L) => { [7, 9.1, 12.3].forEach((m, i) => tone(c, d, { type: "sine", freq: r * m, t0: t, attack: 0.002, release: 0.9 - i * 0.2, level: L * 0.2 })); burst(c, d, n, { t0: t - 0.08, release: 0.15, level: L * 0.3, filter: "bandpass", freq: 3000, to: 7000 }); },
  "Square":            (c, d, n, t, r, L) => { tone(c, d, { type: "square", freq: r, t0: t, attack: 0.02, hold: 0.25, release: 0.5, level: L * 0.15 }); tone(c, d, { type: "sine", freq: r * 2, t0: t, attack: 0.02, hold: 0.25, release: 0.7, level: L * 0.25 }); },
  "Circle":            (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r * 2, t0: t, attack: 0.05, hold: 0.4, release: 1.0, level: L * 0.3 }); tone(c, d, { type: "sine", freq: r * 3, t0: t + 0.1, attack: 0.05, hold: 0.3, release: 1.0, level: L * 0.15 }); },
  "Pyramid":           (c, d, n, t, r, L) => { tone(c, d, { type: "triangle", freq: r * 2, to: r * 4, t0: t, attack: 0.01, release: 0.5, level: L * 0.3 }); },
  "Cylinder":          (c, d, n, t, r, L) => { tone(c, d, { type: "sawtooth", freq: r * 2, t0: t, attack: 0.05, hold: 0.8, release: 0.5, level: L * 0.18 }); burst(c, d, n, { t0: t, attack: 0.05, hold: 0.8, release: 0.5, level: L * 0.2, filter: "bandpass", freq: 1500, q: 2 }); },
  "Halo":              (c, d, n, t, r, L) => { for (let i = 0; i < 6; i++) tone(c, d, { type: "sine", freq: r * (3 + (i % 2)), t0: t + i * 0.12, attack: 0.02, release: 0.4, level: L * 0.2 }); },
  "Sphere":            (c, d, n, t, r, L) => { tone(c, d, { type: "sine", freq: r, to: r * 0.5, t0: t, attack: 0.05, release: 1.6, level: L * 0.5 }); burst(c, d, n, { t0: t, attack: 0.05, release: 1.2, level: L * 0.35, filter: "lowpass", freq: 3000, to: 200 }); },
  "Construct / Field": (c, d, n, t, r, L) => { for (let i = 0; i < 5; i++) { tone(c, d, { type: "square", freq: 110 + i * 30, t0: t + i * 0.1, release: 0.1, level: L * 0.18 }); } tone(c, d, { type: "sine", freq: r * 2, t0: t + 0.5, attack: 0.1, hold: 0.5, release: 1.0, level: L * 0.25 }); }
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
  const root = TIER_ROOT[tier] ?? 110;
  const L = TIER_GAIN[tier] ?? 0.8;
  const start = t0 ?? ctx.currentTime + 0.05;
  const noise = noiseBuffer(ctx);

  /* master: gain → soft clip → compressor → destination */
  const master = ctx.createGain(); master.gain.value = clamp(volume, 0, 1) * 0.6;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
  master.connect(comp); comp.connect(destination ?? ctx.destination);

  /* the space (Size, Field): a convolver in parallel with the dry path */
  let space = SIZE_SPACE[b.size] ?? 0.8;
  if (b.utilities.some(u => u.node === "Field")) space *= 1.6;
  const wet = ctx.createGain(); wet.gain.value = clamp(0.18 + space * 0.12, 0.2, 0.6);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, space, 2.6);
  verb.connect(wet); wet.connect(master);
  const bus = ctx.createGain(); bus.connect(master); bus.connect(verb);

  /* Amplifier → saturation on the bus */
  const amp = b.utilities.find(u => u.node === "Amplifier");
  let dest = bus;
  if (amp) { const ws = shaper(ctx, 0.25 * amp.level); ws.connect(bus); dest = ws; bus.gain.value = 1 + 0.12 * amp.level; }

  /* Orbit → slow rotation of the whole working */
  if (b.utilities.some(u => u.node === "Orbit") && ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner(); const lfo = ctx.createOscillator(); lfo.frequency.value = 0.8;
    const lg = ctx.createGain(); lg.gain.value = 0.9; lfo.connect(lg); lg.connect(pan.pan);
    pan.connect(dest); dest = pan; lfo.start(start); lfo.stop(start + 8);
  }

  /* ---- 1. the charge: a hum intensifying ---- */
  const conv = CONVERSION_CHARGE[b.conversion] ?? CONVERSION_CHARGE.Base;
  const delayNode = b.utilities.find(u => u.node === "Delay");
  const charge = conv.time + clamp(ev.complexity * 0.04, 0, 0.6) + (delayNode ? clamp(delayNode.count * 0.15, 0, 0.9) : 0);
  const humEnd = start + charge;
  {
    const humOut = ctx.createGain(); humOut.connect(dest);
    // intensifying: quiet, then swelling into the release
    humOut.gain.setValueAtTime(0.0001, start);
    humOut.gain.exponentialRampToValueAtTime(L * 0.28, humEnd - 0.02);
    humOut.gain.exponentialRampToValueAtTime(0.0001, humEnd + 0.12);
    let humDest = humOut;
    if (conv.drive) { const ws = shaper(ctx, conv.drive); ws.connect(humOut); humDest = ws; }
    if (conv.tremolo) { // Ritual: the chant
      const trem = ctx.createGain(); trem.gain.value = 0.7; const lfo = ctx.createOscillator(); lfo.frequency.value = conv.tremolo;
      const lg = ctx.createGain(); lg.gain.value = 0.3; lfo.connect(lg); lg.connect(trem.gain); trem.connect(humDest); humDest = trem;
      lfo.start(start); lfo.stop(humEnd + 0.2);
    }
    const voices = INTENT_VOICES[b.intent] ?? INTENT_VOICES.Utility;
    for (const [ratio, level, wave] of voices) {
      const o = ctx.createOscillator(); o.type = wave;
      o.frequency.setValueAtTime(root * ratio * 0.94, start);
      o.frequency.exponentialRampToValueAtTime(root * ratio, humEnd);            // the whir rising
      if (conv.drive) { o.frequency.setValueAtTime(root * ratio, humEnd); o.frequency.exponentialRampToValueAtTime(root * ratio * 1.06, humEnd + 0.1); }
      const g = ctx.createGain(); g.gain.value = level * 0.35;
      o.connect(g); g.connect(humDest); o.start(start); o.stop(humEnd + 0.2);
    }
    // the deep hum under it for big workings
    if (tier >= 3) tone(ctx, humDest, { type: "sine", freq: root * 0.5, t0: start, attack: charge * 0.8, release: 0.3, level: L * 0.2 });
    // Heat: a hiss that rises with the charge
    const heatLevel = clamp(ev.heat / 120, 0.02, 0.35);
    burst(ctx, humDest, noise, { t0: start, attack: charge, release: 0.25, level: heatLevel * 0.5, filter: "highpass", freq: 5000 });
  }

  /* ---- 2. the release ---- */
  let end = humEnd + 0.5;
  const tR = humEnd;
  if (outcome === "failure") {
    // the pattern collapses: a dull pop and a sigh
    tone(ctx, dest, { type: "sine", freq: root, to: root * 0.4, t0: tR, attack: 0.005, release: 0.35, level: L * 0.5 });
    burst(ctx, dest, noise, { t0: tR, attack: 0.02, release: 0.9, level: L * 0.22, filter: "lowpass", freq: 1200, to: 200 });
    end = tR + 1.2;
  } else if (outcome === "fumble") {
    // Flux: the conversion tears loose
    const ws = shaper(ctx, 1.0); ws.connect(bus);
    tone(ctx, ws, { type: "sawtooth", freq: root, to: root * 0.25, t0: tR, attack: 0.005, release: 1.1, level: L * 0.6 });
    tone(ctx, ws, { type: "square", freq: root * 1.02, to: root * 3, t0: tR, attack: 0.01, release: 0.8, level: L * 0.3 });
    burst(ctx, bus, noise, { t0: tR, attack: 0.005, release: 1.4, level: L * 0.7, filter: "bandpass", freq: 1200, to: 150, q: 0.8 });
    for (let i = 0; i < 12; i++) burst(ctx, bus, noise, { t0: tR + 0.1 + i * 0.09, release: 0.04, level: L * 0.3, filter: "highpass", freq: 2000 + (hashOf(i * 13) % 4000) });
    end = tR + 1.8;
  } else {
    const crit = outcome === "critical" ? 1.2 : 1;
    (RELEASES[b.form] ?? RELEASES.Projectile)(ctx, dest, noise, tR, root, L * crit);

    // one pulse per effect, staggered; Split repeats them, Echo echoes them
    const split = b.utilities.find(u => u.node === "Split");
    const echo = b.utilities.find(u => u.node === "Echo");
    const repeats = 1 + (split ? clamp(split.count, 1, 5) : 0) + (echo ? 2 : 0);
    const gap = echo && !split ? 0.32 : 0.14;
    const per = L * crit * (b.effects.length > 3 ? 0.7 : 1);
    b.effects.forEach((fx, i) => {
      const pulse = pulseFor(fx);
      for (let k = 0; k < repeats; k++) {
        const t = tR + 0.06 + i * 0.07 + k * gap * (1 + i * 0.1);
        pulse(ctx, dest, noise, t, root, per * Math.pow(0.72, k));
        end = Math.max(end, t + 2.0);
      }
    });

    // Collapse: everything ends violently
    if (b.utilities.some(u => u.node === "Collapse")) {
      const tC = end - 0.9;
      tone(ctx, dest, { type: "sine", freq: root, to: 30, t0: tC, attack: 0.005, release: 0.7, level: L * 0.8 });
      burst(ctx, dest, noise, { t0: tC, release: 0.6, level: L * 0.5, filter: "lowpass", freq: 2000, to: 100 });
      end = tC + 1.2;
    }

    /* ---- 3. the aftermath: ringing, or stillness ---- */
    const ringLevel = L * (b.size >= 3 ? 0.14 : 0.08);
    tone(ctx, dest, { type: "sine", freq: root * 4, t0: tR + 0.1, attack: 0.05, release: space * 1.2, level: ringLevel });
    if (overheat) { // crackling from the caster's own body
      for (let i = 0; i < 10; i++) burst(ctx, dest, noise, { t0: tR + 0.2 + i * 0.13, release: 0.03, level: L * 0.25, filter: "highpass", freq: 3500 + (hashOf(i * 3) % 2000) });
    }
    end = Math.max(end, tR + 0.1 + space * 1.2);
  }

  return end - start + 0.4;
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
  const probe = new OAC(1, sampleRate, sampleRate);
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
  const conv = { Base: "a steady charge", Ritual: "a slow, chanting charge", Overdrive: "a snap charge" }[b.conversion];
  const fx = b.effects.map(x => x.element ?? (EFFECTS[x.effect]?.label ?? x.effect)).join(", ") || "nothing";
  return `${ev.tier.name}-deep hum, ${conv}, then ${b.form} release with ${fx}${b.size >= 3 ? ", ringing long" : ""}.`;
}
