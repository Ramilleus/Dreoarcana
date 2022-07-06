import { ArmorSheetMythras } from '@item/armor/sheet'
import { SkillSheetMythras } from '@item/skill/sheet'
import { ItemSheetMythras } from '@item/sheet/base'
import { CharacterSheetMythras } from '@actor/character/sheet'
import { PhysicalItemSheetMythras } from '@item/physical/sheet'
import { MYTHRASCONFIG } from './config'

export function registerSheets() {
  registerItemSheet()
  registerActorSheet()
}

/**
 * Unregisters the default Foundry item sheet and registers the custom Mythras sheet
 */
function registerItemSheet() {
  Items.unregisterSheet('core', ItemSheet)

  let itemType: keyof typeof MYTHRASCONFIG.Item.sheetClasses
  for (itemType in MYTHRASCONFIG.Item.sheetClasses) {
    Items.registerSheet('mythras', MYTHRASCONFIG.Item.sheetClasses[itemType], {
      types: [itemType],
      makeDefault: true
    })
  }
}

/**
 * Unregisters the default Foundry actor sheet and registers the custom Mythras sheet
 */
function registerActorSheet() {
  Actors.unregisterSheet('core', ActorSheet)
  let actorType: keyof typeof MYTHRASCONFIG.Actor.sheetClasses
  for (actorType in MYTHRASCONFIG.Actor.sheetClasses) {
    Actors.registerSheet('mythras', MYTHRASCONFIG.Actor.sheetClasses[actorType], {
      types: [actorType],
      makeDefault: true
    })
  }
}
