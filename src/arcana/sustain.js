/* ===================================================================
 * Dreoarcana Arcana — spells that outlast their casting, and the
 * Shields and Barriers they hold up.
 *
 * Mechanical Casting, "Spell Persistence & Decay":
 *   Self-sustaining  Heat once, at casting; ξ fades, ξ₀ × e^(−kt).
 *   Maintained       ξ holds; the spell's Heat again every Melee Round.
 *                    It ends when the caster lets go, or the Heat
 *                    overflows.
 *   Transitional     Maintained until released, then self-sustaining.
 *
 * An active spell is an Active Effect on its caster, flagged with its
 * state, so the caster's owner can end or release it and it shows on
 * the sheet. The active GM's client ticks them as game time passes.
 *
 * "Magic and Combat: Shields vs. Barriers":
 *   Shield   a pool of temporary HP; physical damage hits it first.
 *   Barrier  stops its percentage of magical damage, and what it stops
 *            becomes the caster's Heat; past capacity it collapses.
 * Mythras applies damage by hand, location by location, so both act
 * through takeDamage(): the damage goes through the shields and
 * barriers protecting the target, then armour, then a hit location.
 * =================================================================== */

import { SYSTEM_ID, fmt, hitLocations, randomHitLocation } from "./core.js";
import { PERSISTENCE, FADED_XI, decayedXi, shieldPoints, barrierPercent, absorbByShield, absorbByBarrier,
         evaluateSpell, round1 } from "./rules.js";
import { setting, num, SETTINGS } from "./settings.js";
import { heatState, addHeat } from "./heat.js";
import { formDialog } from "./ui.js";
import { e } from "./html.js";

const FLAG = "activeSpell";
const SOCKET = `system.${SYSTEM_ID}`;
const TAKE_DAMAGE = "arcana.take-damage";
const now = () => Number(game.time?.worldTime) || 0;
const roundSeconds = () => Math.max(1, num(SETTINGS.roundSeconds, 5));
const flagPath = `flags.${SYSTEM_ID}.${FLAG}`;

export const isActiveSpell = (ef) => Boolean(ef?.flags?.[SYSTEM_ID]?.[FLAG]);
export const spellState = (ef) => ef?.flags?.[SYSTEM_ID]?.[FLAG] ?? null;
export const activeSpells = (actor) => actor?.effects?.filter(isActiveSpell) ?? [];

/** Is it being held open by the caster right now, or standing on its own? */
export const heldOpen = (d) => d.kind === "maintained" || (d.kind === "transitional" && !d.released);

/** Every Shield and Barrier protecting an actor, from any caster. */
export function protections(actor) {
  if (!actor) return [];
  const out = [];
  const casters = new Set([...game.actors, actor]);
  for (const caster of casters) {
    for (const ef of activeSpells(caster)) {
      const d = spellState(ef);
      if ((d.targetUuid || caster.uuid) !== actor.uuid) continue;
      if (d.shield?.hp > 0 || d.barrier) out.push({ ef, caster, d });
    }
  }
  return out;
}

/* -------------------------------------------------------------------
 * Starting one, from a successful cast
 * ----------------------------------------------------------------- */

/** Heat a maintained spell costs each round: its Heat with nothing drawn from Stored Orie. */
export const heatPerRound = (build, caster) => round1(evaluateSpell(build, { ...caster, stored: 0 }).heat);

/** Who a lasting spell is for: the one token targeted, for a Defensive or Support spell; else the caster. */
export function lastingTarget(actor, build) {
  if (!["Defensive", "Support"].includes(build.intent)) return actor;
  const targets = [...(game.user?.targets ?? [])];
  return targets.length === 1 && targets[0].actor ? targets[0].actor : actor;
}

export async function startSpell({ actor, item, build, ev, caster }) {
  const kind = build.persistence;
  if (!PERSISTENCE[kind] || kind === "instant") return null;
  const share = ev.effects.length ? 1 / ev.effects.length : 1;
  const each = ev.xi * share;
  const has = (name) => build.effects.some(x => x.effect === name);
  const target = lastingTarget(actor, build);
  const t = now();
  const state = {
    kind, released: false, spellName: item.name, spellUuid: item.uuid,
    xi0: ev.xi, xi: ev.xi, share, k: num(SETTINGS.decayRate, 0.2),
    heatPerRound: heatPerRound(build, caster), start: t, lastTick: t,
    shield: has("Shield") ? { hp: shieldPoints(each), max: shieldPoints(each) } : null,
    barrier: has("Barrier") ? { pct: barrierPercent(each) } : null,
    targetUuid: target.uuid, targetName: target.name
  };
  const [ef] = await actor.createEmbeddedDocuments("ActiveEffect", [{
    name: `${item.name} (${PERSISTENCE[kind].label})`, img: item.img, origin: item.uuid,
    description: PERSISTENCE[kind].desc, transfer: false,
    flags: { [SYSTEM_ID]: { [FLAG]: state } }
  }]);
  return ef ?? null;
}

