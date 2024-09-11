import { WeaponData, WeaponMythras } from '@item/weapon/base'
import { ActorMythras } from '@module/actor'

interface RangedWeaponData extends WeaponData {
  force: string
}

interface RangedWeaponMythras {
  readonly system: RangedWeaponData
}

class RangedWeaponMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends  WeaponMythras<TParent> {
  get force() {
    return this.system.force
  }
}

export { RangedWeaponData, RangedWeaponMythras }
