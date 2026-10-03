/* ===================================================================
 * Dreoarcana Alchemy — the recipe book
 *
 * Every batch an alchemist decants is written into their book
 * (actor system.recipes): the Mother, the reagents, the Xi channelled
 * and the vessel, with how it came out last time. "Use" lays the same
 * mixture out on the bench again from what the alchemist carries.
 *
 * What the brew became is recorded as the alchemist saw it: an
 * unidentified batch stays unnamed in a player's book until the GM
 * reveals a potion of it.
 * =================================================================== */

import { isIngredient, isMother } from "./core.js";
import { asetting, ASETTINGS } from "./settings.js";

const keyOf = (mother, reagents, xi) => [mother, ...[...reagents].sort(), `xi:${Number(xi) || 0}`].join("|");

/** The book, newest first. */
export function recipes(actor) {
  const list = actor?.system?.recipes;
  return Array.isArray(list) ? [...list].sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0)) : [];
}

/** Write a decanted batch into its brewer's book (or update the page it already has). */
export async function recordRecipe(actor, { mother, reagents, xi = 0, size, quality, potency, doses, trueName, identified, potionUuid }) {
  if (!actor?.isOwner || !mother || !reagents?.length) return null;
  const list = Array.isArray(actor.system.recipes) ? foundry.utils.deepClone(actor.system.recipes) : [];
  const key = keyOf(mother, reagents, xi);
  const last = { quality, potency, doses, size, trueName, identified: Boolean(identified), potionUuid: potionUuid ?? null, at: Date.now() };
  let page = list.find(r => r.key === key);
  if (page) {
    page.last = last;
    page.count = (Number(page.count) || 0) + 1;
    page.size = size;
  } else {
    page = { id: foundry.utils.randomID(10), key, name: "", mother, reagents: [...reagents], xi: Number(xi) || 0, size, count: 1, last };
    list.push(page);
  }
  await actor.update({ "system.recipes": list });
  return page;
}

export async function renameRecipe(actor, id, name) {
  if (!actor?.isOwner) return;
  const list = foundry.utils.deepClone(actor.system.recipes ?? []);
  const page = list.find(r => r.id === id);
  if (!page) return;
  page.name = String(name ?? "").trim();
  await actor.update({ "system.recipes": list });
}

export async function deleteRecipe(actor, id) {
  if (!actor?.isOwner) return;
  await actor.update({ "system.recipes": (actor.system.recipes ?? []).filter(r => r.id !== id) });
}

/** The page as this viewer may read it. */
export function recipeView(page, { isGM = game.user?.isGM, actor = null } = {}) {
  const concealed = asetting(ASETTINGS.unidentified) !== false;
  const last = page.last ?? {};
  const known = isGM || !concealed || last.identified;
  const made = known && last.trueName ? last.trueName : null;
  const parts = matchRecipe(actor, page);
  return {
    id: page.id, name: page.name || made || `${page.reagents.join(" + ")}`,
    custom: Boolean(page.name), inputName: page.name ?? "",
    mixture: `${page.reagents.join(" + ")} in ${page.mother}${page.xi ? ` · ${page.xi} Xi` : ""}`,
    result: known && last.quality ? `${last.quality} · P${last.potency} · ${last.doses} dose${last.doses === 1 ? "" : "s"} in ${last.size}` : `${last.doses ?? "?"} dose${last.doses === 1 ? "" : "s"} in ${last.size ?? "?"}; result unknown`,
    made, count: page.count ?? 1, countNote: (page.count ?? 1) > 1 ? ` · brewed ${page.count}×` : "",
    missing: parts.missing, ready: actor ? !parts.missing.length : true
  };
}

/**
 * Find a recipe's ingredients among what an actor carries: identified
 * stacks of the right name, the best Condition first.
 */
export function matchRecipe(actor, page) {
  if (!actor) return { motherId: null, reagentIds: [], missing: [] };
  const stock = actor.items.filter(i => isIngredient(i) && i.system.identified !== false && (Number(i.system.quantity) || 0) > 0);
  const best = (name, test) => stock.filter(i => i.name === name && test(i))
    .sort((a, b) => (Number(b.system.condition) || 0) - (Number(a.system.condition) || 0))[0] ?? null;
  const mother = best(page.mother, i => isMother(i));
  const reagents = page.reagents.map(n => ({ name: n, item: best(n, i => !isMother(i)) }));
  const missing = [...(mother ? [] : [page.mother]), ...reagents.filter(r => !r.item).map(r => r.name)];
  return { motherId: mother?.id ?? null, reagentIds: reagents.filter(r => r.item).map(r => r.item.id), missing };
}
