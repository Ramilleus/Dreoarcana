/* ===================================================================
 * Dreoarcana Alchemy — the workshop: what happens to stock over time,
 * and what an alchemist does about it.
 *
 *   Refine     raise one unit's Condition (§3): Craft (Alchemy) at
 *              Standard; a fumble ruins the sample.
 *   Preserve   stop a perishable stack spoiling (§3).
 *   Pad        carry a potion in a padded case (§7).
 *   Aging      on the GM's clock: perishables lose Condition (§3),
 *              Supercritical doses settle or discharge (§9).
 * =================================================================== */

import { isIngredient, isPotion, craftValue } from "./core.js";
import { asetting, ASETTINGS } from "./settings.js";
import { DIFFICULTY, CONDITIONS, REFINE_STEP, MAX_CONDITION, MAX_POTENCY, SUPERCRITICAL, VOLATILITY,
         gradedTarget, alchemyResult, refineOutcome, isPerishable, spoilage, supercriticalLife, supercriticalFate } from "./rules.js";
import { blastProfile, detonate } from "./volatility.js";
import { e } from "../arcana/html.js";

const conditionLabel = (c) => CONDITIONS[String(c)]?.split(" (")[0] ?? String(c);
const now = () => Number(game.time?.worldTime) || 0;
const trueNameOf = (item) => item.system?.trueName || item.name;

/** Can this ingredient spoil? (The true name decides, not the "Unidentified Plant" label.) */
export const perishable = (item) => isIngredient(item) && !item.system?.mother && isPerishable(trueNameOf(item));

/**
 * Move one unit of a stack into a different state, stacking it with a
 * matching stack if there is one. `changes` are system fields.
 */
async function moveOne(item, changes) {
  const actor = item.parent;
  const qty = Number(item.system.quantity) || 1;
  const same = (i) => i.id !== item.id && i.type === item.type && i.name === item.name
    && trueNameOf(i) === trueNameOf(item)
    && Object.entries(changes).every(([k, v]) => i.system[k] === v)
    && Boolean(i.system.preserved) === Boolean(changes.preserved ?? item.system.preserved);
  const target = actor?.items.find(same);
  if (target) {
    await target.update({ "system.quantity": (Number(target.system.quantity) || 1) + 1 });
    if (qty > 1) await item.update({ "system.quantity": qty - 1 }); else await item.delete();
    return target;
  }
  if (qty <= 1) {
    await item.update(Object.fromEntries(Object.entries(changes).map(([k, v]) => [`system.${k}`, v])));
    return item;
  }
  const data = item.toObject();
  delete data._id;
  data.system.quantity = 1;
  Object.assign(data.system, changes);
  await item.update({ "system.quantity": qty - 1 });
  const [made] = await actor.createEmbeddedDocuments("Item", [data]);
  return made;
}

async function spendOne(item) {
  const qty = Number(item.system.quantity) || 1;
  if (qty > 1) await item.update({ "system.quantity": qty - 1 }); else await item.delete();
}

/* -------------------------------------------------------------------
 * §3 Refine: raise Condition
 * ----------------------------------------------------------------- */

export async function refineIngredient(item, actor = item?.actor) {
  if (!isIngredient(item) || item.pack || !item.parent || !item.isOwner) { ui.notifications.warn("Only an ingredient a character carries can be refined."); return null; }
  const before = Number(item.system.condition) || 0;
  if (before >= MAX_CONDITION) { ui.notifications.info(`${item.name} is already Enhanced.`); return null; }
  const craft = craftValue(actor);
  const grade = DIFFICULTY[REFINE_STEP];
  const target = gradedTarget(craft.value, REFINE_STEP);
  const roll = await new Roll("1d100").evaluate();
  const result = alchemyResult(roll.total, target);
  const out = refineOutcome(result, before);
  const name = item.name;

  let line;
  if (out.verdict === "raised") {
    await moveOne(item, { condition: out.condition });
    line = `One ${e(name)} goes from ${conditionLabel(before)} to <strong>${conditionLabel(out.condition)}</strong>.`;
  } else if (out.verdict === "ruined") {
    await spendOne(item);
    line = `<strong>The sample is ruined.</strong> One ${e(name)} is lost.`;
  } else line = "Hours of work, and it is no better for them.";

  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    rolls: [roll],
    content: `<div class="mm-chat al-chat ${out.verdict === "ruined" ? "is-bad" : ""}">
      <h3>${e(actor?.name ?? game.user.name)} refines ${e(name)}</h3>
      <p>${e(craft.name)} ${craft.value}% · ${e(grade.label)} → <b>${target}%</b>, rolled <b>${roll.total}</b>: <strong>${e(result)}</strong></p>
      <p>${line}</p>
      <p class="mm-hint">Raising Condition takes hours of work and proper equipment (§3).</p></div>`
  });
  return out;
}

/* -------------------------------------------------------------------
 * §3 Preserve, §7 Pad
 * ----------------------------------------------------------------- */

export async function setPreserved(item, preserved = true) {
  if (!perishable(item) || !item.isOwner) return null;
  const update = { "system.preserved": Boolean(preserved) };
  if (!preserved) update["system.harvestedAt"] = now();      // the clock starts again when it comes out
  await item.update(update);
  ui.notifications.info(preserved ? `${item.name} is preserved: it will keep.` : `${item.name} is no longer preserved.`);
  return item;
}

