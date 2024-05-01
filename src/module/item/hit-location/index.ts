import { ArmorMythras } from '@item/armor'
import { ItemMythras } from '@item/base'

interface HitLocationData {
  baseHp: number
  currentHp: number
  maxHpMod: number
  rollRangeStart: number
  rollRangeEnd: number
  naturalArmor: number
  wardLocation: boolean
}

interface HitLocationMythras {
  readonly system: HitLocationData
}

class HitLocationMythras extends ItemMythras {
  get attachedArmor(): Embedded<ArmorMythras>[] {
    return this.actor.items.filter((value: ItemMythras) => {
      return value.type === 'armor' && (value as ArmorMythras).selectedHitLocationId === this.id
    })
  }

  get wardLocation(): boolean {
    return this.system.wardLocation
  }

  get rollRangeStart(): number {
    return this.system.rollRangeStart
  }

  get rollRangeEnd(): number {
    return this.system.rollRangeEnd
  }

  get equippedArmor(): Embedded<ArmorMythras>[] {
    return this.attachedArmor.filter((armor) => armor.isEquipped)
  }

  get equippedArmorNames() {
    return this.equippedArmor.map((armor) => armor.name).join(', ')
  }

  get naturalArmor() {
    return this.system.naturalArmor
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
    const system = deepClone(this.system)
    const actorData = this.actor.system

    const sizValue = Number(this.actor.characteristics.siz)
    const conValue = Number(this.actor.characteristics.con)

    const overallHpMod = Number(actorData.attributes.hitPointMod.mod)
    const hitLocationbaseHp = Number(system.baseHp)
    const hitLocationHpMod = Number(system.maxHpMod)
    let maxHp =
      hitLocationbaseHp + Math.ceil((sizValue + conValue) / 5) + hitLocationHpMod + overallHpMod
    if (maxHp < 1) {
      maxHp = 1
    }
    return maxHp
  }
}

export { HitLocationData, HitLocationMythras }