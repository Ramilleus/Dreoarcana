import { MythrasItemSheet } from './item/item-sheet.js'
import { ActorSheetMythrasCharacter } from './actor/sheet/character.js'

/**
 * Unregisters the default Foundry item sheet and registers the custom Mythras sheet
 */
export function registerItems() {
  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('mythras', MythrasItemSheet, { makeDefault: true })
}

/**
 * Unregisters the default Foundry actor sheet and registers the custom Mythras sheet
 */
export function registerActors() {
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('mythras', ActorSheetMythrasCharacter, {
    types: ['character'],
    makeDefault: true
  })
}
