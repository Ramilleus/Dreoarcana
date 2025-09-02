import { ItemSheetBase } from '@item/ItemSheetBase'
import { SkillMythras } from '.'

export class SkillSheetMythras extends ItemSheetBase<SkillMythras> {
  override async getData(options?: Partial<DocumentSheetOptions>): Promise<ItemSheetData<any>> {
    const sheetData = await super.getData(options);
    return {
      ...sheetData,
      encPenalty: (this.item as any).encPenalty,
      totalVal: (this.item as any).totalVal,
      characteristicsLabels: [
        { value: "str", label: "MYTHRAS.Strength" },
        { value: "con", label: "MYTHRAS.Constitution" },
        { value: "siz", label: "MYTHRAS.Size" },
        { value: "dex", label: "MYTHRAS.Dexterity" },
        { value: "int", label: "MYTHRAS.Intelligence" },
        { value: "pow", label: "MYTHRAS.Power" },
        { value: "cha", label: "MYTHRAS.Charisma" }
      ],
      magicSkillTypeLabels: [
        { value: "FM", label: "MYTHRAS.Folk_Magic"},
        { value: "TR", label: "MYTHRAS.Trance"},
        { value: "BI", label: "MYTHRAS.Binding"},
        { value: "ME", label: "MYTHRAS.Meditation"},
        { value: "MY", label: "MYTHRAS.Mysticism"},
        { value: "IN", label: "MYTHRAS.Invocation"},
        { value: "SH", label: "MYTHRAS.Shaping"},
        { value: "DE", label: "MYTHRAS.Devotion"},
        { value: "EX", label: "MYTHRAS.Exhort"}
      ]
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
