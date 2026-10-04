/* ===================================================================
 * Dreoarcana Arcana — the rules, as data.
 *
 * Single source of truth for the Spell Builder. The builder window,
 * the spell sheet, the casting procedure and the rules journal all
 * read from here, so changing a number changes it everywhere.
 *
 * Sources (Ramilleus Codex, 10 - World/06 - Systems):
 *   "Spell Builder"   — the five formulas, variables, power tiers, the
 *                       Attack Spell rule.
 *   "Node Catalogue"  — Intent, Conversion, Shape (form/range/size),
 *                       Effect and Utility nodes, and the damage types.
 *
 * This file is PURE: no Foundry globals, no I/O. It can be unit-tested
 * with plain Node.
 *
 * Where the source document is silent or ambiguous the system has to
 * pick something; every such choice is marked "HOUSE RULING" below and
 * restated in the README, so it can be argued with.
 * =================================================================== */

/* -------------------------------------------------------------------
 * Intent Nodes — "priced by kindness"
 * ----------------------------------------------------------------- */
export const INTENTS = {
  Offensive: { xi: 1.00, complexity: 1, desc: "Used to directly harm or incapacitate a creature or object" },
  Defensive: { xi: 1.00, complexity: 1, desc: "Used to stop harm from outside forces." },
  Utility:   { xi: 0.75, complexity: 1, desc: "Tactical spells that don't directly influence yourself or others" },
  Support:   { xi: 0.75, complexity: 1, desc: "Used with the intention to help others or yourself." },
  Creation:  { xi: 1.50, complexity: 2, desc: "Used as a way to make physical and spectral \"living\" constructs" }
};

/* -------------------------------------------------------------------
 * Conversion Nodes — where the risk lives.
 *
 * The catalogue writes the three formulas three different ways. The
 * editor's reading, which this system follows: Ritual halves the Orie
 * cost at 1.5× complexity; Overdrive multiplies cost by 1.5 at half
 * complexity. `orie` multiplies Œ; `complexityFactor` multiplies the
 * summed Complexity.
 * ----------------------------------------------------------------- */
export const CONVERSIONS = {
  Base:      { orie: 1.0, complexityFactor: 1.0, tier: 1, desc: "The basic conversion: Œ = ξ × 1/(F × S × C)" },
  Ritual:    { orie: 0.5, complexityFactor: 1.5, tier: 1, desc: "Careful and slow — half the Orie, one-and-a-half times the complexity" },
  Overdrive: { orie: 1.5, complexityFactor: 0.5, tier: 1, desc: "Fast and wasteful — half the complexity, one-and-a-half times the Orie" }
};

/* -------------------------------------------------------------------
 * Shape Nodes — Form (tiered), Range and Size.
 * Shape Total Mod = ξ_range × ξ_shape × ξ_size
 * ----------------------------------------------------------------- */
export const FORMS = {
  "Self":              { tier: 1, complexity: 1, xi: 0.85, desc: "ξ field surrounds the caster.",              notes: "Personal augmentation or defense." },
  "Touch":             { tier: 1, complexity: 1, xi: 0.75, desc: "Transfers ξ through contact.",               notes: "Minimal drain; requires touch." },
  "Projectile":        { tier: 1, complexity: 1, xi: 1.00, desc: "Linear ξ projection along a single vector.", notes: "Baseline attack form." },
  "Cone 30":           { tier: 2, complexity: 2, xi: 1.20, desc: "Expanding directional arc.",                 notes: "Controlled AOE." },
  "Blade":             { tier: 2, complexity: 2, xi: 1.15, desc: "ξ condensed into a cutting edge.",           notes: "Precision slashes or waves." },
  "Square":            { tier: 2, complexity: 2, xi: 1.25, desc: "Flat ξ plane or seal.",                      notes: "Ideal for barriers or sigils." },
  "Circle":            { tier: 3, complexity: 3, xi: 1.40, desc: "Stable radial projection.",                  notes: "Perfect symmetry for traps or zones." },
  "Pyramid":           { tier: 3, complexity: 3, xi: 1.45, desc: "ξ converges to an apex.",                    notes: "Focused or balanced geometry." },
  "Cylinder":          { tier: 4, complexity: 4, xi: 1.60, desc: "Vertical pillar or beam.",                   notes: "Ideal for sustained beams or bursts." },
  "Halo":              { tier: 4, complexity: 4, xi: 1.65, desc: "Orbiting ξ constructs.",                     notes: "Rotating or protective formations." },
  "Sphere":            { tier: 5, complexity: 5, xi: 1.80, desc: "Full 3D field or burst.",                    notes: "Massive ξ amplification." },
  "Construct / Field": { tier: 5, complexity: 5, xi: 2.00, desc: "Independent ξ structure or sustained zone.", notes: "Persistent or environmental effect." }
};

export const RANGES = {
  1: { label: "Close",   distance: "0–30 ft",    metres: "0–9 m",    xi: 1.00, desc: "Melee or short projection" },
  2: { label: "Medium",  distance: "30–60 ft",   metres: "9–18 m",   xi: 1.10, desc: "Standard combat range" },
  3: { label: "Far",     distance: "60–90 ft",   metres: "18–27 m",  xi: 1.25, desc: "Long-range evocation" },
  4: { label: "Distant", distance: "90–120 ft",  metres: "27–37 m",  xi: 1.40, desc: "Battlefield-scale projection" },
  5: { label: "Extreme", distance: "120–150 ft", metres: "37–46 m",  xi: 1.60, desc: "Specialized long-range or siege effects" }
};

export const SIZES = {
  1: { label: "Focused",  area: "5 ft radius / single target", metres: "1.5 m / one target", xi: 1.00, desc: "Precise, minimal ξ spread" },
  2: { label: "Small",    area: "10 ft radius / small group",  metres: "3 m radius",         xi: 1.20, desc: "Affects a few creatures" },
  3: { label: "Moderate", area: "20 ft radius / small room",   metres: "6 m radius",         xi: 1.40, desc: "Area-effect combat spells" },
  4: { label: "Large",    area: "30–40 ft radius / chamber",   metres: "9–12 m radius",      xi: 1.70, desc: "Battlefield control" },
  5: { label: "Vast",     area: "50 ft+ / field-scale",        metres: "15 m+ / field-scale", xi: 2.00, desc: "Siege, storms, or large-scale ritual effects" }
};