export async function setPadded(item, padded = true) {
  if (!isPotion(item) || !item.isOwner) return null;
  const update = { "system.padded": Boolean(padded) };
  await item.update(update);
  ui.notifications.info(padded ? `${item.name} is in a padded case.` : `${item.name} is out of its case.`);
  return item;
}

/** When a Supercritical potion's time runs out, in world seconds; null if it isn't. */
export function supercriticalDeadline(item) {
  if (!isPotion(item) || !item.system.supercritical) return null;
  const at = Number(item.system.brewedAt);
  return Number.isFinite(at) && item.system.brewedAt !== null ? at + supercriticalLife(item.system.padded) : null;
}

/** "in 2 h 10 min" for a number of seconds. */
export function untilText(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return "any moment";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `in ${[d && `${d} d`, h && `${h} h`, !d && m && `${m} min`].filter(Boolean).join(" ")}`;
}

/* -------------------------------------------------------------------
 * Aging — the active GM runs it as game time passes
 * ----------------------------------------------------------------- */

let running = false;

export async function ageAlchemy() {
  if (!game.user?.isGM || (game.users.activeGM && game.users.activeGM !== game.user)) return;
  if (running) return;
  running = true;
  try {
    const t = now();
    const shelf = Number(asetting(ASETTINGS.shelfLife)) || 0;
    const decay = asetting(ASETTINGS.supercriticalDecay) !== false;
    for (const actor of game.actors) {
      const updates = [], spoiled = [], due = [];
      for (const item of actor.items) {
        if (shelf > 0 && perishable(item) && !item.system.preserved) {
          if (item.system.harvestedAt === null || item.system.harvestedAt === undefined) updates.push({ _id: item.id, "system.harvestedAt": t });
          else {
            const s = spoilage({ condition: item.system.condition, harvestedAt: Number(item.system.harvestedAt), now: t, shelfDays: shelf });
            if (s) {
              updates.push({ _id: item.id, "system.condition": s.condition, "system.harvestedAt": s.harvestedAt });
              spoiled.push(`${e(item.name)} ×${item.system.quantity}: now ${conditionLabel(s.condition)}`);
            }
          }
        }
        if (decay && isPotion(item) && item.system.supercritical) {
          if (item.system.brewedAt === null || item.system.brewedAt === undefined) updates.push({ _id: item.id, "system.brewedAt": t });
          else if (t >= supercriticalDeadline(item)) due.push(item);
        }
      }
      if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
      if (spoiled.length) {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id),
          content: `<div class="mm-chat al-chat"><p><strong>${e(actor.name)}'s stores are going off</strong> (§3):</p><ul>${spoiled.map(s => `<li>${s}</li>`).join("")}</ul><p class="mm-hint">Preserve perishables in the Laboratory's Stock tab to stop it.</p></div>`
        });
      }
      for (const item of due) await resolveSupercritical(item, actor);
    }
  } catch (err) {
    console.warn("Dreoarcana | Alchemy: aging", err);
  } finally { running = false; }
}

/** §9 Its few hours are up: 1d6, settle or discharge. */
async function resolveSupercritical(item, actor) {
  const roll = await new Roll("1d6").evaluate();
  const fate = supercriticalFate(roll.total);
  const speaker = ChatMessage.getSpeaker({ actor });
  if (fate === "settles") {
    const was = item.name;
    const fix = (s) => String(s ?? "").replace(/\(P7\)/g, "(P6)");
    const note = `<p><em>Settled from Supercritical to Potency ${MAX_POTENCY}.</em></p>`;
    await item.update({
      name: fix(item.name), "system.trueName": fix(item.system.trueName),
      "system.potency": MAX_POTENCY, "system.supercritical": false,
      "system.trueDescription": `${item.system.trueDescription ?? ""}${note}`,
      ...(item.system.identified ? { "system.description": `${item.system.description ?? ""}${note}` } : {})
    });
    await ChatMessage.create({ speaker, rolls: [roll], content: `<div class="mm-chat al-chat"><p><strong>${e(was)}</strong>, carried by ${e(actor.name)}, has held for its few hours (1d6: ${roll.total}). It settles to <strong>Potency ${MAX_POTENCY}</strong> (§9).</p></div>` });
    return "settled";
  }
  const blast = blastProfile(item) ?? { ...VOLATILITY[SUPERCRITICAL], tier: SUPERCRITICAL, potency: SUPERCRITICAL };
  await ChatMessage.create({ speaker, rolls: [roll], content: `<div class="mm-chat al-chat is-bad"><p><strong>${e(item.name)}</strong> was never stable (1d6: ${roll.total}). Its Supercritical charge lets go (§9).</p></div>` });
  await detonate(item, { actor, cause: "Supercritical discharge", blast });
  await item.delete();
  return "discharged";
}

/** A new ingredient on a character starts its clock; a new Supercritical dose, its fuse. */
export function onPreCreateStock(item) {
  if (item.parent?.documentName !== "Actor") return;
  const t = now();
  if (isIngredient(item) && (item.system.harvestedAt === null || item.system.harvestedAt === undefined)) item.updateSource({ "system.harvestedAt": t });
  if (isPotion(item) && item.system.supercritical && (item.system.brewedAt === null || item.system.brewedAt === undefined)) item.updateSource({ "system.brewedAt": t });
}
