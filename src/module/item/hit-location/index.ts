import { ArmorMythras } from '@item/armor'
import { ItemMythras } from '@item/base'

export class HitLocationMythras extends ItemMythras {
  get attachedArmor(): Embedded<ArmorMythras>[] {
    return this.actor.items.filter((value: ItemMythras) => {
      return value.type === 'armor' && (value as ArmorMythras).selectedHitLocationId === this.id
    })
  }

  get rollRangeStart(): Embedded<ArmorMythras>[] {
    return (this.data.data as any).rollRangeStart
  }

  get rollRangeEnd(): Embedded<ArmorMythras>[] {
    return (this.data.data as any).rollRangeEnd
  }

  get equippedArmor(): Embedded<ArmorMythras>[] {
    return this.attachedArmor.filter((armor) => armor.isEquipped)
  }

  get equippedArmorNames() {
    return this.equippedArmor.map((armor) => armor.name).join(', ')
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

  get maxHp() {
    let data: any = deepClone(this.data)
    let actorData: any = this.actor.data.data

    let sizValue = Number(actorData.characteristics.siz.value)
    let conValue = Number(actorData.characteristics.con.value)

    let overallHpMod = Number(actorData.attributes.hitPointMod.mod)
    let hitLocationbaseHp = Number(data.data.baseHp)
    let hitLocationHpMod = Number(data.data.maxHpMod)
    let maxHp =
      hitLocationbaseHp + Math.ceil((sizValue + conValue) / 5) + hitLocationHpMod + overallHpMod
    if (maxHp < 1) {
      maxHp = 1
    }
    return maxHp
  }
}