/* -------------------------------------------------------------------
 * Ending and releasing
 * ----------------------------------------------------------------- */

async function announce(actor, html, { bad = false } = {}) {
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="mm-chat ${bad ? "mm-chat-overheat" : ""}">${html}</div>` });
}

export async function endSpell(ef, reason = null) {
  const d = spellState(ef);
  const actor = ef.parent;
  await ef.delete();
  if (reason && actor) await announce(actor, `<p>${reason}</p>`);
}

/** The caster lets go of it. */
export async function letGo(ef) {
  const d = spellState(ef);
  if (!ef?.isOwner || !d) return;
  await endSpell(ef, `<strong>${e(ef.parent.name)}</strong> lets <strong>${e(d.spellName)}</strong> go.`);
}

/** A transitional spell is released: it stands on its own from here, and fades. */
export async function releaseSpell(ef) {
  const d = spellState(ef);
  if (!ef?.isOwner || d?.kind !== "transitional" || d.released) return;
  const t = now();
  await ef.update({ [flagPath]: { ...d, released: true, xi0: d.xi, start: t, lastTick: t } });
  await announce(ef.parent, `<p><strong>${e(ef.parent.name)}</strong> releases <strong>${e(d.spellName)}</strong>: it stands on its own now (ξ ${fmt(d.xi)}), and will fade.</p>`);
}

/* -------------------------------------------------------------------
 * The clock — the active GM ticks every active spell
 * ----------------------------------------------------------------- */

let ticking = false;

export async function tickSpells() {
  if (!game.user?.isGM || (game.users.activeGM && game.users.activeGM !== game.user) || ticking) return;
  ticking = true;
  try {
    const t = now(), rs = roundSeconds();
    for (const actor of game.actors) for (const ef of activeSpells(actor)) await tickOne(actor, ef, t, rs);
  } catch (err) {
    console.warn("Dreoarcana | Arcana: active spells", err);
  } finally { ticking = false; }
}

async function tickOne(actor, ef, t, rs) {
  const d = spellState(ef);
  if (t < d.lastTick) return ef.update({ [`${flagPath}.lastTick`]: t });     // time was turned back
  const rounds = Math.floor((t - d.lastTick) / rs);
  if (rounds < 1) return;
  const lastTick = d.lastTick + rounds * rs;

  if (heldOpen(d)) {
    // Heat_maintained = Heat_base × rounds — stopping at the round it overflows.
    if (!(d.heatPerRound > 0) || setting(SETTINGS.trackHeat) === false) return ef.update({ [`${flagPath}.lastTick`]: lastTick });
    // Round by round, so it stops on the round the Heat overflows.
    const st = heatState(actor);
    let heat = st.heat, n = 0;
    while (n < rounds) { n++; heat = round1(heat + d.heatPerRound); if (heat > st.capacity) break; }
    const res = await addHeat(actor, round1(n * d.heatPerRound), { source: `maintaining ${d.spellName}` });
    if (res.after > res.capacity) {
      return endSpell(ef, `<strong>${e(actor.name)}</strong> can't hold <strong>${e(d.spellName)}</strong> open any longer: the Heat overflows (${fmt(res.after)}/${res.capacity}) and it collapses.`);
    }
    return ef.update({ [`${flagPath}.lastTick`]: lastTick });
  }

  // Self-sustaining: ξ(t) = ξ₀ × e^(−kt), t in Melee Rounds.
  const xi = decayedXi(d.xi0, d.k, (t - d.start) / rs);
  if (xi < FADED_XI) return endSpell(ef, `<strong>${e(d.spellName)}</strong> has faded: the world has pushed back to equilibrium.`);
  const each = xi * d.share;
  const next = { ...d, xi: round1(xi), lastTick };
  if (d.shield) { const max = shieldPoints(each); next.shield = { max, hp: Math.min(d.shield.hp, max) }; }
  if (d.barrier) next.barrier = { pct: barrierPercent(each) };
  return ef.update({ [flagPath]: next });
}

