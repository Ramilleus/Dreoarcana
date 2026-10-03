/* ===================================================================
 * Dreoarcana Alchemy — shared core
 *
 * Where alchemy meets the rest of Dreoarcana:
 *
 *   Ingredients   items of type "ingredient" (physical: ENC, quantity,
 *                 value and storage work like any equipment)
 *   Potions       items of type "potion", one dose per quantity
 *   Catalogue     the system compendium "Alchemy Ingredients", plus a
 *                 world compendium for the GM's own additions
 *   Stored Orie   system.trackedStats.magicPoints (via arcana/core.js)
 *   Skills        Craft (Alchemy), Lore (Alchemy), Endurance
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";
import { isMother as isMotherRec } from "./rules.js";

export const INGREDIENT_TYPE = "ingredient";
export const POTION_TYPE = "potion";
export const TEMPLATES = `systems/${SYSTEM_ID}/templates/alchemy`;
export const POTION_IMG = `systems/${SYSTEM_ID}/assets/alchemy/potion.svg`;
export const INGREDIENT_IMG = "icons/svg/item-bag.svg";
export const SYSTEM_PACK = `${SYSTEM_ID}.alchemyIngredients`;
export const WORLD_PACK_NAME = "alchemy-ingredients";
export const WORLD_PACK_LABEL = "Alchemy Ingredients (World)";

export const isIngredient = (doc) => doc?.type === INGREDIENT_TYPE;
export const isPotion = (doc) => doc?.type === POTION_TYPE;
export const isAlchemical = (doc) => isIngredient(doc) || isPotion(doc);

/** A plain record of an ingredient, the shape the rules work on. */
export function record(doc) {
  const s = doc.system ?? {};
  const slots = Array.from({ length: 4 }, (_, i) => s.slots?.[i] || null);
  return {
    id: doc.id ?? doc._id, uuid: doc.uuid ?? null, doc,
    name: doc.name, img: doc.img,
    description: s.description ?? "",
    quantity: Number(s.quantity ?? 1),
    weight: Number(s.encumbrance ?? 0),
    rarity: s.rarity || "Common",
    grade: Number.isInteger(Number(s.grade)) && s.grade !== null && s.grade !== "" ? Number(s.grade) : null,
    condition: Number(s.condition ?? 0),
    class: s.class || "Mundane",
    mother: Boolean(s.mother),
    slots, effects: slots.filter(Boolean)
  };
}

export const isMother = (doc) => isIngredient(doc) && isMotherRec({ mother: doc.system?.mother, name: doc.name });

/* -------------------------------------------------------------------
 * Skills — read off the character's own sheet
 * ----------------------------------------------------------------- */

const skillVal = (item) => Number(item?.totalVal ?? item?.system?.totalVal) || 0;
const findSkill = (actor, re) => actor?.items?.find(i => /Skill$/.test(i.type) && re.test(i.name)) ?? null;

export const craftSkill = (actor) => findSkill(actor, /craft.*alchem|alchem.*craft/i);
export const loreSkill = (actor) => findSkill(actor, /lore.*alchem|alchem.*lore/i);

/** Endurance (CON×2 by default, p.53) — what resists a poison (p.74). */
export function endurance(actor) {
  const item = findSkill(actor, /^endurance$/i);
  if (item) return skillVal(item);
  const con = Number(actor?.characteristics?.con ?? actor?.system?.characteristics?.con?.value) || 0;
  return con * 2;
}

export const skillValue = skillVal;

/* -------------------------------------------------------------------
 * Coins: "3cp" / "10pp" / "12" → integer copper
 * ----------------------------------------------------------------- */
const COIN = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000, dd: 10000 };
export function toCopper(v) {
  v = (v ?? "").toString().trim();
  if (!v || v === "0") return 0;
  const m = v.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (m && COIN[m[2].toLowerCase()]) return Math.round(parseFloat(m[1]) * COIN[m[2].toLowerCase()]);
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : Math.round(n);
}

/** Item data for one ingredient record (from the CSV, the editor, or an old item). */
export function ingredientItemData(rec) {
  const slots = Array.from({ length: 4 }, (_, i) => {
    const v = (rec.slots ?? rec.effects ?? [])[i];
    return v && v !== "Null" && v !== "—" ? v : null;
  });
  const wt = parseFloat(rec.weight);
  return {
    name: rec.name,
    type: INGREDIENT_TYPE,
    img: rec.img || INGREDIENT_IMG,
    system: {
      description: (rec.description ?? "").trim(),
      encumbrance: Number.isNaN(wt) ? 0 : wt,
      quantity: Number(rec.quantity) > 0 ? Number(rec.quantity) : 1,
      value: typeof rec.value === "number" ? rec.value : toCopper(rec.value),
      equipmentType: "MYTHRAS.Materials",
      grade: Number.isInteger(Number(rec.grade)) && rec.grade !== null && rec.grade !== "" ? Number(rec.grade) : null,
      condition: Number(rec.condition) || 0,
      class: rec.class || "Mundane",
      rarity: rec.rarity || "Common",
      mother: Boolean(rec.mother) || /^mother\s*[-–]/i.test(rec.name ?? ""),
      slots,
      discovered: Array.isArray(rec.discovered) ? rec.discovered : []
    }
  };
}

