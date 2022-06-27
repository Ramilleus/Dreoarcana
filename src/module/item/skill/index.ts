import { ItemMythras } from '@item/base'

export class SkillMythras extends ItemMythras {
  get encPenalty() {
    const data: any = this.data.data
    return data.primaryChar === 'str' ||
    data.primaryChar === 'dex' ||
    data.secondaryChar === 'str' ||
    data.secondaryChar === 'dex'
  }

  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const data = itemData.data

    this.calculateSkillValues()

    data.encPenalty =
      data.primaryChar === 'str' ||
      data.primaryChar === 'dex' ||
      data.secondaryChar === 'str' ||
      data.secondaryChar === 'dex'
  }

  recalculateSkillValuesOnCharacteristicUpdate(updatedCharacteristic: string)
  {
    const itemData: any = this.data
    if (itemData.data.primaryChar === updatedCharacteristic ||
      itemData.data.secondaryChar === updatedCharacteristic) {
      this.calculateSkillValues()
    }
  }

  protected calculateSkillValues() {
    if (this.actor && this.actor.data) {
      let data: any = deepClone(this.data)
      let actorData: any = this.actor.data.data
      let primaryChar = data.data.primaryChar
      let secondaryChar = data.data.secondaryChar
      let primaryCharValue = primaryChar ? Number(actorData.characteristics[primaryChar].value) : 0
      let secondaryCharValue = secondaryChar ? Number(actorData.characteristics[secondaryChar].value) : 0
      data.data.baseVal = primaryCharValue + secondaryCharValue
      data.data.totalVal =
        data.data.baseVal +
        Number(data.data.trainingVal) +
        Number(data.data.miscBonus)
      this.data.update(data)
    }

    if (this.sheet) {
      // If the sheet for this skill is rendered (i.e. open), re-render to display the changed values
      if(this.sheet._state == 2) {
        this.sheet.render()
      }
    }
  }
}
