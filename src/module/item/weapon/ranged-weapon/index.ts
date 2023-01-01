import { WeaponData, WeaponMythras } from '@item/weapon/base'

interface RangedWeaponData extends WeaponData {
  force: string
}

interface RangedWeaponMythras {
  readonly system: RangedWeaponData
}

class RangedWeaponMythras extends WeaponMythras {
  get force() {
    return this.system.force
  }
}

export { RangedWeaponData, RangedWeaponMythras }
