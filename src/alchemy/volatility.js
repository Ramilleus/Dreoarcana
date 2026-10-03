/* ===================================================================
 * Dreoarcana Alchemy — Volatility (§7)
 *
 * Mechanical brews at Potency 4+ are restrained planar energy in a
 * bottle. This resolves the two ways that ends: thrown, or broken.
 * Damage is rolled and reported, with who is inside the radius; it is
 * not applied, because Mythras damage goes to a hit location the
 * situation decides.
 * =================================================================== */

import { record, isPotion, isIngredient } from "./core.js";
import { VOLATILITY, SUPERCRITICAL, effectivePotency, paddedDamage } from "./rules.js";
import { confirmDialog } from "../arcana/ui.js";
import { e } from "../arcana/html.js";

/**
 * What happens if this item goes off, or null if it can't.
 * A padded case takes one step off the damage of a carried potion (§7);
 * one that is thrown has left its case.
 */
export function blastProfile(item, { thrown = false } = {}) {
  let potency = 0, mechanical = false, effects = [];
  if (isPotion(item)) {
    potency = Number(item.system.potency) || 0;
    mechanical = Boolean(item.system.mechanical);
    effects = (item.system.manifest ?? []).map(m => m.effect);
  } else if (isIngredient(item)) {
    const rec = record(item);
    potency = effectivePotency(rec.grade, rec.condition) ?? 0;
    mechanical = rec.class === "Mechanical";
    effects = rec.effects;
  } else return null;
  if (!mechanical || !potency) return null;
  const hasExplode = effects.includes("Explode");
  let tier = Math.min(potency, SUPERCRITICAL);
  if (hasExplode) tier = Math.min(tier + 1, SUPERCRITICAL);
  const profile = VOLATILITY[tier];
  if (!profile) return null;
  const padded = isPotion(item) && Boolean(item.system.padded) && !thrown;
  if (!padded) return { ...profile, tier, potency, hasExplode, padded: false };
  const damage = paddedDamage(tier);
  return damage ? { ...profile, damage, tier, potency, hasExplode, padded: true, unpadded: profile.damage } : null;
}

async function spendOne(item) {
  const have = Number(item.system?.quantity ?? 1);
  if (have > 1) await item.update({ "system.quantity": have - 1 });
  else await item.delete();
}

export async function detonate(item, { actor, cause, blast }) {
  const roll = await new Roll(blast.damage).evaluate();
  const origin = actor?.getActiveTokens?.()[0] ?? canvas?.tokens?.controlled?.[0] ?? null;
  let caught = [];
  if (origin && canvas?.tokens?.placeables) {
    caught = canvas.tokens.placeables.filter(t => {
      if (t.id === origin.id) return false;
      const d = Math.hypot(t.center.x - origin.center.x, t.center.y - origin.center.y) / canvas.dimensions.size * canvas.dimensions.distance;
      return d <= blast.radius;
    });
  }
  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    rolls: [roll],
    content: `<div class="mm-chat al-chat is-bad">
      <h3>${e(item.name)} detonates — ${e(cause)}</h3>
      <p><strong>${roll.total}</strong> damage (${blast.damage}) within <strong>${blast.radius} m</strong>${blast.ignoresArmour ? ", <strong>ignoring armour</strong>" : ""}.</p>
      <p><em>${e(blast.note)}</em></p>
      ${blast.hasExplode ? "<p><em>Carries the Explode property: one step above its Potency (§7).</em></p>" : ""}
      ${blast.padded ? `<p><em>Its padded case took the worst of it: ${blast.unpadded} became ${blast.damage} (§7).</em></p>` : ""}
      ${caught.length ? `<p><strong>In radius:</strong> ${caught.map(t => e(t.name)).join(", ")}</p>` : origin ? "<p><em>Nothing else within the blast.</em></p>" : ""}
      <p class="mm-hint">Each target takes it to a random hit location (Mythras p.109).</p></div>`
  });
  return roll.total;
}

/** Throw it as an improvised grenade (§7). */
export async function throwPotion(item, actor = item?.actor) {
  const blast = blastProfile(item, { thrown: true });
  if (!blast) { ui.notifications.warn(`${item.name} isn't volatile: only Mechanical brews at Potency 4+ detonate (§7).`); return null; }
  if (item.pack || !item.parent) { ui.notifications.warn(`${item.name} isn't being carried.`); return null; }
  const go = await confirmDialog({
    title: `Throw ${item.name}?`,
    content: `<p>It bursts for <strong>${blast.damage}</strong> in <strong>${blast.radius} m</strong>${blast.ignoresArmour ? ", ignoring armour" : ""}, and the dose is gone either way.</p><p class="mm-hint">Roll Combat Style or Athletics to land it where you meant.</p>`,
    yesLabel: "Throw it", noLabel: "Keep it"
  });
  if (!go) return null;
  await spendOne(item);
  return detonate(item, { actor, cause: "thrown", blast });
}

/** Broken by a blow, a fall or a fire (§7). */
export async function breakPotion(item, actor = item?.actor) {
  if (item.pack || !item.parent) { ui.notifications.warn(`${item.name} isn't being carried.`); return null; }
  const blast = blastProfile(item);
  const contained = !blast && isPotion(item) && item.system.padded && blastProfile(item, { thrown: true });
  const go = await confirmDialog({ title: `Break ${item.name}?`, content: blast ? `<p>It is volatile: <strong>${blast.damage}</strong> in ${blast.radius} m${blast.padded ? ", softened by its padded case" : ""}.</p>` : contained ? "<p>It is volatile, but its padded case will smother the burst. It will be wasted.</p>" : "<p>It will spill and be wasted.</p>", yesLabel: "Break it", noLabel: "Keep it" });
  if (!go) return null;
  await spendOne(item);
  if (!blast) {
    await ChatMessage.create({ speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined, content: `<p><strong>${e(item.name)}</strong> breaks and spills. A wasted dose, nothing more.</p>` });
    return 0;
  }
  return detonate(item, { actor, cause: "broken", blast });
}

/** Everything volatile a character carries (§7: a hit there may set it off). */
export function carriedVolatiles(actor) {
  return (actor?.items ?? []).map(i => ({ item: i, blast: blastProfile(i) })).filter(x => x.blast);
}
