import { ArmorMythras } from '@item/armor'
import { ItemMythras } from '@item/base'
import { ActorMythras } from '@module/actor'

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

class HitLocationMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends ItemMythras<TParent> {
  get attachedArmor(): ArmorMythras[] {
    //@ts-ignore
    return this.actor.items.filter((value: ItemMythras<TParent>) => {
      return value.type === 'armor' && (value as ArmorMythras<TParent>).selectedHitLocationId.includes(this.id)
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

  get equippedArmor(): ArmorMythras[] {
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
    .reduce((previousAp, currentAp) => Math.max(previousAp, currentAp), 0)
  
  return equippedArmorAp + Number(this.naturalArmor)
}

  get maxHp() {
    const system = foundry.utils.deepClone(this.system)
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