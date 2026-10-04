/* ===================================================================
 * Dreoarcana Arcana — settings
 *
 * The Spell Builder document fixes the formulas and the node tables.
 * It does NOT fix how a percentage becomes Skill (S), how much damage a
 * point of ξ does, or how a body copes with Heat — those are house
 * rulings, so they are all here where a table can change them without
 * editing code. Keys are "arcana.*" under the dreoarcana namespace.
 * =================================================================== */

import { SYSTEM_ID } from "./core.js";

export const SETTINGS = {
  playerBuilding:     "arcana.playerBuilding",
  spendOrie:          "arcana.spendOrie",
  skillDivisor:       "arcana.skillDivisor",
  xiPerDamage:        "arcana.xiPerDamage",
  tierDifficulty:     "arcana.tierDifficulty",
  roundSeconds:       "arcana.roundSeconds",
  trackHeat:          "arcana.trackHeat",
  heatCapacityPerCon: "arcana.heatCapacityPerCon",
  heatPerWound:       "arcana.heatPerWound",
  ventPerRound:       "arcana.ventPerRound",
  radiators:          "arcana.radiators",
  decayRate:          "arcana.decayRate",
  affinityLimit:      "arcana.affinityLimit",
  fluxEnabled:        "arcana.fluxEnabled",
  fluxHours:          "arcana.fluxHours",
  barrierHeat:        "arcana.barrierHeat",
  theme:              "arcana.theme",
  animations:         "arcana.animations",
  sigilImages:        "arcana.sigilImages",
  castSounds:         "arcana.castSounds",
  soundVolume:        "arcana.soundVolume",
  migrated:           "arcana.migrated"
};

/* Visual themes for the Arcanum and the arcane chat cards. Each is a
   block of CSS variables in styles/arcana keyed by body[data-mm-theme]. */
export const THEMES = {
  parchment: "Parchment — aged paper, ink and a little glow",
  melfyric:  "Melfyric Night — the infinite sea of colour, seen from inside",
  flux:      "Prismatic Flux — oxidised brass and shattered light",
  ink:       "Ink & Bone — a grimoire page, monochrome"
};

export const SETTINGS_HOOK = `${SYSTEM_ID}.arcanaSettingsChanged`;

/** Read a setting, falling back safely if it isn't registered yet. */
export function setting(key) {
  try { return game.settings.get(SYSTEM_ID, key); }
  catch { return undefined; }
}

/** A numeric setting with a fallback. */
export function num(key, fallback) {
  const v = Number(setting(key));
  return Number.isFinite(v) ? v : fallback;
}

