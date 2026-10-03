/* ===================================================================
 * Dreoarcana Alchemy — wiring
 *
 * The Alchemis alchemy system (canon "Mythras Alchemy System") as part
 * of Dreoarcana. The data model lives in static/template.json
 * (ingredient, potion) and the catalogue in the system compendium
 * "Alchemy Ingredients"; the Laboratory is the one window for it.
 * =================================================================== */

import { SYSTEM_ID, currentActor } from "../arcana/core.js";
import { INGREDIENT_TYPE, POTION_TYPE, TEMPLATES, isAlchemical } from "./core.js";
import * as rules from "./rules.js";
import { registerAlchemySettings, ALCHEMY_SETTINGS_HOOK, asetting, ASETTINGS } from "./settings.js";
import { Laboratory, openLaboratory, LAB_TEMPLATES } from "./laboratory.js";
import { AlchemySheet } from "./sheets.js";
import { commitBrew, decant, planBrew, revealPotion } from "./brew.js";
import { drinkPotion, eatIngredient, saturationCheck } from "./consume.js";
import { throwPotion, breakPotion, blastProfile } from "./volatility.js";
import { tasteIngredient, studyIngredient } from "./discovery.js";
import { upsertIngredients, recordsFromCSV, catalogue } from "./core.js";
import { migrateAlchemy, onPreCreateAlchemy } from "./legacy.js";
import { applyLastingEffects, expirePotionEffects, isPotionEffect, potionSkillBonus } from "./effects.js";
import { currentLoad, addLoad, clearLoad } from "./saturation.js";
import { forageDay, identifyIngredient, grounds, saveGround } from "./forage.js";
import { ROUND_SECONDS } from "./rules.js";
import { refineIngredient, setPreserved, setPadded, ageAlchemy, onPreCreateStock } from "./workshop.js";
import { recipes, recordRecipe, deleteRecipe, matchRecipe } from "./recipes.js";

export { openLaboratory } from "./laboratory.js";

const lab = () => (Laboratory.instance?.rendered ? Laboratory.instance : null);

export function registerAlchemy() {
  Hooks.once("init", () => {
    registerAlchemySettings();
    const DSC = foundry.applications.apps?.DocumentSheetConfig ?? globalThis.DocumentSheetConfig;
    DSC.registerSheet(Item, SYSTEM_ID, AlchemySheet, { types: [INGREDIENT_TYPE, POTION_TYPE], makeDefault: true, label: "Laboratory" });
    // A Mythras Combat Round is five seconds (p.69). Foundry's default is 0,
    // which left game time standing still through combat, so nothing timed
    // — potion durations, saturation clearance — could run out in a fight.
    if (!CONFIG.time.roundTime) CONFIG.time.roundTime = ROUND_SECONDS;
    CONFIG.Item.typeLabels = { ...(CONFIG.Item.typeLabels ?? {}), [INGREDIENT_TYPE]: "TYPES.Item.ingredient", [POTION_TYPE]: "TYPES.Item.potion" };
    const load = foundry.applications.handlebars?.loadTemplates ?? globalThis.loadTemplates;
    load([...LAB_TEMPLATES]).catch(err => console.warn("Dreoarcana | Alchemy: template preload failed", err));
  });

  Hooks.once("ready", async () => {
    try { await migrateAlchemy(); } catch (err) { console.warn("Dreoarcana | Alchemy: migration", err); }
    game.mythras.alchemy = {
      rules, openLaboratory, Laboratory, planBrew, commitBrew, decant, revealPotion,
      drinkPotion, eatIngredient, saturationCheck, throwPotion, breakPotion, blastProfile,
      tasteIngredient, studyIngredient, upsertIngredients, recordsFromCSV, catalogue,
      applyLastingEffects, expirePotionEffects, potionSkillBonus, currentLoad, addLoad, clearLoad,
      forageDay, identifyIngredient, grounds, saveGround,
      refineIngredient, setPreserved, setPadded, ageAlchemy, recipes, recordRecipe, deleteRecipe, matchRecipe
    };
    expirePotionEffects().catch(() => {});
    ageAlchemy().catch(() => {});
  });

  Hooks.on(ALCHEMY_SETTINGS_HOOK, () => lab()?.render());
  Hooks.on("preCreateItem", onPreCreateAlchemy);
  Hooks.on("preCreateItem", onPreCreateStock);

  // The Laboratory follows its alchemist's stock and pools.
  const follow = (doc) => {
    const app = lab();
    if (!app || !isAlchemical(doc)) return;
    if (app.actor ? doc.parent === app.actor : true) app.refresh();
  };
  Hooks.on("createItem", follow);
  Hooks.on("updateItem", follow);
  Hooks.on("deleteItem", follow);
  Hooks.on("updateActor", (actor) => { const app = lab(); if (app?.actor === actor) app.render({ parts: ["rail"] }); });

  // Lasting potion effects: keep the rail current and clear what has run out.
  const followEffect = (effect) => {
    if (!isPotionEffect(effect)) return;
    const app = lab();
    if (app?.actor && effect.parent === app.actor) app.render({ parts: ["rail"] });
  };
  Hooks.on("createActiveEffect", followEffect);
  Hooks.on("deleteActiveEffect", followEffect);
  Hooks.on("updateWorldTime", () => {
    expirePotionEffects().catch(err => console.warn("Dreoarcana | Alchemy: effect expiry", err));
    ageAlchemy();
    const app = lab();
    if (app?.actor) app.render({ parts: ["rail"] });
  });

  // The Items directory gets one more way in, beside the Arcanum.
  Hooks.on("renderItemDirectory", (app, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".laboratory-launch")) return;
    if (!game.user.isGM && asetting(ASETTINGS.playerBrewing) === false && !currentActor()) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "laboratory-launch";
    btn.innerHTML = `<i class="fas fa-mortar-pestle"></i> Laboratory`;
    btn.dataset.tooltip = "Brew, read and use ingredients and potions";
    btn.addEventListener("click", (ev) => { ev.preventDefault(); openLaboratory({ actor: currentActor() ?? undefined }); });
    const where = root.querySelector(".header-actions") ?? root.querySelector(".directory-header") ?? root;
    where.appendChild(btn);
  });
}
