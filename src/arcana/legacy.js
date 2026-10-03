/* ===================================================================
 * Dreoarcana Arcana — bringing in Mechanical Magic data
 *
 * Before Arcana was part of the system it was a Mythras module,
 * "alchemis-mechanical-magic". Its spells were Mythras `spell` items
 * and its Effect nodes `cyberModule` items, both carrying the module's
 * flags; Heat and the reservoir were actor flags. A world moved onto
 * Dreoarcana keeps that data, so on the GM's first load it is converted
 * once: spells and effects become arcaneSpell / arcaneEffect items and
 * the actor flags become tracked stats. Items dropped in later (from an
 * old compendium, say) are converted as they arrive.
 * =================================================================== */

import { SYSTEM_ID, SPELL_TYPE, EFFECT_TYPE, SPELL_IMG, EFFECT_IMG, LOG } from "./core.js";
import { normalizeBuild } from "./rules.js";
import { setting, SETTINGS } from "./settings.js";

const LEGACY = "alchemis-mechanical-magic";
const MIGRATION_VERSION = 1;

const legacyFlags = (data) => data?.flags?.[LEGACY] ?? null;
export const isLegacySpell = (data) => data?.type === "spell" && Boolean(legacyFlags(data)?.spell);
export const isLegacyEffect = (data) => data?.type === "cyberModule" && Boolean(legacyFlags(data)?.effect);
export const isLegacy = (data) => isLegacySpell(data) || isLegacyEffect(data);

/** Flags with the module's scope and its sheet override removed. */
function cleanFlags(flags = {}) {
  const out = foundry.utils.deepClone(flags);
  delete out[LEGACY];
  if (out.core?.sheetClass) delete out.core.sheetClass;
  return out;
}

const keepImage = (img, fallback) => (!img || img.startsWith(`modules/${LEGACY}/`) ? fallback : img);

/** New item data for a legacy item's source data. */
export function convertLegacyItem(data) {
  const f = legacyFlags(data) ?? {};
  const base = {
    name: data.name, folder: data.folder ?? null, sort: data.sort ?? 0,
    ownership: data.ownership, flags: cleanFlags(data.flags)
  };
  if (isLegacySpell(data)) {
    return {
      ...base, type: SPELL_TYPE, img: keepImage(data.img, SPELL_IMG),
      system: {
        description: data.system?.description ?? "",
        build: normalizeBuild({ ...(f.build ?? {}), name: data.name }),
        snapshot: f.snapshot ?? {},
        soundFile: f.soundFile ?? ""
      }
    };
  }
  const x = f.effect ?? {};
  return {
    ...base, type: EFFECT_TYPE, img: keepImage(data.img, EFFECT_IMG),
    system: {
      description: data.system?.description ?? "",
      key: x.key || data.name,
      category: x.category || "Custom",
      intents: Array.isArray(x.intents) && x.intents.length ? x.intents : ["Utility"],
      complexity: Number.isFinite(Number(x.complexity)) ? Number(x.complexity) : 1,
      damage: Boolean(x.damage),
      desc: x.desc || "",
      magnitude: x.magnitude || "Manifests at Might {M}"
    }
  };
}

/** Replace the legacy items in a collection (world or one actor). */
async function convertCollection(items, { parent = null } = {}) {
  const old = items.filter(i => isLegacy(i));
  if (!old.length) return 0;
  const data = old.map(i => {
    const src = i.toObject();
    const out = convertLegacyItem(src);
    if (parent) { delete out.folder; delete out.ownership; }
    return out;
  });
  const ids = old.map(i => i.id);
  if (parent) {
    await parent.createEmbeddedDocuments("Item", data, { arcanaMigration: true });
    await parent.deleteEmbeddedDocuments("Item", ids);
  } else {
    await Item.createDocuments(data, { arcanaMigration: true });
    await Item.deleteDocuments(ids);
  }
  return old.length;
}

/** The Heat flag becomes the Heat stat; old reservoir Orie goes back into Stored Orie. */
async function convertActorFlags(actor) {
  const f = actor.flags?.[LEGACY];
  if (!f) return false;
  const update = { [`flags.-=${LEGACY}`]: null };
  const heat = Number(f.heat) || 0;
  const reservoir = Number(f.reservoir) || 0;
  if (heat) update["system.trackedStats.heat.value"] = heat;
  if (reservoir) {
    const now = Number(actor.system?.trackedStats?.magicPoints?.value) || 0;
    const max = Number(actor.maxMagicPoints);
    update["system.trackedStats.magicPoints.value"] = Number.isFinite(max) ? Math.min(max, now + reservoir) : now + reservoir;
  }
  await actor.update(update);
  return true;
}

/** One pass over the world. GM only; runs once per world. */
export async function migrateWorld() {
  if (!game.user.isGM) return;
  if ((Number(setting(SETTINGS.migrated)) || 0) >= MIGRATION_VERSION) return;
  let items = 0, actors = 0;
  try {
    items += await convertCollection(game.items);
    for (const actor of game.actors) {
      items += await convertCollection(actor.items, { parent: actor });
      if (await convertActorFlags(actor)) actors++;
    }
    await game.settings.set(SYSTEM_ID, SETTINGS.migrated, MIGRATION_VERSION);
    if (items || actors) {
      LOG(`converted ${items} Mechanical Magic item(s) and ${actors} actor(s)`);
      ui.notifications.info(`Arcana: brought in ${items} spell and effect item${items === 1 ? "" : "s"} from Mechanical Magic${actors ? `, and Heat for ${actors} character${actors === 1 ? "" : "s"}` : ""}.`);
    }
  } catch (err) {
    console.error("Dreoarcana | Arcana: migration failed; it will retry next load", err);
  }
}

/**
 * An old item arriving (dropped from a compendium, imported, pasted):
 * create the converted item instead and refuse the original.
 */
export function onPreCreateItem(doc, data, options, userId) {
  if (userId !== game.user.id || options.arcanaMigration) return;
  const src = doc.toObject();
  if (!isLegacy(src)) return;
  const out = convertLegacyItem(src);
  if (doc.parent) delete out.folder;
  Item.create(out, { parent: doc.parent ?? undefined, pack: doc.pack ?? undefined })
    .catch(err => console.error("Dreoarcana | Arcana: could not convert dropped item", err));
  return false;
}
