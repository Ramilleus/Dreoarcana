/* ===================================================================
 * Dreoarcana Arcana — flow control at the table
 *
 * What the Utility nodes do once a spell is cast (rules.js, "Flow
 * control", has the rules as data):
 *
 *   branchTargets   who each branch is for: Split, Field, the tokens
 *                   targeted, or the caster
 *   rollBranches    each branch's effects rolled (Sync joins the damage
 *                   into one roll; Mirror adds a half-Might copy)
 *   pending         Delay, Echo and Gate hold a spell's release back:
 *                   an Active Effect on the caster, released by the
 *                   clock or by the caster's trigger
 *   collapseBurst   Collapse: what a structure still holds, let loose
 *
 * Damage on a card carries an Apply button that sends it through the
 * target's Shields and Barriers, armour and a hit location.
 * =================================================================== */

import { SYSTEM_ID, fmt } from "./core.js";
import { flowOf, effectsScaled, syncFormula, damageFormula, decayedXi, normalizeBuild, evaluateSpell,
         MIRROR_SCALE, ECHO_SCALE, SIZE_RADIUS_M } from "./rules.js";
import { startSpell, takeDamage } from "./sustain.js";
import { setting, num, SETTINGS } from "./settings.js";
import { e } from "./html.js";

const FLAG = "activeSpell";
const flagPath = `flags.${SYSTEM_ID}.${FLAG}`;
const now = () => Number(game.time?.worldTime) || 0;
const roundSeconds = () => Math.max(1, num(SETTINGS.roundSeconds, 5));

/* -------------------------------------------------------------------
 * Targets
 * ----------------------------------------------------------------- */

const ref = (actor) => (actor ? { uuid: actor.uuid, name: actor.name } : null);

/** Tokens within a radius (metres) of a token, itself included. */
function tokensAround(token, metres) {
  if (!token || !canvas?.ready || !canvas.tokens?.placeables) return [];
  const units = String(canvas.scene?.grid?.units ?? canvas.dimensions?.units ?? "m").toLowerCase();
  const radius = /ft|feet|foot/.test(units) ? metres / 0.3048 : metres;
  const perPixel = canvas.dimensions.distance / canvas.dimensions.size;
  return canvas.tokens.placeables.filter(t => t.actor &&
    Math.hypot(t.center.x - token.center.x, t.center.y - token.center.y) * perPixel <= radius + 1e-6);
}

/**
 * Who the spell's branches are for: [{ uuid, name } | null].
 *   Self form   the caster
 *   Field       everyone within the area, around the one target (or the caster)
 *   otherwise   the targeted tokens, one per branch; with none targeted, a
 *               non-Offensive spell falls on the caster, an Offensive one
 *               on whoever the table decides
 */
export function branchTargets(actor, build, flow = flowOf(build)) {
  const b = normalizeBuild(build);
  if (b.form === "Self") return [ref(actor)];
  const targets = [...(game.user?.targets ?? [])].filter(t => t.actor);
  if (flow.field) {
    const centre = targets.length === 1 ? targets[0] : actor?.getActiveTokens?.()[0] ?? null;
    const inArea = tokensAround(centre, SIZE_RADIUS_M[b.size] ?? 1.5).map(t => ref(t.actor));
    if (inArea.length) return inArea;
  }
  const n = Math.max(flow.branches, flow.linked ? flow.linked + 1 : 1);
  const picked = targets.slice(0, n).map(t => ref(t.actor));
  if (!picked.length) return [b.intent === "Offensive" ? null : ref(actor)];
  return picked;
}

/* -------------------------------------------------------------------
 * Rolling the branches
 * ----------------------------------------------------------------- */

/**
 * Roll every branch. Returns { rows, rolls }: a row per branch, with its
 * effect parts, and every Roll for the message.
 */
