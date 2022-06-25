import { ItemMythras } from '@item/base'
import { updateSkillValues } from '@item/skill-helper'

export class SkillMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()
    
    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}

    const data = itemData.data
    if (data.baseVal.init === 0) {
      updateSkillValues(itemData, actorData)
      // Set the base skill value initialization flag to 1, this way, this code only gets run once
      data.baseVal.init = 1
    }
    
    data.encPenalty =
      data.primaryChar === 'str' ||
      data.primaryChar === 'dex' ||
      data.secondaryChar === 'str' ||
      data.secondaryChar === 'dex'
  }
}
