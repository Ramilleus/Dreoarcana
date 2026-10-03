/* ===================================================================
 * Dreoarcana Arcana — shared core
 *
 * Constants, and every place the spell system reaches into the rest of
 * Dreoarcana. The Mythras engine underneath supplies the actor, its
 * skills and hit locations; Arcana adds two item types and two tracked
 * stats to it (see static/template.json):
 *
 *   Stored Orie   system.trackedStats.magicPoints   (max: actor.maxMagicPoints)
 *                 — the caster's reservoir: Orie drawn from it makes no Heat
 *   Heat          system.trackedStats.heat          (max: actor.maxHeat)
 *   Built spells  items of type "arcaneSpell", build in system.build
 *   Effect nodes  items of type "arcaneEffect"
 *   Catalysts     any physical item, system.catalyst.{enabled,quality,worth}
 * =================================================================== */

export const SYSTEM_ID = "dreoarcana";
export const SPELL_TYPE = "arcaneSpell";
export const EFFECT_TYPE = "arcaneEffect";
export const ASSETS = `systems/${SYSTEM_ID}/assets/arcana`;
export const TEMPLATES = `systems/${SYSTEM_ID}/templates/arcana`;
export const SPELL_IMG = `${ASSETS}/spell.svg`;
export const EFFECT_IMG = `${ASSETS}/effect.svg`;

/* -------------------------------------------------------------------
 * Item kinds
 * ----------------------------------------------------------------- */

export const isArcaneSpell = (item) => item?.type === SPELL_TYPE;
export const isEffectItem = (doc) => doc?.type === EFFECT_TYPE;

/* -------------------------------------------------------------------
 * Tracked stats. All three live in system.trackedStats so the
 * character sheet's header shows them, with its own +/- buttons.
 * ----------------------------------------------------------------- */

const statPath = (key) => `system.trackedStats.${key}.value`;

export function statValue(actor, key) {
  return Number(foundry.utils.getProperty(actor ?? {}, statPath(key))) || 0;
}

export async function setStat(actor, key, value) {
  await actor.update({ [statPath(key)]: value });
  return value;
}

/** Stored Orie: the caster's reservoir (Mythras' Magic Points, relabelled). */
export const currentOrie = (actor) => statValue(actor, "magicPoints");

export function maxOrie(actor) {
  const derived = Number(actor?.maxMagicPoints);
  return Number.isFinite(derived) ? derived : currentOrie(actor);
}

export async function setOrie(actor, value) {
  const next = Math.max(0, Math.min(Math.round(value), maxOrie(actor)));
  await setStat(actor, "magicPoints", next);
  return next;
}

/* -------------------------------------------------------------------
 * Characteristics, after the sheet's own modifiers
 * ----------------------------------------------------------------- */
export function characteristic(actor, key) {
  const derived = actor?.characteristics?.[key];
  if (Number.isFinite(Number(derived))) return Number(derived);
  return Number(actor?.system?.characteristics?.[key]?.value) || 0;
}

/* -------------------------------------------------------------------
 * Skills — which percentage governs the casting roll.
 * ----------------------------------------------------------------- */

const skillValue = (item) => Number(item.totalVal ?? item.system?.totalVal) || 0;

/** Every skill the actor could reasonably cast with, magic skills first. */
export function castingSkills(actor) {
  if (!actor) return [];
  const rank = { magicSkill: 0, professionalSkill: 1, standardSkill: 2 };
  return actor.items
    .filter(i => i.type in rank)
    .map(i => ({ id: i.id, name: i.name, type: i.type, value: skillValue(i) }))
    .sort((a, b) => (rank[a.type] - rank[b.type]) || a.name.localeCompare(b.name));
}

/**
 * The skill this actor casts with: a magic skill named for Mechanical
 * Magic or Arcana, else any magic skill, else Willpower, else nothing.
 */
export function defaultCastingSkill(actor) {
  const skills = castingSkills(actor);
  return skills.find(s => s.type === "magicSkill" && /mechanic|arcan/i.test(s.name))
      ?? skills.find(s => s.type === "magicSkill")
      ?? skills.find(s => /willpower/i.test(s.name))
      ?? null;
}

/* -------------------------------------------------------------------
 * Catalysts — gear with system.catalyst.enabled
 * ----------------------------------------------------------------- */
export const isCatalyst = (item) => Boolean(item?.system?.catalyst?.enabled);

export function carriedCatalysts(actor) {
  if (!actor) return [];
  return actor.items
    .filter(isCatalyst)
    .map(i => {
      const c = i.system.catalyst;
      return { id: i.id, name: i.name, quality: Number(c.quality) || 1, worth: c.worth ?? "" };
    })
    .sort((a, b) => a.quality - b.quality);
}

/* -------------------------------------------------------------------
 * Hit locations — for overheat wounds
 * ----------------------------------------------------------------- */
export function hitLocations(actor) {
  return (actor?.items ?? []).filter(i => i.type === "hitLocation")
    .map(i => ({
      item: i, name: i.name,
      start: Number(i.system?.rollRangeStart) || 0,
      end: Number(i.system?.rollRangeEnd) || 0,
      hp: Number(i.system?.currentHp) || 0
    }))
    .sort((a, b) => a.start - b.start);
}

/** Roll 1d20 and find the location it lands on, or null. */
export async function randomHitLocation(actor) {
  const locs = hitLocations(actor);
  if (!locs.length) return { roll: null, location: null };
  const roll = await new Roll("1d20").evaluate();
  const hit = locs.find(l => roll.total >= l.start && roll.total <= l.end)
           ?? locs[Math.min(locs.length - 1, Math.floor(roll.total / 20 * locs.length))];
  return { roll, location: hit };
}

/* -------------------------------------------------------------------
 * The acting actor
 * ----------------------------------------------------------------- */
export function currentActor() {
  return canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}

/** Characters this user may cast for, by name. */
export function castableActors() {
  return game.actors
    .filter(a => a.type === "character" && a.isOwner)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------
 * Small helpers
 * ----------------------------------------------------------------- */
export const fmt = (n, d = 1) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(d);
};

export const FilePickerImpl = () => foundry.applications.apps?.FilePicker?.implementation ?? globalThis.FilePicker;

export const LOG = (...a) => console.log("Dreoarcana | Arcana:", ...a);