/* -------------------------------------------------------------------
 * Damage Types — the elements an Evocation (Elemental) effect can carry.
 * Compound types (blue in the source) list what they combine.
 * ----------------------------------------------------------------- */
export const DAMAGE_TYPES = {
  "Fire":        { desc: "It's just fire, bro", effects: "Can burn flammable material and cause continuous damage as long as the flame is sustained or remains" },
  "Lightning":   { desc: "Electricity weaponized", effects: "Able to shock enemies and paralyze them with enough electricity applied as well as harnessing conductive materials and surroundings to your benefit" },
  "Frost":       { desc: "The cold of winter", effects: "Able to freeze targets or limbs allowing critical damage upon the target or limb frozen while also being able to freeze objects" },
  "Wind":        { desc: "Force of the wind utilized", effects: "May push, knock down, or cause harm when forced into immense speed, can pick up objects to be thrown" },
  "Thunder":     { desc: "Powerful blasts of sound", effects: "May deafen, disorient, and knock down those affected" },
  "Acid":        { desc: "Burning chemicals causing material degradation", effects: "Causes damage to armor and weapons and when hitting bare flesh does further damage" },
  "Necrotic":    { desc: "Rots flesh and biological material", effects: "Weakens by eroding biological material and causing exhaustion" },
  "Poison":      { desc: "Inflicting sickness upon those hit by it", effects: "Weakens when acquired and may cause vomiting or death" },
  "Prismatic":   { desc: "Holding all elements allow any to hit", effects: "Any element can come from being hit by prismatic" },
  "Force":       { desc: "Physical damage caused by a spell", effects: "Physical damage caused by spells that can hit hard" },
  "Slashing":    { desc: "Has a chance to cause bleeding and hemorrhages as well as being able to shred thin material", effects: "Does bonus damage to flesh and can cause bleeding that can lead into hemorrhaging" },
  "Bludgeoning": { desc: "Blunt force damage", effects: "Does bonus damage to armor" },
  "Piercing":    { desc: "Puncturing damage", effects: "Does bonus damage to weak points" },
  "Ghost Flame":       { compound: ["Fire", "Necrotic"],   desc: "A cold flame of the dead dealing both fire and necrotic damage able to burn away the soul", effects: "Will cause you to weaken and heat to harm you extensively eventually leading to your soul burning away" },
  "Rotting Sickness":  { compound: ["Necrotic", "Poison"], desc: "A dreadful mix of necrotic and poison damage", effects: "Puts a plague on whomever it hits and spreads necrosis and poison to all around the infected individual" },
  "Radiant Lightning": { compound: ["Lightning", "Radiant"], desc: "Lightning infused with divine power", effects: "Can instantly paralyze the target when hitting and causes excessive damage to undead and demons" },
  "Divine Flame":      { compound: ["Fire", "Radiant"],    desc: "Bright flame given enhanced power by divine sources", effects: "Does continuous burning without need of flammable material and causes excessive damage to undead and demons." },
  "Cutting Force":     { compound: ["Force", "Slashing"],  desc: "Force damage enhanced to a deadlier form", effects: "Magic able to do slashing damage with each hit as well as force damage (Magic missile becomes sharp :3)" }
};

/* HOUSE RULING: a compound element costs one extra point of complexity —
   two conversions braided into one effect. The catalogue prices every
   Effect node at 1 and does not price compounds at all. */
export const COMPOUND_COMPLEXITY_BONUS = 1;

/* -------------------------------------------------------------------
 * Effect Nodes.
 *
 * `damage: true` marks an effect that can carry an Attack Intent on its
 * own (the Attack Spell rule). The Elemental effect takes an element
 * from DAMAGE_TYPES; everything else is a named effect.
 *
 * `intents` is the catalogue's Intent column — advisory, shown as a
 * warning when ignored, except the Attack rule which is enforced.
 *
 * `magnitude(M)` turns Might into a table-usable line. HOUSE RULING:
 * the Spell Builder says effect dice are "mechanically derived from ξ or
 * Œ_final" and stops there, so these scalings are the system's.
 * ----------------------------------------------------------------- */
export const EFFECTS = {
  "Elemental": {
    category: "Evocation", intents: ["Offensive", "Utility"], complexity: 1, damage: true, element: true,
    desc: "Damage or status effects",
    magnitude: (M, ctx) => `${ctx.damageFormula} ${ctx.element ?? ""} damage to the location struck`
  },
  "Barrier": {
    category: "Protection", intents: ["Defensive", "Support"], complexity: 1,
    desc: "Reduces magic damage based on percentage",
    magnitude: (M) => `Stops ${barrierPercent(M)}% of magical damage while it lasts; what it stops becomes the caster's Heat`
  },
  "Shield": {
    category: "Protection", intents: ["Defensive", "Support"], complexity: 1,
    desc: "Blocks damage until durability is zero",
    magnitude: (M) => `Absorbs ${shieldPoints(M)} points of physical damage before it breaks`
  },
  "Timed Reanimation": {
    category: "Necromancy", intents: ["Utility"], complexity: 1,
    desc: "Raise the dead for a limited amount of time",
    magnitude: (M) => `One corpse rises for ${Math.max(1, Math.round(M))} Melee Rounds`
  },
  "Sustained Reanimation": {
    category: "Necromancy", intents: ["Utility"], complexity: 1,
    desc: "Raise the dead until heat overflows",
    magnitude: (M) => `One corpse rises and stays risen while the caster keeps converting — Heat accrues every Round`
  },
  "Control Dead": {
    category: "Necromancy", intents: ["Utility"], complexity: 1,
    desc: "Manipulate the will of the dead until heat overflows",
    magnitude: (M) => `Commands up to ${Math.max(1, Math.floor(M / 5))} undead while the caster keeps converting`
  },
  "Create Golem": {
    category: "Construct Magic", intents: ["Utility", "Creation"], complexity: 1,
    desc: "FOLLOW GOLEM RULES",
    magnitude: (M) => `A golem of Might ${Math.round(M)} — follow the golem rules`
  },
  "Create Homunculus": {
    category: "Construct Magic", intents: ["Utility", "Creation"], complexity: 1,
    desc: "FOLLOW HOMUNCULUS RULES",
    magnitude: (M) => `A homunculus of Might ${Math.round(M)} — follow the homunculus rules`
  },
  "Create Sentry": {
    category: "Construct Magic", intents: ["Utility", "Creation"], complexity: 1,
    desc: "Construct a sentry that targets whatever the caster desires and can be given a desired effect",
    magnitude: (M) => `A sentry that fires the spell's other effects at Might ${Math.round(M)}`
  },
  "Create Watcher": {
    category: "Construct Magic", intents: ["Utility", "Creation"], complexity: 1,
    desc: "Form a construct that allows you to see through it remotely",
    magnitude: (M) => `A watcher the caster can see through, for ${Math.max(1, Math.round(M))} minutes`
  },
  "Heighten Senses": {
    category: "Sensory", intents: ["Utility", "Support"], complexity: 1,
    desc: "Increase a sense of your choice",
    magnitude: (M) => `+${Math.min(60, Math.max(5, Math.round(M) * 5))}% to Perception with one chosen sense`
  },
  "Create Sound": {
    category: "Illusion", intents: ["Utility"], complexity: 1,
    desc: "Create a sound of your choosing within castable range",
    magnitude: (M) => `A sound as loud as ${M >= 20 ? "thunder" : M >= 10 ? "a shout" : "a voice"}, within range`
  },
  "Create Mirage": {
    category: "Illusion", intents: ["Utility"], complexity: 1,
    desc: "Create an image of your choosing within castable range",
    magnitude: (M) => `An image within range; disbelieved by an Insight roll opposed by ${Math.min(100, Math.round(M) * 5)}%`
  },
  "Create Smell": {
    category: "Illusion", intents: ["Utility"], complexity: 1,
    desc: "Create a smell of your choosing within castable range",
    magnitude: (M) => `A smell within range, ${M >= 10 ? "overpowering" : "noticeable"}`
  },
  "Create Touch": {
    category: "Illusion", intents: ["Utility"], complexity: 1,
    desc: "Create a feeling to the mirages casted",
    magnitude: (M) => `Gives the spell's mirages a sense of touch`
  }
};

