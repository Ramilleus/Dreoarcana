/* ===================================================================
 * Dreoarcana Arcana — Heat
 *
 * "All magic creates a type of heat which is made from opening that
 *  portal and has to be dissipated or it can cause permanent damage to
 *  a wielder." — What I Want From This
 *
 * "Reservoirs allow casters out of combat to build up Melfyrium for use
 *  in battle without creating heat." — same document
 *
 * Heat is a tracked stat on the character (template.json), shown in
 * the sheet header and on the main tab. Its capacity comes from CON;
 * past it, every few points burn a hit point off a random location,
 * armour ignored — the burn is inside.
 *
 * Stored Orie is the reservoir. Orie drawn from it at cast time is not
 * converted then, so it heats nothing; only what it can't cover is
 * converted on the spot.
 * =================================================================== */

import { statValue, setStat, characteristic, randomHitLocation, fmt } from "./core.js";
import { setting, num, SETTINGS } from "./settings.js";
import { round1, radiatorVent } from "./rules.js";
import { e } from "./html.js";

/** Heat capacity for an actor — also the actor's maxHeat getter. CON × setting + the sheet's modifier. */
export const heatCapacity = (actor) => Math.max(1, Math.round(characteristic(actor, "con") * num(SETTINGS.heatCapacityPerCon, 3))
  + (Number(actor?.system?.attributes?.heat?.mod) || 0));

/** Radiators the actor carries (house rule; see rules.js), with what each sheds a round. */
export function carriedRadiators(actor) {
  if (!actor || setting(SETTINGS.radiators) === false) return [];
  return actor.items.filter(i => i.system?.radiator?.enabled)
    .map(i => ({ id: i.id, name: i.name, material: i.system.radiator.material || "", vent: radiatorVent(i.system.radiator.material) }))
    .filter(r => r.vent > 0);
}

/** Heat shed per Melee Round of rest: the setting, plus any radiators. */
export function ventRate(actor) {
  const base = Math.max(1, num(SETTINGS.ventPerRound, 2));
  return base + carriedRadiators(actor).reduce((s, r) => s + r.vent, 0);
}

/** Everything the Arcanum and the caster need to know about an actor. */
export function heatState(actor) {
  const heat = Math.max(0, statValue(actor, "heat"));
  const capacity = heatCapacity(actor);
  return {
    heat, capacity, over: Math.max(0, heat - capacity),
    pct: Math.min(100, Math.round(heat / capacity * 100)),
    rate: ventRate(actor), radiators: carriedRadiators(actor),
    tracking: setting(SETTINGS.trackHeat) !== false
  };
}

/**
 * Add Heat. Returns what happened, and applies overheat wounds.
 * Damage is worked out on the *crossing* — points already over capacity
 * before this cast have already burned.
 *
 * `announce: false` applies the wound but leaves the chat message to the
 * caller (announceOverheat), so a cast can post its own card first.
 */
export async function addHeat(actor, amount, { source = "casting", announce = true } = {}) {
  const st = heatState(actor);
  const before = st.heat;
  const after = round1(Math.max(0, before + (Number(amount) || 0)));
  await setStat(actor, "heat", after);

  const perWound = Math.max(1, num(SETTINGS.heatPerWound, 5));
  const oldOver = Math.max(0, before - st.capacity);
  const newOver = Math.max(0, after - st.capacity);
  const damage = Math.floor(newOver / perWound) - Math.floor(oldOver / perWound);

  const result = { before, after, capacity: st.capacity, over: newOver, damage, location: null, locationRoll: null, source };

  if (damage > 0) {
    const { roll, location } = await randomHitLocation(actor);
    result.locationRoll = roll?.total ?? null;
    if (location) {
      result.location = location.name;
      await location.item.update({ "system.currentHp": location.hp - damage });
    }
    if (announce) await announceOverheat(actor, result);
  }
  return result;
}

/** Post the overheat card for a result from addHeat (no-op if nothing burned). */
export async function announceOverheat(actor, result) {
  if (!result?.damage) return;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mm-chat mm-chat-overheat">
        <h3>Overheat — ${e(actor.name)}</h3>
        <p>${fmt(result.after)} Heat against a capacity of ${result.capacity}: <strong>${fmt(result.over)} over</strong>
           after ${e(result.source)}.</p>
        <p>The conversion burns from the inside: <strong>${result.damage} damage</strong>
           ${result.location ? `to the <strong>${e(result.location)}</strong> (rolled ${result.locationRoll})` : "to a location of the GM's choice"},
           ignoring armour.</p>
        <p class="mm-hint">Vent the Heat before casting again.</p>
      </div>`
  });
}

/** Vent Heat for a number of Melee Rounds of doing nothing else. */
export async function ventHeat(actor, rounds = 1) {
  const st = heatState(actor);
  const rate = st.rate;
  const n = Math.max(1, Math.floor(Number(rounds) || 1));
  const after = round1(Math.max(0, st.heat - rate * n));
  if (after === st.heat) { ui.notifications.info(`${actor.name} carries no Heat.`); return after; }
  await setStat(actor, "heat", after);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${e(actor.name)}</strong> vents Heat for ${n} Round${n === 1 ? "" : "s"}:
              ${fmt(st.heat)} → <strong>${fmt(after)}</strong> (capacity ${st.capacity})${st.radiators.length ? `, helped by ${st.radiators.map(r => e(r.name)).join(", ")}` : ""}.</p>`
  });
  return after;
}

/** Cool completely — a rest, or the GM's say-so. */
export async function clearHeat(actor) {
  await setStat(actor, "heat", 0);
  ui.notifications.info(`${actor.name} has cooled completely.`);
  return 0;
}
