import { PhysicalItemMythras } from '@item/physical'

export class WeaponMythras extends PhysicalItemMythras {
  get damageRoll() {
    const data: any = this.system
    if (this.damageModifier) {
      return data.damage + '+' + this.actor.damageMod
    } else {
      return data.damage
    }
  }

  get damageModifier() {
    return (this.system as any).damageModifier
  }

  get combatEffects() {
    return (this.system as any)['combat-effects']
  }
}
