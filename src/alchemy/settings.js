/* ===================================================================
 * Dreoarcana Alchemy — settings ("alchemy.*" under dreoarcana)
 *
 * Each one is a rule the canon document calls optional, or a number it
 * states as a default rather than a law.
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";

export const ASETTINGS = {
  discovery: "alchemy.discovery",
  maxIngredients: "alchemy.maxIngredients",
  sevenBand: "alchemy.sevenBand",
  consumeIngredients: "alchemy.consumeIngredients",
  spendOrie: "alchemy.spendOrie",
  autoSaturation: "alchemy.autoSaturation",
  playerBrewing: "alchemy.playerBrewing",
  unidentified: "alchemy.unidentified",
  saturationClear: "alchemy.saturationClear",
  grounds: "alchemy.grounds",
  migrated: "alchemy.migrated"
};

export const ALCHEMY_SETTINGS_HOOK = `${SYSTEM_ID}.alchemySettingsChanged`;

export function asetting(key) {
  try { return game.settings.get(SYSTEM_ID, key); }
  catch { return undefined; }
}

export function registerAlchemySettings() {
  const S = (key, data) => game.settings.register(SYSTEM_ID, key, {
    scope: "world", config: true,
    onChange: () => Hooks.callAll(ALCHEMY_SETTINGS_HOOK, key),
    ...data
  });

  S(ASETTINGS.discovery, {
    name: "Alchemy: use the Discovery rule (§4)",
    hint: "Players only know an ingredient's effects once they have tasted, studied or brewed with it. Off shows every effect to everyone.",
    type: Boolean, default: true
  });
  S(ASETTINGS.maxIngredients, {
    name: "Alchemy: maximum reagents per brew",
    hint: "Two is the baseline in §4; three represents an advanced alchemist. The Mother doesn't count.",
    type: Number, default: 3, range: { min: 2, max: 6, step: 1 }
  });
  S(ASETTINGS.sevenBand, {
    name: "Alchemy: use the 7-band Quality ladder (§5)",
    hint: "Adds Basic and Fine around Good, matching the original spreadsheet.",
    type: Boolean, default: false
  });
  S(ASETTINGS.consumeIngredients, {
    name: "Alchemy: brewing consumes ingredients",
    hint: "Reagents are spent when the mixture is committed, even if the brew fails; the Mother is measured out at decant. Off for planning or testing.",
    type: Boolean, default: true
  });
  S(ASETTINGS.spendOrie, {
    name: "Alchemy: channelling spends Stored Orie",
    hint: "Xi channelled into a brew is drawn from the brewer's Stored Orie, without Heat; whatever Stored Orie can't cover is converted on the spot and makes Heat, as for a spell. Off means you track it yourself.",
    type: Boolean, default: true
  });
  S(ASETTINGS.autoSaturation, {
    name: "Alchemy: roll saturation automatically (§8)",
    hint: "Rolls the dose against the drinker's Endurance (Mythras p.74) when a Mechanical potion is drunk or an ingredient eaten raw. Off reports the dose and leaves it to the GM.",
    type: Boolean, default: true
  });
  S(ASETTINGS.playerBrewing, {
    name: "Alchemy: players may brew",
    hint: "Off makes brewing a GM action. Players can still drink, throw and study what they carry.",
    type: Boolean, default: true
  });
  S(ASETTINGS.unidentified, {
    name: "Alchemy: brews start unidentified",
    hint: "A new potion arrives unnamed, and the GM reveals it in the Laboratory. Off names every brew plainly.",
    type: Boolean, default: true
  });
  S(ASETTINGS.saturationClear, {
    name: "Alchemy: how fast a body clears raw Orie (§8)",
    hint: "Doses taken close together add up against the same SIZ capacity (§8). The body clears its Healing Rate in raw Orie per this much game time. House rule: the canon says only \"a short period\".",
    type: String, default: "hour",
    choices: { hour: "Healing Rate per hour", day: "Healing Rate per day", rest: "Only when the GM says the character has rested" }
  });
  game.settings.register(SYSTEM_ID, ASETTINGS.grounds, {
    scope: "world", config: false, type: Array, default: [],
    onChange: () => Hooks.callAll(ALCHEMY_SETTINGS_HOOK, ASETTINGS.grounds)
  });
  game.settings.register(SYSTEM_ID, ASETTINGS.migrated, { scope: "world", config: false, type: Number, default: 0 });
}
