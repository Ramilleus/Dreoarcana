/* ===================================================================
 * Dreoarcana Alchemy — the rules, as data.
 *
 * The single source of truth for the Laboratory. Section numbers (§)
 * refer to the canon alchemy document, "Mythras Alchemy System.md"
 * (Gavin's Vault, Canon/05 - Systems); page numbers (p.) refer to the
 * Mythras rulebook, 3rd printing, which governs every roll.
 *
 * PURE: no Foundry globals, no I/O.
 * =================================================================== */

import { outcomeFor } from "../arcana/rules.js";

/* --- §3 Difficulty Grades, keyed by effective Potency -------------
 * The canon document uses Mythras' Simplified Difficulty Grades — flat
 * percentages rather than multipliers — which the rulebook offers as
 * an alternative to the standard table (Skills, p.38). */
export const DIFFICULTY = {
  1: { label: "Very Easy",  mod:  40 },
  2: { label: "Easy",       mod:  20 },
  3: { label: "Standard",   mod:   0 },
  4: { label: "Hard",       mod: -20 },
  5: { label: "Formidable", mod: -40 },
  6: { label: "Herculean",  mod: -80 }
};

/* --- §3 Condition ------------------------------------------------- */
export const CONDITIONS = {
  "-1": "Degraded (Old / Stale)",
  "0": "Sound (Standard / Fresh)",
  "1": "Enhanced (Excellent / Concentrated / Pure)"
};

/* --- §5 Quality: duration, yield cap, magnitude ------------------- */
export const QUALITY = {
  Trash:    { tier: "Fumble",   rounds: 0,  portions: 0,  mult: 0,   note: "Ruined; the batch is lost" },
  Mundane:  { tier: "Failure",  rounds: 1,  portions: 3,  mult: 1 },
  Basic:    { tier: "Success-", rounds: 4,  portions: 6,  mult: 1.25, variant: true },
  Good:     { tier: "Success",  rounds: 7,  portions: 9,  mult: 1.5 },
  Fine:     { tier: "Success+", rounds: 10, portions: 12, mult: 1.75, variant: true },
  Greater:  { tier: "Special",  rounds: 13, portions: 15, mult: 2 },
  Superior: { tier: "Critical", rounds: 16, portions: 18, mult: 3,
              note: "Every effect on the combined ingredients manifests, not just overlaps" }
};

/* --- §7 Volatility (Mechanical only, Potency 4+) ------------------ */
export const VOLATILITY = {
  1: null, 2: null, 3: null,
  4: { damage: "1d6", radius: 2, ignoresArmour: false, note: "A sharp prismatic crack; ignites flammables" },
  5: { damage: "2d6", radius: 4, ignoresArmour: true,  note: "Leaves a lingering Flux disturbance for minutes" },
  6: { damage: "4d6", radius: 8, ignoresArmour: true,  note: "Blast plus a brief Flux zone" },
  7: { damage: "4d6", radius: 12, ignoresArmour: true, note: "Supercritical — always volatile, radius one step wider" }
};

/* --- §7 Dermal absorption ----------------------------------------- */
export const ABSORPTION = {
  1: null, 2: null, 3: null,
  4: "Partial: half the batch's effects manifest, at half Duration",
  5: "Full effect, delayed by 1d3 Melee Rounds",
  6: "Full effect, immediate",
  7: "Instant, and delivers all 49 Orie to the saturation check"
};

/* --- §9 Containers: one charge = 50 mL = one dose ----------------- */
export const SIZES = {
  Tiny:       { mL: 50,   charges: 1,   cost: "1 gp" },
  Small:      { mL: 100,  charges: 2,   cost: "2 gp" },
  Standard:   { mL: 250,  charges: 5,   cost: "5 gp" },
  Medium:     { mL: 500,  charges: 10,  cost: "10 gp" },
  Large:      { mL: 750,  charges: 15,  cost: "15 gp" },
  Huge:       { mL: 1000, charges: 20,  cost: "20 gp" },
  Gargantuan: { mL: 5000, charges: 100, cost: "100 gp" }
};

/* --- §9 Physical ceiling ------------------------------------------ */
export const DOSE_ML = 50;
export const MAX_POTENCY = 6;          // normal ceiling
export const SUPERCRITICAL = 7;        // 49 mL in a 50 mL dose
export const MAX_ORIE_PER_DOSE = 49;   // beyond this, overflow detonates

