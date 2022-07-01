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
        formula: (_combatant) => '1d10 + @attributes.initiativeBonus.value',
        decimals: 2
      }

      // Register Handlebars Helpers
      registerHandlebarsHelpers()

      // Load Handlebars partial templates
      registerTemplates()

      SetGameMythras.onInit()
    })
  }
}