/* -------------------------------------------------------------------
 * Damage, through Shields and Barriers
 * ----------------------------------------------------------------- */

/**
 * Apply damage to an actor: Shields soak physical damage, Barriers stop
 * their share of magical damage (as the caster's Heat), armour takes
 * its part, and the rest comes off a hit location.
 * @param {Actor} actor
 * @param {object} opts { amount, kind: "physical"|"magical", locationId, ignoreArmour, bypass }
 */
export async function takeDamage(actor, { amount = 0, kind = "physical", locationId = "", ignoreArmour = false, bypass = false } = {}) {
  const dmg = Math.max(0, Math.floor(Number(amount) || 0));
  if (!actor || !dmg) return null;
  const prot = bypass ? [] : protections(actor);

  // Everything touched must be writable here; if not, the GM does it.
  const touched = [actor, ...prot.map(p => p.caster)];
  if (!game.user.isGM && touched.some(a => !a.isOwner)) {
    if (!game.users.activeGM) { ui.notifications.warn("That needs the GM: a Shield or Barrier from another caster is involved."); return null; }
    game.socket?.emit(SOCKET, { type: TAKE_DAMAGE, actorUuid: actor.uuid, opts: { amount: dmg, kind, locationId, ignoreArmour, bypass } });
    ui.notifications.info("Sent to the GM to resolve.");
    return null;
  }

  let remaining = dmg;
  const lines = [];
  if (kind === "physical") {
    for (const p of prot.filter(x => x.d.shield?.hp > 0)) {
      if (!remaining) break;
      const r = absorbByShield(remaining, p.d.shield.hp);
      remaining = r.through;
      lines.push(`<strong>${e(p.d.spellName)}</strong> (${e(p.caster.name)}'s Shield) soaks <b>${r.absorbed}</b>${r.broken ? ", and breaks" : ` — ${r.pool} left`}.`);
      if (r.broken && !p.d.barrier) await p.ef.delete();
      else await p.ef.update({ [flagPath]: { ...p.d, shield: r.broken ? null : { ...p.d.shield, hp: r.pool } } });
    }
  } else {
    for (const p of prot.filter(x => x.d.barrier)) {
      if (!remaining) break;
      const r = absorbByBarrier(remaining, p.d.barrier.pct);
      remaining = r.through;
      let line = `<strong>${e(p.d.spellName)}</strong> (${e(p.caster.name)}'s Barrier, ${p.d.barrier.pct}%) stops <b>${r.stopped}</b>`;
      if (r.stopped && setting(SETTINGS.barrierHeat) !== false && setting(SETTINGS.trackHeat) !== false) {
        const res = await addHeat(p.caster, r.stopped, { source: `${p.d.spellName} holding back magic` });
        line += `, as <b>+${r.stopped}</b> Heat on ${e(p.caster.name)} (${fmt(res.after)}/${res.capacity})`;
        if (res.after > res.capacity) {
          line += ` — <strong>past capacity, it collapses</strong>`;
          if (p.d.shield?.hp > 0) await p.ef.update({ [flagPath]: { ...p.d, barrier: null } });
          else await p.ef.delete();
        }
      }
      lines.push(`${line}.`);
    }
  }

  // What gets through: armour, then a hit location.
  let loc = null, locRoll = null, ap = 0, applied = 0;
  if (remaining > 0) {
    loc = locationId ? hitLocations(actor).find(l => l.item.id === locationId) ?? null : null;
    if (!loc) { const r = await randomHitLocation(actor); loc = r.location; locRoll = r.roll; }
    if (loc) {
      ap = ignoreArmour ? 0 : Number(loc.item.totalAp ?? loc.item.system?.naturalArmor ?? 0) || 0;
      applied = Math.max(0, remaining - ap);
      if (applied) await loc.item.update({ "system.currentHp": loc.hp - applied });
    }
  }

  const where = loc ? `the <strong>${e(loc.name)}</strong>${locRoll ? ` (rolled ${locRoll.total})` : ""}` : "no hit location on the sheet";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: locRoll ? [locRoll] : [],
    content: `<div class="mm-chat">
      <h3>${e(actor.name)} takes ${dmg} ${kind} damage${bypass ? " <small>(bypassing Shields and Barriers)</small>" : ""}</h3>
      ${lines.length ? `<ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul>` : ""}
      ${remaining > 0
        ? `<p><b>${remaining}</b> gets through to ${where}${loc ? `: ${ap ? `armour takes ${Math.min(ap, remaining)}, ` : ""}<b>${applied}</b> damage (${loc.hp} → ${loc.hp - applied} HP).` : "."}</p>`
        : "<p>None of it gets through.</p>"}</div>`
  });
  return { amount: dmg, through: remaining, applied, location: loc?.name ?? null };
}

