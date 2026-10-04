/* ===================================================================
 * Dreoarcana Alchemy — brewing (§4), in three steps the Laboratory
 * drives:
 *
 *   planBrew   what the mixture is: class, overlap, Orie pool,
 *              difficulty. Pure; used for the live readout.
 *   commitBrew the point of no return: reagents spent (§4.4), Xi
 *              channelled, Craft (Alchemy) rolled, Quality read (§5).
 *   decant     the container chosen, the Mother measured out (§3b),
 *              the potion made (§4.7–8, §9), discoveries recorded.
 *
 * Channelling follows Arcana's rule for spells: Xi drawn from Stored
 * Orie makes no Heat; whatever Stored Orie can't cover is converted on
 * the spot and the brewer takes the Heat.
 * =================================================================== */

import { record, POTION_TYPE, POTION_IMG, isIngredient, gmCard } from "./core.js";
import { QUALITY, SIZES, VOLATILITY, ABSORPTION, DIFFICULTY, MAX_POTENCY, SUPERCRITICAL, SLOT_NAMES,
         effectivePotency, oriePool, potencyPerDose, minimumDoses, describeEffect, overlapWithSlots,
         bestSlot, slotPotency, motherDoses, motherDosesPerUnit, motherUnitsSpent, resolveClass,
         gradedTarget, qualityFromRoll, alchemyResult, vesselName } from "./rules.js";
import { recordRecipe } from "./recipes.js";
import { asetting, ASETTINGS } from "./settings.js";
import { discoverFromBrew } from "./discovery.js";
import { currentOrie, setOrie, fmt } from "../arcana/core.js";
import { heatState, addHeat } from "../arcana/heat.js";
import { setting as arcanaSetting, SETTINGS as ARCANA } from "../arcana/settings.js";
import { e } from "../arcana/html.js";

/* HOUSE RULE: Heat for Xi converted on the spot while brewing. Arcana's
   formula is H = Œ^1.3 × Complexity ÷ 6; a brew has no node complexity,
   so it is taken as 6 — the Heat is simply Œ^1.3. */
export const channelHeat = (orie) => Math.round(Math.pow(Math.max(0, orie), 1.3) * 10) / 10;

/** Everything about a mixture before anything is spent. */
export function planBrew({ mother, reagents = [], xi = 0, actor = null, skill = 0, mod = 0 }) {
  const chosen = mother ? [mother, ...reagents] : [...reagents];
  const ingredientOrie = oriePool(chosen);
  const channelled = Math.max(0, Math.floor(Number(xi) || 0));
  const orie = ingredientOrie + channelled;
  const potionClass = resolveClass({ mother, reagents, channelledXi: channelled });
  const potencies = chosen.map(i => effectivePotency(i.grade, i.condition)).filter(Number.isInteger);
  const step = potencies.length ? Math.min(Math.max(...potencies), MAX_POTENCY) : 3;
  const have = actor ? currentOrie(actor) : 0;
  const spend = asetting(ASETTINGS.spendOrie) !== false;
  const drawn = spend ? Math.min(channelled, have) : channelled;
  const converted = channelled - drawn;
  return {
    chosen, mother, reagents, ingredientOrie, channelled, orie, potionClass,
    mechanical: potionClass === "Mechanical",
    step, difficulty: DIFFICULTY[step], target: gradedTarget(skill, step, mod),
    overlaps: overlapWithSlots(chosen),
    minDoses: minimumDoses(orie),
    drawn, converted, heat: channelHeat(converted)
  };
}

