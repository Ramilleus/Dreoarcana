/* ===================================================================
 * Dreoarcana Alchemy — drinking, eating raw, and saturation (§6a, §8)
 *
 * A dose is spent, the saturation check is rolled, and the effects are
 * laid out ready to apply. Hit points are not applied for the player:
 * Mythras HP is per location, so "heals 4 HP" needs a choice only they
 * can make. Stored Orie, having no such ambiguity, is applied.
 * =================================================================== */

import { record, endurance, isPotion, isIngredient } from "./core.js";
import { MAX_POTENCY, QUALITY, describeEffect, slotPotency, effectivePotency, saturationOutcome, OVERDOSE } from "./rules.js";
import { addLoad } from "./saturation.js";
import { applyLastingEffects } from "./effects.js";
import { asetting, ASETTINGS } from "./settings.js";
import { currentOrie, setOrie } from "../arcana/core.js";
import { confirmDialog } from "../arcana/ui.js";
import { e } from "../arcana/html.js";

const isStock = (item, actor) => Boolean(item?.id) && !item.pack && item.parent && item.parent === actor;

async function spendOne(item) {
  const have = Number(item.system?.quantity ?? 1);
  if (have > 1) await item.update({ "system.quantity": have - 1 });
  else await item.delete();
  return Math.max(0, have - 1);
}

/**
 * §8 Saturation. The dose joins whatever raw Orie the body is still
 * carrying (step 4: repeated doses stack against the same capacity).
 * Under SIZ, absorbed with no roll; over it, the excess becomes a
 * Potency rolled against the drinker's Endurance (p.74).
 */
export async function saturationCheck({ actor, rawOrie, source }) {
  if (!actor || !rawOrie) return null;
  const src = e(source ?? "a dose");
  const siz = Number(actor.characteristics?.siz ?? actor.system?.characteristics?.siz?.value) || 0;
  const { before, after: total } = await addLoad(actor, rawOrie);
  const carried = before > 0 ? `${rawOrie} Orie on top of ${before} still carried: <strong>${total}</strong>` : `${rawOrie} Orie`;

  if (asetting(ASETTINGS.autoSaturation) === false) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="mm-chat al-chat"><p><strong>Saturation (§8):</strong> ${carried} raw Orie from ${src}, against ${e(actor.name)}'s SIZ ${siz}. Roll it as you see fit.</p></div>`
    });
    return { verdict: "deferred", total };
  }
  if (total <= siz) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="mm-chat al-chat"><p><strong>Saturation (§8):</strong> ${carried} against SIZ ${siz}: absorbed safely, no roll.</p></div>`
    });
    return { verdict: "safe", total };
  }

  const end = endurance(actor);
  const potRoll = await new Roll("1d100").evaluate();
  const endRoll = await new Roll("1d100").evaluate();
  const out = saturationOutcome({ dose: total, siz, potRoll: potRoll.total, endRoll: endRoll.total, endurance: end });
  const detail = out.verdict === "resisted" ? "The body copes. No lasting harm." : OVERDOSE[out.verdict];

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [potRoll, endRoll],
    content: `<div class="mm-chat al-chat ${out.verdict === "resisted" ? "" : "is-bad"}">
      <h3>Saturation (§8) — ${src}</h3>
      <p>${carried} against SIZ ${siz}: <strong>${out.excess} over</strong>, so the dose is Potency ${out.pot}%.</p>
      <p>Dose rolls <b>${potRoll.total}</b> vs ${out.pot}% (${out.a}) · Endurance rolls <b>${endRoll.total}</b> vs ${end}% (${out.b})</p>
      <p><strong>${e(detail)}</strong></p></div>`
  });
  return { ...out, total };
}

/** Lucky (§6): extra Luck Points for the scene, above the usual maximum. */
async function grantLuck(actor, manifest, potency) {
  const lucky = manifest.find(m => m.effect === "Lucky");
  if (!lucky) return;
  const sp = slotPotency(potency, lucky.slot ?? 0);
  if (sp < 1) return;
  const n = sp >= 5 ? 2 : 1;
  const before = Number(actor.system?.trackedStats?.luckPoints?.value) || 0;
  await actor.update({ "system.trackedStats.luckPoints.value": before + n });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>Lucky: <strong>+${n} Luck Point${n > 1 ? "s" : ""}</strong> for the scene (${before} → ${before + n}); unspent ones vanish when it ends.</p>` });
}

