import { ItemSheetMythras } from '@item/sheet/base'
import { SkillMythras } from '.'

export class SkillSheetMythras extends ItemSheetMythras<SkillMythras> {
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);
    return {
      ...sheetData,
      encPenalty: this.item.encPenalty
    }
  }
}