/* -------------------------------------------------------------------
 * Compendiums
 * ----------------------------------------------------------------- */

/** The world's own ingredient compendium, for the GM's additions. */
export async function worldPack({ create = true } = {}) {
  let pack = game.packs.get(`world.${WORLD_PACK_NAME}`);
  if (!pack && create && game.user.isGM) {
    const CC = foundry.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
    pack = await CC.createCompendium({ label: WORLD_PACK_LABEL, name: WORLD_PACK_NAME, type: "Item", packageType: "world" });
    ui.notifications.info(`Created compendium "${WORLD_PACK_LABEL}".`);
  }
  return pack ?? null;
}

/** Every ingredient in the catalogue: the system pack, then the world pack (world wins by name). */
export async function catalogue() {
  const byName = new Map();
  for (const pack of [game.packs.get(SYSTEM_PACK), game.packs.get(`world.${WORLD_PACK_NAME}`)]) {
    if (!pack) continue;
    const docs = await pack.getDocuments();
    for (const d of docs) if (isIngredient(d)) byName.set(d.name, d);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Create or update ingredients in the world pack, matched by name. */
export async function upsertIngredients(records) {
  const pack = await worldPack({ create: true });
  if (!pack) throw new Error("Only the GM can add to the ingredient catalogue.");
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  try {
    const current = await pack.getDocuments();
    const byName = new Map(current.map(d => [d.name, d]));
    const toCreate = [], toUpdate = [];
    for (const rec of records) {
      if (!rec?.name) continue;
      const data = ingredientItemData(rec);
      const hit = byName.get(rec.name);
      if (hit) {
        if (!data.system.description) delete data.system.description;   // a blank cell keeps existing prose
        delete data.system.discovered;
        toUpdate.push({ _id: hit.id, ...data });
      } else toCreate.push(data);
    }
    if (toCreate.length) await Item.createDocuments(toCreate, { pack: pack.collection });
    if (toUpdate.length) await Item.updateDocuments(toUpdate, { pack: pack.collection });
    return { created: toCreate.length, updated: toUpdate.length, pack };
  } finally {
    if (wasLocked) await pack.configure({ locked: true });
  }
}

/* -------------------------------------------------------------------
 * CSV — "Mythras Alchemy Ingredients.csv", matched by header name
 * ----------------------------------------------------------------- */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    }
    else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

export function recordsFromCSV(text) {
  const rows = parseCSV(String(text ?? "").trim());
  if (!rows.length) return { records: [], error: "No rows found." };
  const header = rows.shift().map(h => h.trim());
  const col = (n) => header.findIndex(h => h.toLowerCase().startsWith(n.toLowerCase()));
  const iName = col("Name"), iRarity = col("Rarity"), iGrade = col("Grade"), iClass = col("Class"),
        iP = col("Primary"), iS = col("Secondary"), iT = col("Tertiary"), iQ = col("Quaternary"),
        iWt = col("Weight"), iVal = col("Value"), iDesc = col("Description");
  if (iName < 0 || iGrade < 0) return { records: [], error: "The CSV needs at least 'Name' and 'Grade' columns." };
  const cell = (r, i) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const records = rows.map(r => {
    const gradeRaw = cell(r, iGrade);
    return {
      name: cell(r, iName), rarity: cell(r, iRarity),
      grade: /^\d+$/.test(gradeRaw) ? Number(gradeRaw) : null,
      class: cell(r, iClass) || "Mundane",
      slots: [iP, iS, iT, iQ].map(i => { const v = cell(r, i); return v && v !== "Null" && v !== "—" ? v : null; }),
      weight: cell(r, iWt), value: cell(r, iVal), description: cell(r, iDesc)
    };
  }).filter(r => r.name);
  return { records, error: null };
}

/** Records marked Mundane that carry magic-only effects (§3a). */
export function classContradictions(records, arcane) {
  return records
    .filter(r => r.class === "Mundane" && (r.slots ?? []).some(e => e && arcane.has(e)))
    .map(r => ({ name: r.name, offending: r.slots.filter(e => e && arcane.has(e)) }));
}
