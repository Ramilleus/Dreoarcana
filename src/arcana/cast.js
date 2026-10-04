/* ===================================================================
 * Dreoarcana Arcana — casting
 *
 * The procedure, end to end:
 *   1. Take the caster's parameters — skill, Focus, catalyst, Orie drawn
 *      from Stored Orie, circumstances (grade steps). The Arcanum's Caster node
 *      supplies them; a macro may pass its own or take defaults (which
 *      draw as much Stored Orie as the spell can use).
 *   2. Re-derive the spell with those numbers (the item only stores the
 *      build; the maths is always done fresh).
 *   4. Roll d100 against the skill at the tier's difficulty.
 *   5. Spend the Stored Orie drawn; add Heat for the rest (scaled by outcome).
 *   6. On a success, roll any damage; post one chat card with it all.
 *
 * Every rule comes from rules.js; this file only sequences it.
 * =================================================================== */

import { isArcaneSpell, currentOrie, setOrie, fmt } from "./core.js";
import { evaluateSpell, DIFFICULTY_GRADES, TIER_DIFFICULTY, OUTCOMES, outcomeFor, shiftGrade, gradedTarget } from "./rules.js";
import { setting, num, SETTINGS } from "./settings.js";
import { heatState, addHeat, announceOverheat } from "./heat.js";
import { buildOf, baselineCaster } from "./spells.js";
import { e } from "./html.js";
import { sigilSVG } from "./sigil.js";
import { broadcastCast } from "./sound.js";
import { startSpell, heatPerRound, lastingTarget } from "./sustain.js";
import { PERSISTENCE } from "./rules.js";

/* Chat content is sanitised and inline <svg> is stripped, so the card
   carries the sigil as an image with a data URI, which the sanitiser
   keeps. Tier colour is baked in because the chat log is not themed. */
