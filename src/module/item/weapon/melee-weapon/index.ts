import { WeaponData, WeaponMythras } from '@item/weapon/base'

interface MeleeWeaponData extends WeaponData {
  traits: string
  size: string
  reach: string
}

interface MeleeWeaponMythras {
  readonly system: MeleeWeaponData
}

class MeleeWeaponMythras extends WeaponMythras {
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
