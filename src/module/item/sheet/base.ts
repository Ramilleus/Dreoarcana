import { ItemMythras } from '@item/base'
import { skillTypes } from '@item/skill-helper.js'

export class ItemSheetMythras<TItem extends ItemMythras> extends ItemSheet<TItem> {
  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['mythras', 'sheet', 'item'],
      width: 495,
      height: 550,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes'
        }
      ]
    })
  }

  override get template() {
    const path = 'systems/mythras/templates/item'

    const itemType = this.item.data.type

    // Return a unique template based on item type
    if (itemType === 'magicSkill') {
      // A magic skill is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-magicSkill-sheet.html`
    } else if (itemType === 'combatStyle') {
      // Combat style is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-combatStyle-sheet.html`
    } else if (skillTypes.includes(itemType)) {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-skill-sheet.html`
    } else {
      // Loads a unique sheet for all remaining types (armor, melee-weapon, etc.)
      return `${path}/item-${itemType}-sheet.html`
    }
  }

  override getData(options?: Partial<DocumentSheetOptions>) {
    const data = super.getData(options)
    return data
  }

  override setPosition(options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 192
    sheetBody.css('height', bodyHeight)
    return position
  }

  override activateListeners($html: JQuery): void {
    super.activateListeners($html)

    $html.find('input').on('click', function (event) {
      this.select()
    })

    if (!this.options.editable) return
  }
}
