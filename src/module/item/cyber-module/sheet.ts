import { PhysicalItemSheetMythras } from '@item/physical/sheet';
import { CyberModuleMythras } from '.'

export class CyberModuleSheetMythras extends PhysicalItemSheetMythras<CyberModuleMythras> {

  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);
    return {
      ...sheetData,
      availableHitLocations: this.item.availableHitLocations,
      cyberModuleAvailibilityLabels: this.item.cyberModuleAvailibilityLabels
    }
  }

  override get template(): string {
    return 'systems/mythras/templates/item/item-cyberModule-sheet.hbs'
  }
}