for (const def of Object.values(EFFECTS)) def.builtin = true;

export const effectNames = () => Object.keys(EFFECTS);
/** Display name for an effect key — custom effects carry their item's name. */
export const effectLabel = (key) => EFFECTS[key]?.label ?? key;
export const effectCategories = () => [...new Set(Object.values(EFFECTS).map(e => e.category))];

/* -------------------------------------------------------------------
 * Custom Effect nodes.
 *
 * The catalogue is a starting point, not a ceiling — the Conjuration
 * row is literally "WIP". A table can add its own Effect nodes as data:
 *
 *   { key, category, intents, complexity, damage, desc, magnitude }
 *
 * `magnitude` is a text template, not code. Placeholders:
 *   {M}          Might, rounded
 *   {M*2} {M/5} {M+3} {M-1}   one arithmetic step on Might, rounded, min 1
 *   {dice}       the damage formula (damage-capable effects only)
 *
 * Registered effects live in the same EFFECTS table as the built-ins,
 * so the builder, the sheet, casting and the journal need no special
 * cases. Built-ins carry `builtin: true` and are never removed.
 * ----------------------------------------------------------------- */

/** Fill a magnitude template for a given Might. */
export function formatMagnitude(template, M, ctx = {}) {
  const might = Number(M) || 0;
  return String(template ?? "")
    .replace(/\{dice\}/gi, ctx.damageFormula ?? "—")
    .replace(/\{M(?:\s*([*/+\-×÷])\s*(\d+(?:\.\d+)?))?\}/gi, (_, op, n) => {
      let v = might;
      const k = Number(n);
      if (op === "*" || op === "×") v = might * k;
      else if (op === "/" || op === "÷") v = k ? might / k : might;
      else if (op === "+") v = might + k;
      else if (op === "-") v = might - k;
      return String(Math.max(1, Math.round(v)));
    });
}

/** Check a raw custom-effect record; returns { ok, errors, def }. */
export function validateEffectDefinition(raw = {}) {
  const errors = [];
  const key = String(raw.key ?? raw.name ?? "").trim();
  if (!key) errors.push("An effect needs a name.");
  if (key && EFFECTS[key]?.builtin) errors.push(`"${key}" is a catalogue effect and can't be replaced.`);
  if (/[|]/.test(key)) errors.push("The name can't contain a vertical bar.");
  const intents = (Array.isArray(raw.intents) ? raw.intents : String(raw.intents ?? "").split(/[,/]/))
    .map(s => String(s).trim()).filter(s => INTENTS[s]);
  if (!intents.length) errors.push("Pick at least one Intent the effect is catalogued for.");
  const complexity = Math.max(0, Math.min(10, Math.round(Number(raw.complexity ?? 1))));
  if (!Number.isFinite(complexity)) errors.push("Complexity must be a number.");
  const def = {
    key,
    label: String(raw.label ?? key).trim() || key,
    source: raw.source ? String(raw.source) : null,
    uuid: raw.uuid ? String(raw.uuid) : null,
    category: String(raw.category ?? "Custom").trim() || "Custom",
    intents,
    complexity: Number.isFinite(complexity) ? complexity : 1,
    damage: Boolean(raw.damage),
    desc: String(raw.desc ?? "").trim(),
    magnitude: String(raw.magnitude ?? "").trim() || "Manifests at Might {M}"
  };
  return { ok: errors.length === 0, errors, def };
}

/** Turn a stored record into a live EFFECTS entry. */
function liveEffect(def) {
  return {
    label: def.label,
    source: def.source,
    uuid: def.uuid,
    category: def.category,
    intents: def.intents.slice(),
    complexity: def.complexity,
    damage: def.damage,
    element: false,
    desc: def.desc,
    custom: true,
    template: def.magnitude,
    magnitude: (M, ctx) => formatMagnitude(def.magnitude, M, ctx)
  };
}

/** Register (or replace) one custom effect. Returns the live entry. */
export function registerEffect(raw) {
  const { ok, errors, def } = validateEffectDefinition(raw);
  if (!ok) throw new Error(errors.join(" "));
  EFFECTS[def.key] = liveEffect(def);
  return EFFECTS[def.key];
}

/** Remove a custom effect. Built-ins are refused. */
export function unregisterEffect(key) {
  if (!EFFECTS[key] || EFFECTS[key].builtin) return false;
  delete EFFECTS[key];
  return true;
}

/**
 * Replace the whole custom set with `list` (the stored records). Invalid
 * records are skipped and reported, never thrown — a bad row must not
 * take the system down at startup.
 */
