/* ===================================================================
 * Dreoarcana Arcana — sigils
 *
 * A spell's sigil is drawn from its nodes, so two spells built the same
 * way share a mark and any change to the build changes the mark:
 *
 *   Intent      → the outer ring (spiked, doubled, dashed, open, seeded)
 *   Conversion  → the core (a point, layered rings, a burst)
 *   Form        → the central figure (line, wedge, blade, square, …)
 *   Range       → ticks on the outer ring, one tier one step
 *   Size        → how much of the figure is filled
 *   Effects     → glyphs around the figure, one each
 *   Flow nodes  → small marks on the inner ring
 *   Tier        → the colour, when one is baked in
 *
 * Pure: no Foundry globals. Returns SVG markup. Strokes use
 * currentColor so an inline sigil takes its colour from CSS; a baked
 * colour is set on the root for files.
 * =================================================================== */

import { normalizeBuild, evaluateSpell, DAMAGE_TYPES, hashString as hashOf } from "./rules.js";

const R_OUTER = 92, R_TICK = 97, R_BAND = 82, R_GLYPH = 54, R_MARK = 24, R_FIGURE = 22;
const TAU = Math.PI * 2;

const TIER_HEX = { 1: "#b8652a", 2: "#c9a227", 3: "#2f6f9f", 4: "#6f3fa0", 5: "#a3241f" };

const polar = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
const pt = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
const polygon = (n, r, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => pt(polar(r, rot + i * TAU / n))).join(" ");
const star = (n, r1, r2, rot = -Math.PI / 2) =>
  Array.from({ length: n * 2 }, (_, i) => pt(polar(i % 2 ? r2 : r1, rot + i * TAU / (n * 2)))).join(" ");

/* -------------------------------------------------------------------
 * Outer ring — Intent
 * ----------------------------------------------------------------- */
const RINGS = {
  Offensive: () => `<circle r="${R_OUTER}"/>` +
    Array.from({ length: 8 }, (_, i) => { const a = i * TAU / 8; const [x1, y1] = polar(R_OUTER, a); const [x2, y2] = polar(R_OUTER + 7, a);
      const [lx, ly] = polar(R_OUTER, a - 0.07), [rx, ry] = polar(R_OUTER, a + 0.07);
      return `<polygon points="${pt([lx, ly])} ${pt([x2, y2])} ${pt([rx, ry])}" fill="currentColor" stroke="none"/>`; }).join(""),
  Defensive: () => `<circle r="${R_OUTER}"/><circle r="${R_OUTER - 6}"/>`,
  Utility:   () => `<circle r="${R_OUTER}" stroke-dasharray="6 5"/>`,
  Support:   () => `<circle r="${R_OUTER}" stroke-dasharray="${(R_OUTER * TAU / 4 - 14).toFixed(1)} 14"/>` +
    Array.from({ length: 4 }, (_, i) => { const [x, y] = polar(R_OUTER, i * TAU / 4 + TAU / 8); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="currentColor" stroke="none"/>`; }).join(""),
  Creation:  () => `<circle r="${R_OUTER}"/>` +
    Array.from({ length: 12 }, (_, i) => { const [x, y] = polar(R_OUTER, i * TAU / 12); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"/>`; }).join("")
};

/* -------------------------------------------------------------------
 * Core — Conversion
 * ----------------------------------------------------------------- */
const CORES = {
  Base:      () => `<circle r="4.5" fill="currentColor" stroke="none"/>`,
  Ritual:    () => `<circle r="3" fill="currentColor" stroke="none"/><circle r="8"/><circle r="12" stroke-dasharray="3 3"/>`,
  Overdrive: () => `<polygon points="${star(8, 12, 5)}" fill="currentColor" stroke="none"/>`
};

/* -------------------------------------------------------------------
 * Central figure — Form. Drawn inside R_FIGURE; `fill` is the Size.
 * ----------------------------------------------------------------- */
