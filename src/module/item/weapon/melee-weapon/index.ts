import { WeaponData, WeaponMythras } from '@item/weapon/base'
import { ActorMythras } from '@module/actor'

interface MeleeWeaponData extends WeaponData {
  traits: string
  size: string
  reach: string
}

interface MeleeWeaponMythras {
  readonly system: MeleeWeaponData
}

class MeleeWeaponMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends  WeaponMythras<TParent> {
  get traits() {
    return this.system.traits
  }

  get size() {
    return this.system.size
  }

  get reach() {
    return this.system.reach
  }
}

export { MeleeWeaponData, MeleeWeaponMythras }
