import { CharacterMythras } from '@actor'
import { CreatureSheetMythras } from '@actor/creature/sheet'

export class CharacterSheetMythras extends CreatureSheetMythras<CharacterMythras> {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['mythras', 'sheet', 'actor'],
      template: 'systems/mythras/templates/actor/actor-sheet.hbs',
      width: 800,
      height: 900,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }
}
