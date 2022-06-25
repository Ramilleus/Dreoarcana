import { ItemMythras } from '@item/base'

export class SpellMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}
    
    const data = itemData.data
    const intMod = Number(data.intensity.mod)
    const magMod = Number(data.magnitude.mod)
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
        data.intensity.base = sourceName[0].data.data.intensity.max
        data.magnitude.base = sourceName[0].data.data.magnitude.max
      }
    }
    if (data.sourceID === 'Uncategorized') {
      data.source = 'Uncategorized'
      data.magicType = ''
    }

    data.intensity.value = data.intensity.base + intMod
    data.magnitude.value = data.magnitude.base + magMod

    data.intensity.applyClass = this.applyModColoring(intMod)
    data.magnitude.applyClass = this.applyModColoring(magMod)

  }

  applyModColoring(mod: Number){
    let classMod: string = ''
    if (mod > 0){
      classMod = 'increased-attribute'
    }else if(mod < 0){
      classMod = 'decreased-attribute'
    }else{
      classMod = ''
    }
    return classMod
  }
}
