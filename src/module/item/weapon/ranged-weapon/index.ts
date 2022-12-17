import { WeaponMythras } from '@item/weapon/base'

export class RangedWeaponMythras extends WeaponMythras {
  get force() {
    return (this.data.data as any).force
  }
}
