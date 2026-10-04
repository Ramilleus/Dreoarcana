/* ===================================================================
 * Dreoarcana Alchemy — foraging
 *
 * "A crafting system for crafting potions that rewards going and
 * looking for herbs." The Codex names foraging as the one unbuilt
 * piece of alchemy; this builds it from rules that already exist and
 * marks what it adds (see rules.js, "Foraging").
 *
 *   1. The GM describes foraging grounds: a name, a difficulty, and
 *      which catalogue ingredients grow there. "Anywhere" is always
 *      available and draws on the whole catalogue.
 *   2. A day's foraging is one Survival roll at the ground's difficulty
 *      (Mythras p.49: foraging, once per day). Success finds 1d3
 *      things; a critical finds more and harvests them Enhanced (§3).
 *   3. Each find is drawn by Rarity — common things turn up far more
 *      often — and, if the forager doesn't already know it, identified
 *      in the field with Lore (Alchemy) or Lore (Natural World) at its
 *      Rarity difficulty (§3). A failure leaves it "Unidentified", to
 *      be worked out later in the Laboratory.
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";
import { catalogue, isIngredient, isMother, skillValue, gmCard } from "./core.js";
import { asetting, ASETTINGS } from "./settings.js";
import { DIFFICULTY, RARITY_DIFFICULTY, FORAGE_FINDS, SLOT_NAMES, gradedTarget, alchemyResult, pickByRarity, categoryOf } from "./rules.js";
import { e } from "../arcana/html.js";

export const ANYWHERE = "anywhere";

/* -------------------------------------------------------------------
 * Grounds
 * ----------------------------------------------------------------- */

export function grounds() {
  const list = asetting(ASETTINGS.grounds);
  return Array.isArray(list) ? list : [];
}

export function anywhereGround() {
  return { id: ANYWHERE, name: "Anywhere", grade: 3, description: "Whatever the wild offers: the whole catalogue, common things far more often than rare ones.", entries: null };
}

export function groundById(id) {
  return id === ANYWHERE ? anywhereGround() : grounds().find(g => g.id === id) ?? null;
}

export async function saveGround(ground) {
  if (!game.user.isGM) throw new Error("Only the GM can describe foraging grounds.");
  const list = grounds().filter(g => g.id !== ground.id);
  const clean = {
    id: ground.id || foundry.utils.randomID(10),
    name: String(ground.name || "Unnamed ground").trim(),
    grade: Math.min(6, Math.max(1, Number(ground.grade) || 3)),
    description: String(ground.description ?? ""),
    entries: [...new Set((ground.entries ?? []).filter(Boolean))]
  };
  list.push(clean);
  list.sort((a, b) => a.name.localeCompare(b.name));
  await game.settings.set(SYSTEM_ID, ASETTINGS.grounds, list);
  return clean;
}

export async function deleteGround(id) {
  if (!game.user.isGM) return;
  await game.settings.set(SYSTEM_ID, ASETTINGS.grounds, grounds().filter(g => g.id !== id));
}

/** The catalogue documents that grow on a ground. */
export async function groundStock(ground) {
  const all = (await catalogue()).filter(d => isIngredient(d) && !isMother(d));
  if (!ground?.entries) return all;
  const want = new Set(ground.entries);
  return all.filter(d => want.has(d.name));
}

/* -------------------------------------------------------------------
 * Skills: Survival, and the better of two Lores (§3)
 * ----------------------------------------------------------------- */

const findSkill = (actor, re) => actor?.items?.find(i => /Skill$/.test(i.type) && re.test(i.name)) ?? null;

/** Survival, or its Mythras base of CON+POW (p.53). */
export function survivalValue(actor) {
  const item = findSkill(actor, /^survival$/i);
  if (item) return { value: skillValue(item), name: item.name };
  const c = actor?.characteristics ?? {};
  return { value: (Number(c.con) || 0) + (Number(c.pow) || 0), name: "Survival, base" };
}