/* --- §6 Effect glossary -------------------------------------------
 * arcane: requires a magical source (ξ)
 * text(p, q): the mechanic, with Potency p and Quality multiplier q
 * ------------------------------------------------------------------ */
const scaled = (p, q, base) => Math.floor(base * p * q);

/**
 * Magnitude at a given Potency and Quality.
 *
 * Quality is supposed to multiply what an effect actually does (§5), but
 * only the percentage wards were using it — which made a Superior healing
 * potion identical to a Good one. Anything with a number attached now
 * runs through here.
 *
 * Deliberately NOT scaled by Quality:
 *   • raw Orie doses (§8) — a physical quantity of Melfyrium, not craft
 *   • Action Points — capped at +1 because AP is the strongest currency
 *     in Mythras combat
 *   • binary abilities (Waterbreathing, Cat's Eye, Foresight…) — you
 *     either can breathe water or you can't
 */
const mag = (p, q = 1, base = 1) => Math.max(1, Math.floor(base * p * (q || 1)));

export const EFFECTS = {
  // Wards
  "Resist Acid":       { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. acid, for Duration` },
  "Resist Disease":    { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. disease, for Duration` },
  "Resist Exhaustion": { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance vs. fatigue, for Duration` },
  "Resist Fire":       { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. fire, for Duration` },
  "Resist Frost":      { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. cold, for Duration` },
  "Resist Lightning":  { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. lightning, for Duration` },
  "Resist Necrotic":   { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. necrotic, for Duration` },
  "Resist Petrify":    { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Resistance vs. petrification, for Duration` },
  "Resist Poison":     { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance vs. poison, for Duration` },
  "Resist Radiant":    { cat: "Ward", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance/Resistance vs. radiant, for Duration` },

  // Minor wards — single instance
  "Aversion to Fire":      { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of fire, then expires` },
  "Aversion to Frost":     { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of cold, then expires` },
  "Aversion to Lightning": { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of lightning, then expires` },
  "Aversion to Necrotic":  { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of necrotic, then expires` },
  "Aversion to Poison":    { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of poison, then expires` },
  "Aversion to Radiant":   { cat: "Ward (minor)", text: (p, q) => `+${scaled(p, q, 10)}% vs. one specific instance of radiant, then expires` },

  // Resilience & healing
  "Fortify Self":        { cat: "Resilience", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance rolls, for Duration` },
  "Fortify Restoration": { cat: "Resilience", text: (p, q) => `+${scaled(p, q, 10)}% to Endurance rolls, for Duration` },
  "Restore Health":      { cat: "Healing",    text: (p, q) => `Heals ${mag(p, q)} HP to one damaged hit location${p >= 5 ? "; can restore a location below 0" : ""}` },
  "Regenerate Health":   { cat: "Healing",    text: (p, q) => `Heals 1 HP per Melee Round to one damaged location, up to ${mag(p, q)} HP total` },
  "Cure Disease":        { cat: "Cure",       text: (p, q) => `Opposed: potion POT ${mag(p, q, 10)} vs. the disease's POT; failure still reduces it by ${mag(p, q)}` },
  "Cure Poison":         { cat: "Cure",       text: (p, q) => `Opposed: potion POT ${mag(p, q, 10)} vs. the poison's POT; failure still reduces it by ${mag(p, q)}` },
  "Lower Toxicity":      { cat: "Detox",      text: (p, q) => `Reduces an active toxin's POT by ${mag(p, q, 2)}` },

  // Resource
  "Restore Melfyrium": { cat: "Resource", arcane: true,
    text: (p, q) => `Restores ${scaled(p, q, 1)} Stored Orie. Counts toward the drinker's saturation capacity (§8)` },

  // Toxic / damaging
  // The Orie dose is a physical quantity (§8) and doesn't scale with craft;
  // the harm it does when it lands is a magnitude, and does.
  "Poison":             { cat: "Toxic", text: (p, q) => `Toxic, POT ${mag(p, q, 10)}: raw dose ${p * p} Orie vs. SIZ capacity (§8)` },
  "Toxicity":           { cat: "Toxic", text: (p, q) => `Toxic, POT ${mag(p, q, 10)}: raw dose ${p * p} Orie vs. SIZ capacity (§8)` },
  "Acid":               { cat: "Toxic", text: (p, q) => `Corrosive, ${mag(p, q)} damage: raw dose ${p * p} Orie vs. SIZ capacity (§8)` },
  "Disease":            { cat: "Toxic", text: (p, q) => `Infectious, POT ${mag(p, q, 10)}: raw dose ${p * p} Orie vs. SIZ capacity (§8)` },
  "Damage Health":      { cat: "Toxic", text: (p, q) => `Deals ${mag(p, q)} damage to a random hit location; raw dose ${p * p} Orie (§8)` },
  "Nausea":             { cat: "Toxic", text: (p, q) => `Nauseating, POT ${mag(p, q, 10)}: raw dose ${p * p} Orie vs. SIZ capacity (§8)` },
  "Drain Intelligence": { cat: "Toxic", text: (p, q) => `Drains ${mag(p, q)} INT on a failed Resistance Roll; dose ${p * p} Orie (§8)` },
  "Drain Max HP":       { cat: "Toxic", text: (p, q) => `Drains ${mag(p, q)} maximum HP on a failed Resistance Roll; dose ${p * p} Orie (§8)` },
  "Explode":            { cat: "Toxic", arcane: true,
    text: (p) => `Volatile at any Potency; detonates one step above ${p} (§7)` },
  "Petrify":            { cat: "Toxic", arcane: true, text: (p, q) => `Petrifying: Resistance Roll vs. POT ${mag(p, q, 10)}` },
  "Cursed":             { cat: "Toxic", arcane: true, text: (p, q) => `Curse: Resistance Roll vs. POT ${mag(p, q, 10)}` },

  // Tempo
  "Speed": { cat: "Tempo", arcane: true,
    text: (p) => p >= 4 ? "+1 Action Point for Duration (never stacks past +1)" : "No effect below Potency 4" },
  "Slow":  { cat: "Tempo", text: (p, q) => `Target Resists (Endurance vs. POT ${mag(p, q, 10)}) or loses 1 Action Point` },

  // Combat state
  "Frenzy":         { cat: "Combat", text: (p, q) => `+${scaled(p, q, 10)}% Combat Style, −${scaled(p, q, 10)}% Evade and INT skills; can't disengage` },
  "Wild":           { cat: "Combat", arcane: true, text: () => `GM rolls a random Special Effect on each successful attack` },
  "Liquid Courage": { cat: "Combat", text: (p, q) => `+${scaled(p, q, 10)}% Willpower vs. fear, intimidation, despair` },
  "Fear":           { cat: "Combat", arcane: true, text: (p, q) => `Target Resists (Willpower vs. POT ${mag(p, q, 10)}) or flees/freezes` },

  // Utility & senses
  "Waterbreathing": { cat: "Utility", arcane: true, text: () => `Breathe water freely, for Duration` },
  "Lucky":          { cat: "Luck",    arcane: true, text: (p) => `+${p >= 5 ? 2 : 1} Luck Point for the scene` },
  "Labor":          { cat: "Endurance", text: () => `Removes one Fatigue level; delays the next by Duration` },
  "Cat's Eye":      { cat: "Senses",  arcane: true, text: () => `See normally in dim light; treat darkness as dim` },
  "Light":          { cat: "Senses",  arcane: true, text: (p, q) => `Light in a ${mag(p, q, 2)} m radius, for Duration` },
  "Darkness":       { cat: "Senses",  arcane: true, text: (p, q) => `Quenches light in a ${mag(p, q, 2)} m radius, for Duration` },
  "Detect Life":    { cat: "Senses",  arcane: true, text: (p, q) => `Sense living creatures within ${mag(p, q, 10)} m, through obstacles` },
  "Detect Undead":  { cat: "Senses",  arcane: true, text: (p, q) => `Sense undead within ${mag(p, q, 10)} m, through obstacles` },
  "Foresight":      { cat: "Senses",  arcane: true, text: () => `Reroll one failed roll, or force one enemy reroll` },

  // Divine
  "Holy":         { cat: "Divine", arcane: true, text: (p, q) => `Harms undead only: POT ${mag(p, q, 10)}; harmless to the living` },
  "Damage Undead":{ cat: "Divine", arcane: true, text: (p, q) => `Harms undead only: POT ${mag(p, q, 10)}; harmless to the living` },

  // Mental
  "Increase Intelligence": { cat: "Mental", arcane: true, text: (p, q) => `+${scaled(p, q, 5)}% to all INT-based skills, for Duration` },

  // Flavour
  "Hair Growth": { cat: "Flavour", text: () => `No mechanical effect — cosmetic` },
  "Midas Touch": { cat: "Flavour", arcane: true, text: () => `Gilds a small object's surface; no mechanical effect` }
};

