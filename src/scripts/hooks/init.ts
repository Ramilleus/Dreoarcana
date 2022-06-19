import { MythrasItem } from '@item/item.js'
import { ActorMythras } from '@actor/actor.js'
import { CombatMythras } from '@combat/combat-mythras.js'
import { MythrasCombatTracker } from '@combat/combat-tracker'
import { MythrasCombatTrackerConfig } from '@combat/combat-config.js'
import { registerHandlebarsHelpers } from '@scripts/handlebars'
import { registerTemplates } from '@scripts/register-templates'

export const Init = {
  listen: (): void => {
    Hooks.once('init', function () {
      // Setup game.mythras
      game.mythras = {
        ActorMythras,
        MythrasItem,
        CombatMythras,
        MythrasCombatTracker,
        MythrasCombatTrackerConfig
      }

      // Define custom Entity classes
      CONFIG.Actor.documentClass = ActorMythras
      CONFIG.Item.documentClass = MythrasItem
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
    })
  }
}