export function applyCustomEffects(list) {
  for (const [k, v] of Object.entries(EFFECTS)) if (v.custom) delete EFFECTS[k];
  const applied = [], skipped = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const { ok, errors, def } = validateEffectDefinition(raw);
    if (!ok) { skipped.push({ raw, errors }); continue; }
    EFFECTS[def.key] = liveEffect(def);
    applied.push(def.key);
  }
  return { applied, skipped };
}

/** The custom effects currently registered, as storable records. */
export function customEffectRecords() {
  return Object.entries(EFFECTS)
    .filter(([, v]) => v.custom)
    .map(([key, v]) => ({ key, label: v.label ?? key, source: v.source ?? null, uuid: v.uuid ?? null,
                          category: v.category, intents: v.intents.slice(), complexity: v.complexity,
                          damage: v.damage, desc: v.desc, magnitude: v.template }));
}

/* The Discipline table — flavour and risk, one row per school. */
export const DISCIPLINES = {
  "Protection & Barriers": { core: "Converts ξ into kinetic or thermal resistance fields; stabilizes local space to deflect damage or pressure.", behaviour: "Compact, layered conversion — stable but heat-retentive.", risk: "Gradual internal heat buildup; risk of containment collapse." },
  "Summoning & Gatecraft": { core: "Manifests entities or opens spatial tears to transport matter or energy.", behaviour: "High-volume Melfyrium draw; unstable dimensional oscillation.", risk: "Extreme risk; failures cause dimensional recoil, phantom burns, or “anchor slip.”" },
  "Detection & Analysis":  { core: "Reads ambient Melfyric signatures, ξ flow, or biological auras.", behaviour: "Minimal energy use, fine-tuned resonance.", risk: "Low; only risks sensory feedback loops or false positives." },
  "Evocation":             { core: "Converts Melfyrium into direct energetic output — flame, lightning, poison, etc.", behaviour: "Fast, high-pressure ξ release.", risk: "Violent heat spike; most likely to self-combust if conversion unstable." },
  "Necromancy":            { core: "Reanimates, preserves, or manipulates decayed matter and residual ξ patterns.", behaviour: "Reverse-polarized ξ flow; steals order from entropy.", risk: "Corruptive feedback; chronic exposure leads to spiritual erosion." },
  "Construct Magic":       { core: "Infuses ξ into artificial matrices (metal, stone, organic vessels) to create autonomous forms.", behaviour: "Sustained Melfyric saturation, steady ξ feed.", risk: "Overload melts or collapses structure; severe Heat drain on user." }
};

/* -------------------------------------------------------------------
 * Utility (Flow Control) Nodes.
 *
 * `dc` is ΔC. `per` names what a count multiplies ΔC by ("+2 per split
 * branch"). `levels` gives the multiplier ladder for the two scaling
 * nodes. HOUSE RULING: the ξ multiplier is applied once per node,
 * however many branches or targets it carries; only ΔC scales.
 * ----------------------------------------------------------------- */
export const UTILITY_NODES = {
  "Split":      { dc: 2, per: "split branch",   xi: 1.20, desc: "Divides ξ flow into multiple chains." },
  "Combiner":   { dc: 3,                        xi: 1.50, desc: "Merges two ξ streams into one stronger effect." },
  "Delay":      { dc: 1, per: "3 s of delay",   xi: 1.05, desc: "Holds ξ for a defined time before release." },
  "Gate":       { dc: 2,                        xi: 1.10, desc: "Opens or closes a branch manually or on trigger." },
  "Sync":       { dc: 2,                        xi: 1.15, desc: "Forces two branches to resolve simultaneously." },
  "Amplifier":  { dc: 3, levels: [1.4, 1.6, 1.8, 2.0], desc: "Increases ξ output for the node (×1.4–×2.0, scales with amplification level)." },
  "Anchor":     { dc: 1,                        xi: 1.10, desc: "Fixes an effect in space independent of caster." },
  "Orbit":      { dc: 2,                        xi: 1.30, desc: "Binds effect to orbit around target." },
  "Link":       { dc: 3, per: "link target",    xi: 1.20, desc: "Shares ξ between multiple objects or allies." },
  "Field":      { dc: 4,                        xi: 1.60, desc: "Expands local ξ field affecting all within area." },
  "Mirror":     { dc: 3,                        xi: 1.25, desc: "Creates a duplicate chain with reduced ξ." },
  "Collapse":   { dc: 4,                        xi: 1.80, desc: "Ends all active sub-chains violently." },
  "Echo":       { dc: 2,                        xi: 1.30, desc: "Replays earlier portion of the chain with altered ξ." },
  "Adaptive":   { dc: 3, levels: [1.2, 1.4, 1.6, 1.8], desc: "Adjusts ξ output based on environment (×1.2–×1.8, dynamic)." }
};

/** ξ multiplier and ΔC for one utility node entry {node, count, level}. */
export function utilityNodeValues(entry) {
  const def = UTILITY_NODES[entry?.node];
  if (!def) return { xi: 1, dc: 0, label: "" };
  const count = Math.max(1, Math.floor(Number(entry.count) || 1));
  const level = Math.min(def.levels?.length ?? 1, Math.max(1, Math.floor(Number(entry.level) || 1)));
  const xi = def.levels ? def.levels[level - 1] : def.xi;
  const dc = def.per ? def.dc * count : def.dc;
  let label = entry.node;
  if (def.per) label += ` ×${count}`;
  if (def.levels) label += ` (level ${level})`;
  return { xi, dc, label, count, level };
}

/* -------------------------------------------------------------------
 * Power Tiers — by total ξ.
 * ----------------------------------------------------------------- */
export const TIERS = [
  { tier: 1, numeral: "I",   name: "Ember",     min: 0,   max: 10,       desc: "Small, subtle effects; sparks, minor force nudges, arcane whispers." },
  { tier: 2, numeral: "II",  name: "Lumen",     min: 11,  max: 25,       desc: "Noticeable magic; elemental bursts, minor barriers, illusions." },
  { tier: 3, numeral: "III", name: "Tempest",   min: 26,  max: 50,       desc: "Strong effects; lightning strikes, larger elemental manipulations, controlled chaos." },
  { tier: 4, numeral: "IV",  name: "Aetherion", min: 51,  max: 100,      desc: "Grand-scale magic; constructs, large area effects, multi-target control." },
  { tier: 5, numeral: "V",   name: "Cataclysm", min: 101, max: Infinity, desc: "Devastating, world-shaping effects; planar breaches, unstoppable destructive force." }
];