export async function rollBranches({ build, caster, scale = 1, targets, flow = flowOf(build), label = "" }) {
  const lines = effectsScaled(build, caster, scale);
  const mirror = flow.mirror ? effectsScaled(build, caster, scale * MIRROR_SCALE) : [];
  const branches = Math.max(flow.field ? targets.length : flow.branches, targets.length, 1);
  const rows = [], rolls = [];

  const rollParts = async (set, tag) => {
    const parts = [];
    const damage = set.filter(x => x.damage && x.formula);
    for (const x of set.filter(x => !x.damage || !x.formula)) parts.push({ label: x.element ?? x.label, text: x.text, tag });
    if (flow.synced && damage.length > 1) {
      const r = await new Roll(syncFormula(damage.map(x => x.formula))).evaluate();
      rolls.push(r);
      parts.push({ label: damage.map(x => x.element ?? x.label).join(" + "), text: "one hit, at one location (Sync)", total: r.total, anchor: anchorOf(r), tag });
    } else {
      for (const x of damage) {
        const r = await new Roll(x.formula).evaluate();
        rolls.push(r);
        parts.push({ label: x.element ?? x.label, text: x.text, total: r.total, anchor: anchorOf(r), tag });
      }
    }
    return parts;
  };

  for (let i = 0; i < branches; i++) {
    const target = targets[i] ?? null;
    const parts = await rollParts(lines, "");
    if (mirror.length) parts.push(...await rollParts(mirror, "Mirror"));
    rows.push({ target, parts, branch: i + 1 });
  }
  return { rows, rolls, label, scale };
}

const anchorOf = (roll) => roll.toAnchor?.()?.outerHTML ?? `<strong>${roll.total}</strong>`;

/** Branch rows as card HTML, with Apply buttons for damage. */
export function branchesHTML({ rows }, { many = rows.length > 1 } = {}) {
  return `<ul class="mm-chat-effects">${rows.map(r => {
    const who = r.target ? e(r.target.name) : (many ? `Branch ${r.branch}` : "");
    const apply = (p) => (p.total > 0 && r.target)
      ? ` <button type="button" class="arcana-apply" data-actor-uuid="${e(r.target.uuid)}" data-amount="${p.total}" data-tooltip="Through ${e(r.target.name)}'s Shields and Barriers, armour, then a hit location">Apply ${p.total}</button>`
      : "";
    const parts = r.parts.map(p => `${p.tag ? `<em>${e(p.tag)}:</em> ` : ""}<strong>${e(p.label)}</strong> ${p.anchor ? `${p.anchor} · ` : "— "}${e(p.text)}${apply(p)}`).join("<br>");
    return `<li>${who ? `<b>${who}</b>: ` : ""}${parts}</li>`;
  }).join("")}</ul>`;
}

/** Notes for the card about what the nodes did. */
export function flowNotes(flow, { released = false } = {}) {
  const n = [];
  if (flow.branches > 1) n.push(`Split into ${flow.branches} branches, Might shared between them.`);
  if (flow.combined) n.push("Combined: each effect carries the full Might.");
  if (flow.synced) n.push("Synced: the damage lands as one hit.");
  if (flow.mirror) n.push("Mirrored: a second chain at half Might.");
  if (flow.field) n.push("Field: everyone within the area.");
  if (!released && flow.echo) n.push("It will echo next Round at half Might.");
  return n;
}

/* -------------------------------------------------------------------
 * Pending releases: Delay, Echo, Gate
 * ----------------------------------------------------------------- */

export const isPending = (d) => d?.kind === "pending";

/**
 * Hold a spell's release back, as an Active Effect on the caster.
 * @param {object} p { actor, item, build, caster, targets, releaseAt?, gated?, scale?, echo? }
 */
export async function createPending({ actor, item, build, caster, targets, releaseAt = null, gated = false, scale = 1, echo = false, startsLasting = true }) {
  const t = now();
  const state = {
    kind: "pending", spellName: item.name, spellUuid: item.uuid, build: normalizeBuild(build), caster,
    targets: targets ?? [], releaseAt, gated, scale, echo, startsLasting, start: t, lastTick: t,
    k: num(SETTINGS.decayRate, 0.2), collapse: flowOf(build).collapse
  };
  const what = gated ? "Primed" : echo ? "Echo" : "Delayed";
  const [ef] = await actor.createEmbeddedDocuments("ActiveEffect", [{
    name: `${item.name} (${what})`, img: item.img, origin: item.uuid, transfer: false,
    description: gated ? "Primed: it waits for the caster's trigger." : "Held back: it releases on its own.",
    flags: { [SYSTEM_ID]: { [FLAG]: state } }
  }]);
  return ef ?? null;
}