async function spend(records, actor) {
  if (!actor || asetting(ASETTINGS.consumeIngredients) === false) return [];
  const out = [], updates = [], deletions = [];
  for (const rec of records) {
    const item = rec.doc;
    if (!item?.id || item.pack || item.parent !== actor) continue;    // only an actor's own stock is spent
    const have = Number(item.system?.quantity ?? 1);
    const use = Math.max(1, Number(rec.spend ?? 1));
    out.push(use > 1 ? `${item.name} ×${use}` : item.name);
    if (have > use) updates.push({ _id: item.id, "system.quantity": have - use });
    else deletions.push(item.id);
  }
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  if (deletions.length) await actor.deleteEmbeddedDocuments("Item", deletions);
  return out;
}

/**
 * Commit the mixture: spend the reagents, channel the Xi, roll Craft
 * (Alchemy). Returns the batch for decanting, or null if nothing was
 * done. A Trash result ends the batch here.
 */
export async function commitBrew({ actor = null, mother, reagents, xi = 0, skill, mod = 0, skillName = "Craft (Alchemy)" }) {
  const max = Number(asetting(ASETTINGS.maxIngredients)) || 3;
  if (!mother) { ui.notifications.warn("Choose a Mother: the liquid you brew into (§3b)."); return null; }
  if (reagents.length < 2 || reagents.length > max) { ui.notifications.warn(`Choose between 2 and ${max} reagents.`); return null; }
  const kinds = new Set([mother, ...reagents].map(r => r.trueName || r.name));
  if (kinds.size < reagents.length + 1) { ui.notifications.warn("Two stacks of the same ingredient are one ingredient: choose different reagents (§4)."); return null; }
  const plan = planBrew({ mother, reagents, xi, actor, skill, mod });

  const spent = await spend(reagents, actor);

  // §3 Channelling: drawn from Stored Orie, the rest converted with Heat.
  const notes = [];
  if (plan.channelled && actor) {
    if (plan.drawn) {
      const before = currentOrie(actor);
      const after = await setOrie(actor, before - plan.drawn);
      notes.push(`${plan.drawn} Xi drawn from Stored Orie (${before} → ${after}), no Heat`);
    }
    if (plan.converted) {
      const tracking = arcanaSetting(ARCANA.trackHeat) !== false;
      const res = tracking ? await addHeat(actor, plan.heat, { source: "channelling into a brew" }) : null;
      notes.push(`${plan.converted} Xi converted on the spot: +${fmt(plan.heat)} Heat${res ? ` (${fmt(res.after)}/${res.capacity})` : ""}`);
    }
  }

  const roll = await new Roll("1d100").evaluate();
  const quality = qualityFromRoll(roll.total, plan.target, asetting(ASETTINGS.sevenBand) === true);
  const result = alchemyResult(roll.total, plan.target);

  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
    rolls: [roll],
    content: `<div class="mm-chat al-chat">
      <h3>${e(actor?.name ?? game.user.name)} brews</h3>
      <p>${e(skillName)} ${skill}% · ${e(plan.difficulty.label)} (${plan.difficulty.mod >= 0 ? "+" : ""}${plan.difficulty.mod}%)${mod ? ` · tools ${mod > 0 ? "+" : ""}${mod}%` : ""} → <b>${plan.target}%</b>, rolled <b>${roll.total}</b>: <strong>${e(result)}</strong></p>
      ${game.user.isGM || asetting(ASETTINGS.unidentified) === false ? `<p>Quality: <strong>${e(quality)}</strong></p>` : ""}
      ${spent.length ? `<p class="mm-hint">Committed: ${spent.map(e).join(", ")}.</p>` : ""}
      ${notes.length ? `<p class="mm-hint">${notes.map(e).join(" · ")}</p>` : ""}</div>`
  });

  if (quality === "Trash") {
    await ChatMessage.create({ speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
      content: `<div class="mm-chat al-chat is-bad"><p><strong>The batch is ruined.</strong>${spent.length ? ` ${spent.map(e).join(" and ")} ${spent.length > 1 ? "are" : "is"} wasted.` : ""}</p></div>` });
    return { ...plan, actor, quality, result, roll: roll.total, done: true };
  }
  return { ...plan, actor, quality, result, roll: roll.total, done: false };
}