/* Derived: the set of effects requiring a magical source. */
export const ARCANE_EFFECTS = new Set(
  Object.entries(EFFECTS).filter(([, v]) => v.arcane).map(([k]) => k)
);

export const EFFECT_NAMES = Object.keys(EFFECTS).sort();

export const RARITIES = [
  "Common", "Uncommon", "Unusual", "Rare", "Very Rare", "Legendary", "Mythic"
];

export const CLASSES = ["Mechanical", "Mystical", "Mundane"];

/* --- Derivations -------------------------------------------------- */

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** §3 Effective Potency from an ingredient's Grade plus its Condition. */
export const effectivePotency = (grade, condition = 0) =>
  Number.isInteger(grade) ? clamp(grade + Number(condition || 0), 1, MAX_POTENCY) : null;

/** §3 Orie an ingredient contributes to the batch pool. */
export const oriePool = (ingredients) =>
  ingredients.reduce((sum, ing) => {
    const p = effectivePotency(ing.grade, ing.condition);
    return sum + (ing.class === "Mechanical" && p ? p * p : 0);
  }, 0);

/** §9 Potency per dose = floor(sqrt(pool / doses)). */
export function potencyPerDose(pool, doses) {
  if (!doses || doses < 1) return 0;
  return Math.floor(Math.sqrt(pool / doses));
}

