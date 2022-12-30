import { ItemMythras } from '@item/base'
import { itemIsSkill } from '@item/type-guards'
import { SheetPostRender } from '@module/sheet-common/sheet-post-render'

export class ItemSheetMythras<TItem extends ItemMythras> extends ItemSheet<TItem> {
  sheetPostRender!: SheetPostRender

  constructor (item: TItem, options?: Partial<DocumentSheetOptions>) {
    super(item, options)
    // Apply styles after renderActorSheet hook
    Hooks.on('renderItemSheet', () => {
      this.sheetPostRender = new SheetPostRender(this.element)
      this.postRender()
    })
  }

  override async getData(options?: Partial<DocumentSheetOptions>) {
    const itemData = super.getData(options) as any

    return {
      ...itemData,
      system: this.item.system,
      item: this.item,
      options
    }
  }

  private postRender() {
    this.sheetPostRender.postRender()
  }

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

    const itemType = this.item.type

    // Return a unique template based on item type
    if (itemType === 'magicSkill') {
      // A magic skill is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-magicSkill-sheet.hbs`
    } else if (itemType === 'combatStyle') {
      // Combat style is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-combatStyle-sheet.hbs`
    } else if (itemIsSkill(this.item)) {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-skill-sheet.hbs`
    } else {
      // Loads a unique sheet for all remaining types (armor, melee-weapon, etc.)
      return `${path}/item-${itemType}-sheet.hbs`
    }
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
