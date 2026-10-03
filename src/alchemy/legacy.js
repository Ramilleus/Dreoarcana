/* ===================================================================
 * Dreoarcana Alchemy — bringing in Alchemis Alchemy data
 *
 * Before alchemy was part of the system it was a Mythras module,
 * "alchemis-alchemy". Its ingredients and potions were Mythras
 * `equipment` items carrying the module's flags (early builds used the
 * scope "alchemis"). A world moved onto Dreoarcana keeps that data, so
 * on the GM's first load it is converted once into ingredient and
 * potion items; anything dropped in later converts as it arrives.
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";
import { INGREDIENT_TYPE, POTION_TYPE, POTION_IMG, ingredientItemData } from "./core.js";
import { asetting, ASETTINGS } from "./settings.js";

const SCOPES = ["alchemis-alchemy", "alchemis"];
const VERSION = 1;

const flagsOf = (data) => SCOPES.map(s => data?.flags?.[s]).find(Boolean) ?? null;
export const isLegacyAlchemy = (data) => data?.type === "equipment" && Boolean(flagsOf(data)?.ingredient || flagsOf(data)?.potion);

function cleanFlags(flags = {}) {
  const out = foundry.utils.deepClone(flags);
  for (const s of SCOPES) delete out[s];
  if (out.core?.sheetClass) delete out.core.sheetClass;
  return out;
}

/** New item data for an old module item's source data. */
export function convertLegacyAlchemy(src) {
  const f = flagsOf(src) ?? {};
  const base = { name: src.name, folder: src.folder ?? null, sort: src.sort ?? 0, ownership: src.ownership, flags: cleanFlags(src.flags) };
  const sys = src.system ?? {};
  const physical = { encumbrance: sys.encumbrance ?? 0, quantity: sys.quantity ?? 1, value: sys.value ?? 0, storage: sys.storage ?? "Unknown" };
  if (f.potion) {
    return {
      ...base, type: POTION_TYPE,
      img: !src.img || src.img.startsWith("modules/alchemis-alchemy/") ? POTION_IMG : src.img,
      system: {
        description: sys.description ?? "", ...physical, equipmentType: sys.equipmentType || "MYTHRAS.Consumables",
        identified: Boolean(f.identified), quality: f.quality ?? "", potency: f.potency ?? 0, supercritical: Boolean(f.supercritical),
        orie: f.orie ?? 0, ingredientOrie: f.ingredientOrie ?? 0, channelledXi: f.channelledXi ?? 0, rawOriePerDose: f.rawOriePerDose ?? 0,
        mechanical: Boolean(f.mechanical), potionClass: f.potionClass ?? (f.mechanical ? "Mechanical" : "Mundane"),
        mother: f.mother ?? "", motherUnits: f.motherUnits ?? 0, boiledOff: f.boiledOff ?? 0,
        duration: f.duration ?? 0, multiplier: f.multiplier ?? 1,
        manifest: f.manifest ?? (f.effects ?? []).map(effect => ({ effect, slot: 0 })),
        size: f.size ?? "", ingredients: f.ingredients ?? [], trueName: f.trueName ?? src.name,
        trueDescription: f.trueDescription ?? sys.description ?? "", brewedBy: ""
      }
    };
  }
  // An auto-generated summary from the old importer is not flavour text.
  const desc = /<strong>Rarity:<\/strong>/.test(sys.description ?? "") ? "" : (sys.description ?? "");
  const data = ingredientItemData({
    name: src.name, img: src.img, description: desc, weight: physical.encumbrance, value: physical.value, quantity: physical.quantity,
    grade: f.grade, condition: f.condition, class: f.class, rarity: f.rarity, slots: f.slots ?? f.effects, discovered: f.discovered
  });
  data.system.storage = physical.storage;
  return { ...base, ...data, type: INGREDIENT_TYPE };
}

async function convertCollection(items, parent = null) {
  const old = items.filter(i => isLegacyAlchemy(i));
  if (!old.length) return 0;
  const data = old.map(i => { const d = convertLegacyAlchemy(i.toObject()); if (parent) { delete d.folder; delete d.ownership; } return d; });
  if (parent) {
    await parent.createEmbeddedDocuments("Item", data, { alchemyMigration: true });
    await parent.deleteEmbeddedDocuments("Item", old.map(i => i.id));
  } else {
    await Item.createDocuments(data, { alchemyMigration: true });
    await Item.deleteDocuments(old.map(i => i.id));
  }
  return old.length;
}

/** Once per world, on the GM's client. */
export async function migrateAlchemy() {
  if (!game.user.isGM || (Number(asetting(ASETTINGS.migrated)) || 0) >= VERSION) return;
  try {
    let n = await convertCollection(game.items);
    for (const actor of game.actors) n += await convertCollection(actor.items, actor);
    await game.settings.set(SYSTEM_ID, ASETTINGS.migrated, VERSION);
    if (n) ui.notifications.info(`Alchemy: brought in ${n} ingredient and potion item${n === 1 ? "" : "s"} from Alchemis Alchemy.`);
  } catch (err) {
    console.error("Dreoarcana | Alchemy: migration failed; it will retry next load", err);
  }
}

/** An old item arriving later: create the converted item instead. */
export function onPreCreateAlchemy(doc, data, options, userId) {
  if (userId !== game.user.id || options.alchemyMigration) return;
  const src = doc.toObject();
  if (!isLegacyAlchemy(src)) return;
  const out = convertLegacyAlchemy(src);
  if (doc.parent) delete out.folder;
  Item.create(out, { parent: doc.parent ?? undefined, pack: doc.pack ?? undefined })
    .catch(err => console.error("Dreoarcana | Alchemy: could not convert dropped item", err));
  return false;
}
