import { MythrasItemSheet } from '@item/item-sheet.js'
import { ActorSheetMythrasCharacter } from '@actor/sheet/character.js'

export function registerSheets() {
  registerItemSheet()
  registerActorSheet()
}

/**
 * Unregisters the default Foundry item sheet and registers the custom Mythras sheet
 */
function registerItemSheet() {
  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('mythras', MythrasItemSheet as any, { makeDefault: true })
}

/**
 * Unregisters the default Foundry actor sheet and registers the custom Mythras sheet
 */
function registerActorSheet() {
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('mythras', ActorSheetMythrasCharacter as any, {
    types: ['character'],
    makeDefault: true
  })
}
