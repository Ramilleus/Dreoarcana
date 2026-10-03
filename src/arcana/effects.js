/* ===================================================================
 * Dreoarcana Arcana — Effect nodes as Items
 *
 * A custom Effect node is an "arcaneEffect" item. It can live in the
 * Items directory, in any Item compendium, or on an actor, and
 * compendiums are what make effects portable between worlds.
 *
 * The registry is rebuilt from every effect item the client can see:
 * world items, plus the index of every Item compendium (the system
 * fields ride in the index, so packs are never fully loaded). World
 * items win over pack items with the same key, so importing one to
 * tweak it works.
 *
 * Identity is system.key, minted once at creation and carried through
 * export and import; builds reference that key, so an effect can be
 * renamed freely.
 * =================================================================== */

import { SYSTEM_ID, EFFECT_TYPE, EFFECT_IMG, isEffectItem, LOG } from "./core.js";
import * as rules from "./rules.js";

export const PACK_NAME = "arcane-effects";
export const PACK_LABEL = "Arcane Effects";
export const EFFECTS_HOOK = `${SYSTEM_ID}.arcanaEffectsChanged`;
const FOLDER = "Arcane Effects";

/** The registry record for an item or index entry. */
export function recordOf(doc, { source = "World", uuid = doc?.uuid ?? null } = {}) {
  const s = doc.system ?? {};
  return {
    key: s.key || doc.name,
    label: doc.name,
    source, uuid,
    category: s.category, intents: s.intents, complexity: s.complexity,
    damage: s.damage, desc: s.desc, magnitude: s.magnitude
  };
}

/** Item data for a new (or migrated) effect. */
export function effectItemData(rec = {}) {
  return {
    name: rec.label || rec.name || rec.key || "New Effect",
    type: EFFECT_TYPE,
    img: rec.img || EFFECT_IMG,
    system: {
      description: rec.desc ? `<p>${foundry.utils.escapeHTML(rec.desc)}</p>` : "",
      key: rec.key || foundry.utils.randomID(12),
      category: rec.category || "Custom",
      intents: Array.isArray(rec.intents) && rec.intents.length ? rec.intents : ["Utility"],
      complexity: Number.isFinite(Number(rec.complexity)) ? Number(rec.complexity) : 1,
      damage: Boolean(rec.damage),
      desc: rec.desc || "",
      magnitude: rec.magnitude || "Manifests at Might {M}"
    }
  };
}

/** Create a world effect item (GM). Returns the Item. */
export async function createEffectItem(rec = {}) {
  if (!game.user.isGM) { ui.notifications.warn("Only the GM can define Effect nodes."); return null; }
  const folder = game.folders.find(f => f.name === FOLDER && f.type === "Item")
              ?? await Folder.create({ name: FOLDER, type: "Item", color: "#4a3c8c" });
  let item = null;
  try { item = await Item.create({ ...effectItemData(rec), folder: folder.id }, { renderSheet: false }); }
  catch (err) { console.error("Dreoarcana | Arcana: could not create effect item", err); }
  if (!item) ui.notifications.error("Could not create the Effect node item — see the console.");
  return item ?? null;
}

/* -------------------------------------------------------------------
 * Scanning and registering
 * ----------------------------------------------------------------- */

/** Every effect record visible to this client — packs first, world last. */
export async function scanEffectItems() {
  const records = [];
  for (const pack of game.packs) {
    if (pack.documentName !== "Item" || !pack.visible) continue;
    let index;
    try { index = await pack.getIndex({ fields: ["system", "type"] }); }
    catch (err) { LOG(`could not index ${pack.collection}:`, err.message); continue; }
    for (const entry of index) {
      if (!isEffectItem(entry)) continue;
      records.push(recordOf(entry, { source: pack.metadata.label, uuid: entry.uuid ?? `Compendium.${pack.collection}.Item.${entry._id}` }));
    }
  }
  for (const item of game.items) if (isEffectItem(item)) records.push(recordOf(item, { source: "World", uuid: item.uuid }));
  return records;
}

/** Rebuild the registry from items and tell open windows. Cheap; safe to call often. */
export async function refreshEffects({ reason = "" } = {}) {
  const records = await scanEffectItems();
  const res = rules.applyCustomEffects(records);
  LOG(`effects (${reason || "refresh"}): ${res.applied.length} registered${res.skipped.length ? `, ${res.skipped.length} skipped` : ""}`);
  for (const s of res.skipped) console.warn("Dreoarcana | Arcana: skipped effect item", s.raw?.label ?? s.raw?.key, s.errors);
  Hooks.callAll(EFFECTS_HOOK, res);
  return res;
}

/** Debounced refresh for document hooks that arrive in bursts. */
export const refreshEffectsSoon = foundry.utils.debounce(() => refreshEffects({ reason: "items changed" }), 250);

/* -------------------------------------------------------------------
 * Compendium helpers
 * ----------------------------------------------------------------- */

/** The world's own effects compendium, created on demand. */
export async function getEffectsPack({ create = true } = {}) {
  let pack = game.packs.get(`world.${PACK_NAME}`)
          ?? game.packs.find(p => p.metadata.label === PACK_LABEL && p.documentName === "Item");
  if (!pack && create) {
    if (!game.user.isGM) return null;
    const CC = foundry.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
    pack = await CC.createCompendium({ label: PACK_LABEL, name: PACK_NAME, type: "Item", packageType: "world" });
    ui.notifications.info(`Created compendium "${PACK_LABEL}".`);
  }
  return pack;
}

/** Copy a world effect into the effects compendium (upsert by key). */
export async function sendEffectToPack(item) {
  if (!game.user.isGM || !isEffectItem(item)) return null;
  const pack = await getEffectsPack({ create: true });
  if (!pack) return null;
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  try {
    const key = item.system.key;
    const index = await pack.getIndex({ fields: ["system.key"] });
    const hit = index.find(x => x.system?.key === key);
    const data = item.toObject();
    delete data._id; delete data.folder; delete data.ownership;
    let doc;
    if (hit) doc = await (await pack.getDocument(hit._id)).update(data);
    else [doc] = await Item.createDocuments([data], { pack: pack.collection });
    ui.notifications.info(`${item.name} ${hit ? "updated in" : "added to"} "${pack.metadata.label}".`);
    return doc;
  } finally {
    if (wasLocked) await pack.configure({ locked: true });
  }
}

/* -------------------------------------------------------------------
 * Usage
 * ----------------------------------------------------------------- */

/** Spells on world actors and in the Items directory that use an effect key. */
export function spellsUsingEffect(key) {
  const uses = (item) => item.type === "arcaneSpell" && (item.system?.build?.effects ?? []).some(x => x.effect === key);
  const hits = [];
  for (const item of game.items) if (uses(item)) hits.push(item.name);
  for (const actor of game.actors) for (const item of actor.items) if (uses(item)) hits.push(`${item.name} (${actor.name})`);
  return hits;
}