/** The damage dialog: amount, kind, where, and whether armour or shields count. */
export async function takeDamageDialog(actor) {
  if (!actor) return null;
  const prot = protections(actor);
  const locs = hitLocations(actor);
  const guards = prot.map(p => `<li>${e(p.d.spellName)} <small>(${e(p.caster.name)})</small>${p.d.shield?.hp > 0 ? ` · Shield ${p.d.shield.hp}/${p.d.shield.max}` : ""}${p.d.barrier ? ` · Barrier ${p.d.barrier.pct}%` : ""}</li>`).join("");
  const opts = await formDialog({
    title: `Damage to ${actor.name}`,
    label: "Apply",
    width: 420,
    content: `<div class="mm-dialog arcana-damage">
      <label>Damage <input type="number" name="amount" value="" min="1" step="1" autofocus></label>
      <fieldset><legend>Kind</legend>
        <label><input type="radio" name="kind" value="physical" checked> Physical <small>(Shields soak it)</small></label>
        <label><input type="radio" name="kind" value="magical"> Magical <small>(Barriers stop part of it)</small></label>
      </fieldset>
      <label>Hit location <select name="locationId"><option value="">Roll it (d20)</option>${locs.map(l => `<option value="${l.item.id}">${e(l.name)} (${l.start}–${l.end})</option>`).join("")}</select></label>
      <label><input type="checkbox" name="ignoreArmour"> Ignores armour</label>
      <label><input type="checkbox" name="bypass"> Bypasses Shields and Barriers <small>(lightning spears, Cutting Force…)</small></label>
      ${guards ? `<p class="mm-hint">Protecting ${e(actor.name)}:</p><ul>${guards}</ul>` : `<p class="mm-hint">Nothing is protecting ${e(actor.name)}.</p>`}
    </div>`,
    parse: (form) => ({
      amount: Number(form.querySelector('[name="amount"]')?.value) || 0,
      kind: form.querySelector('[name="kind"]:checked')?.value ?? "physical",
      locationId: form.querySelector('[name="locationId"]')?.value ?? "",
      ignoreArmour: Boolean(form.querySelector('[name="ignoreArmour"]')?.checked),
      bypass: Boolean(form.querySelector('[name="bypass"]')?.checked)
    })
  });
  if (!opts?.amount) return null;
  return takeDamage(actor, opts);
}

/** The active GM resolves damage a player couldn't apply themselves. Call once at ready. */
export function listenForDamage() {
  game.socket?.on(SOCKET, async (msg) => {
    if (msg?.type !== TAKE_DAMAGE || !game.user.isGM || game.users.activeGM !== game.user) return;
    const actor = await fromUuid(msg.actorUuid).catch(() => null);
    if (actor) await takeDamage(actor, msg.opts ?? {});
  });
}

/* -------------------------------------------------------------------
 * Views, for the Arcanum rail and the character sheet
 * ----------------------------------------------------------------- */

export function spellView(ef, holder) {
  const d = spellState(ef);
  const held = heldOpen(d);
  return {
    id: ef.id, uuid: ef.uuid, name: d.spellName,
    kind: d.kind === "transitional" ? (d.released ? "Released" : "Held, until released") : PERSISTENCE[d.kind]?.label ?? d.kind,
    held, xi: fmt(d.xi), heat: fmt(d.heatPerRound),
    shield: d.shield?.hp > 0 ? `${d.shield.hp}/${d.shield.max}` : null,
    barrier: d.barrier ? `${d.barrier.pct}%` : null,
    target: d.targetUuid && d.targetUuid !== holder?.uuid ? d.targetName : null,
    canRelease: d.kind === "transitional" && !d.released,
    isOwner: Boolean(ef.isOwner)
  };
}

/** What an actor holds up, and what holds it up. */
export function sustainContext(actor) {
  if (!actor) return { held: [], guarded: [], any: false };
  const held = activeSpells(actor).map(ef => spellView(ef, actor));
  const guarded = protections(actor).filter(p => p.caster !== actor).map(p => ({ ...spellView(p.ef, p.caster), caster: p.caster.name }));
  return { held, guarded, any: held.length + guarded.length > 0 };
}
