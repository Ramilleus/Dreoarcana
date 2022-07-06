import { WeaponMythras } from '@item/weapon/base'

export class MeleeWeaponMythras extends WeaponMythras {
  get traits() {
    return (this.data.data as any).traits
  }

  get size() {
    return (this.data.data as any).size
  }

  get reach() {
    return (this.data.data as any).reach
  }
}
