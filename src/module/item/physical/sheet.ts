import { ItemSheetMythras } from '@item/sheet/base'
import { PhysicalItemMythras } from '.'

export class PhysicalItemSheetMythras<TItem extends PhysicalItemMythras> extends ItemSheetMythras<TItem> {
  
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);

    return {
      ...sheetData,
      availableStorage: this.item.availableStorage
    }
  }
}