import { ItemSheetMythras } from '@item/sheet/base'
import { ArmorMythras } from '.'

export class ArmorSheetMythras extends ItemSheetMythras<ArmorMythras> {
  
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      availableHitLocations: this.item.availableHitLocations
    }
  }
}
