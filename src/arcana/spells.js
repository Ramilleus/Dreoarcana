/* ===================================================================
 * Dreoarcana Arcana — spell items
 *
 * A built spell is an "arcaneSpell" item. The node build lives in
 * system.build; everything else (Might, Heat, tier…) is derived from
 * it fresh whenever it is read, so a rules change reaches every spell.
 * A snapshot of the saved figures and an HTML summary are kept only so
 * the plain item views and compendium browsers say something useful.
 * =================================================================== */

import { SPELL_TYPE, SPELL_IMG, isArcaneSpell, defaultCastingSkill, fmt, FilePickerImpl, LOG, actorAffinity } from "./core.js";
import { evaluateSpell, normalizeBuild, castTimeLabel, describeBuild, buildShapeKey } from "./rules.js";
import { setting, num, SETTINGS } from "./settings.js";
import { e } from "./html.js";
import { sigilFile } from "./sigil.js";

export const DATA_DIR = "dreoarcana";
export const SIGIL_DIR = `${DATA_DIR}/sigils`;
const FOLDER = "Arcane Spells";

/** Is this image ours to replace — the default, a sigil, or nothing? */
export const replaceableImage = (img) =>
  !img || img === SPELL_IMG || img.startsWith(SIGIL_DIR) || img.startsWith("mechanical-magic/sigils")
  || img === "icons/svg/item-bag.svg" || img === "icons/svg/book.svg";

/** The build stored on an item, normalised. */
export function buildOf(item) {
  const b = item?.system?.build;
  return normalizeBuild(b && Object.keys(b).length ? { ...b, name: b.name ?? item.name } : { name: item?.name });
}

/** Caster parameters from settings alone — used for saved snapshots and macros. */
export function baselineCaster(actor, skillPercent) {
  const skill = skillPercent ?? defaultCastingSkill(actor)?.value ?? 50;
  return {
    skill,
    skillDivisor: num(SETTINGS.skillDivisor, 50),
    xiPerDamage: num(SETTINGS.xiPerDamage, 2),
    focus: 1, catalyst: 1, stored: 0,
    affinity: num(SETTINGS.affinityLimit, 1) > 0 ? actorAffinity(actor) : [], surroundings: "calm"
  };
}

/** A static HTML summary for the item description and compendium views. */
export function spellDescriptionHTML(ev) {
  const b = ev.build;
  const fx = ev.effects.map(x =>
    `<li><strong>${e(x.element ?? x.label ?? x.effect)}</strong> — ${e(x.text)}</li>`).join("");
  return `
    <p><strong>Tier ${ev.tier.numeral} — ${ev.tier.name}</strong> · ${e(describeBuild(b))}</p>
    ${b.notes ? `<p>${e(b.notes)}</p>` : ""}
    <p>Might <strong>${fmt(ev.xi)}</strong> · Complexity <strong>${fmt(ev.complexity)}</strong> ·
       Œ <strong>${fmt(ev.orieFinal)}</strong> at S ${fmt(ev.caster.S, 2)} ·
       Heat <strong>${fmt(ev.heat)}</strong> · Cast ${e(castTimeLabel(ev.castTime, num(SETTINGS.roundSeconds, 5)))}</p>
    <ul>${fx || "<li><em>No effects</em></li>"}</ul>`;
}

/** The Item document data for a build. */
export function spellItemData(build, { actor = null, caster = null } = {}) {
  const b = normalizeBuild(build);
  const ev = evaluateSpell(b, caster ?? baselineCaster(actor));
  return {
    name: b.name,
    type: SPELL_TYPE,
    img: SPELL_IMG,
    system: {
      description: spellDescriptionHTML(ev),
      build: b,
      snapshot: {
        xi: ev.xi, complexity: ev.complexity, orieFinal: ev.orieFinal, heat: ev.heat,
        castTime: ev.castTime, tier: ev.tier.tier, skill: ev.caster.skill, savedAt: Date.now()
      }
    }
  };
}

/**
 * Create or update a spell item.
 *  - item given  → update it in place (keeps id, links, a custom image)
 *  - actor given → embedded on that actor
 *  - neither     → a world item in the "Arcane Spells" folder
 */
export async function saveSpell({ build, actor = null, item = null, caster = null }) {
  const data = spellItemData(build, { actor: actor ?? item?.actor ?? null, caster });
  let result;
  if (item) {
    const { type, img, ...rest } = data;
    // The build is replaced whole, not merged: removed nodes must go.
    await item.update({ ...rest, "system.==build": data.system.build });
    result = item;
  } else if (actor) {
    [result] = await actor.createEmbeddedDocuments("Item", [data]);
  } else {
    const folder = game.folders.find(f => f.name === FOLDER && f.type === "Item")
                ?? await Folder.create({ name: FOLDER, type: "Item", color: "#4a3c8c" });
    result = await Item.create({ ...data, folder: folder.id });
  }
  try { await writeSigilImage(result); } catch (err) { LOG("sigil image:", err.message); }
  return result;
}

/**
 * Write the spell's sigil to Data/dreoarcana/sigils and set it as the
 * item image. Needs file-upload permission; anyone else keeps the
 * generic icon and still sees the sigil inline. The file is named from
 * the build, so a changed build gets a fresh path (no stale cache).
 */
export async function writeSigilImage(item) {
  if (setting(SETTINGS.sigilImages) === false) return null;
  if (!game.user?.can?.("FILES_UPLOAD")) return null;
  if (!isArcaneSpell(item) || !replaceableImage(item.img)) return null;

  const build = buildOf(item);
  const file = new File([sigilFile(build)], `sigil-${buildShapeKey(build)}.svg`, { type: "image/svg+xml" });
  const target = `${SIGIL_DIR}/${file.name}`;
  if (item.img === target) return target;

  const FP = FilePickerImpl();
  for (const dir of [DATA_DIR, SIGIL_DIR]) {
    try { await FP.createDirectory("data", dir); } catch { /* exists */ }
  }
  const res = await FP.upload("data", SIGIL_DIR, file, {}, { notify: false });
  const img = res?.path ?? target;
  await item.update({ img });
  return img;
}

/** Spells an actor (or, with none, the Items directory) holds, sorted by name. */
export function spellbook(actor) {
  const items = actor ? actor.items : game.items;
  return items.filter(isArcaneSpell).sort((a, b) => a.name.localeCompare(b.name));
}
