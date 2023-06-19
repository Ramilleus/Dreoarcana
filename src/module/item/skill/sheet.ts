import { ItemSheetBase } from '@item/ItemSheetBase'
import { SkillMythras } from '.'

export class SkillSheetMythras extends ItemSheetBase<SkillMythras> {
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData = await super.getData(options);
    return {
      ...sheetData,
      encPenalty: this.item.encPenalty,
      totalVal: this.item.totalVal
    }
  }

  override get template() {
    const path = 'systems/mythras/templates/item'

    const itemType = this.item.type
    if (itemType === "magicSkill") {
      // A magic skill is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-magicSkill-sheet.hbs`
    } else if (itemType === "combatStyle") {
      // Combat style is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-combatStyle-sheet.hbs`
    } else if (itemType === "standardSkill" || itemType === "professionalSkill" || itemType === "passion") {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-skill-sheet.hbs`
    } else {
      throw new Error('ItemType uses SkillSheetMythras class but type is not known: ' + itemType)
    }
  }
}