export function tierFor(xi) {
  const x = Math.max(0, Number(xi) || 0);
  return TIERS.find(t => x <= t.max) ?? TIERS[TIERS.length - 1];
}

/* -------------------------------------------------------------------
 * Casting in Mythras — HOUSE RULINGS, all of them.
 *
 * Difficulty by tier uses the system's own multipliers, so a Tier I
 * spell is Easy and a Tier V spell Herculean.
 * ----------------------------------------------------------------- */
export const DIFFICULTY_GRADES = [
  { key: "veryEasy",   label: "Very Easy",  mult: 2 },
  { key: "easy",       label: "Easy",       mult: 1.5 },
  { key: "standard",   label: "Standard",   mult: 1 },
  { key: "hard",       label: "Hard",       mult: 2 / 3 },
  { key: "formidable", label: "Formidable", mult: 0.5 },
  { key: "herculean",  label: "Herculean",  mult: 0.1 }
];
export const TIER_DIFFICULTY = { 1: "easy", 2: "standard", 3: "hard", 4: "formidable", 5: "herculean" };

/**
 * Outcome consequences. `heat` multiplies the Heat taken (house rule).
 * `orie` multiplies the Stored Orie drawn that is actually spent, and
 * `extraOrie` is lost on top — the Magic Point costs of Mythras Folk
 * Magic (p.122): a critical costs nothing, success and failure cost the
 * points, a fumble loses 1d3 more.
 */
export const OUTCOMES = {
  critical: { label: "Critical",  heat: 0.5, orie: 0, extraOrie: null,  effect: true,  note: "A clean conversion: no Stored Orie spent, half the Heat." },
  success:  { label: "Success",   heat: 1.0, orie: 1, extraOrie: null,  effect: true,  note: "" },
  failure:  { label: "Failure",   heat: 0.5, orie: 1, extraOrie: null,  effect: false, note: "The portal opens but the pattern collapses. The Orie drawn is gone; half the Heat." },
  fumble:   { label: "Fumble",    heat: 1.5, orie: 1, extraOrie: "1d3", effect: false, note: "Misfire. The Orie drawn and 1d3 more are lost; full Heat and half again; the GM rolls a Flux event." }
};

/**
 * Mythras success level for a d100 roll against a graded skill (Skills,
 * p.37), exactly as the system's own skill roller reads it: 96-00 always
 * fail and 99-00 fumble (only 00 once the skill is over 100); 01-05
 * always succeed; a critical is a roll within one tenth of the skill,
 * rounded up, and a 01 is always critical.
 */
export function outcomeFor(roll, target) {
  const t = Math.max(0, Math.ceil(target));
  const crit = Math.ceil(t * 0.1);
  if (roll > 95) return (roll === 100 || (roll === 99 && t <= 100)) ? "fumble" : "failure";
  if (roll <= 5) return (roll === 1 || roll <= crit) ? "critical" : "success";
  if (roll <= crit) return "critical";
  return roll <= t ? "success" : "failure";
}

/**
 * Circumstances move the difficulty grade (Skills, p.38; Magic, p.120):
 * each casting requirement denied — a free hand, a voice, clear thought,
 * sight of the target — makes it one grade harder; preparing for a
 * minute or an hour makes it easier (Ritualistic Casting Times, p.115).
 */
export const CIRCUMSTANCES = [
  { steps: -2, label: "An hour of preparation (two grades easier)" },
  { steps: -1, label: "A minute of preparation (one grade easier)" },
  { steps: 0,  label: "As it comes" },
  { steps: 1,  label: "One grade harder (a hand, voice, sight or clear thought denied)" },
  { steps: 2,  label: "Two grades harder" },
  { steps: 3,  label: "Three grades harder" }
];

/** A grade moved by some steps; null once past Herculean (Hopeless: no attempt can be made). */
export function shiftGrade(key, steps = 0) {
  const i = DIFFICULTY_GRADES.findIndex(g => g.key === key);
  const j = (i < 0 ? 2 : i) + (Number(steps) || 0);
  if (j >= DIFFICULTY_GRADES.length) return null;
  return DIFFICULTY_GRADES[Math.max(0, j)];
}

/** The casting target for a skill at a grade, rounded up as the system's roller does. */
export const gradedTarget = (skill, grade) => (grade ? Math.ceil((Number(skill) || 0) * grade.mult) : 0);

/* Focus presets. HOUSE RULING: the source says F > 1 reduces efficiency
   while its own formula divides by F. To keep the formula literal AND
   the intent (distraction hurts), Focus is an efficiency between 0 and
   1: full attention is 1, and every distraction lowers it, which raises
   the Orie required. */
export const FOCUS_PRESETS = {
  1.00: "Calm and undisturbed",
  0.85: "Under pressure (in combat, hurried)",
  0.70: "Distracted (engaged in melee, concentrating on another effect)",
  0.50: "Impaired (wounded, exhausted, fighting for breath)"
};

/* Catalyst presets. Γ multiplies Œ and the complexity term of casting
   time; 1.0 is bare hands and lower is better. Precious metals conduct
   magic (Materials); base metals do not. House defaults. */
export const CATALYST_PRESETS = {
  1.00: "None — bare hands",
  0.90: "Wand (conductive metal or crystal)",
  0.80: "Staff (robust, rare conductive material)",
  0.75: "Rod (conductive metal, amplifying arts)",
  0.65: "Orb (refined gem, spreads ξ into area)"
};

