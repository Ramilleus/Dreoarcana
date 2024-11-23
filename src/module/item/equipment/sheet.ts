import { PhysicalItemSheetMythras } from '@item/physical/sheet';
import { EquipmentMythras, EquipmentTypes } from '.'

export class EquipmentSheetMythras extends PhysicalItemSheetMythras<EquipmentMythras> {
  
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      equipmentTypes: EquipmentTypes
    }
  }

  override get template(): string {
    return `systems/mythras/templates/item/item-equipment-sheet.hbs`
  }
}