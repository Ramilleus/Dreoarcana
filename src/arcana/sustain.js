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
         evaluateSpell, round1, flowOf, normalizeBuild } from "./rules.js";
import { branchTargets, rollBranches, branchesHTML, releasePending, collapseBurst, releaseSubChains, isPending } from "./flow.js";
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

/** Who a lasting spell covers: its targets (Link: several), or its caster. Anchored spells cover a place. */
export const coveredBy = (d, caster) => d.anchored ? []
  : (Array.isArray(d.targetUuids) && d.targetUuids.length ? d.targetUuids : [d.targetUuid || caster.uuid]);

/**
 * Every Shield and Barrier protecting an actor, from any caster.
 * `inside` lists anchored spells (by effect uuid) the actor stands within.
 */
export function protections(actor, { inside = [] } = {}) {
  if (!actor) return [];
  const out = [];
  const casters = new Set([...game.actors, actor]);
  for (const caster of casters) {
    for (const ef of activeSpells(caster)) {
      const d = spellState(ef);
      if (isPending(d)) continue;
      const covers = d.anchored ? inside.includes(ef.uuid) : coveredBy(d, caster).includes(actor.uuid);
      if (covers && (d.shield?.hp > 0 || d.barrier)) out.push({ ef, caster, d });
    }
  }
  return out;
}

/** Anchored Shields and Barriers anywhere: places someone might be standing in. */
export function anchoredWards() {
  const out = [];
  for (const caster of game.actors) for (const ef of activeSpells(caster)) {
    const d = spellState(ef);
    if (d.anchored && !isPending(d) && (d.shield?.hp > 0 || d.barrier)) out.push({ ef, caster, d });
  }
  return out;
}

/* -------------------------------------------------------------------
 * Starting one, from a successful cast
 * ----------------------------------------------------------------- */

/** Heat a maintained spell costs each round: its Heat with nothing drawn from Stored Orie. */
export const heatPerRound = (build, caster) => round1(evaluateSpell(build, { ...caster, stored: 0 }).heat);

/**
 * Start what a spell leaves standing. One structure per branch target;
 * with Link, one structure (one pool) across them all; with Anchor, one
 * structure in a place rather than on anyone.
 */
export async function startSpell({ actor, item, build, ev, caster, targets = null }) {
  const b = normalizeBuild(build);
  const kind = b.persistence;
  if (!PERSISTENCE[kind] || kind === "instant") return null;
  const flow = ev.flow ?? flowOf(b);
  const tgs = targets ?? branchTargets(actor, b, flow);
  const has = (name) => b.effects.some(x => x.effect === name);
  const t0 = now();
  const whole = flow.combined || !b.effects.length ? 1 : 1 / b.effects.length;   // one structure: no branch split
  const make = (share, list) => {
    const each = ev.xi * share;
    const real = list.filter(Boolean);
    return {
      kind, released: false, spellName: item.name, spellUuid: item.uuid,
      xi0: ev.xi, xi: ev.xi, share, k: num(SETTINGS.decayRate, 0.2),
      heatPerRound: heatPerRound(b, caster), start: t0, lastTick: t0,
      shield: has("Shield") ? { hp: shieldPoints(each), max: shieldPoints(each) } : null,
      barrier: has("Barrier") ? { pct: barrierPercent(each) } : null,
      targetUuid: real[0]?.uuid ?? null, targetName: real[0]?.name ?? "",
      targetUuids: real.map(x => x.uuid), targetNames: real.map(x => x.name),
      anchored: flow.anchored, linked: flow.linked > 0, orbit: flow.orbit, collapse: flow.collapse,
      build: b, caster
    };
  };
  const states = flow.anchored ? [make(whole, [])]
    : flow.linked ? [make(whole, tgs.filter(Boolean).length ? tgs : [{ uuid: actor.uuid, name: actor.name }])]
    : tgs.map(x => make(ev.share ?? whole, [x]));
  const suffix = (s) => s.anchored ? ", anchored" : s.targetUuids.length > 1 ? `, linked ×${s.targetUuids.length}`
    : s.targetName && s.targetUuid !== actor.uuid ? `, on ${s.targetName}` : "";
  return actor.createEmbeddedDocuments("ActiveEffect", states.map(state => ({
    name: `${item.name} (${PERSISTENCE[kind].label}${suffix(state)})`,
    img: item.img, origin: item.uuid, description: PERSISTENCE[kind].desc, transfer: false,
    flags: { [SYSTEM_ID]: { [FLAG]: state } }
  })));
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
  // Collapse: it ends violently — what is pending goes off, what stands bursts.
  if (d?.collapse && actor && !isPending(d)) {
    await releaseSubChains(actor, d.spellUuid);
    await collapseBurst(actor, d);
  }
}

/** The caster lets go of it. A held-back release dissipates — or, with Collapse, goes off now. */
export async function letGo(ef) {
  const d = spellState(ef);
  if (!ef?.isOwner || !d) return;
  if (isPending(d)) {
    if (d.collapse) return releasePending(ef, { reason: "Collapse: let go, it goes off at once." });
    await ef.delete();
    return announce(ef.parent, `<p><strong>${e(ef.parent.name)}</strong> lets <strong>${e(d.spellName)}</strong> dissipate before it is released.</p>`);
  }
  await endSpell(ef, `<strong>${e(ef.parent.name)}</strong> lets <strong>${e(d.spellName)}</strong> go.`);
}