function sigilDataURI(build) {
  const svg = sigilSVG(build, { size: 56, tierColor: true, cls: "" });
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Difficulty grade for a tier, honouring the setting, moved by any
 * circumstance steps. null means Hopeless — no attempt can be made.
 */
export function gradeFor(tier, steps = 0) {
  const key = setting(SETTINGS.tierDifficulty) === false ? "standard" : (TIER_DIFFICULTY[tier] ?? "standard");
  return shiftGrade(key, steps);
}

/** Can this spell be cast as built, in these circumstances? Returns a reason, or "". */
export function cannotCast(actor, ev, steps = 0) {
  if (!ev.valid) return ev.errors.join(" ");
  if (!gradeFor(ev.tier.tier, steps)) return "Hopeless: past Herculean, no attempt can be made.";
  return "";
}

/** Whole Orie taken from Stored Orie for a draw (a part-Orie costs a whole one). */
export const orieSpent = (drawn) => Math.ceil((Number(drawn) || 0) - 1e-9);

/**
 * Cast an arcane spell item.
 * @param {Item}   item
 * @param {object} [opts]
 * @param {Actor}  [opts.actor]       defaults to the item's owner
 * @param {object} [opts.caster]      { skill, focus, catalyst, stored } — stored is the Orie to
 *                                    draw; leave it out to draw as much as the spell can use
 * @param {number} [opts.steps]       circumstances: difficulty grades harder (+) or easier (−)
 * @param {string} [opts.skillName]   for the chat card
 */
export async function castSpell(item, { actor = item?.actor ?? null, caster = null, steps = 0, skillName = null } = {}) {
  if (!isArcaneSpell(item)) return ui.notifications.warn(`${item?.name ?? "That"} is not an arcane spell.`);
  if (!actor) return ui.notifications.warn("That spell belongs to nobody. Put it on a character to cast it.");
  if (!actor.isOwner) return ui.notifications.warn(`You don't control ${actor.name}.`);

  const build = buildOf(item);
  const st = heatState(actor);
  const params = {
    ...baselineCaster(actor),
    ...(caster ?? {}),
    skillDivisor: num(SETTINGS.skillDivisor, 50),
    xiPerDamage: num(SETTINGS.xiPerDamage, 2)
  };
  const want = caster && caster.stored !== undefined && caster.stored !== null && caster.stored !== "" ? Number(caster.stored) : Infinity;
  params.stored = Math.max(0, Math.min(Number.isNaN(want) ? 0 : want, currentOrie(actor)));
  const ev = evaluateSpell(build, params);
  const why = cannotCast(actor, ev, steps);
  if (why) return ui.notifications.warn(`${why} Nothing has been spent.`);

  /* ---- the roll ------------------------------------------------- */
  const grade = gradeFor(ev.tier.tier, steps);
  const target = gradedTarget(ev.caster.skill, grade);
  const roll = await new Roll("1d100").evaluate();
  const outcomeKey = outcomeFor(roll.total, target);
  const outcome = OUTCOMES[outcomeKey];

  /* ---- the price ------------------------------------------------ */
  const spend = setting(SETTINGS.spendOrie) !== false;
  const orieBefore = currentOrie(actor);
  let orieAfter = orieBefore;
  // Folk Magic's Magic Point costs (p.122): nothing on a critical, 1d3 more on a fumble.
  let spent = orieSpent(ev.caster.stored * outcome.orie);
  let extraRoll = null;
  if (outcome.extraOrie) {
    extraRoll = await new Roll(outcome.extraOrie).evaluate();
    spent += extraRoll.total;
  }
  if (spend && spent > 0) orieAfter = await setOrie(actor, orieBefore - spent);

  const heatTaken = Math.round(ev.heat * outcome.heat * 10) / 10;
  const heatResult = st.tracking && heatTaken > 0
    ? await addHeat(actor, heatTaken, { source: item.name, announce: false })
    : null;

  /* ---- the effect ----------------------------------------------- */
  // Damage is rolled here and shown as a clickable inline roll; every
  // roll rides on the message so dice animations see them.
  const rolls = [roll, ...(extraRoll ? [extraRoll] : [])];
  const effectRows = [];
  for (const fx of ev.effects) {
    let anchor = "";
    if (outcome.effect && fx.damage && fx.formula) {
      const dmg = await new Roll(fx.formula).evaluate();
      rolls.push(dmg);
      anchor = dmg.toAnchor?.()?.outerHTML ?? `<strong>${dmg.total}</strong>`;
    }
    effectRows.push({ ...fx, anchor });
  }

  /* ---- how long it lasts ---------------------------------------- */
  const lasting = PERSISTENCE[build.persistence] && build.persistence !== "instant" ? build.persistence : null;
  let lastingHTML = "";
  if (lasting) {
    const target = lastingTarget(actor, build);
    const onWhom = target !== actor ? ` on ${e(target.name)}` : "";
    const perRound = heatPerRound(build, params);
    lastingHTML = outcome.effect
      ? `<p class="mm-chat-note"><strong>${PERSISTENCE[lasting].label}${onWhom}.</strong> ${lasting === "sustaining"
          ? "It stands on its own and fades as the world pushes back."
          : `Held open: <b>+${fmt(perRound)}</b> Heat every Melee Round until ${e(actor.name)} lets go${lasting === "transitional" ? " or releases it" : ""}, or the Heat overflows.`}</p>`
      : "";
  }

  /* ---- the card ------------------------------------------------- */
  const roundSeconds = num(SETTINGS.roundSeconds, 5);
  const fxHTML = effectRows.length ? `<ul class="mm-chat-effects">${effectRows.map(x => `
      <li><strong>${e(x.element ?? x.label ?? x.effect)}</strong>
        ${outcome.effect ? `${x.anchor ? `${x.anchor} · ` : "— "}${e(x.text)}` : "— <em>does not manifest</em>"}</li>`).join("")}</ul>` : "";

  const costs = [
    `Might <b>${fmt(ev.xi)}</b>`,
    ev.caster.stored > 0 || spent > 0
      ? `<b>${spend ? orieBefore - orieAfter : spent}</b> Stored Orie${extraRoll ? ` <small>(incl. ${extraRoll.total} lost to the fumble)</small>` : ""}${outcomeKey === "critical" && ev.caster.stored > 0 ? " <small>(critical: none spent)</small>" : ""}${spend ? ` <small>${orieAfter} left</small>` : ""}`
      : "",
    ev.orieConverted > 0 ? `Œ <b>${fmt(ev.orieConverted)}</b> converted` : "",
    `<span class="${heatResult?.over ? "mm-bad" : ""}">+<b>${fmt(heatTaken)}</b> Heat${heatResult ? ` <small>(${fmt(heatResult.after)}/${heatResult.capacity})</small>` : ""}</span>`,
    `<b>${fmt(ev.castTime)}</b> s <small>(${fmt(ev.castTime / roundSeconds)} rd)</small>`
  ].filter(Boolean).join(" · ");

  const content = `
    <div class="mm-chat mm-tier-${ev.tier.tier}">
      <header class="mm-chat-head">
        <img class="mm-chat-sigil" alt="" src="${sigilDataURI(build)}">
        <div>
          <h3>${e(item.name)}</h3>
          <div class="mm-chat-sub">${ev.tier.numeral} ${e(ev.tier.name)} · ${e(build.intent)} ${e(build.form)}</div>
        </div>
      </header>
      <div class="mm-chat-result">
        <span class="mm-outcome mm-outcome-${outcomeKey}">${outcome.label}</span>
        <span>${e(skillName ?? "Casting")} ${ev.caster.skill}% · ${grade.label}
          → <b>${target}%</b>, rolled <b>${roll.total}</b></span>
      </div>
      ${outcome.note ? `<p class="mm-chat-note">${e(outcome.note)}</p>` : ""}
      ${fxHTML}
      ${lastingHTML}
      <p class="mm-chat-costs">${costs}</p>
      ${outcomeKey === "fumble" ? `<p class="mm-error"><strong>Flux.</strong> The conversion runs undirected: colours drift, the air sings, and the GM decides what the loose ξ does.</p>` : ""}
    </div>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls,
    content,
    flags: { dreoarcana: { arcanaCast: { item: item.id, outcome: outcomeKey, xi: ev.xi, heat: heatTaken, orie: ev.orieFinal } } }
  });

  // The burn, if any, after the spell that caused it.
  await announceOverheat(actor, heatResult);

  // A spell that outlasts its casting goes on holding.
  if (lasting && outcome.effect) await startSpell({ actor, item, build, ev, caster: params }).catch(err => console.warn("Dreoarcana | Arcana: active spell", err));

  // The sound of it, for everyone at the table.
  broadcastCast(build, { outcome: outcomeKey, overheat: Boolean(heatResult?.over) }).catch(() => {});

  return { ev, roll, outcome: outcomeKey, target, heat: heatResult, orie: { before: orieBefore, after: orieAfter } };
}