/** Drink one dose of a brewed potion. */
export async function drinkPotion(item, actor = item?.actor) {
  if (!isPotion(item)) { ui.notifications.warn(`${item?.name} isn't a brewed potion.`); return null; }
  if (!actor || !isStock(item, actor)) { ui.notifications.warn("Nobody is carrying that potion. Put it on a character first."); return null; }
  const s = item.system;
  if (!s.identified && !game.user.isGM) {
    const go = await confirmDialog({ title: `Drink ${item.name}?`, content: "<p>You don't know what this does. Drink it anyway?</p>", yesLabel: "Drink", noLabel: "Think better of it" });
    if (!go) return null;
  }
  const potency = Math.min(Number(s.potency) || 1, MAX_POTENCY);
  const mult = Number(s.multiplier) || 1;
  const manifest = Array.isArray(s.manifest) ? s.manifest : [];
  const left = await spendOne(item);

  const lines = manifest.map(({ effect, slot }) => {
    const sp = slotPotency(potency, slot ?? 0);
    return sp >= 1 ? `<li><strong>${e(effect)}</strong> — ${e(describeEffect(effect, sp, mult))}</li>` : null;
  }).filter(Boolean);
  const seen = s.identified || game.user.isGM;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="mm-chat al-chat">
      <h3>${e(actor.name)} drinks ${seen ? e(item.name) : "an unidentified potion"}</h3>
      <p><em>${e(s.quality || "?")} · Potency ${e(s.potency ?? "?")} · ${s.duration ?? "?"} Melee Round${s.duration === 1 ? "" : "s"} · ${left} dose${left === 1 ? "" : "s"} left</em></p>
      ${lines.length ? `<ul class="mm-chat-effects">${lines.join("")}</ul>` : "<p><em>Nothing happens.</em></p>"}</div>`
  });

  if (manifest.some(m => m.effect === "Restore Melfyrium")) {
    const slot = manifest.find(m => m.effect === "Restore Melfyrium").slot ?? 0;
    const gain = Math.floor(slotPotency(potency, slot) * mult);
    if (gain > 0) {
      const before = currentOrie(actor);
      const after = await setOrie(actor, before + gain);
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>Stored Orie restored: ${before} → <strong>${after}</strong>.</p>` });
    }
  }
  // §5 Duration: lasting effects go on the drinker and count down.
  await applyLastingEffects(actor, { manifest, potency, multiplier: mult, rounds: Number(s.duration) || 1, source: item.name, img: item.img });
  await grantLuck(actor, manifest, potency);
  if (s.mechanical && s.rawOriePerDose) await saturationCheck({ actor, rawOrie: s.rawOriePerDose, source: `drinking ${item.name}` });
  return item;
}

/** §6a Eat an ingredient raw: the Primary only, at full Potency, and the whole dose. */
export async function eatIngredient(item, actor = item?.actor) {
  if (!isIngredient(item)) { ui.notifications.warn(`${item?.name} isn't an ingredient.`); return null; }
  if (!actor || !isStock(item, actor)) { ui.notifications.warn("Nobody is carrying that. Put it on a character first."); return null; }
  const rec = record(item);
  const potency = effectivePotency(rec.grade, rec.condition) ?? 1;
  const primary = rec.slots[0];
  await spendOne(item);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="mm-chat al-chat">
      <h3>${e(actor.name)} eats ${e(item.name)} raw</h3>
      ${primary ? `<p>Only the Primary manifests, at full Potency ${potency}:</p><ul class="mm-chat-effects"><li><strong>${e(primary)}</strong> — ${e(describeEffect(primary, potency, 1))}</li></ul>
                   <p class="mm-hint">No Quality multiplier, and the briefest duration (§6a).</p>`
                : "<p><em>It does nothing at all.</em></p>"}</div>`
  });
  // §6a: the briefest duration on the §5 table, and no Quality multiplier.
  if (primary) {
    const manifest = [{ effect: primary, slot: 0 }];
    await applyLastingEffects(actor, { manifest, potency, multiplier: 1, rounds: QUALITY.Mundane.rounds, source: `${item.name}, eaten raw`, img: item.img });
    await grantLuck(actor, manifest, potency);
  }
  if (rec.class === "Mechanical") await saturationCheck({ actor, rawOrie: potency * potency, source: `eating ${item.name} raw` });
  return item;
}