/** Gate: the caster opens it. */
export async function triggerGate(ef) {
  const d = spellState(ef);
  if (!ef?.isOwner || !isPending(d) || !d.gated) return null;
  return releasePending(ef);
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
  if (isPending(d)) {
    if (!d.gated && d.releaseAt !== null && t >= d.releaseAt) return releasePending(ef);
    return;
  }
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
    await ef.update({ [`${flagPath}.lastTick`]: lastTick });
    return orbitStrikes(actor, d, rounds, 1);
  }

  // Self-sustaining: ξ(t) = ξ₀ × e^(−kt), t in Melee Rounds.
  const xi = decayedXi(d.xi0, d.k, (t - d.start) / rs);
  if (xi < FADED_XI) return endSpell(ef, `<strong>${e(d.spellName)}</strong> has faded: the world has pushed back to equilibrium.`);
  const each = xi * d.share;
  const next = { ...d, xi: round1(xi), lastTick };
  if (d.shield) { const max = shieldPoints(each); next.shield = { max, hp: Math.min(d.shield.hp, max) }; }
  if (d.barrier) next.barrier = { pct: barrierPercent(each) };
  await ef.update({ [flagPath]: next });
  return orbitStrikes(actor, d, rounds, xi / (d.xi0 || 1));
}

/** Orbit: the spell circles its target and strikes it again each round (at most ten at once). */
async function orbitStrikes(actor, d, rounds, scale) {
  if (!d.orbit || !d.build || !d.build.effects?.length) return;
  const targets = (d.targetUuids ?? []).map((uuid, i) => ({ uuid, name: d.targetNames?.[i] ?? "" }));
  if (!targets.length) return;
  const n = Math.min(rounds, 10);
  const all = [], rolls = [];
  for (let i = 0; i < n; i++) {
    const out = await rollBranches({ build: d.build, caster: d.caster, scale, targets, flow: { ...flowOf(d.build), branches: targets.length, mirror: false, field: false } });
    all.push(...out.rows); rolls.push(...out.rolls);
  }
  if (!all.some(r => r.parts.some(p => p.total))) return;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }), rolls,
    content: `<div class="mm-chat"><h3>${e(d.spellName)} orbits and strikes${n > 1 ? ` ×${n}` : ""}</h3>${branchesHTML({ rows: all }, { many: false })}${rounds > n ? `<p class="mm-hint">${rounds - n} more strikes passed unrolled.</p>` : ""}</div>`
  });
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
export async function takeDamage(actor, { amount = 0, kind = "physical", locationId = "", ignoreArmour = false, bypass = false, inside = [] } = {}) {
  const dmg = Math.max(0, Math.floor(Number(amount) || 0));
  if (!actor || !dmg) return null;
  const prot = bypass ? [] : protections(actor, { inside });

  // Everything touched must be writable here; if not, the GM does it.
  const touched = [actor, ...prot.map(p => p.caster)];
  if (!game.user.isGM && touched.some(a => !a.isOwner)) {
    if (!game.users.activeGM) { ui.notifications.warn("That needs the GM: a Shield or Barrier from another caster is involved."); return null; }
    game.socket?.emit(SOCKET, { type: TAKE_DAMAGE, actorUuid: actor.uuid, opts: { amount: dmg, kind, locationId, ignoreArmour, bypass, inside } });
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
  const anchored = anchoredWards();
  const places = anchored.map(p => `<label><input type="checkbox" name="inside" value="${e(p.ef.uuid)}"> Inside ${e(p.d.spellName)} <small>(${e(p.caster.name)}'s, anchored${p.d.shield?.hp > 0 ? ` · Shield ${p.d.shield.hp}/${p.d.shield.max}` : ""}${p.d.barrier ? ` · Barrier ${p.d.barrier.pct}%` : ""})</small></label>`).join("");
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
      ${places ? `<fieldset><legend>Anchored wards</legend>${places}</fieldset>` : ""}
    </div>`,
    parse: (form) => ({
      amount: Number(form.querySelector('[name="amount"]')?.value) || 0,
      kind: form.querySelector('[name="kind"]:checked')?.value ?? "physical",
      locationId: form.querySelector('[name="locationId"]')?.value ?? "",
      ignoreArmour: Boolean(form.querySelector('[name="ignoreArmour"]')?.checked),
      bypass: Boolean(form.querySelector('[name="bypass"]')?.checked),
      inside: [...form.querySelectorAll('[name="inside"]:checked')].map(x => x.value)
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
  if (isPending(d)) {
    const left = d.releaseAt !== null ? Math.max(0, d.releaseAt - now()) : null;
    return {
      id: ef.id, uuid: ef.uuid, name: d.spellName, pending: true, gated: Boolean(d.gated),
      kind: d.gated ? "Primed: waiting for its trigger" : d.echo ? `Echo in ${fmt(left)} s` : `Releases in ${fmt(left)} s`,
      held: false, xi: "", heat: "", shield: null, barrier: null,
      target: (d.targets ?? []).filter(Boolean).map(x => x.name).join(", ") || null,
      canRelease: false, canTrigger: Boolean(d.gated) && Boolean(ef.isOwner), isOwner: Boolean(ef.isOwner)
    };
  }
  const held = heldOpen(d);
  const names = (d.targetNames ?? []).filter(Boolean);
  return {
    id: ef.id, uuid: ef.uuid, name: d.spellName,
    kind: d.kind === "transitional" ? (d.released ? "Released" : "Held, until released") : PERSISTENCE[d.kind]?.label ?? d.kind,
    held, xi: fmt(d.xi), heat: fmt(d.heatPerRound),
    shield: d.shield?.hp > 0 ? `${d.shield.hp}/${d.shield.max}` : null,
    barrier: d.barrier ? `${d.barrier.pct}%` : null,
    target: d.anchored ? "anchored in place" : names.length > 1 ? names.join(", ") : d.targetUuid && d.targetUuid !== holder?.uuid ? d.targetName : null,
    orbit: Boolean(d.orbit), collapse: Boolean(d.collapse),
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