export function registerSettings() {
  const S = (key, data) => game.settings.register(SYSTEM_ID, key, {
    onChange: () => Hooks.callAll(SETTINGS_HOOK, key),
    ...data
  });

  /* ---- Look and feel (per player) -------------------------------- */

  S(SETTINGS.theme, {
    name: "Arcana: visual theme",
    hint: "The look of the Arcanum and the arcane chat cards. Yours alone; other players choose their own.",
    scope: "client", config: true, type: String, default: "parchment",
    choices: THEMES
  });

  S(SETTINGS.animations, {
    name: "Arcana: animated flow",
    hint: "Motes and glow travelling along the spell chart's links, and the pulses on the manifestation and overheat. Off leaves the chart still.",
    scope: "client", config: true, type: Boolean, default: true
  });

  S(SETTINGS.soundVolume, {
    name: "Arcana: spell sound volume",
    hint: "Your own level for spell sounds, under Foundry's Interface volume. 0 mutes them for you alone.",
    scope: "client", config: true, type: Number, default: 0.8,
    range: { min: 0, max: 1, step: 0.05 }
  });

  S(SETTINGS.castSounds, {
    name: "Arcana: play spell sounds on cast",
    hint: "Every spell has a sound synthesised from its nodes. On a cast it plays for every connected player.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.sigilImages, {
    name: "Arcana: write sigils as spell icons",
    hint: "When someone allowed to upload files saves a spell, its sigil is written to Data/dreoarcana/sigils and set as the item's image, unless the image was changed by hand.",
    scope: "world", config: true, type: Boolean, default: true
  });

  /* ---- Table style ---------------------------------------------- */

  S(SETTINGS.playerBuilding, {
    name: "Arcana: players may build spells",
    hint: "Off makes building and editing spells a GM action. Players can still cast the spells on their sheet.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.spendOrie, {
    name: "Arcana: casting spends Stored Orie",
    hint: "Casting deducts the Orie drawn from the caster's Stored Orie. Off means you track it yourself; the draw still spares the Heat.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.tierDifficulty, {
    name: "Arcana: tier sets the casting difficulty",
    hint: "Ember is Easy, Lumen Standard, Tempest Hard, Aetherion Formidable, Cataclysm Herculean. Off rolls every spell at Standard.",
    scope: "world", config: true, type: Boolean, default: true
  });

  /* ---- Conversions the document leaves open ---------------------- */

  S(SETTINGS.skillDivisor, {
    name: "Arcana: skill percentage that equals S = 1",
    hint: "The First Principle divides by Skill. A caster at this percentage has S = 1; 100% is S = 2 at the default of 50.",
    scope: "world", config: true, type: Number, default: 50,
    range: { min: 20, max: 100, step: 5 }
  });

  S(SETTINGS.xiPerDamage, {
    name: "Arcana: ξ per point of expected damage",
    hint: "Might (M = ξ) becomes dice with this average. At 2, a 10 ξ Ember bolt averages 5 damage. Lower is deadlier.",
    scope: "world", config: true, type: Number, default: 2,
    range: { min: 0.5, max: 5, step: 0.5 }
  });

  S(SETTINGS.roundSeconds, {
    name: "Arcana: seconds per Melee Round",
    hint: "Mythras rounds are 5 seconds; the Dreoarcana design notes use a 15-second window. Casting time is shown in both.",
    scope: "world", config: true, type: Number, default: 5,
    range: { min: 3, max: 15, step: 1 }
  });

  /* ---- Heat ----------------------------------------------------- */

  S(SETTINGS.trackHeat, {
    name: "Arcana: track Heat",
    hint: "Accumulates Heat from casting on the character, with a capacity from CON. Off hides the Heat stat; each cast still reports its Heat.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.heatCapacityPerCon, {
    name: "Arcana: Heat capacity per point of CON",
    hint: "A body holds this much Heat per point of CON before it starts to burn.",
    scope: "world", config: true, type: Number, default: 3,
    range: { min: 1, max: 10, step: 1 }
  });

  S(SETTINGS.heatPerWound, {
    name: "Arcana: Heat over capacity per point of damage",
    hint: "Every this-many points of Heat beyond capacity burns one hit point off a random location, ignoring armour.",
    scope: "world", config: true, type: Number, default: 5,
    range: { min: 1, max: 20, step: 1 }
  });

  S(SETTINGS.ventPerRound, {
    name: "Arcana: Heat vented per Melee Round of rest",
    hint: "How fast Heat dissipates while the caster does nothing else.",
    scope: "world", config: true, type: Number, default: 2,
    range: { min: 1, max: 20, step: 1 }
  });

  S(SETTINGS.decayRate, {
    name: "Arcana: how fast self-sustaining spells fade (k)",
    hint: "ξ(t) = ξ₀ × e^(−kt), with t in Melee Rounds; canon gives k as 0.1–0.3. A spell has faded when its ξ falls below 1. At 0.2 it halves in about 3½ rounds.",
    scope: "world", config: true, type: Number, default: 0.2,
    range: { min: 0.05, max: 0.5, step: 0.05 }
  });

  S(SETTINGS.affinityLimit, {
    name: "Arcana: spell classes a caster can be aligned with (Affinity)",
    hint: "Each a discipline (Evocation, Protection…) or an element (Fire, Frost…). An Effect node in it is a point steadier; a spell whose every Effect node is in it needs ×0.85 Orie and makes −20% Heat (the Pact numbers). 0 turns Affinity off.",
    scope: "world", config: true, type: Number, default: 1,
    range: { min: 0, max: 4, step: 1 }
  });

  S(SETTINGS.fluxEnabled, {
    name: "Arcana: large conversions leave Flux",
    hint: "A Tier III spell leaves a Flux zone of intensity 1 where it was cast, Tier IV 2, Tier V 3; a fumble adds 1. Spells cast inside one count it as their Surroundings and roll a d10: amplified (×1.5 Might) or misfired at the ends. Structures in Flux fade faster.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.fluxHours, {
    name: "Arcana: hours of game time for Flux to weaken one step",
    hint: "A zone loses one intensity each this many hours, and is gone at none.",
    scope: "world", config: true, type: Number, default: 1,
    range: { min: 0.5, max: 24, step: 0.5 }
  });

  S(SETTINGS.barrierHeat, {
    name: "Arcana: a Barrier turns the magic it stops into Heat",
    hint: "Mechanical Casting: a Barrier \"converts incoming magical damage directly into Heat for the barrier's caster\", and collapses when that Heat passes capacity. Off, it only reduces magical damage by its percentage, as the Node Catalogue puts it.",
    scope: "world", config: true, type: Boolean, default: true
  });

  S(SETTINGS.radiators, {
    name: "Arcana: wearable radiators shed Heat",
    hint: "House rule. Gear marked as a radiator adds its metal's conductance ÷ 100 to the Heat its wearer vents each Melee Round (Materials table: silver 4, copper 4, gold 3, aluminium 2).",
    scope: "world", config: true, type: Boolean, default: true
  });

  /* ---- Bookkeeping ---------------------------------------------- */

  game.settings.register(SYSTEM_ID, SETTINGS.migrated, {
    scope: "world", config: false, type: Number, default: 0
  });
}