/* -------------------------------------------------------------------
 * Derivations
 * ----------------------------------------------------------------- */
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** A small stable string hash — picks a custom effect's glyph and voice, names files. */
export const hashString = (s) => Array.from(String(s)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The part of a build that decides its sigil and sound — everything but the name and notes. */
export const buildShapeKey = (build) => { const { name: _n, notes: _t, persistence: _p, ...shape } = build ?? {}; return hashString(JSON.stringify(shape)).toString(36); };
export const round1 = (n) => Math.round(n * 10) / 10;

/** Skill S from a Mythras percentage. HOUSE RULING: 50% is S = 1. */
export const skillToS = (percent, divisor = 50) =>
  Math.max(0.1, (Number(percent) || 0) / (Number(divisor) || 50));

/**
 * Turn an expected damage value into a dice expression whose average is
 * close to it. Whole d6s first, the remainder flat; below one die, a
 * single small die. HOUSE RULING — the source stops at "derived from ξ".
 */
export function damageFormula(expected) {
  const E = Math.max(0, Number(expected) || 0);
  if (E < 1) return "1";
  const n = Math.floor(E / 3.5);
  if (n < 1) return `1d${clamp(Math.round(2 * E - 1), 2, 6)}`;
  const r = Math.round(E - 3.5 * n);
  return r > 0 ? `${n}d6+${r}` : `${n}d6`;
}

/** Default caster parameters — used when nothing better is known. */
export const DEFAULT_CASTER = Object.freeze({
  skill: 50, skillDivisor: 50, focus: 1.0, catalyst: 1.0, stored: 0, xiPerDamage: 2
});

/** An empty spell — a Projectile of Fire with 5 ξ behind it. */
export function blankBuild() {
  return {
    name: "New Spell",
    intent: "Offensive",
    conversion: "Base",
    form: "Projectile",
    range: 1,
    size: 1,
    effects: [{ effect: "Elemental", element: "Fire" }],
    utilities: [],
    power: 5,
    notes: "",
    persistence: "instant"
  };
}

/** Coerce anything vaguely build-shaped into a valid build. */
export function normalizeBuild(raw = {}) {
  const b = blankBuild();
  const src = raw ?? {};
  b.name = String(src.name ?? b.name).trim() || "Unnamed Spell";
  if (INTENTS[src.intent]) b.intent = src.intent;
  if (CONVERSIONS[src.conversion]) b.conversion = src.conversion;
  if (FORMS[src.form]) b.form = src.form;
  b.range = RANGES[Number(src.range)] ? Number(src.range) : 1;
  b.size = SIZES[Number(src.size)] ? Number(src.size) : 1;
  b.power = clamp(Number(src.power) || 1, 1, 1000);
  b.notes = String(src.notes ?? "");
  b.persistence = PERSISTENCE[src.persistence] ? src.persistence : "instant";

  const effects = Array.isArray(src.effects) ? src.effects : [];
  b.effects = effects
    .map(e => (typeof e === "string" ? { effect: e } : e))
    .filter(e => e && EFFECTS[e.effect])
    .map(e => EFFECTS[e.effect].element
      ? { effect: e.effect, element: DAMAGE_TYPES[e.element] ? e.element : "Fire" }
      : { effect: e.effect });
  // De-duplicate: one Barrier is one Barrier; one Fire is one Fire.
  const seen = new Set();
  b.effects = b.effects.filter(e => {
    const k = `${e.effect}|${e.element ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  if (!b.effects.length) b.effects = [];

  const utils = Array.isArray(src.utilities) ? src.utilities : [];
  b.utilities = utils
    .filter(u => u && UTILITY_NODES[u.node])
    .map(u => ({ node: u.node, count: Math.max(1, Math.floor(Number(u.count) || 1)),
                 level: Math.max(1, Math.floor(Number(u.level) || 1)) }));
  return b;
}

/**
 * Validate a build against the catalogue.
 * Returns { errors, warnings } — errors block casting, warnings don't.
 */
export function validateBuild(build) {
  const errors = [], warnings = [];
  const b = build;

  if (!b.effects.length) errors.push("A spell needs at least one Effect node.");

  // The Attack Spell rule — the one hard constraint in the source.
  if (b.intent === "Offensive" && !b.effects.some(e => EFFECTS[e.effect]?.damage)) {
    errors.push("An Offensive (Attack) Intent must include an Effect node capable of dealing damage. " +
                "Light, Illusion, Link and Resonance cannot stand alone.");
  }

  // Advisory: the catalogue's Intent column. One line per set of intents,
  // naming the effects by what the player picked (Fire, not "Elemental").
  const mismatched = new Map();
  for (const e of b.effects) {
    const def = EFFECTS[e.effect];
    if (!def || def.intents.includes(b.intent)) continue;
    const intents = def.intents.join(" / ");
    if (!mismatched.has(intents)) mismatched.set(intents, []);
    const name = e.element ?? def.label ?? e.effect;
    if (!mismatched.get(intents).includes(name)) mismatched.get(intents).push(name);
  }
  for (const [intents, names] of mismatched) {
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are` : `${names[0]} is`;
    warnings.push(`${list} catalogued for ${intents} intent, not ${b.intent}.`);
  }
  if (b.intent === "Creation" && !b.effects.some(e => EFFECTS[e.effect]?.category === "Construct Magic")) {
    warnings.push("Creation intent usually carries a Construct Magic effect.");
  }
  if (b.form === "Touch" && b.range > 1) warnings.push("Touch has no reach — range beyond Close does nothing but cost ξ.");
  if (b.form === "Self" && b.size > 1) warnings.push("Self is one body — a larger Size only costs ξ.");
  if (b.form === "Self" && b.range > 1) warnings.push("Self has no range.");
  return { errors, warnings };
}

/**
 * The whole Spell Builder in one function.
 *
 *   ξ       = N × Π(node ξ multipliers)
 *   C       = Σ(node complexity) × conversion factor
 *   Œ       = ξ × 1/(F × S) × conversion Orie modifier        (First Principle)
 *   Œ_final = Œ × Γ                                            (Second Principle)
 *   Œ_conv  = Œ_final − Stored Orie   (what is actually converted, and heats)
 *   H       = Œ_conv^1.3 × C/6                                 (Heat Formula)
 *   T_cast  = 4 s + C × Γ                                      (Casting Time)
 *   M       = ξ                                                (Might)
 *
 * @param {object} build   normalised build
 * @param {object} caster  { skill, skillDivisor, focus, catalyst, stored, xiPerDamage }
 */
export function evaluateSpell(build, caster = {}) {
  const b = normalizeBuild(build);
  const c = { ...DEFAULT_CASTER, ...Object.fromEntries(Object.entries(caster).filter(([, v]) => v !== undefined && v !== null && v !== "")) };

  const intent = INTENTS[b.intent];
  const conv = CONVERSIONS[b.conversion];
  const form = FORMS[b.form];
  const range = RANGES[b.range];
  const size = SIZES[b.size];

  // --- ξ ---
  const lines = [];      // multiplier breakdown for the sheet
  let xiMult = 1;
  const push = (label, mult, dc) => { lines.push({ label, mult, dc }); xiMult *= mult; };
  push(`${b.intent} intent`, intent.xi, intent.complexity);
  push(`${b.form} form`, form.xi, form.complexity);
  push(`${range.label} range`, range.xi, 0);
  push(`${size.label} size`, size.xi, 0);
  const utilities = b.utilities.map(u => {
    const v = utilityNodeValues(u);
    push(v.label, v.xi, v.dc);
    return { ...u, ...v };
  });
  const shapeMod = form.xi * range.xi * size.xi;
  const xi = b.power * xiMult;

  // --- Complexity ---
  let complexityRaw = intent.complexity + form.complexity;
  const effects = b.effects.map(e => {
    const def = EFFECTS[e.effect];
    const compound = e.element && DAMAGE_TYPES[e.element]?.compound ? COMPOUND_COMPLEXITY_BONUS : 0;
    const cx = def.complexity + compound;
    complexityRaw += cx;
    const label = def.label ?? e.effect;
    lines.push({ label: e.element ? `${e.element} (${label})` : label, mult: 1, dc: cx });
    return { ...e, def, label, complexity: cx, compound: Boolean(compound) };
  });
  utilities.forEach(u => { complexityRaw += u.dc; });
  const complexity = complexityRaw * conv.complexityFactor;

  // --- Orie ---
  const F = clamp(Number(c.focus) || 1, 0.1, 2);
  const S = skillToS(c.skill, c.skillDivisor);
  const G = clamp(Number(c.catalyst) || 1, 0.1, 2);
  const orieBase = xi * (1 / (F * S)) * conv.orie;
  const orieFinal = orieBase * G;
  const stored = clamp(Number(c.stored) || 0, 0, orieFinal);
  const orieConverted = Math.max(0, orieFinal - stored);

  // --- Heat, time, might ---
  const heat = Math.pow(orieConverted, 1.3) * (complexity / 6);
  const castTime = 4 + complexity * G;
  const might = xi;
  const tier = tierFor(xi);

  // --- Effects at this Might ---
  // HOUSE RULING: several effects share the ξ evenly for magnitude, and
  // Split branches share it again (a Combiner stops the first sharing);
  // cost and Heat are paid on the whole.
  const flow = flowOf(b);
  const xiPerDamage = Math.max(0.1, Number(c.xiPerDamage) || 2);
  const effectLines = effectsAtMight(effects, might, { combined: flow.combined, branches: flow.branches, xiPerDamage });
  const share = mightShare(effects.length, flow);

  const validity = validateBuild(b);

  return {
    build: b,
    caster: { skill: Number(c.skill) || 0, S: round1(S * 100) / 100, F, G, stored, skillDivisor: c.skillDivisor, xiPerDamage },
    xi: round1(xi), xiMult: Math.round(xiMult * 1000) / 1000, shapeMod: Math.round(shapeMod * 1000) / 1000,
    complexityRaw, complexity: round1(complexity),
    orieBase: round1(orieBase), orieFinal: round1(orieFinal), orieConverted: round1(orieConverted),
    mpCost: Math.ceil(orieConverted - 1e-9),
    heat: round1(heat), castTime: round1(castTime),
    might: round1(might), tier,
    difficulty: TIER_DIFFICULTY[tier.tier],
    difficultyLabel: DIFFICULTY_GRADES.find(g => g.key === TIER_DIFFICULTY[tier.tier])?.label ?? "Standard",
    lines, effects: effectLines, utilities, flow, share,
    errors: validity.errors, warnings: validity.warnings,
    valid: validity.errors.length === 0
  };
}

/** Seconds → Mythras rounds/turns, given the table's round length. */
export function castTimeLabel(seconds, roundSeconds = 5) {
  const s = Number(seconds) || 0;
  const r = Number(roundSeconds) || 5;
  const rounds = s / r;
  if (rounds <= 1) return `${round1(s)} s (within one Round)`;
  if (rounds < 12) return `${round1(s)} s (${round1(rounds)} Rounds)`;
  return `${round1(s)} s (${round1(s / 60)} min)`;
}

/** Text summary of a build, for names, tooltips and chat. */
export function describeBuild(build) {
  const b = normalizeBuild(build);
  const fx = b.effects.map(e => e.element ?? effectLabel(e.effect)).join(" + ") || "no effect";
  const u = b.utilities.length ? ` · ${b.utilities.map(x => utilityNodeValues(x).label).join(", ")}` : "";
  return `${b.intent} ${b.form} of ${fx}, ${RANGES[b.range].label}/${SIZES[b.size].label}, ${b.conversion}${u} · N=${b.power}`;
}

/* ---------------------------------------------------------------------
 * Wearable radiators — HOUSE RULE
 *
 * The world records only that wearable radiators "dissipate conversion
 * heat, not planar heat" (The Melfyrium Cycle), and the Materials table
 * records each metal's thermal conductivity. Built from those two facts:
 * a carried radiator adds ⌊conductance ÷ 100⌋ Heat to what its wearer
 * vents each Melee Round. Silver sheds 4, copper 4, gold 3, iron none.
 * ------------------------------------------------------------------- */
export const RADIATOR_MATERIALS = {
  Alumium: 237, Argentum: 429, Aurum: 317, Chrom: 94, Cobold: 100, Cuprium: 400, Ferrium: 80,
  Irid: 150, Ledin: 35, Magnes: 156, Mangan: 105, Nicklor: 91, Osmi: 87, Pallad: 72, Platina: 72,
  Rhod: 150, Ruth: 150, Tinn: 66, Titane: 22, Zinkor: 116
};
export const radiatorVent = (material) => Math.floor((RADIATOR_MATERIALS[material] ?? 0) / 100);

/* ===================================================================
 * Spell persistence (Mechanical Casting: "Spell Persistence & Decay")
 *
 * Every spell that outlasts its casting is one of these:
 *   Self-sustaining  "You build it, and the world carries it." Heat once,
 *                    at casting; ξ(t) = ξ₀ × e^(−kt).
 *   Maintained       "You keep the wound open by will alone." ξ holds,
 *                    but Heat_maintained = Heat_base × (t / Δt_unit): the
 *                    spell's Heat again every Melee Round. It collapses
 *                    when the caster lets go — or when the Heat overflows.
 *   Transitional     Maintained until released; then self-sustaining.
 *
 * HOUSE RULES, both settings: t is counted in Melee Rounds (the canon
 * gives no unit), with k = 0.2; a self-sustaining spell has faded when
 * its ξ falls below 1.
 * =================================================================== */
export const PERSISTENCE = {
  instant:      { label: "Instant",         desc: "Done when it is cast." },
  sustaining:   { label: "Self-sustaining", desc: "You build it, and the world carries it: Heat once, at casting; then its ξ fades, ξ₀ × e^(−kt)." },
  maintained:   { label: "Maintained",      desc: "You keep the wound open by will alone: its ξ holds, but its Heat comes again every Melee Round until you let go or it overflows." },
  transitional: { label: "Transitional",    desc: "Maintained until you release it; then it stands on its own and fades like a self-sustaining spell." }
};
export const DECAY_K = 0.2;
export const FADED_XI = 1;

/** ξ left in a self-sustaining structure after `rounds` Melee Rounds. */
export const decayedXi = (xi0, k, rounds) => (Number(xi0) || 0) * Math.exp(-(Number(k) || 0) * Math.max(0, Number(rounds) || 0));

/* --- Shield and Barrier, from the Effect node magnitudes ---------------
 * Shield: "a pool of temporary HP. Physical damage hits this pool
 *   first; when it hits zero, the shield breaks." Some effects bypass it.
 * Barrier: the Node Catalogue says it "reduces magic damage by
 *   percentage"; Mechanical Casting says it "converts incoming magical
 *   damage directly into Heat for the barrier's caster", and collapses
 *   when that Heat passes the caster's tolerance. Read together: it stops
 *   its percentage of magical damage, and what it stops becomes Heat. */
export const shieldPoints = (might) => Math.max(1, Math.round(Number(might) || 0));
export const barrierPercent = (might) => Math.min(90, Math.max(5, Math.round((Number(might) || 0) * 2)));

/** Physical damage against a shield pool. */
export function absorbByShield(damage, pool) {
  const d = Math.max(0, Math.floor(Number(damage) || 0)), p = Math.max(0, Math.floor(Number(pool) || 0));
  const absorbed = Math.min(d, p);
  return { absorbed, through: d - absorbed, pool: p - absorbed, broken: p > 0 && p - absorbed <= 0 };
}

/** Magical damage against a barrier. */
export function absorbByBarrier(damage, percent) {
  const d = Math.max(0, Math.floor(Number(damage) || 0));
  const stopped = Math.min(d, Math.round(d * (Number(percent) || 0) / 100));
  return { stopped, through: d - stopped };
}

/* ===================================================================
 * Flow control — what the Utility nodes do at the table. HOUSE RULES:
 * the Node Catalogue gives each node a one-line function and its
 * costs; these are the table procedures built from those lines.
 *
 *   Split ×N   N+1 branches, each carrying Might ÷ (N+1), each rolled
 *   Combiner   Effect nodes stop sharing Might: each gets all of it
 *   Sync       damage effects land as one roll, at one hit location
 *   Mirror     a second chain at half Might
 *   Delay ×N   the effects release 3 s × N after casting
 *   Echo       the effects repeat a Melee Round later at half Might
 *   Gate       primed, not released: waits for the caster's trigger,
 *              fading as e^(−kt) while it waits
 *   Orbit      a lasting spell strikes its target again every round
 *   Link ×N    one lasting Shield/Barrier pool shared by N+1 allies
 *   Field      everyone within the spell's area
 *   Anchor     a lasting spell holds a place, not a person
 *   Collapse   ending it releases everything still pending at once,
 *              and a standing structure bursts for Force damage from
 *              the ξ it still holds
 *   Amplifier, Adaptive   raise ξ, and so Might (Might = ξ)
 * =================================================================== */
export const MIRROR_SCALE = 0.5;
export const ECHO_SCALE = 0.5;
export const DELAY_SECONDS = 3;

/** Area radius in metres for each Size tier (the catalogue's feet, at 0.3 m). */
export const SIZE_RADIUS_M = { 1: 1.5, 2: 3, 3: 6, 4: 10.5, 5: 15 };

/** What a build's Utility nodes do. */
export function flowOf(build) {
  const has = (n) => (build?.utilities ?? []).find(u => u.node === n) ?? null;
  const count = (u) => Math.max(1, Math.floor(Number(u?.count) || 1));
  const split = has("Split"), delay = has("Delay"), link = has("Link");
  return {
    branches: split ? count(split) + 1 : 1,
    combined: Boolean(has("Combiner")),
    synced: Boolean(has("Sync")),
    mirror: Boolean(has("Mirror")),
    delaySeconds: delay ? DELAY_SECONDS * count(delay) : 0,
    echo: Boolean(has("Echo")),
    gated: Boolean(has("Gate")),
    orbit: Boolean(has("Orbit")),
    linked: link ? count(link) : 0,
    field: Boolean(has("Field")),
    anchored: Boolean(has("Anchor")),
    collapse: Boolean(has("Collapse"))
  };
}

/** The fraction of the spell's Might each effect gets, on each branch. */
export const mightShare = (effectCount, flow) =>
  (flow?.combined || !effectCount ? 1 : 1 / effectCount) / Math.max(1, flow?.branches ?? 1);

/**
 * Effect lines at a given total Might. `effects` are evaluated effect
 * entries ({ effect, def, label, element, compound }); the result is
 * what the card and the bench show.
 */
export function effectsAtMight(effects, might, { combined = false, branches = 1, xiPerDamage = 2 } = {}) {
  const each = (Number(might) || 0) * mightShare(effects.length, { combined, branches });
  return effects.map(e => {
    const dmg = e.def.damage ? damageFormula(each / Math.max(0.1, xiPerDamage)) : null;
    let text;
    try { text = e.def.magnitude(each, { damageFormula: dmg, element: e.element }); }
    catch { text = e.effect; }
    return {
      effect: e.effect, label: e.label, element: e.element ?? null, category: e.def.category,
      damage: Boolean(e.def.damage), formula: dmg, compound: e.compound,
      might: round1(each), text
    };
  });
}

/** Re-derive a build's effect lines at a scaled Might (Mirror, Echo, a fading Gate). */
export function effectsScaled(build, caster, scale = 1) {
  const ev = evaluateSpell(build, caster);
  const b = normalizeBuild(build);
  const entries = b.effects.map(e => {
    const def = EFFECTS[e.effect];
    const compound = e.element && DAMAGE_TYPES[e.element]?.compound ? COMPOUND_COMPLEXITY_BONUS : 0;
    return { ...e, def, label: def.label ?? e.effect, compound: Boolean(compound) };
  });
  return effectsAtMight(entries, ev.might * scale, { combined: ev.flow.combined, branches: ev.flow.branches, xiPerDamage: ev.caster.xiPerDamage });
}

/** Sync: several damage rolls become one. */
export const syncFormula = (formulas) => formulas.filter(Boolean).join(" + ") || null;