/** §9 Fewest doses that keep every dose at or below Supercritical. */
export const minimumDoses = (pool) => Math.max(1, Math.ceil(pool / MAX_ORIE_PER_DOSE));

/* --- §3b Mothers: the liquid you brew into --------------------------
 * A Mother is the solvent, not a reagent. It supplies the volume, sets
 * the potion's Class, and its own effects still count toward overlap —
 * but it sits outside the 2–3 reagent limit.
 *
 * Mother - Water (Clean) carries no effects at all, which is exactly
 * right for a neutral base and was the clue that the data already
 * worked this way.
 * ------------------------------------------------------------------ */

/** Is this ingredient a Mother? Recognised by the naming convention. */
export const isMother = (rec) =>
  Boolean(rec?.mother) || /^mother\s*[-–]/i.test(rec?.name ?? "");

/**
 * How many doses a Mother can fill.
 *
 * Liquids are recorded by weight, and at water's density a kilogram is a
 * litre — so one unit fills twenty 50 mL doses, and a stack of three
 * fills sixty. Anything without a recorded weight gets a modest default
 * rather than blocking the brew.
 *
 * When nobody is holding the Mother (browsing the compendium rather than
 * a character's pack) there is no stock to run out of, so capacity is
 * effectively unbounded.
 */
export function motherDoses(rec, { unbounded = false } = {}) {
  if (unbounded) return 9999;
  const kg = Number(rec?.weight ?? rec?.doc?.system?.encumbrance ?? 0);
  const qty = Math.max(1, Number(rec?.quantity ?? rec?.doc?.system?.quantity ?? 1));
  const perUnit = kg ? Math.floor((kg * 1000) / DOSE_ML) : 5;
  return Math.max(1, perUnit * qty);
}

/** Doses one unit of a Mother yields — what boils off is measured against this. */
export function motherDosesPerUnit(rec) {
  const kg = Number(rec?.weight ?? rec?.doc?.system?.encumbrance ?? 0);
  return kg ? Math.max(1, Math.floor((kg * 1000) / DOSE_ML)) : 5;
}

/**
 * Units of Mother consumed to fill a given number of doses. You open as
 * many measures as you need; whatever is left in the last one boils off
 * with the brew rather than going back in the bottle.
 */
export const motherUnitsSpent = (rec, doses) =>
  Math.max(1, Math.ceil(doses / motherDosesPerUnit(rec)));

/**
 * §3a The Mother decides the potion's Class where it has one of its own.
 * A neutral (Mundane) Mother defers to the reagents — so Holy Water makes
 * a brew Mystical, Fey Dew makes it Mechanical, and Clean Water gets out
 * of the way.
 */