/** Lore (Alchemy) or Lore (Natural World), whichever is higher; else INT×2 (p.53). */
export function identifyValue(actor) {
  const lores = [findSkill(actor, /lore.*alchem/i), findSkill(actor, /lore.*natural/i)].filter(Boolean);
  if (lores.length) {
    const best = lores.reduce((a, b) => (skillValue(b) > skillValue(a) ? b : a));
    return { value: skillValue(best), name: best.name };
  }
  return { value: (Number(actor?.characteristics?.int) || 0) * 2, name: "Lore, base" };
}

/** Does this character already know this ingredient on sight? */
const familiar = (actor, name) => actor.items.some(i => isIngredient(i) && i.system.identified !== false && i.name === name);

/* -------------------------------------------------------------------
 * A day's foraging
 * ----------------------------------------------------------------- */

export async function forageDay(actor, groundId, { mod = 0 } = {}) {
  if (!actor?.isOwner) { ui.notifications.warn("Choose a character you control to forage."); return null; }
  const ground = groundById(groundId);
  if (!ground) { ui.notifications.warn("That foraging ground no longer exists."); return null; }
  const stock = await groundStock(ground);
  if (!stock.length) { ui.notifications.warn(`Nothing is listed as growing in ${ground.name}.`); return null; }

  const survival = survivalValue(actor);
  const step = ground.grade ?? 3;
  const target = gradedTarget(survival.value, step, mod);
  const roll = await new Roll("1d100").evaluate();
  const result = alchemyResult(roll.total, target);
  const outcome = FORAGE_FINDS[result];
  const rolls = [roll];

  let count = 0;
  if (outcome.dice) {
    const n = await new Roll(outcome.dice).evaluate();
    rolls.push(n);
    count = n.total;
  }

  // Draw each find by Rarity, then identify it in the field (§3).
  const lore = identifyValue(actor);
  const finds = [];
  for (let i = 0; i < count; i++) {
    const doc = pickByRarity(stock.map(d => ({ doc: d, rarity: d.system.rarity })), Math.random()).doc;
    let identified = familiar(actor, doc.name), idRoll = null, idResult = null, primary = false;
    if (!identified) {
      const idStep = RARITY_DIFFICULTY[doc.system.rarity] ?? 3;
      const idTarget = gradedTarget(lore.value, idStep);
      const r = await new Roll("1d100").evaluate();
      rolls.push(r);
      idResult = alchemyResult(r.total, idTarget);
      identified = ["success", "special", "critical"].includes(idResult);
      primary = idResult === "critical";        // a critical Lore gives real insight (p.47)
      idRoll = `${r.total} vs ${idTarget}%`;
    }
    finds.push({ doc, identified, primary, idRoll, idResult });
  }

  const created = await stowFinds(actor, finds, outcome.condition);

  const grade = DIFFICULTY[step];
  const lines = finds.map(f => {
    const shown = f.identified ? e(f.doc.name) : `an unidentified ${e(categoryOf(f.doc.name).toLowerCase())}`;
    const how = f.idRoll ? ` <small>(${e(lore.name)} ${f.idRoll}: ${f.idResult}${f.primary ? ", and its Primary property is plain" : ""})</small>` : " <small>(known on sight)</small>";
    return `<li>${shown}${how}</li>`;
  }).join("");
  const gmTruth = finds.filter(f => !f.identified).map(f => e(f.doc.name));

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls,
    content: `<div class="mm-chat al-chat ${result === "fumble" ? "is-bad" : ""}">
      <h3>${e(actor.name)} forages ${e(ground.name)}</h3>
      <p>${e(survival.name)} ${survival.value}% · ${e(grade.label)} (${grade.mod >= 0 ? "+" : ""}${grade.mod}%)${mod ? ` · ${mod > 0 ? "+" : ""}${mod}%` : ""} → <b>${target}%</b>, rolled <b>${roll.total}</b>: <strong>${result}</strong></p>
      ${outcome.note ? `<p><em>${e(outcome.note)}</em></p>` : ""}
      ${finds.length ? `<p>A day's foraging turns up ${finds.length} thing${finds.length === 1 ? "" : "s"}:</p><ul>${lines}</ul>` : ""}</div>`
  });
  if (gmTruth.length) {
    await gmCard(`<p><strong>[GM]</strong> ${e(actor.name)}'s unidentified finds were: ${gmTruth.join(", ")}.</p>`);
  }
  return { result, finds, created };
}

