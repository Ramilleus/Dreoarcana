/* ===================================================================
 * Dreoarcana Alchemy — potion effects that last (§5 Duration)
 *
 * Each lasting effect becomes an Active Effect on the drinker, timed
 * in game seconds (a Melee Round is five, Mythras p.69), so it shows on
 * the token and counts down in and out of combat. When it runs out the
 * GM's client removes it.
 *
 * Unconditional bonuses apply for the player:
 *   Fortify Self / Restoration  +% to Endurance
 *   Frenzy                      +% Combat Styles, −% Evade and INT skills
 *   Increase Intelligence       +% INT skills
 *   Speed                       +1 Action Point (Potency 4+)
 * Skill bonuses are added where the system computes a skill's total
 * (src/module/item/skill), so every roll and the sheet include them.
 * Conditional effects (a ward against fire, courage against fear) are
 * tracked and shown, and applied at the table.
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";
import { LASTING_EFFECTS, ROUND_SECONDS, automaticBonus, skillMatches, describeEffect, slotPotency, MAX_POTENCY } from "./rules.js";
import { POTION_IMG } from "./core.js";
import { e } from "../arcana/html.js";

const FLAG = "alchemy";
const flagOf = (effect) => effect?.flags?.[SYSTEM_ID]?.[FLAG] ?? null;
export const isPotionEffect = (effect) => Boolean(flagOf(effect));

/**
 * Put a potion's lasting effects on the drinker.
 * @param {Actor} actor
 * @param {object} o  { manifest: [{effect, slot}], potency, multiplier, rounds, source, img }
 * Returns the effects created.
 */
export async function applyLastingEffects(actor, { manifest = [], potency = 1, multiplier = 1, rounds = 1, source = "a potion", img = POTION_IMG }) {
  if (!actor || !rounds) return [];
  const p = Math.min(Number(potency) || 1, MAX_POTENCY);
  const data = [];
  for (const { effect, slot } of manifest) {
    if (!LASTING_EFFECTS.has(effect)) continue;
    const sp = slotPotency(p, slot ?? 0);
    if (sp < 1) continue;
    const bonus = automaticBonus(effect, sp, multiplier);
    const changes = bonus?.actionPoints
      ? [{ key: "system.attributes.actionPoints.mod", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(bonus.actionPoints) }]
      : [];
    data.push({
      name: effect,
      img,
      description: `<p>${e(describeEffect(effect, sp, multiplier))}</p><p><em>From ${e(source)}.</em></p>`,
      duration: { seconds: rounds * ROUND_SECONDS, startTime: game.time.worldTime, rounds },
      changes,
      flags: { [SYSTEM_ID]: { [FLAG]: { effect, potency: sp, multiplier, source, skills: bonus?.skills ?? [], applied: Boolean(bonus) } } }
    });
  }
  if (!data.length) return [];
  // Speed never stacks past +1 (§6): a second dose replaces the first.
  const old = actor.effects.filter(ef => isPotionEffect(ef) && data.some(d => d.name === ef.name)).map(ef => ef.id);
  if (old.length) await actor.deleteEmbeddedDocuments("ActiveEffect", old);
  return actor.createEmbeddedDocuments("ActiveEffect", data);
}

/** The potion bonus for one skill item, summed over its owner's lasting effects. */
export function potionSkillBonus(skill) {
  const actor = skill?.actor;
  if (!actor?.effects?.size) return 0;
  let total = 0;
  for (const ef of actor.effects) {
    const f = flagOf(ef);
    if (!f?.skills?.length || ef.disabled) continue;
    const remaining = ef.duration?.remaining;
    if (typeof remaining === "number" && remaining <= 0) continue;
    for (const b of f.skills) if (skillMatches(b.test, skill)) total += Number(b.value) || 0;
  }
  return total;
}

/** Lasting effects on an actor, for the Laboratory rail. */
export function lastingEffects(actor) {
  return (actor?.effects ?? []).filter(isPotionEffect).map(ef => {
    const f = flagOf(ef);
    const rem = ef.duration?.remaining;
    const rounds = typeof rem === "number" ? Math.max(0, Math.ceil(rem / ROUND_SECONDS)) : null;
    return { id: ef.id, name: ef.name, applied: f.applied, potency: f.potency,
             remaining: rounds === null ? "" : `${rounds} rd`, expired: rounds === 0,
             tip: (ef.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() };
  });
}

/** GM's client: remove potion effects whose time has run out. */
export async function expirePotionEffects() {
  if (!game.user.isGM) return;
  for (const actor of game.actors) {
    const gone = actor.effects.filter(ef => isPotionEffect(ef) && typeof ef.duration?.remaining === "number" && ef.duration.remaining <= 0).map(ef => ef.id);
    if (gone.length) await actor.deleteEmbeddedDocuments("ActiveEffect", gone);
  }
}
