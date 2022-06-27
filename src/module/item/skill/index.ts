import { ItemMythras } from '@item/base'

export class SkillMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()
    
    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}

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
      let primaryCharValue = Number(actorData.characteristics[data.data.primaryChar].value)
      let secondaryCharValue = Number(actorData.characteristics[data.data.secondaryChar].value)
      data.data.baseVal = primaryCharValue + secondaryCharValue
      data.data.totalVal =
        data.data.baseVal +
        Number(data.data.trainingVal) +
        Number(data.data.miscBonus)
      this.data.update(data)
    }
  }
}