export function resolveClass({ mother, reagents = [], channelledXi = 0 }) {
  if (mother?.class === "Mystical") return "Mystical";
  if (mother?.class === "Mechanical") return "Mechanical";

  if (channelledXi > 0) return "Mechanical";
  if (reagents.some(r => r.class === "Mechanical")) return "Mechanical";
  if (reagents.some(r => r.class === "Mystical")) return "Mystical";
  return "Mundane";
}

/** One record per kind of ingredient: two stacks of the same thing are one ingredient (§4). */
export const distinctIngredients = (ingredients) => {
  const seen = new Set();
  return ingredients.filter(i => { const k = i.trueName || i.name; if (seen.has(k)) return false; seen.add(k); return true; });
};

/** §4 Effects shared by 2+ ingredients (Skyrim-style overlap). */
export function overlappingEffects(ingredients) {
  const count = {};
  for (const ing of distinctIngredients(ingredients)) {
    for (const e of new Set(ing.effects ?? [])) count[e] = (count[e] ?? 0) + 1;
  }
  return Object.entries(count).filter(([, n]) => n >= 2).map(([e]) => e);
}

/** Render one effect's mechanic at a given Potency and Quality. */
export function describeEffect(name, potency, qualityMult = 1) {
  const rule = EFFECTS[name];
  if (!rule) return name;
  try { return rule.text(potency, qualityMult); }
  catch { return name; }
}

/** §3a Class contradictions: Mundane can't produce ξ effects. */
export function classContradiction(cls, effects = []) {
  if (cls !== "Mundane") return [];
  return effects.filter(e => ARCANE_EFFECTS.has(e));
}

/* --- §6a Slot falloff ---------------------------------------------
 * An ingredient's four effect slots are ordered by strength. The
 * Primary is what the raw ingredient does when eaten; each later slot
 * is one step weaker, and only surfaces through proper brewing.
 * ------------------------------------------------------------------ */
export const SLOT_NAMES = ["Primary", "Secondary", "Tertiary", "Quaternary"];

/** Effective Potency for an effect sitting in slot i (0-based). */
export const slotPotency = (potency, slotIndex) =>
  Math.max(0, potency - slotIndex);

/**
 * Where an effect sits across the combined ingredients.
 * Overlap uses the BEST (earliest) slot any contributor offers it —
 * a Primary source carries the weaker partner.
 */
export function bestSlot(ingredients, effect) {
  let best = Infinity;
  for (const ing of ingredients) {
    const slots = ing.slots ?? ing.effects ?? [];
    const i = slots.findIndex(e => e === effect);
    if (i >= 0 && i < best) best = i;
  }
  return Number.isFinite(best) ? best : null;
}

/** Which effects appear on 2+ ingredients, with their best slot. */
export function overlapWithSlots(ingredients) {
  const count = {};
  for (const ing of distinctIngredients(ingredients)) {
    const slots = (ing.slots ?? ing.effects ?? []).filter(Boolean);
    for (const e of new Set(slots)) count[e] = (count[e] ?? 0) + 1;
  }
  return Object.entries(count)
    .filter(([, n]) => n >= 2)
    .map(([effect]) => ({ effect, slot: bestSlot(ingredients, effect) }))
    .filter(x => x.slot !== null)
    .sort((a, b) => a.slot - b.slot);
}

/** §6a Raw consumption: only the Primary manifests, at full Potency. */
export function rawEffect(ingredient) {
  const slots = ingredient.slots ?? ingredient.effects ?? [];
  const primary = slots[0];
  if (!primary) return null;
  const p = effectivePotency(ingredient.grade, ingredient.condition);
  return { effect: primary, potency: p, slot: 0 };
}

/* ===================================================================
 * Rolls, by the Mythras rulebook
 * =================================================================== */

/** §3 Rarity sets the Lore (Alchemy) difficulty, on the Potency ladder. */
export const RARITY_DIFFICULTY = {
  "Common": 1, "Uncommon": 2, "Unusual": 3,
  "Rare": 4, "Very Rare": 5, "Legendary": 6, "Mythic": 6
};

/** Skill + a Simplified Difficulty Grade + any lab or tool bonus. Skills may exceed 100% (p.37). */
export const gradedTarget = (skill, step, mod = 0) =>
  Math.max(0, (Number(skill) || 0) + (DIFFICULTY[step]?.mod ?? 0) + (Number(mod) || 0));

