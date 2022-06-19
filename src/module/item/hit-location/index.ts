import { ItemMythras } from '@item/base'

export class HitLocationMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}
    
    const data = itemData.data
    const id = itemData._id
    if (actorData && actorData.items) {
      let armors = actorData.items.filter(function (value: any) {
        return value.type === 'armor'
      })

      let armorEquipped: any = []
      let ap = 0
      armors.forEach(function (piece: any, index: any) {
        if (piece.data.data.location === id && piece.data.data.equipped) {
          armorEquipped.push(piece.name)
          ap += Number(piece.data.data.ap)
        }
      })
      data.armors = armorEquipped.join(', ')
      data.ap = Math.max(ap || 0, data.naturalArmor || 0)
      if (data.maxHp == 0) {
        data.maxHp =
          Number(data.baseHp) +
          Math.ceil(
            (Number(actorData.data.characteristics.siz.value) +
              Number(actorData.data.characteristics.con.value)) /
              5
          ) +
          Number(actorData.data.attributes.hitPointMod.mod) +
          Number(data.maxHpMod)
        if (data.maxHp < 1) {
          data.maxHp = 1
        }
      }
    }
  }
}
