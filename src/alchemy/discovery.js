/* ===================================================================
 * Dreoarcana Alchemy — Discovery (§4, optional)
 *
 * Knowledge is per slot, recorded on the ingredient itself
 * (system.discovered), so two characters each carrying their own
 * Silverleaf can know different things about it. Compendium entries
 * record nothing: they are the world's catalogue, not anyone's notes.
 *
 *   Taste — reveals the Primary, but it is swallowed (§6a): the whole
 *           raw dose goes against the taster's SIZ (§8).
 *   Study — Lore (Alchemy) at the ingredient's Rarity difficulty; a
 *           success reveals the next slot, a critical two.
 *   Brew  — an effect that manifests reveals itself on every
 *           ingredient that contributed it.
 * =================================================================== */

import { record, loreSkill, skillValue } from "./core.js";
import { asetting, ASETTINGS } from "./settings.js";
import { SLOT_NAMES, ARCANE_EFFECTS, RARITY_DIFFICULTY, DIFFICULTY,
         effectivePotency, describeEffect, slotPotency, gradedTarget, alchemyResult } from "./rules.js";
import { e } from "../arcana/html.js";
import { saturationCheck } from "./consume.js";

/** Which slots this viewer knows. GMs know everything. */
export function knownSlots(doc, { asGM = game.user?.isGM } = {}) {
  if (asGM || asetting(ASETTINGS.discovery) === false) return [0, 1, 2, 3];
  const d = doc?.system?.discovered;
  return Array.isArray(d) ? d : [];
}

/** Can discoveries be written to this item? (an owned, non-compendium copy) */
export const canDiscoverOn = (item) => Boolean(item?.update) && !item.pack && item.isOwner === true;

export async function discoverSlots(item, indices) {
  const current = knownSlots(item, { asGM: false });
  const slots = record(item).slots;
  const gained = indices.filter(i => !current.includes(i) && slots[i]);
  if (!gained.length || !canDiscoverOn(item)) return [];
  try { await item.update({ "system.discovered": [...current, ...gained].sort((a, b) => a - b) }); }
  catch (err) { console.warn("Dreoarcana | Alchemy: could not record discovery", err); return []; }
  return gained;
}

/** Every slot of an ingredient, as this viewer may see it. */
export function describeKnown(doc, { asGM = game.user?.isGM } = {}) {
  const rec = record(doc);
  const known = knownSlots(doc, { asGM });
  const potency = effectivePotency(rec.grade, rec.condition);
  return rec.slots.map((effect, index) => {
    const seen = known.includes(index);
    const sp = potency ? slotPotency(potency, index) : 0;
    return {
      index, name: SLOT_NAMES[index], effect, known: seen,
      label: !effect ? "—" : (seen ? effect : "unknown"),
      arcane: Boolean(effect) && ARCANE_EFFECTS.has(effect),
      potency: sp,
      rule: seen && effect && sp >= 1 ? describeEffect(effect, sp, 1) : null
    };
  });
}

/** Taste: the Primary at once, at the price of swallowing it. */
export async function tasteIngredient(item, actor = item.actor) {
  const rec = record(item);
  if (!rec.slots[0]) { ui.notifications.warn(`${item.name} has no Primary property to taste.`); return []; }
  if (!canDiscoverOn(item)) { ui.notifications.warn(`${item.name} isn't yours to learn from. Put a copy on a character first.`); return []; }
  const gained = await discoverSlots(item, [0]);
  const potency = effectivePotency(rec.grade, rec.condition) ?? 1;
  const raw = rec.class === "Mechanical" ? potency * potency : 0;
  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    content: `<div class="mm-chat al-chat">
      <p><strong>${e(actor?.name ?? game.user.name)}</strong> tastes <strong>${e(item.name)}</strong>.</p>
      ${gained.length ? `<p>Its Primary property is plain enough: <strong>${e(rec.slots[0])}</strong> — at Potency ${potency}: ${e(describeEffect(rec.slots[0], potency, 1))}</p>`
                      : `<p>Nothing new; its Primary was already known.</p>`}
      ${raw ? `<p><strong>Raw dose:</strong> ${raw} Orie against the taster's SIZ (§8).</p>` : ""}</div>`
  });
  // §4: it is swallowed, so the whole raw dose joins the taster's load (§8).
  if (raw && actor) await saturationCheck({ actor, rawOrie: raw, source: `tasting ${item.name}` });
  return gained;
}

/** Study: Lore (Alchemy) against the ingredient's Rarity. */
export async function studyIngredient(item, { actor = item.actor, skill = null } = {}) {
  const rec = record(item);
  const known = knownSlots(item, { asGM: false });
  const next = rec.slots.findIndex((fx, i) => fx && !known.includes(i));
  if (next === -1) { ui.notifications.info(`Nothing further to learn about ${item.name}.`); return []; }
  if (!canDiscoverOn(item)) { ui.notifications.warn(`${item.name} isn't yours to study. Put a copy on a character first.`); return []; }

  const value = skill ?? skillValue(loreSkill(actor));
  if (!value) { ui.notifications.warn(`${actor?.name ?? "This character"} has no Lore (Alchemy) skill to study with.`); return []; }
  const step = RARITY_DIFFICULTY[rec.rarity] ?? 3;
  const target = gradedTarget(value, step);
  const roll = await new Roll("1d100").evaluate();
  const result = alchemyResult(roll.total, target);
  const success = result === "success" || result === "special" || result === "critical";
  const grade = DIFFICULTY[step];

  let gained = [];
  if (success) {
    const reveal = [next];
    if (result === "critical") {
      const second = rec.slots.findIndex((fx, i) => fx && !known.includes(i) && i !== next);
      if (second !== -1) reveal.push(second);
    }
    gained = await discoverSlots(item, reveal);
  }
  const potency = effectivePotency(rec.grade, rec.condition) ?? 1;
  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    rolls: [roll],
    content: `<div class="mm-chat al-chat">
      <h3>Studying ${e(item.name)}</h3>
      <p>Lore (Alchemy) ${value}% · ${e(grade.label)} (${grade.mod >= 0 ? "+" : ""}${grade.mod}%, ${e(rec.rarity)}) → <b>${target}%</b>, rolled <b>${roll.total}</b>: <strong>${result}</strong></p>
      ${success
        ? `<ul>${gained.map(i => { const sp = slotPotency(potency, i);
            return `<li><strong>${e(rec.slots[i])}</strong> <em>(${SLOT_NAMES[i]})</em>${sp >= 1 ? ` — at Potency ${sp}: ${e(describeEffect(rec.slots[i], sp, 1))}` : ""}</li>`; }).join("")}</ul>`
        : `<p>Hours of work, and it gives nothing up.</p>`}</div>`
  });
  return gained;
}

/** Brewing: whatever manifested is now known on each contributor. */
export async function discoverFromBrew(records, manifest) {
  const learned = [];
  for (const rec of records) {
    if (!canDiscoverOn(rec.doc)) continue;
    const indices = manifest.map(m => rec.slots.indexOf(m.effect)).filter(i => i >= 0);
    if (!indices.length) continue;
    const gained = await discoverSlots(rec.doc, indices);
    if (gained.length) learned.push({ name: rec.name, gained, slots: rec.slots });
  }
  return learned;
}
