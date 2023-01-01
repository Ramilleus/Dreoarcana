import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'

interface WeaponData extends PhysicalItemData {
  damageModifier: string
  'combat-effects': string
  damage: string
}

interface WeaponMythras {
  readonly system: WeaponData
}

class WeaponMythras extends PhysicalItemMythras {
  get damageRoll() {
    const systemData = this.system
    if (this.damageModifier) {
      return systemData.damage + '+' + this.actor.damageMod
    } else {
      return systemData.damage
    }
  }

  get damageModifier() {
    return this.system.damageModifier
  }

  get combatEffects() {
    return this.system['combat-effects']
  }
}

export { WeaponData, WeaponMythras }