const FIGURES = {
  "Self":              (f) => `<circle r="${R_FIGURE}" ${f}/>`,
  "Touch":             (f) => `<line x1="-${R_FIGURE}" y1="0" x2="${R_FIGURE - 10}" y2="0"/><circle cx="${R_FIGURE - 4}" cy="0" r="6" ${f}/>`,
  "Projectile":        (f) => `<line x1="-${R_FIGURE}" y1="0" x2="${R_FIGURE - 8}" y2="0"/><polygon points="${R_FIGURE - 10},-7 ${R_FIGURE + 2},0 ${R_FIGURE - 10},7" ${f}/>`,
  "Cone 30":           (f) => `<polygon points="-${R_FIGURE},0 ${R_FIGURE},-${R_FIGURE * 0.6} ${R_FIGURE},${R_FIGURE * 0.6}" ${f}/>`,
  "Blade":             (f) => `<path d="M-${R_FIGURE},0 Q0,-${R_FIGURE * 0.7} ${R_FIGURE},0 Q0,${R_FIGURE * 0.7} -${R_FIGURE},0 Z" ${f}/><line x1="-${R_FIGURE}" y1="0" x2="${R_FIGURE}" y2="0"/>`,
  "Square":            (f) => `<rect x="-${R_FIGURE * 0.75}" y="-${R_FIGURE * 0.75}" width="${R_FIGURE * 1.5}" height="${R_FIGURE * 1.5}" ${f}/>`,
  "Circle":            (f) => `<circle r="${R_FIGURE}" ${f}/><circle r="${R_FIGURE * 0.55}"/>`,
  "Pyramid":           (f) => `<polygon points="${polygon(3, R_FIGURE)}" ${f}/>`,
  "Cylinder":          (f) => `<rect x="-${R_FIGURE * 0.55}" y="-${R_FIGURE}" width="${R_FIGURE * 1.1}" height="${R_FIGURE * 2}" rx="${R_FIGURE * 0.55}" ${f}/><line x1="-${R_FIGURE * 0.55}" y1="-${R_FIGURE * 0.45}" x2="${R_FIGURE * 0.55}" y2="-${R_FIGURE * 0.45}"/>`,
  "Halo":              (f) => `<circle r="${R_FIGURE * 0.8}" ${f}/>` + Array.from({ length: 6 }, (_, i) => { const [x, y] = polar(R_FIGURE, i * TAU / 6); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="currentColor" stroke="none"/>`; }).join(""),
  "Sphere":            (f) => `<circle r="${R_FIGURE}" ${f}/><ellipse rx="${R_FIGURE}" ry="${R_FIGURE * 0.38}"/><ellipse rx="${R_FIGURE * 0.38}" ry="${R_FIGURE}"/>`,
  "Construct / Field": (f) => `<polygon points="${polygon(6, R_FIGURE)}" ${f}/><polygon points="${polygon(6, R_FIGURE * 0.5, -Math.PI / 2 + Math.PI / 6)}"/>`
};

/* -------------------------------------------------------------------
 * Glyphs — Effects. Each ~20 units across, centred on 0,0.
 * ----------------------------------------------------------------- */
const GLYPHS = {
  // elements
  "Fire":        `<path d="M0,-10 C6,-4 7,2 4,7 C2,10 -2,10 -4,7 C-7,2 -4,-2 0,-10 Z M0,2 C2,4 2,6 0,7 C-2,6 -2,4 0,2 Z"/>`,
  "Lightning":   `<polyline points="2,-10 -5,1 0,1 -2,10 6,-2 1,-2 3,-10" fill="currentColor" stroke="none"/>`,
  "Frost":       `<g>${[0, 60, 120].map(d => `<line x1="0" y1="-9" x2="0" y2="9" transform="rotate(${d})"/><path d="M-3,-6 L0,-9 L3,-6 M-3,6 L0,9 L3,6" transform="rotate(${d})"/>`).join("")}</g>`,
  "Wind":        `<path d="M-9,-4 H4 a3,3 0 1 0 -3,-3 M-9,1 H7 a3,3 0 1 1 -3,3 M-9,6 H2 a2.5,2.5 0 1 1 -2.5,2.5"/>`,
  "Thunder":     `<path d="M-8,4 a8,8 0 0 1 16,0 M-4,4 a4,4 0 0 1 8,0"/><circle cy="4" r="1.5" fill="currentColor" stroke="none"/>`,
  "Acid":        `<path d="M0,-9 C5,-2 7,2 7,5 a7,7 0 0 1 -14,0 C-7,2 -5,-2 0,-9 Z"/><circle cx="2" cy="5" r="1.5" fill="currentColor" stroke="none"/>`,
  "Necrotic":    `<path d="M4,-8 a9,9 0 1 0 0,16 a7,7 0 1 1 0,-16 Z" fill="currentColor" stroke="none"/>`,
  "Poison":      `<path d="M0,-9 C5,-2 7,2 7,5 a7,7 0 0 1 -14,0 C-7,2 -5,-2 0,-9 Z"/><line x1="-3" y1="2" x2="3" y2="8"/><line x1="3" y1="2" x2="-3" y2="8"/>`,
  "Prismatic":   `<polygon points="0,-9 8,6 -8,6"/><line x1="-8" y1="6" x2="0" y2="-2"/><line x1="8" y1="6" x2="0" y2="-2"/>`,
  "Force":       `<circle r="7" fill="currentColor" stroke="none"/><circle r="10" stroke-dasharray="2 3"/>`,
  "Slashing":    `<line x1="-8" y1="-8" x2="8" y2="8"/><line x1="-2" y1="-8" x2="8" y2="2"/>`,
  "Bludgeoning": `<rect x="-6" y="-6" width="12" height="12" fill="currentColor" stroke="none"/>`,
  "Piercing":    `<polygon points="0,-10 5,6 0,3 -5,6" fill="currentColor" stroke="none"/>`,
  "Radiant":     `<circle r="4"/>${[0, 45, 90, 135].map(d => `<line x1="0" y1="-9" x2="0" y2="-6" transform="rotate(${d})"/><line x1="0" y1="6" x2="0" y2="9" transform="rotate(${d})"/>`).join("")}`,
  // named effects
  "Barrier":               `<path d="M-9,4 a9,9 0 0 1 18,0"/><path d="M-6,7 a6,6 0 0 1 12,0"/>`,
  "Shield":                `<path d="M0,-9 L8,-6 C8,2 5,7 0,10 C-5,7 -8,2 -8,-6 Z"/>`,
  "Timed Reanimation":     `<line x1="-8" y1="8" x2="8" y2="8"/><line x1="0" y1="8" x2="0" y2="-6"/><polyline points="-4,-2 0,-8 4,-2"/>`,
  "Sustained Reanimation": `<line x1="-8" y1="8" x2="8" y2="8"/><line x1="0" y1="8" x2="0" y2="-6"/><polyline points="-4,-2 0,-8 4,-2"/><circle cy="-8" r="2.5"/>`,
  "Control Dead":          `<path d="M-9,0 Q0,-8 9,0 Q0,8 -9,0 Z"/><circle r="3" fill="currentColor" stroke="none"/>`,
  "Create Golem":          `<rect x="-6" y="-2" width="12" height="11"/><rect x="-3.5" y="-9" width="7" height="6"/>`,
  "Create Homunculus":     `<circle cy="-5" r="3.5"/><path d="M-5,9 L-3,0 H3 L5,9"/>`,
  "Create Sentry":         `<polygon points="0,-9 9,8 -9,8"/><circle cy="3" r="2.5" fill="currentColor" stroke="none"/>`,
  "Create Watcher":        `<path d="M-9,0 Q0,-9 9,0 Q0,9 -9,0 Z"/><circle r="3.5"/><circle r="1.2" fill="currentColor" stroke="none"/>`,
  "Heighten Senses":       `<path d="M-6,-6 a8,8 0 0 1 0,12 M-2,-9 a12,12 0 0 1 0,18 M2,-12 a16,16 0 0 1 0,24"/>`,
  "Create Sound":          `<path d="M-8,-3 h4 l5,-5 v16 l-5,-5 h-4 Z"/><path d="M4,-3 a5,5 0 0 1 0,6"/>`,
  "Create Mirage":         `<path d="M-9,-3 q4,-5 8,0 t8,0 M-9,3 q4,-5 8,0 t8,0"/>`,
  "Create Smell":          `<path d="M-6,8 q-3,-6 0,-11 q3,-5 0,-9 M0,8 q-3,-6 0,-11 q3,-5 0,-9 M6,8 q-3,-6 0,-11 q3,-5 0,-9"/>`,
  "Create Touch":          `<path d="M-6,8 V-2 a2,2 0 0 1 4,0 V2 M-2,2 V-6 a2,2 0 0 1 4,0 V2 M2,2 V-4 a2,2 0 0 1 4,0 V4 a6,6 0 0 1 -12,6"/>`
};

/* Custom effects get a stable geometric mark chosen from their key. */
const CUSTOM_MARKS = [
  `<polygon points="${polygon(5, 9)}"/>`,
  `<polygon points="${star(4, 9, 4)}"/>`,
  `<circle r="8"/><line x1="-8" y1="0" x2="8" y2="0"/><line x1="0" y1="-8" x2="0" y2="8"/>`,
  `<polygon points="${polygon(4, 9, 0)}"/><circle r="3"/>`,
  `<path d="M-9,0 a9,9 0 0 1 18,0 a9,9 0 0 1 -18,0" stroke-dasharray="4 3"/><circle r="2.5" fill="currentColor" stroke="none"/>`,
  `<polygon points="${polygon(3, 9)}"/><polygon points="${polygon(3, 9, Math.PI / 2)}"/>`,
  `<path d="M-8,-8 L8,8 M-8,8 L8,-8 M0,-10 V10"/>`,
  `<circle r="9"/><circle r="5"/><circle r="1.5" fill="currentColor" stroke="none"/>`
];

/* -------------------------------------------------------------------
 * Marks — Flow-control nodes, small, on the inner ring.
 * ----------------------------------------------------------------- */
const MARKS = {
  "Split":     `<path d="M0,6 V0 M0,0 L-5,-6 M0,0 L5,-6"/>`,
  "Combiner":  `<path d="M0,-6 V0 M0,0 L-5,6 M0,0 L5,6"/>`,
  "Delay":     `<path d="M-5,-6 H5 L-5,6 H5 Z"/>`,
  "Gate":      `<path d="M-5,-6 V6 M5,-6 V6 M-5,0 H5"/>`,
  "Sync":      `<path d="M-3,-6 V6 M3,-6 V6"/>`,
  "Amplifier": `<path d="M-6,3 L0,-5 L6,3"/>`,
  "Anchor":    `<path d="M0,-6 V6 M-6,2 Q0,8 6,2"/><circle cy="-6" r="1.8"/>`,
  "Orbit":     `<ellipse rx="7" ry="3.5"/><circle r="1.8" fill="currentColor" stroke="none"/>`,
  "Link":      `<circle cx="-3" r="4"/><circle cx="3" r="4"/>`,
  "Field":     `<circle r="6" stroke-dasharray="2 2.5"/>`,
  "Mirror":    `<path d="M0,-6 V6 M-6,-4 L-1,0 L-6,4 Z M6,-4 L1,0 L6,4 Z"/>`,
  "Collapse":  `<path d="M-6,-6 L6,6 M-6,6 L6,-6"/>`,
  "Echo":      `<path d="M-3,-5 a6,6 0 0 1 0,10 M0,-7 a9,9 0 0 1 0,14"/>`,
  "Adaptive":  `<path d="M-7,0 q3,-6 7,0 t7,0"/>`
};

/* -------------------------------------------------------------------
 * Script — the inscription around the ring.
 *
 * A rune alphabet built from a dozen primitive strokes in a ±7 box.
 * Each letter is a fixed combination, so a name always reads the same
 * and two names differ. Digits are dotted forms. Nothing here is a real
 * script; it only has to look like one and be consistent.
 * ----------------------------------------------------------------- */
const RUNE_STROKES = [
  "M0,-7 V7", "M-4,-7 V7", "M4,-7 V7", "M-4,-7 L4,7", "M4,-7 L-4,7", "M-4,0 H4",
  "M-4,-7 H4", "M-4,7 H4", "M0,-7 L4,-2", "M0,7 L-4,2", "M-4,-4 L0,0 L-4,4", "M4,-4 L0,0 L4,4"
];
function runeFor(ch) {
  const c = ch.toUpperCase();
  if (c >= "A" && c <= "Z") {
    const k = c.charCodeAt(0) - 65;
    const picks = [(k * 5 + 1) % 12, (k * 7 + 3) % 12];
    if (k % 3 === 0) picks.push((k * 11 + 5) % 12);
    return picks.map(i => `<path d="${RUNE_STROKES[i]}"/>`).join("");
  }
  if (c >= "0" && c <= "9") {
    const d = c.charCodeAt(0) - 48;
    return `<path d="${RUNE_STROKES[d % 12]}"/><circle cy="${d % 2 ? -4 : 4}" r="1.6" fill="currentColor" stroke="none"/>`;
  }
  return "";
}

/** The inscription: the name in runes, a seal, then the Power as a tally. */
function inscription(name, power) {
  const text = String(name ?? "").replace(/[^A-Za-z0-9 ]/g, "").trim().slice(0, 28);
  const tens = Math.min(9, Math.floor((Number(power) || 0) / 10));
  const ones = Math.max(0, Math.round((Number(power) || 0) - tens * 10));
  const cells = [];
  for (const ch of text) cells.push(ch === " " ? "" : `<g stroke-width="2.4">${runeFor(ch)}</g>`);
  cells.push(`<polygon points="0,-5 4,0 0,5 -4,0" fill="currentColor" stroke="none"/>`);                 // the seal
  for (let i = 0; i < tens; i++) cells.push(`<circle r="3.2" stroke-width="1.8"/>`);                     // tens: rings
  for (let i = 0; i < ones; i++) cells.push(`<circle r="1.8" fill="currentColor" stroke="none"/>`);   // ones: dots
  const slots = Math.max(cells.length, 26);
  const step = 360 / slots;
  return cells.map((inner, i) => inner
    ? `<g transform="rotate(${(i * step).toFixed(2)}) translate(0,-${R_BAND}) scale(0.48)">${inner}</g>`
    : "").join("");
}

/** Construction lines binding the effect glyphs to the core. */
function construction(n) {
  if (!n) return "";
  const pts = Array.from({ length: n }, (_, i) => polar(R_GLYPH, -Math.PI / 2 + i * TAU / n));
  const out = [];
  if (n < 3) out.push(pts.map(([x, y]) => `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join(""));
  else {
    out.push(`<polygon points="${pts.map(pt).join(" ")}"/>`);
    if (n >= 5) { const stepped = pts.map((_, i) => pts[(i * 2) % n]); out.push(`<polygon points="${stepped.map(pt).join(" ")}"/>`); }
    if (n >= 7) { const stepped = pts.map((_, i) => pts[(i * 3) % n]); out.push(`<polygon points="${stepped.map(pt).join(" ")}" stroke-dasharray="2 3"/>`); }
  }
  return `<g class="mm-sigil-construction" stroke-width="0.9" stroke-opacity="0.55">${out.join("")}</g>`;
}

/** The glyph for an effect entry {effect, element}. */
export function effectGlyph(entry) {
  if (entry?.element) {
    const d = DAMAGE_TYPES[entry.element];
    if (d?.compound) {
      const [a, b] = d.compound;
      return `<g transform="translate(-3,-3) scale(0.8)">${GLYPHS[a] ?? ""}</g><g transform="translate(4,4) scale(0.8)">${GLYPHS[b] ?? GLYPHS.Radiant}</g>`;
    }
    return GLYPHS[entry.element] ?? GLYPHS.Force;
  }
  if (GLYPHS[entry?.effect]) return GLYPHS[entry.effect];
  return CUSTOM_MARKS[hashOf(entry?.effect ?? "") % CUSTOM_MARKS.length];
}

/**
 * Build the sigil.
 * @param {object} build
 * @param {object} [opts]
 * @param {number} [opts.size=200]     rendered width/height
 * @param {string} [opts.color]        bake a colour (else currentColor from CSS)
 * @param {boolean} [opts.tierColor]   bake the tier colour
 * @param {string} [opts.background]   optional background fill for files
 * @param {string} [opts.cls]          class on the root svg
 * @param {boolean} [opts.spin]        turn the rings slowly (SMIL, so the
 *                                     axis is the sigil's own centre)
 */
export function sigilSVG(build, { size = 200, color = null, tierColor = false, background = null, cls = "mm-sigil-svg", spin = false } = {}) {
  const turn = (dur, reverse = false) => spin
    ? `<animateTransform attributeName="transform" type="rotate" from="${reverse ? 360 : 0} 0 0" to="${reverse ? 0 : 360} 0 0" dur="${dur}s" repeatCount="indefinite"/>`
    : "";
  const b = normalizeBuild(build);
  const ev = evaluateSpell(b);
  const tier = ev.tier;
  const baked = color ?? (tierColor ? TIER_HEX[tier.tier] : null);

  const parts = [];
  // Outer ring (Intent), its ticks (Range), the inscription band (name and
  // Power) and the tier hairlines — all one turning group.
  const ticks = [0, 0, 4, 8, 12, 16][b.range] ?? 0;
  const tickMarks = ticks ? Array.from({ length: ticks }, (_, i) => {
    const a = i * TAU / ticks + TAU / (ticks * 2); const [x1, y1] = polar(R_OUTER + 2, a); const [x2, y2] = polar(R_TICK + 2, a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }).join("") : "";
  const band = `<g class="mm-sigil-band" stroke-width="0.8" stroke-opacity="0.7"><circle r="${R_BAND + 5}"/><circle r="${R_BAND - 5}"/></g>` +
               `<g class="mm-sigil-script" stroke-width="1.6">${inscription(b.name, b.power)}</g>`;
  const hairlines = `<g class="mm-sigil-hairlines" stroke-width="0.7" stroke-opacity="0.5">${Array.from({ length: tier.tier }, (_, i) =>
    `<circle r="${(R_BAND - 8 - i * 2.4).toFixed(1)}"${i % 2 ? ' stroke-dasharray="1.5 3"' : ""}/>`).join("")}</g>`;
  parts.push(`<g class="mm-sigil-ring">${turn(48)}${(RINGS[b.intent] ?? RINGS.Utility)()}<g class="mm-sigil-ticks">${tickMarks}</g>${band}${hairlines}</g>`);

  // Construction lines behind everything inside the band.
  parts.push(construction(b.effects.length));

  // Inner ring with flow-control marks.
  parts.push(`<circle r="${R_MARK + 10}" class="mm-sigil-inner" stroke-width="1.4" stroke-opacity="0.55"/>`);
  const utils = b.utilities;
  if (utils.length) parts.push(`<g class="mm-sigil-marks" stroke-width="2.2">${utils.map((u, i) => {
    const a = -Math.PI / 2 + i * TAU / utils.length; const [x, y] = polar(R_MARK + 10, a);
    const reps = u.node === "Amplifier" ? Math.max(1, u.level) : 1;
    const inner = Array.from({ length: reps }, (_, k) => `<g transform="translate(0,${(k - (reps - 1) / 2) * 3.2})">${MARKS[u.node] ?? ""}</g>`).join("");
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(0.78)"><circle r="9" class="mm-sigil-pad"/>${inner}</g>`; }).join("")}</g>`);

  // Central figure (Form), filled by Size.
  const fillAlpha = [0, 0, 0.18, 0.32, 0.5, 0.7][b.size] ?? 0;
  const fillAttr = fillAlpha ? `fill="currentColor" fill-opacity="${fillAlpha}"` : `fill="none"`;
  parts.push(`<g class="mm-sigil-figure">${(FIGURES[b.form] ?? FIGURES.Projectile)(fillAttr)}</g>`);

  // Core (Conversion).
  parts.push(`<g class="mm-sigil-core">${(CORES[b.conversion] ?? CORES.Base)()}</g>`);

  // Effect glyphs around the figure.
  const fx = b.effects;
  if (fx.length) parts.push(`<g class="mm-sigil-glyphs">${turn(90, true)}${fx.map((x, i) => {
    const a = -Math.PI / 2 + i * TAU / fx.length; const [gx, gy] = polar(R_GLYPH, a);
    const pad = fx.length > 6 ? 9 : 10.5;
    const sc = fx.length > 6 ? 0.72 : 0.85;
    return `<g transform="translate(${gx.toFixed(1)},${gy.toFixed(1)})"><circle r="${pad}" class="mm-sigil-pad"/><circle r="${pad}" stroke-width="0.8" stroke-opacity="0.5"/><g transform="scale(${sc})">${effectGlyph(x)}</g></g>`; }).join("")}</g>`);

  const style = baked ? ` style="color:${baked}"` : "";
  const bg = background ? `<rect x="-106" y="-106" width="212" height="212" fill="${background}" stroke="none"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-106 -106 212 212" width="${size}" height="${size}" class="${cls}" data-tier="${tier.tier}"${style}>` +
    `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${bg}${parts.join("")}</g></svg>`;
}

/** A standalone file for a spell: parchment disc, tier colour baked in. */
export function sigilFile(build) {
  const b = normalizeBuild(build);
  const tier = evaluateSpell(b).tier;
  const svg = sigilSVG(b, { size: 256, color: TIER_HEX[tier.tier], cls: "" })
    .replace(`<g fill="none"`, `<circle r="104" fill="#f4ead6" stroke="#b09466" stroke-width="2"/><g fill="none"`)
    .split(`class="mm-sigil-pad"`).join(`class="mm-sigil-pad" fill="#f4ead6" stroke="none"`)
    .split(`class="mm-sigil-inner"`).join(`class="mm-sigil-inner" stroke-opacity="0.45"`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`;
}

/** A single effect's glyph as a small standalone svg (for effect sheets). */
export function glyphSVG(entry, { size = 32, cls = "mm-glyph-svg" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" width="${size}" height="${size}" class="${cls}">` +
    `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${effectGlyph(entry)}</g></svg>`;
}

export { TIER_HEX };
