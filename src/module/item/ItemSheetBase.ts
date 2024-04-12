import { ItemMythras } from '@item/base'
import { SheetPostRender } from '@module/sheet-common/sheet-post-render'

export class ItemSheetBase<TItem extends ItemMythras> extends ItemSheet<TItem> {
  sheetPostRender!: SheetPostRender

  constructor(item: TItem, options?: Partial<DocumentSheetOptions>) {
    super(item, options)
    // Apply styles after renderActorSheet hook
    Hooks.on('renderItemSheet', () => {
      this.sheetPostRender = new SheetPostRender(this.element)
      this.postRender()
    })
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
    const itemType = this.item.type
    return `systems/mythras/templates/item/item-${itemType}-sheet.hbs`
  }

  override async getData(options?: Partial<DocumentSheetOptions>) {
    const itemData = await super.getData(options) as any
    const item = itemData.item;

    // Enrich HTML description
    itemData.descriptionHTML = await TextEditor.enrichHTML(item.system.description, {
      secrets: item.isOwner,
      async: true,
      documents: true,
      rollData: itemData.rollData
    });

    return {
      ...itemData,
      system: this.item.system,
      item: this.item,
      isClassicTheme: game.mythras.theme.isClassic(),
      options
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