/**
 * A d100 roll read on the Mythras ladder (Skills, p.37): 01-05 always
 * succeed, 96-00 always fail, 99/00 fumble (only 00 above 100%), a
 * critical is a roll within one tenth of the skill.
 *
 * HOUSE RULE — "special". The canon Quality table (§5) has a Special
 * Success between Success and Critical, but Mythras has no such level.
 * It is read here as a roll within one fifth of the skill, the old
 * RuneQuest convention the canon document was written from.
 */
export function alchemyResult(roll, target) {
  const base = outcomeFor(roll, target);
  if (base !== "success") return base;
  return roll <= Math.ceil(Math.max(0, target) / 5) ? "special" : "success";
}

/**
 * §5 Quality from a Craft (Alchemy) roll. With the 7-band option an
 * ordinary success is split by how far under the target it landed:
 * the third nearest the Special band is Fine, the middle Good, the
 * third nearest a failure Basic.
 */
export function qualityFromRoll(roll, target, sevenBand = false) {
  const r = alchemyResult(roll, target);
  if (r === "fumble") return "Trash";
  if (r === "critical") return "Superior";
  if (r === "special") return "Greater";
  if (r === "failure") return "Mundane";
  if (!sevenBand) return "Good";
  const special = Math.ceil(Math.max(0, target) / 5);
  const span = target - special;
  if (span <= 0) return "Good";
  const into = (roll - special) / span;
  if (into <= 1 / 3) return "Fine";
  if (into <= 2 / 3) return "Good";
  return "Basic";
}

/* ---------------------------------------------------------------------
 * §8 Saturation, resolved as Mythras resolves any poison (Disease and
 * Poison, p.74): the dose's Potency against the drinker's Endurance in
 * an Opposed Roll (p.50). The better level of success wins; on equal
 * levels, the higher roll still within its skill.
 *
 * HOUSE RULES, both flagged in the Rules tab:
 *  - The canon says the excess over SIZ "sets the effective POT" without
 *    a scale; it is read as excess × 5%.
 *  - The canon stages a loss by how far the dose beat the drinker
 *    (Minor / Moderate / Severe, "or a Critical"). That is read as the
 *    Differential Roll's levels of success (p.51): one level Minor, two
 *    Moderate, three — or any critical by the dose — Severe.
 * ------------------------------------------------------------------- */

export const SATURATION_POT_PER_ORIE = 5;

const LEVEL = { fumble: 0, failure: 1, success: 2, critical: 3 };

/** Who wins an Opposed Roll, by Mythras' rule. Returns "a", "b" or "none". */
export function opposedWinner(aRoll, aTarget, bRoll, bTarget) {
  const a = outcomeFor(aRoll, aTarget), b = outcomeFor(bRoll, bTarget);
  const la = LEVEL[a], lb = LEVEL[b];
  if (la < 2 && lb < 2) return { winner: "none", a, b };
  if (la !== lb) return { winner: la > lb ? "a" : "b", a, b };
  return { winner: aRoll >= bRoll ? "a" : "b", a, b };
}

/** The whole saturation check, given both rolls. */
export function saturationOutcome({ dose, siz, potRoll, endRoll, endurance }) {
  if (dose <= siz) return { verdict: "safe", excess: 0 };
  const excess = dose - siz;
  const pot = excess * SATURATION_POT_PER_ORIE;
  const res = opposedWinner(potRoll, pot, endRoll, endurance);
  if (res.winner !== "a") return { verdict: "resisted", excess, pot, ...res };
  const levels = LEVEL[res.a] - LEVEL[res.b];
  const verdict = res.a === "critical" || levels >= 3 ? "severe" : levels === 2 ? "moderate" : "minor";
  return { verdict, excess, pot, levels, ...res };
}

export const OVERDOSE = {
  minor:    "Minor overdose: nausea and −10% to physical skills for 1d6 Melee Rounds.",
  moderate: "Moderate overdose: −20% to physical skills, and the Nausea condition (Mythras p.75) until treated.",
  severe:   "Severe overdose: lose Potency points from a relevant characteristic (GM's choice), and the Nausea condition until treated."
};

/** A Mythras Melee Round is five seconds (p.69). */
export const ROUND_SECONDS = 5;

/* ===================================================================
 * Effects that last (§5 Duration, §6)
 *
 * The canon glossary says which effects hold "for Duration". Those
 * become timed effects on the drinker. A few are unconditional skill
 * or attribute bonuses and are applied for the player; the rest are
 * conditional ("vs. fire", "against fear") and are tracked and shown,
 * but applied at the table.
 * =================================================================== */