/** Vessels of a size the actor carries (§9): items named "Vessel - <Size>". */
export function carriedVessels(actor, size) {
  if (!actor) return [];
  const want = vesselName(size).toLowerCase();
  return actor.items.filter(i => i.name.trim().toLowerCase() === want && (Number(i.system?.quantity) || 0) > 0);
}
const vesselCount = (actor, size) => carriedVessels(actor, size).reduce((n, i) => n + (Number(i.system.quantity) || 0), 0);

/** The containers this batch could be decanted into (§9). */
export function decantOptions(batch) {
  const required = asetting(ASETTINGS.vessels) === "required";
  const q = QUALITY[batch.quality];
  const capacity = motherDoses(batch.mother, { unbounded: !batch.actor });
  const gradePotency = Math.max(1, ...batch.chosen.map(i => effectivePotency(i.grade, i.condition) ?? 1));
  return Object.entries(SIZES).map(([name, c]) => {
    const doses = Math.max(1, Math.min(c.charges, q.portions, capacity));
    const potency = batch.mechanical ? potencyPerDose(batch.orie, doses) : gradePotency;
    let issue = null;
    if (c.charges > capacity && capacity < q.portions) issue = `only ${capacity} dose${capacity > 1 ? "s" : ""} of ${batch.mother.name}`;
    if (batch.mechanical && doses < batch.minDoses) issue = `overflows: needs ${batch.minDoses}+ doses`;
    else if (potency < 1) issue = "too dilute to do anything";
    const vessels = batch.actor ? vesselCount(batch.actor, name) : null;
    if (!issue && required && batch.actor && !vessels) issue = `no ${name} vessel carried`;
    return { name, ...c, doses, potency, issue, vessels,
      vesselNote: vessels === null ? c.cost : vessels ? `${vessels} carried` : `new vessel ${c.cost}`, volatile: batch.mechanical && potency >= 4, supercritical: potency >= SUPERCRITICAL };
  });
}

/** Overflow (§9): no container can hold it, so it goes off as Potency 6. */
export async function overflow(batch) {
  const v = VOLATILITY[MAX_POTENCY];
  await ChatMessage.create({ speaker: batch.actor ? ChatMessage.getSpeaker({ actor: batch.actor }) : undefined,
    content: `<div class="mm-chat al-chat is-bad"><h3>Overflow</h3><p>${batch.orie} Orie can't be divided safely at ${e(batch.quality)} quality (it needs ${batch.minDoses}+ doses). The batch discharges as a Potency ${MAX_POTENCY} detonation (§7): <strong>${v.damage}</strong> in ${v.radius} m.</p></div>` });
}

