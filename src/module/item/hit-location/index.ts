import { ArmorMythras } from '@item/armor'
import { ItemMythras } from '@item/base'

export class HitLocationMythras extends ItemMythras {
  get attachedArmor(): Embedded<ArmorMythras>[] {
    return this.actor.items.filter((value: ItemMythras) => {
      return value.type === 'armor' && (value as ArmorMythras).selectedHitLocationId === this.id
    })
  }

  get equippedArmor(): Embedded<ArmorMythras>[] {
    return this.attachedArmor
      .filter((armor) => armor.isEquipped)
  }

  get equippedArmorNames() {
    return this.equippedArmor
      .map((armor) => armor.name).join(', ')
  }

  get naturalArmor() {
    return (this.data.data as any).naturalArmor
  }

  get totalAp() {
    let equippedArmorAp = this.equippedArmor
      .map((armor) => armor.ap)
      .reduce((previousAp, currentAp) => previousAp + currentAp, 0)
    if (this.naturalArmor > equippedArmorAp) {
      return this.naturalArmor
    } else {
      return equippedArmorAp
    }
  }

  override prepareData(): void {
    super.prepareData()
    this.calculateMaxHitpoints()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}
    
    const data = itemData.data
    if (actorData && actorData.items) {
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

  calculateMaxHitpoints() {
    if (this.actor && this.actor.data) {
      let data: any = deepClone(this.data)
      let actorData: any = this.actor.data.data
  
      let sizValue = Number(actorData.characteristics.siz.value)
      let conValue = Number(actorData.characteristics.con.value)
  
      let overallHpMod = Number(actorData.attributes.hitPointMod.mod)
      let hitLocationbaseHp = Number(data.data.baseHp)
      let hitLocationHpMod = Number(data.data.maxHpMod)
      data.data.maxHp =
        hitLocationbaseHp +
        Math.ceil((sizValue + conValue) / 5) +
        hitLocationHpMod +
        overallHpMod
      this.data.update(data)
    }
  }
}
