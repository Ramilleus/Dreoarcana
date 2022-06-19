import { ItemSheetMythras } from '@item/sheet/base'
import { updateSkillValues } from '@item/skill-helper'
import { SkillMythras } from '.'

export class SkillSheetMythras extends ItemSheetMythras<SkillMythras> {
  
  override _updateObject(event: Event, formData: Record<string, unknown>): Promise<any> {
    super._updateObject(event, formData)
    const itemData: any = this.item.data
    const actorData = this.actor ? this.actor.data : {}

    const target = event.target as any

    const data = itemData.data
    if (target) {
      switch (target.id) {
        case 'char-change':
          data.primaryChar = formData['data.primaryChar']
          data.secondaryChar = formData['data.secondaryChar']
          updateSkillValues(itemData, actorData)
          break
        case 'skill-mod':
          data.totalVal =
            data.baseVal.value +
            Number(formData['data.trainingVal']) +
            Number(formData['data.miscBonus'])
          break
        default:
      }
    }
  
    return this.item.update(formData)
  }

  override activateListeners(html: any) {
    super.activateListeners(html)
    let itemData: any = this.item.data.data

    if (
      (itemData.primaryChar + itemData.secondaryChar).includes('str') ||
      (itemData.primaryChar + itemData.secondaryChar).includes('dex')
    ) {
      html.find('.char-enc')[0].checked = true
    } else {
      html.find('.char-enc')[0].checked = false
    }

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return
  }
}
