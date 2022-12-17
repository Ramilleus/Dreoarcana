import { ActorMythras } from '@actor'
import { CombatMythras } from '@combat/combat-mythras.js'
import { MythrasCombatTracker } from '@combat/combat-tracker'
import { registerHandlebarsHelpers } from '@scripts/handlebars'
import { registerTemplates } from '@scripts/register-templates'
import { MYTHRASCONFIG } from '@scripts/config'
import { ItemMythras } from '@item/base'
import { SetGameMythras } from '@scripts/set-game-mythras'

export const Init = {
  listen: (): void => {
    Hooks.once('init', function () {
      CONFIG.MYTHRAS = MYTHRASCONFIG

      // Define custom Entity classes
      CONFIG.Actor.documentClass = ActorMythras
      CONFIG.Item.documentClass = ItemMythras
      CONFIG.Combat.documentClass = CombatMythras
      CONFIG.ui.combat = MythrasCombatTracker as any

      // Set an initiative formula for the system
      CONFIG.Combat.initiative = {
        //Weird error below, but it works
        //TODO: Look into this
        //@ts-ignore
        formula: '1d10 + @initiativeBonus',
        decimals: 2
      }

      //CONFIG.debug.hooks = true

      // Register Handlebars Helpers
      registerHandlebarsHelpers()

      // Load Handlebars partial templates
      registerTemplates()

      SetGameMythras.onInit()
    })
    Hooks.on('updateCombatant', function (combatant) {
      console.log(combatant)
    })
  }
}
