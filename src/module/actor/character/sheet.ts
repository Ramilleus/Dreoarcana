import { CharacterMythras } from '@actor'
import { CreatureSheetMythras } from '@actor/creature/sheet'

export class CharacterSheetMythras extends CreatureSheetMythras<CharacterMythras> {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    foundry.utils.mergeObject(options, {
      classes: ['mythras', 'sheet', 'actor'],
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
    return options;
  }

  override get template(): string {
    return game.mythras.theme.getTheme().getCharacterActorTemplate()
  }
}
