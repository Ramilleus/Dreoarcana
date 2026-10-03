/* ===================================================================
 * Dreoarcana Arcana — wiring
 *
 * Arcana is the Dreoarcana magic system: the Spell Builder and Node
 * Catalogue from the Ramilleus Codex, played on the Mythras engine.
 * This file registers it with Foundry. The data model lives in
 * static/template.json (arcaneSpell, arcaneEffect, the Heat tracked
 * stat and its modifier, system.catalyst on gear); the actor's maxHeat
 * getter lives in src/module/actor/base.ts. Stored Orie is the
 * system's Magic Points, relabelled, and is the caster's reservoir.
 * =================================================================== */

import { SYSTEM_ID, SPELL_TYPE, EFFECT_TYPE, TEMPLATES, isArcaneSpell, isEffectItem, currentActor, LOG } from "./core.js";
import * as rules from "./rules.js";
import { registerSettings, setting, SETTINGS, SETTINGS_HOOK, THEMES } from "./settings.js";
import { Arcanum, openArcanum, ARCANUM_TEMPLATES } from "./arcanum.js";
import { ArcaneSpellSheet, ArcaneEffectSheet } from "./sheets.js";
import { heatState, addHeat, ventHeat, clearHeat } from "./heat.js";
import { castSpell } from "./cast.js";
import { saveSpell, spellItemData, buildOf } from "./spells.js";
import { createEffectItem, refreshEffects, refreshEffectsSoon, sendEffectToPack, EFFECTS_HOOK } from "./effects.js";
import { buildRulesJournal, rulesPages } from "./rules-pages.js";
import { sigilSVG, glyphSVG } from "./sigil.js";
import { registerSocket, playLocal, exportSpellWav } from "./sound.js";
import { migrateWorld, onPreCreateItem } from "./legacy.js";

export { arcaneSheetContext } from "./sheets.js";
export { openArcanum } from "./arcanum.js";
export { heatCapacity } from "./heat.js";

const PARTIALS = [`${TEMPLATES}/actor-arcana.hbs`, `${TEMPLATES}/item-catalyst.hbs`];

/* The theme is a data attribute on <body>; the stylesheet keys its
   variable blocks off it. Motion is a class so one rule stills it all. */
function applyTheme() {
  const theme = setting(SETTINGS.theme);
  document.body.dataset.mmTheme = THEMES[theme] ? theme : "parchment";
  document.body.classList.toggle("mm-no-motion", setting(SETTINGS.animations) === false);
}

const arcanum = () => (Arcanum.instance?.rendered ? Arcanum.instance : null);

/** Redraw character sheets that show Heat (a capacity or visibility setting changed). */
function rerenderCharacterSheets() {
  for (const actor of game.actors ?? []) if (actor.sheet?.rendered) actor.sheet.render(false);
}

export function registerArcana() {
  Hooks.once("init", () => {
    registerSettings();

    const DSC = foundry.applications.apps?.DocumentSheetConfig ?? globalThis.DocumentSheetConfig;
    DSC.registerSheet(Item, SYSTEM_ID, ArcaneSpellSheet, { types: [SPELL_TYPE], makeDefault: true, label: "Arcanum" });
    DSC.registerSheet(Item, SYSTEM_ID, ArcaneEffectSheet, { types: [EFFECT_TYPE], makeDefault: true, label: "Arcanum" });
    CONFIG.Item.typeLabels = { ...(CONFIG.Item.typeLabels ?? {}), [SPELL_TYPE]: "TYPES.Item.arcaneSpell", [EFFECT_TYPE]: "TYPES.Item.arcaneEffect" };

    const load = foundry.applications.handlebars?.loadTemplates ?? globalThis.loadTemplates;
    load([...ARCANUM_TEMPLATES, ...PARTIALS]).catch(err => LOG("template preload failed:", err.message));
    LOG("registered");
  });

  Hooks.once("ready", async () => {
    applyTheme();
    registerSocket();
    try { await migrateWorld(); } catch (err) { LOG("migration failed:", err.message); }
    try { await refreshEffects({ reason: "ready" }); } catch (err) { LOG("effect scan failed:", err.message); }

    game.mythras.arcana = {
      rules, openArcanum, Arcanum, castSpell, saveSpell, spellItemData, buildOf,
      heatState, addHeat, ventHeat, clearHeat,
      createEffectItem, refreshEffects, sendEffectToPack,
      rulesPages, buildRulesJournal,
      sigilSVG, glyphSVG, playSpellSound: playLocal, exportSpellWav,
      setting, SETTINGS
    };
  });

  Hooks.on(SETTINGS_HOOK, (key) => {
    if (key === SETTINGS.theme || key === SETTINGS.animations) {
      applyTheme();
      arcanum()?.render();
      return;
    }
    if ([SETTINGS.trackHeat, SETTINGS.heatCapacityPerCon].includes(key)) rerenderCharacterSheets();
    arcanum()?.render();
  });

  /* ---- Effect items keep the registry in step ------------------- */

  const touchesEffects = (doc, changes) => isEffectItem(doc) || changes?.type === EFFECT_TYPE;
  Hooks.on("createItem", (doc) => { if (isEffectItem(doc)) refreshEffectsSoon(); });
  Hooks.on("updateItem", (doc, changes) => { if (touchesEffects(doc, changes)) refreshEffectsSoon(); });
  Hooks.on("deleteItem", (doc) => { if (isEffectItem(doc)) refreshEffectsSoon(); });
  Hooks.on(EFFECTS_HOOK, () => arcanum()?.render({ parts: ["bench", "effects"] }));

  /* ---- The Arcanum follows its caster --------------------------- */

  const SKILLS = ["magicSkill", "professionalSkill", "standardSkill"];
  const followItem = (doc, changes = null) => {
    const app = arcanum();
    if (!app) return;
    const ours = app.actor ? doc.parent === app.actor : !doc.parent;
    if (!ours) return;
    if (isArcaneSpell(doc)) return app.render({ parts: ["rail", "foot"] });
    // Skills and catalysts feed the Caster node.
    const catalyst = changes ? changes.system?.catalyst !== undefined : Boolean(doc.system?.catalyst?.enabled);
    if (SKILLS.includes(doc.type) || catalyst) app.render({ parts: ["rail", "bench"] });
  };
  Hooks.on("createItem", (doc) => followItem(doc));
  Hooks.on("updateItem", (doc, changes) => followItem(doc, changes));
  Hooks.on("deleteItem", (doc) => followItem(doc));
  Hooks.on("updateActor", (actor) => { const app = arcanum(); if (app?.actor === actor) app.refreshCaster(); });

  /* ---- Old Mechanical Magic items convert as they arrive -------- */
  Hooks.on("preCreateItem", onPreCreateItem);

  /* ---- One way in from the sidebar ------------------------------ */
  Hooks.on("renderItemDirectory", (app, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".arcanum-launch")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "arcanum-launch";
    btn.innerHTML = `<i class="fas fa-hat-wizard"></i> Arcanum`;
    btn.dataset.tooltip = "Build, cast and catalogue spells";
    btn.addEventListener("click", (ev) => { ev.preventDefault(); openArcanum({ actor: currentActor() ?? undefined }); });
    const where = root.querySelector(".header-actions") ?? root.querySelector(".directory-header") ?? root;
    where.appendChild(btn);
  });
}
