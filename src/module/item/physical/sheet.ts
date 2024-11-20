import { ItemSheetBase } from '@item/ItemSheetBase'
import { PhysicalItemMythras } from '.'

export class PhysicalItemSheetMythras<TItem extends PhysicalItemMythras> extends ItemSheetBase<TItem> {

  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      availableStorage: this.item.availableStorage,
      weaponSizeLabels: [
        { value: "S", label: "MYTHRAS.Small" },
        { value: "M", label: "MYTHRAS.Medium" },
        { value: "L", label: "MYTHRAS.Large" },
        { value: "H", label: "MYTHRAS.Huge" },
        { value: "E", label: "MYTHRAS.Enormous" },
        { value: "BE", label: "MYTHRAS.Beyond_Enormous" }
      ],
      weaponReachLabels: [        
        { value: "T", label: "MYTHRAS.Touch" },
        { value: "S", label: "MYTHRAS.Short" },
        { value: "M", label: "MYTHRAS.Medium" },
        { value: "L", label: "MYTHRAS.Long" },
        { value: "VL", label: "MYTHRAS.Very_Long" }
      ]
    }
  }

  //["melee-weapon", "ranged-weapon", "equipment", "currency", "storage"]

  override get template(): string {
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
    }else {
      throw new Error('ItemType uses PhysicalItemSheetMythras class but type is not known: ' + itemType)
    }
  }
}