/** Effects that persist on the drinker for the potion's Duration. */
export const LASTING_EFFECTS = new Set([
  "Resist Acid", "Resist Disease", "Resist Exhaustion", "Resist Fire", "Resist Frost", "Resist Lightning",
  "Resist Necrotic", "Resist Petrify", "Resist Poison", "Resist Radiant",
  "Aversion to Fire", "Aversion to Frost", "Aversion to Lightning", "Aversion to Necrotic", "Aversion to Poison", "Aversion to Radiant",
  "Fortify Self", "Fortify Restoration", "Regenerate Health",
  "Speed", "Frenzy", "Wild", "Liquid Courage",
  "Waterbreathing", "Labor", "Cat's Eye", "Light", "Darkness", "Detect Life", "Detect Undead", "Foresight",
  "Increase Intelligence"
]);

/**
 * The bonuses applied automatically, by effect, at a slot Potency p and
 * Quality multiplier q. Skill tests:
 *   endurance — the Endurance skill      evade — the Evade skill
 *   combat    — every Combat Style       int   — every skill based on INT
 * Same arithmetic as the glossary text, so the sheet and the card agree.
 */
export function automaticBonus(effect, p, q = 1) {
  const pct = (base) => Math.floor(base * p * (q || 1));
  switch (effect) {
    case "Fortify Self":
    case "Fortify Restoration":
      return { skills: [{ test: "endurance", value: pct(10) }] };
    case "Frenzy":
      return { skills: [{ test: "combat", value: pct(10) }, { test: "evade", value: -pct(10) }, { test: "int", value: -pct(10) }] };
    case "Increase Intelligence":
      return { skills: [{ test: "int", value: pct(5) }] };
    case "Speed":
      return p >= 4 ? { actionPoints: 1 } : null;
    default:
      return null;
  }
}

/** Does a skill item fall under a bonus test? */
export function skillMatches(test, skill) {
  const name = String(skill?.name ?? "").trim().toLowerCase();
  const s = skill?.system ?? {};
  if (test === "endurance") return name === "endurance";
  if (test === "evade") return name === "evade";
  if (test === "combat") return skill?.type === "combatStyle";
  if (test === "int") return s.primaryChar === "int" || s.secondaryChar === "int";
  return false;
}

/* ===================================================================
 * Foraging — HOUSE RULES (the Codex names foraging as unbuilt)
 *
 * Built from what the rules already say:
 *   - Mythras gives foraging to Survival, rolled once per day in the
 *     wild; a critical finds a good source, a fumble is an accident
 *     such as eating something poisonous (Skills, p.49).
 *   - The canon alchemy document makes Rarity the difficulty of
 *     identifying an unfamiliar ingredient in the field with Lore
 *     (Alchemy) or Lore (Natural World) (§3), and says expert
 *     harvesting raises Condition while careless harvest lowers it (§3).
 * What is new: how many finds a day yields, and how often each rarity
 * turns up.
 * =================================================================== */

/** Relative chance of a find, by Rarity: each step half as likely. */
export const RARITY_WEIGHT = {
  "Common": 64, "Uncommon": 32, "Unusual": 16, "Rare": 8, "Very Rare": 4, "Legendary": 2, "Mythic": 1
};

/** Finds for a day's foraging, by the Survival result. */
export const FORAGE_FINDS = {
  critical: { dice: "1d3+1", condition: 1, note: "A good source, worked by an expert hand: everything gathered is Enhanced (§3)." },
  special:  { dice: "1d3+1", condition: 0, note: "A rich patch." },
  success:  { dice: "1d3",   condition: 0, note: "" },
  failure:  { dice: null,    condition: 0, note: "Nothing worth gathering today." },
  fumble:   { dice: null,    condition: 0, note: "An accident (Mythras p.49): a fierce creature, exposure, or something poisonous tasted. The GM decides which." }
};

/** Pick one entry at random, weighted by Rarity. `rand` is 0..1. */
export function pickByRarity(entries, rand) {
  const total = entries.reduce((s, e) => s + (RARITY_WEIGHT[e.rarity] ?? 1), 0);
  let x = rand * total;
  for (const e of entries) {
    x -= RARITY_WEIGHT[e.rarity] ?? 1;
    if (x < 0) return e;
  }
  return entries.at(-1) ?? null;
}

