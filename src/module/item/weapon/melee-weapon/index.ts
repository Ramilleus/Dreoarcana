import { WeaponMythras } from '@item/weapon/base'

export class MeleeWeaponMythras extends WeaponMythras {
  get traits() {
    return (this.system as any).traits
  }

  get size() {
    return (this.system as any).size
  }

  get reach() {
    return (this.system as any).reach
  }
}
