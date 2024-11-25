import { ActorMythras } from '@actor'
import { CombatMythras } from '@combat/combat-mythras'
import { MythrasCombatTracker } from '@combat/combat-tracker'
import { registerHandlebarsHelpers } from '@scripts/handlebars'
import { registerTemplates } from '@scripts/register-templates'
import { MYTHRASCONFIG } from '@scripts/config'
import { ItemMythras, ItemProxyMythras } from '@item/base'
import { SetGameMythras } from '@scripts/set-game-mythras'
import { ActorSheetClassRegistry } from "@actor/ActorSheetClassRegistry";
import { ItemSheetClassRegistry } from "@item/ItemSheetClassRegistry";

export const Init = {
  listen: (): void => {
    Hooks.once('init', function () {
      console.log(`Mythras | Initializing the Mythras Game System`);
      CONFIG.MYTHRAS = MYTHRASCONFIG
      // Define custom Entity classes
      CONFIG.Actor.documentClass = ActorMythras
      ActorSheetClassRegistry.registerSheetClasses()
      CONFIG.Item.documentClass = ItemProxyMythras
      ItemSheetClassRegistry.registerSheetClasses()
      CONFIG.Combat.documentClass = CombatMythras
      CONFIG.ui.combat = MythrasCombatTracker as any
      //TODO: Figure out how to use the active effects class for further Mythras customization
      //CONFIG.ActiveEffect.documentClass = ActiveEffectMythras


      // Set an initiative formula for the system
      CONFIG.Combat.initiative = {
        //Weird error below, but it works
        //TODO: Look into this
        //@ts-ignore
        formula: '1d10 + @initiativeBonus',
        decimals: 2
      }

      // Register Handlebars Helpers
      registerHandlebarsHelpers()

      // Load Handlebars partial templates
      registerTemplates()

      // Set up custom Mythras combat setting
      game.settings.register("mythras", "combat.reduceAp", {
        name: "Automatically Reduce AP?",
        hint: "Automatically reduce Action Points when a combatant's turn is passed?",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
      });

      game.settings.register("mythras", "debugging", {
        name: "Debugging Mode",
        hint: "Enables additional debug logging.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
      });

      SetGameMythras.onInit()
    })

    Hooks.on('updateCombatant', function (combatant) {
      if (game.settings.get("mythras", "debugging")) {
        console.log(combatant)
      }
    })
  }
}
