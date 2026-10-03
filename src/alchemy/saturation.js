/* ===================================================================
 * Dreoarcana Alchemy — the saturation load (§8, step 4)
 *
 * "Repeated doses in a short period should stack the effective Orie
 * total against the same SIZ capacity, rather than each dose being
 * checked independently."
 *
 * The raw Orie a body is carrying lives on the actor
 * (system.saturation: { value, time }) with the game time it was last
 * written. HOUSE RULE: the canon gives no clearance rate, so the body
 * clears its Healing Rate (a Mythras attribute, CON ÷ 6) in Orie per hour of game time —
 * or per day, or only on the GM's word, by setting.
 * =================================================================== */

import { asetting, ASETTINGS } from "./settings.js";
import { round1 } from "../arcana/rules.js";

const SECONDS = { hour: 3600, day: 86400 };

const healingRate = (actor) => Math.max(1, Number(actor?.healingRate) || 1);

/** Raw Orie the body still carries, after clearance since it was last written. */
export function currentLoad(actor) {
  const s = actor?.system?.saturation ?? {};
  const value = Math.max(0, Number(s.value) || 0);
  if (!value) return 0;
  const mode = asetting(ASETTINGS.saturationClear) ?? "hour";
  const period = SECONDS[mode];
  if (!period) return value;
  const elapsed = Math.max(0, (game.time?.worldTime ?? 0) - (Number(s.time) || 0));
  return round1(Math.max(0, value - healingRate(actor) * (elapsed / period)));
}

/** Add a dose to the load. Returns { before, after }. */
export async function addLoad(actor, orie) {
  const before = currentLoad(actor);
  const after = round1(before + Math.max(0, Number(orie) || 0));
  await actor.update({ "system.saturation.value": after, "system.saturation.time": game.time?.worldTime ?? 0 });
  return { before, after };
}

/** The body has rested and cleared it all. */
export async function clearLoad(actor) {
  await actor.update({ "system.saturation.value": 0, "system.saturation.time": game.time?.worldTime ?? 0 });
  return 0;
}

/** For display: how the load compares with this body's capacity. */
export function loadState(actor) {
  const siz = Number(actor?.characteristics?.siz ?? actor?.system?.characteristics?.siz?.value) || 0;
  const load = currentLoad(actor);
  const mode = asetting(ASETTINGS.saturationClear) ?? "hour";
  return {
    load, siz, over: Math.max(0, load - siz),
    pct: siz ? Math.min(100, Math.round(load / siz * 100)) : 0,
    rate: mode === "rest" ? "clears on rest" : `−${healingRate(actor)} per ${mode}`
  };
}
