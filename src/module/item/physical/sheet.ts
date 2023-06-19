import { ItemSheetBase } from '@item/ItemSheetBase'
import { PhysicalItemMythras } from '.'

export class PhysicalItemSheetMythras<TItem extends PhysicalItemMythras> extends ItemSheetBase<TItem> {

  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      availableStorage: this.item.availableStorage
    }
  }

  //["melee-weapon", "ranged-weapon", "equipment", "currency", "storage"]

  override get template() {
    const path = 'systems/mythras/templates/item'

    const itemType = this.item.type
    if (itemType === "melee-weapon") {
      // A magic skill is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-melee-weapon-sheet.hbs`
    } else if (itemType === "ranged-weapon") {
      // Combat style is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-ranged-weapon-sheet.hbs`
    } else if (itemType === "equipment") {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-equipment-sheet.hbs`
    } else if (itemType === "currency") {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-currency-sheet.hbs`
    } else if (itemType === "storage") {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-storage-sheet.hbs`
    } else {
      throw new Error('ItemType uses PhysicalItemSheetMythras class but type is not known: ' + itemType)
    }
  }
}