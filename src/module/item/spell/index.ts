import { ItemMythras } from '@item/base'

export class SpellMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}
    
    const data = itemData.data
    if (actorData && actorData.items) {
      data.sourceList = actorData.items.filter(function (value: any) {
        return value.type === 'magicSkill'
      })
      let sourceName = data.sourceList.filter(function (value: any) {
        return value.id === data.sourceID
      })
      if (sourceName.length > 0) {
        data.source = sourceName[0].name
        let sourceData = sourceName[0].data.data
        data.magicType = sourceData.skillType
      }
    }
    if (data.sourceID === 'Uncategorized') {
      data.source = 'Uncategorized'
      data.magicType = ''
    }
    if (data.intensity && data.magnitude) {
      if (data.magicType === 'FM') {
        data.intensity.value = 1
        data.magnitude.value = 1
      } else {
        data.intensity.value = 0
        data.magnitude.value = 0
      }
    }
  }
}
