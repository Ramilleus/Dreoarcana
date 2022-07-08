import { ItemMythras } from '@item/base'
import { MagicSkillMythras } from '../magic-skill'

export class SpellMythras extends ItemMythras {
  get availableMagicSkills(): MagicSkillMythras[] {
    if (this.actorData) {
      return this.actor.itemTypes.magicSkill
    }
    return []
  }

  get magicSkill(): MagicSkillMythras {
    if (this.actorData && this.magicSkillId !== 'Uncategorized') {
      return this.actor.itemTypes.magicSkill.find(
        (skill: MagicSkillMythras) => skill.id === this.magicSkillId
      )
    }
    return undefined
  }

  get magicSkillId(): string {
    return (this.data.data as any).sourceID
  }

  get magicSkillName(): string {
    if (this.magicSkill) {
      return this.magicSkill.name
    }
    return 'Uncategorized'
  }

  get intensity() {
    if (this.magicSkill) {
      return this.magicSkill.intensity + Number((this.data.data as any).intensity.mod)
    }
    return 0
  }

  get magnitude() {
    if (this.magicSkill) {
      return this.magicSkill.magnitude + Number((this.data.data as any).magnitude.mod)
    }
    return 0
  }

  // override prepareData(): void {
  //   super.prepareData()

  //   const itemData: any = this.data
  //   const actorData: any = this.actor ? this.actor.data : {}

  //   const data = itemData.data
  //   if (actorData && actorData.items) {
  //     data.sourceList = actorData.items.filter(function (value: any) {
  //       return value.type === 'magicSkill'
  //     })
  //     let sourceName = data.sourceList.filter(function (value: any) {
  //       return value.id === data.sourceID
  //     })
  //     if (sourceName.length > 0) {
  //       data.source = sourceName[0].name
  //       let sourceData = sourceName[0].data.data
  //       data.magicType = sourceData.skillType
  //       data.intensity.base = sourceName[0].data.data.intensity.max
  //       data.magnitude.base = sourceName[0].data.data.magnitude.max
  //     }
  //   }
  //   if (data.sourceID === 'Uncategorized') {
  //     data.source = 'Uncategorized'
  //     data.magicType = ''
  //   }

  //   data.intensity.value = data.intensity.base + Number(data.intensity.mod)
  //   data.magnitude.value = data.magnitude.base + Number(data.magnitude.mod)
  // }
}
