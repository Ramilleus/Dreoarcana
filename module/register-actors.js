import { ActorSheetMythrasCharacter } from './actor/sheet/character.js'

export function registerActors() {
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('mythras', ActorSheetMythrasCharacter, {
    types: ['character'],
    makeDefault: true
  })
}
