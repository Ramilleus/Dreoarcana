import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from '@module/actor'

interface WeaponData extends PhysicalItemData {
  damageModifier: string
  'combat-effects': string
  damage: string
}

interface WeaponMythras {
  readonly system: WeaponData
}

class WeaponMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends  PhysicalItemMythras<TParent> {
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