/** Release a pending spell now: roll it, post it, then start anything it leaves standing. */
export async function releasePending(ef, { reason = "" } = {}) {
  const d = ef?.flags?.[SYSTEM_ID]?.[FLAG];
  if (!isPending(d)) return null;
  const actor = ef.parent;
  // A Gate fades while it waits (e^−kt); a Delay or an Echo holds its strength.
  const scale = d.gated ? (d.scale ?? 1) * decayedXi(1, d.k, (now() - d.start) / roundSeconds()) : (d.scale ?? 1);
  await ef.delete();
  const flow = flowOf(d.build);
  const out = await rollBranches({ build: d.build, caster: d.caster, scale, targets: d.targets, flow });
  const head = d.echo ? "echoes" : d.gated ? "is triggered" : "releases";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: out.rolls,
    content: `<div class="mm-chat">
      <h3>${e(d.spellName)} ${head}</h3>
      ${reason ? `<p class="mm-chat-note">${reason}</p>` : ""}
      ${branchesHTML(out)}
      ${scale !== 1 ? `<p class="mm-hint">At ${Math.round(scale * 100)}% of its Might${d.gated ? ", faded while it waited" : ""}.</p>` : ""}
      ${flowNotes(flow, { released: d.echo }).map(x => `<p class="mm-hint">${e(x)}</p>`).join("")}
    </div>`
  });
  // An Echo follows the first release; what is left standing starts now.
  if (!d.echo && flow.echo) {
    await createPending({ actor, item: { name: d.spellName, uuid: d.spellUuid, img: ef.img }, build: d.build, caster: d.caster, targets: d.targets,
      releaseAt: now() + roundSeconds(), scale: ECHO_SCALE, echo: true, startsLasting: false });
  }
  if (!d.echo && d.startsLasting && d.build.persistence !== "instant") {
    const item = await fromUuid(d.spellUuid).catch(() => null);
    if (item) await startSpell({ actor, item, build: d.build, ev: evaluateSpell(d.build, d.caster), caster: d.caster, targets: d.targets });
  }
  return out;
}

/* -------------------------------------------------------------------
 * Collapse: a structure's ξ, let loose
 * ----------------------------------------------------------------- */

export async function collapseBurst(actor, d) {
  const xi = Number(d.xi) || 0;
  if (xi < 1) return null;
  const formula = damageFormula(xi / num(SETTINGS.xiPerDamage, 2));
  const targets = d.anchored ? [] : (d.targetUuids?.length ? d.targetUuids.map((uuid, i) => ({ uuid, name: d.targetNames?.[i] ?? "" })) : [d.targetUuid ? { uuid: d.targetUuid, name: d.targetName } : null].filter(Boolean));
  const roll = await new Roll(formula).evaluate();
  const rows = [{ target: targets[0] ?? null, branch: 1, parts: [{ label: "Force", text: `the ξ it still held (${fmt(xi)}) bursts outward`, total: roll.total, anchor: anchorOf(roll) }] }];
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }), rolls: [roll],
    content: `<div class="mm-chat mm-chat-overheat"><h3>${e(d.spellName)} collapses</h3>${branchesHTML({ rows })}<p class="mm-hint">Collapse: it ends violently${d.anchored ? ", at the place it was anchored" : ""}.</p></div>`
  });
  return roll.total;
}

/** Collapse also releases everything still pending from the same spell. */
export async function releaseSubChains(actor, spellUuid) {
  const pend = actor.effects.filter(ef => { const d = ef.flags?.[SYSTEM_ID]?.[FLAG]; return isPending(d) && d.spellUuid === spellUuid; });
  for (const ef of pend) await releasePending(ef, { reason: "Collapse: released early." });
}

/* -------------------------------------------------------------------
 * Apply buttons on cards
 * ----------------------------------------------------------------- */

export function bindApplyButtons() {
  const bind = (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    root?.querySelectorAll?.(".arcana-apply").forEach(btn => {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const actor = await fromUuid(btn.dataset.actorUuid).catch(() => null);
        if (!actor) return ui.notifications.warn("That target no longer exists.");
        btn.disabled = true;
        await takeDamage(actor, { amount: Number(btn.dataset.amount) || 0, kind: "magical" });
      });
    });
  };
  Hooks.on("renderChatMessageHTML", bind);
}

export { flagPath as PENDING_FLAG_PATH };
