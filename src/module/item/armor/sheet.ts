import { PhysicalItemSheetMythras } from '@item/physical/sheet';
import { ArmorMythras } from '.'

export class ArmorSheetMythras extends PhysicalItemSheetMythras<ArmorMythras> {
  
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      availableHitLocations: this.item.availableHitLocations
    }
  }

  override get template(): string {
    return `systems/mythras/templates/item/item-armor-sheet.hbs`
  }
}