/** Decant into a container and make the potion. */
export async function decant(batch, containerName) {
  const options = decantOptions(batch);
  const usable = options.filter(o => !o.issue);
  if (!usable.length) { await overflow(batch); return null; }
  const pick = options.find(o => o.name === containerName && !o.issue) ?? usable.reduce((a, b) => (b.potency > a.potency ? b : a));
  const q = QUALITY[batch.quality];
  const { doses, potency } = pick;
  const supercritical = potency >= SUPERCRITICAL;
  const effPotency = Math.min(potency, MAX_POTENCY);

  // §9 The vessel: one the alchemist carries, or a new one at its price.
  let vesselLine = "";
  if (batch.actor) {
    const [held] = carriedVessels(batch.actor, pick.name);
    if (held) {
      const n = Number(held.system.quantity) || 1;
      if (n > 1) await held.update({ "system.quantity": n - 1 }); else await held.delete();
      vesselLine = `A carried ${pick.name} vessel is used.`;
    } else vesselLine = `A new ${pick.name} vessel: ${pick.cost}.`;
  }

  // §3b The liquid is measured now; the rest of the last measure boils off.
  const motherUnits = motherUnitsSpent(batch.mother, doses);
  await spend([{ ...batch.mother, spend: motherUnits }], batch.actor);
  const boiledOff = Math.max(0, motherUnits * motherDosesPerUnit(batch.mother) - doses);
  const rawOriePerDose = batch.mechanical ? Math.floor(batch.ingredientOrie / doses) : 0;

  const manifest = batch.quality === "Superior"
    ? [...new Set(batch.chosen.flatMap(i => i.slots.filter(Boolean)))]
        .map(effect => ({ effect, slot: bestSlot(batch.chosen, effect) }))
        .filter(o => o.slot !== null).sort((a, b) => a.slot - b.slot)
    : batch.overlaps;
  const live = manifest.filter(m => slotPotency(effPotency, m.slot) >= 1);

  const effectLines = manifest.length
    ? manifest.map(({ effect, slot }) => {
        const sp = slotPotency(effPotency, slot);
        return sp < 1
          ? `<li><strong>${e(effect)}</strong> — <em>too weak to manifest (${SLOT_NAMES[slot]} at Potency ${effPotency})</em></li>`
          : `<li><strong>${e(effect)}</strong> <em>${SLOT_NAMES[slot]}</em> — at Potency ${sp}: ${e(describeEffect(effect, sp, q.mult))}</li>`;
      }).join("")
    : "<li><em>No overlapping effects: this potion is inert.</em></li>";
  const vol = batch.mechanical ? VOLATILITY[Math.min(potency, SUPERCRITICAL)] : null;
  const abs = batch.mechanical ? ABSORPTION[Math.min(potency, SUPERCRITICAL)] : null;
  const reagentNames = batch.reagents.map(r => r.name);
  const trueName = `${batch.quality} Potion (P${potency}) — ${live.length ? live.map(m => m.effect).join("/") : "Inert"}`;

  const description = `
    <p><strong>${e(batch.quality)}</strong> · Potency <strong>${potency}</strong>${supercritical ? " <em>(Supercritical)</em>" : ""} · ${q.rounds} Melee Round${q.rounds === 1 ? "" : "s"}</p>
    <p><em>Brewed from ${reagentNames.map(e).join(" + ")} in ${e(batch.mother.name)}${motherUnits > 1 ? ` ×${motherUnits}` : ""}${batch.mechanical
      ? ` — ${batch.orie} Orie${batch.channelled ? ` (${batch.ingredientOrie} raw + ${batch.channelled} channelled)` : ""} across ${doses} dose${doses > 1 ? "s" : ""}`
      : ` — ${doses} dose${doses > 1 ? "s" : ""}, no Melfyrium`}.${boiledOff ? ` ${boiledOff} dose${boiledOff > 1 ? "s" : ""}' worth boiled off.` : ""}</em></p>
    <ul>${effectLines}</ul>
    ${vol ? `<p><strong>Volatile (§7):</strong> ${vol.damage} in ${vol.radius} m${vol.ignoresArmour ? ", ignores armour" : ""}. ${e(vol.note)}</p>` : ""}
    ${abs ? `<p><strong>Skin contact (§7):</strong> ${e(abs)}</p>` : ""}
    ${batch.mechanical && rawOriePerDose ? `<p><strong>Saturation (§8):</strong> ${rawOriePerDose} raw Orie per dose against the drinker's SIZ.</p>` : ""}
    ${supercritical ? "<p><strong>Supercritical:</strong> cannot be stored more than a few hours, and uses Potency 6 for every effect.</p>" : ""}`;

  const concealed = asetting(ASETTINGS.unidentified) !== false;
  const data = {
    name: concealed ? `Unidentified Potion` : trueName,
    type: POTION_TYPE,
    img: POTION_IMG,
    system: {
      description: concealed ? `<p><em>An unidentified brew</em>, decanted from ${[batch.mother.name, ...reagentNames].map(e).join(" + ")}.</p>` : description,
      encumbrance: batch.mechanical ? Number((effPotency * effPotency * 0.1).toFixed(2)) : 0.1,
      quantity: doses, value: 0, equipmentType: "MYTHRAS.Consumables",
      identified: !concealed, quality: batch.quality, potency, supercritical,
      orie: batch.orie, ingredientOrie: batch.ingredientOrie, channelledXi: batch.channelled, rawOriePerDose,
      mechanical: batch.mechanical, potionClass: batch.potionClass,
      mother: batch.mother.name, motherUnits, boiledOff,
      duration: q.rounds, multiplier: q.mult, manifest, size: pick.name,
      ingredients: [batch.mother.name, ...reagentNames], trueName, trueDescription: description,
      brewedBy: batch.actor?.name ?? game.user.name,
      brewedAt: Number(game.time?.worldTime) || 0
    }
  };
  const [potion] = batch.actor ? await batch.actor.createEmbeddedDocuments("Item", [data]) : await Item.createDocuments([data]);

  if (batch.actor && potion) {
    await recordRecipe(batch.actor, {
      mother: batch.mother.name, reagents: reagentNames, xi: batch.channelled, size: pick.name,
      quality: batch.quality, potency, doses, trueName, identified: !concealed, potionUuid: potion.uuid
    }).catch(err => console.warn("Dreoarcana | Alchemy: recipe book", err));
  }

  const learned = await discoverFromBrew(batch.chosen, manifest);
  const speaker = batch.actor ? ChatMessage.getSpeaker({ actor: batch.actor }) : undefined;
  const vesselHint = vesselLine ? `<p class="mm-hint">${e(vesselLine)}</p>` : "";
  const full = `<div class="mm-chat al-chat"><h3>${e(trueName)}</h3>${description}${vesselHint}${concealed ? "<p class=\"mm-hint\">Made unidentified; reveal it in the Laboratory.</p>" : ""}</div>`;
  if (!concealed) await ChatMessage.create({ speaker, content: full });
  else if (game.user.isGM) await gmCard(full, speaker);
  else {
    await ChatMessage.create({ speaker, content: `<div class="mm-chat al-chat"><h3>${e(batch.actor?.name ?? game.user.name)} decants a potion</h3><p>${doses} dose${doses > 1 ? "s" : ""} of something, from ${[batch.mother.name, ...reagentNames].map(e).join(" + ")}.</p>${vesselHint}</div>` });
    await gmCard(full, speaker);
  }
  if (learned.length) {
    await ChatMessage.create({ speaker, content: `<div class="mm-chat al-chat"><p><strong>Learned by brewing:</strong></p><ul>${
      learned.map(l => `<li>${e(l.name)}: ${l.gained.map(i => `<strong>${e(l.slots[i])}</strong> <em>(${SLOT_NAMES[i]})</em>`).join(", ")}</li>`).join("")}</ul></div>` });
  }
  return potion;
}

/** The GM turns an unknown brew into a known one. */
export async function revealPotion(item) {
  if (!game.user.isGM) { ui.notifications.warn("Only the GM can identify a potion."); return null; }
  if (item?.type !== POTION_TYPE) return null;
  if (item.system.identified) { ui.notifications.info(`${item.name} is already identified.`); return item; }
  await item.update({ name: item.system.trueName || item.name, "system.description": item.system.trueDescription || item.system.description, "system.identified": true });
  // The brewer's recipe book can now say what that batch was.
  const actor = item.parent;
  const book = actor?.system?.recipes;
  if (Array.isArray(book) && book.some(r => r.last?.potionUuid === item.uuid)) {
    await actor.update({ "system.recipes": book.map(r => r.last?.potionUuid === item.uuid ? { ...r, last: { ...r.last, identified: true } } : r) });
  }
  ui.notifications.info(`Identified: ${item.name}`);
  return item;
}

export const recordsOf = (docs) => docs.filter(isIngredient).map(record);