/** "Plant - Silverleaf" → "Plant": what an unidentified find looks like. */
export const categoryOf = (name) => (String(name ?? "").split(/\s+[-–]\s+/)[0] || "Ingredient").trim();

/* ===================================================================
 * The gaps: rules the canon names but leaves without numbers
 * =================================================================== */

/* --- §3 Raising Condition ------------------------------------------
 * "A Craft (Alchemy) task in its own right — Standard difficulty, hours
 * of work and proper equipment; a Fumble ruins the sample." Enhanced
 * (+1) is the top of the ladder. */
export const REFINE_STEP = 3;
export const MAX_CONDITION = 1;

/** What a refining roll does to one unit at a Condition. */
export function refineOutcome(result, condition) {
  const c = Number(condition) || 0;
  if (c >= MAX_CONDITION) return { verdict: "max", condition: c };
  if (result === "fumble") return { verdict: "ruined", condition: c };
  if (result === "failure") return { verdict: "nothing", condition: c };
  return { verdict: "raised", condition: c + 1 };
}

/* --- §7 Padded cases -----------------------------------------------
 * "Purpose-built cases … reduce blast damage by one step." The damage
 * of the tier below; below Potency 4 there is no blast to take. The
 * case protects a carried potion; one that is thrown has left it. */
export function paddedDamage(tier) {
  const below = VOLATILITY[tier - 1];
  return below ? below.damage : null;
}

/* --- §9 Supercritical decay ----------------------------------------
 * "It discharges or degrades to Potency 6 within a few hours;
 * overnight is never safe. Purpose-built containment can extend this."
 * HOUSE RULE for the numbers: after SUPERCRITICAL_HOURS (doubled in a
 * padded case) roll 1d6 — 1-3 it settles to Potency 6, 4-6 it
 * discharges as a Potency 7 blast. */
export const SUPERCRITICAL_HOURS = 3;
export const supercriticalLife = (padded = false) => SUPERCRITICAL_HOURS * 3600 * (padded ? 2 : 1);
export const supercriticalFate = (d6) => (Number(d6) <= 3 ? "settles" : "discharges");

/* --- §9 Vessels ------------------------------------------------------
 * "Cost is for the vessel and consumables." A carried "Vessel - <Size>"
 * is used up at decant; without one, the vessel is bought at that cost. */
export const vesselName = (size) => `Vessel - ${size}`;
export const VESSEL_COPPER = { Tiny: 100, Small: 200, Standard: 500, Medium: 1000, Large: 1500, Huge: 2000, Gargantuan: 10000 };
export const VESSEL_WEIGHT = { Tiny: 0.05, Small: 0.1, Standard: 0.25, Medium: 0.4, Large: 0.6, Huge: 0.8, Gargantuan: 3 };

/* --- §3 Spoilage -----------------------------------------------------
 * Condition falls with "age, heat, sunlight … poor storage", and rises
 * with "proper preservation". HOUSE RULE for the clock: a perishable
 * ingredient loses one step of Condition per shelf life (default two
 * weeks of game time) until it is Degraded, unless it is preserved.
 * Minerals, metals, bone, horn, shell, hair and the Mothers keep. */
export const SHELF_LIFE_DAYS = 14;
export const MIN_CONDITION = -1;
export const PERISHABLE = new Set([
  "Animal", "Berry", "Blood", "Ear", "Egg", "Eye", "Flesh", "Flower", "Foot", "Fruit", "Fungus",
  "Gllob", "Heart", "Herb", "Hog", "Insect", "Mushroom", "Plant", "Reed", "Root"
]);
export const isPerishable = (name) => PERISHABLE.has(categoryOf(name));

/**
 * How far an ingredient has spoiled by `now` (seconds of world time).
 * Returns the new Condition and the clock carried forward, or null if
 * nothing has changed.
 */
export function spoilage({ condition, harvestedAt, now, shelfDays = SHELF_LIFE_DAYS }) {
  const life = Math.max(1, Number(shelfDays) || SHELF_LIFE_DAYS) * 86400;
  const c = Number(condition) || 0;
  if (!Number.isFinite(Number(harvestedAt)) || harvestedAt === null || c <= MIN_CONDITION) return null;
  const steps = Math.floor((now - harvestedAt) / life);
  if (steps < 1) return null;
  const next = Math.max(MIN_CONDITION, c - steps);
  return { condition: next, lost: c - next, harvestedAt: harvestedAt + steps * life };
}