/** Put the day's finds in the forager's pack, stacking like with like. */
async function stowFinds(actor, finds, condition) {
  const creates = [], updates = new Map();
  const now = Number(game.time?.worldTime) || 0;
  // Only stack with a harvest from the same day, so each keeps its own shelf-life clock (§3).
  const fresh = (i) => !i.system.preserved && Math.abs((Number(i.system.harvestedAt) || 0) - now) < 86400;
  for (const f of finds) {
    const src = f.doc.toObject();
    delete src._id;
    const trueName = f.doc.name;
    const name = f.identified ? trueName : `Unidentified ${categoryOf(trueName)}`;
    const existing = actor.items.find(i => isIngredient(i) && i.name === name && (i.system.trueName || i.name) === trueName && Number(i.system.condition) === condition && fresh(i));
    const pending = creates.find(c => c.name === name && c.system.trueName === trueName);
    if (existing) { updates.set(existing.id, (updates.get(existing.id) ?? Number(existing.system.quantity)) + 1); continue; }
    if (pending) { pending.system.quantity += 1; continue; }
    src.name = name;
    src.system.quantity = 1;
    src.system.condition = condition;
    src.system.identified = f.identified;
    src.system.trueName = trueName;
    src.system.discovered = f.primary ? [0] : [];
    src.system.harvestedAt = now;
    src.system.preserved = false;
    if (!f.identified) src.system.description = "";
    creates.push(src);
  }
  if (updates.size) await actor.updateEmbeddedDocuments("Item", [...updates].map(([_id, q]) => ({ _id, "system.quantity": q })));
  return creates.length ? actor.createEmbeddedDocuments("Item", creates) : [];
}

/* -------------------------------------------------------------------
 * Identifying a find later
 * ----------------------------------------------------------------- */

/** Lore at the find's Rarity (§3). Players roll; the GM may simply reveal. */
export async function identifyIngredient(item, actor = item.actor) {
  if (!isIngredient(item) || item.system.identified !== false) return null;
  if (!item.isOwner || item.pack) { ui.notifications.warn("Only its owner can work out what this is."); return null; }
  const trueName = item.system.trueName || item.name;
  const lore = identifyValue(actor);
  const step = RARITY_DIFFICULTY[item.system.rarity] ?? 3;
  const target = gradedTarget(lore.value, step);
  const roll = await new Roll("1d100").evaluate();
  const result = alchemyResult(roll.total, target);
  const ok = ["success", "special", "critical"].includes(result);
  if (ok) {
    const update = { name: trueName, "system.identified": true };
    if (result === "critical") update["system.discovered"] = [...new Set([...(item.system.discovered ?? []), 0])];
    await item.update(update);
  }
  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    rolls: [roll],
    content: `<div class="mm-chat al-chat"><p>${e(lore.name)} ${lore.value}% · ${e(DIFFICULTY[step].label)} → <b>${target}%</b>, rolled <b>${roll.total}</b>: <strong>${result}</strong>.</p>
      <p>${ok ? `It is <strong>${e(trueName)}</strong>.${result === "critical" ? ` Its Primary property is plain too: <strong>${e(item.system.slots?.[0] ?? "nothing")}</strong> (${SLOT_NAMES[0]}).` : ""}` : "It still isn't clear what this is."}</p></div>`
  });
  return ok;
}

export async function revealIngredient(item) {
  if (!game.user.isGM || !isIngredient(item) || item.system.identified !== false) return null;
  await item.update({ name: item.system.trueName || item.name, "system.identified": true });
  return item;
}
