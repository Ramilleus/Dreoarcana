import { ItemMythras } from '@item/base'
import { PhysicalItemMythras } from '@item/physical'
import { itemIsArmor, itemIsPhysical } from '@item/type-guards'
import { ActorMythras } from '@actor/base'
import { EncumbranceLevel } from './types'

export class ActorMythrasEncumbrance {
  constructor(private actor: ActorMythras) {}

  // Encumbrance getters
  get currentEncumbrance(): number {
    return this.encumbranceCalc()
  }

  get percentEncumbered(): number {
    return (this.currentEncumbrance / this.maxLoad) * 100
  }

  get burdenedCap(): number {
    return this.actor.characteristics.str * 2
  }

  get isBurdened(): boolean {
    return this.currentEncumbrance > this.burdenedCap
  }

  get overloadedCap(): number {
    return this.actor.characteristics.str * 3
  }

  get isOverloaded(): boolean {
    return this.currentEncumbrance > this.overloadedCap
  }

  get maxLoad(): number {
    return this.actor.characteristics.str * 4
  }

  get isOverMaxLoad(): boolean {
    return this.currentEncumbrance > this.maxLoad
  }

  get levels(): Record<string, EncumbranceLevel> {
    return {
      burdened: {
        skillGrade: 'One Step Penalty',
        movementPenalty: () => -2
      },
      overloaded: {
        skillGrade: 'Two Steps Penalty',
        movementPenalty: (movement) => -(movement * 0.5)
      }
    }
  }

  get barSegments() {
    const encumbranceLevels = [this.burdenedCap, this.overloadedCap, this.maxLoad]
    const encumbranceLevelNames = ['Burdened', 'Overloaded', 'Max Load']
    const segments = []
    const totalEncumbrance = this.currentEncumbrance
    let barCovered = 0
    let barFilled = 0

    for (let i = 0; i < encumbranceLevels.length; i++) {
      let percentSegmentFilled = 0
      if (totalEncumbrance >= encumbranceLevels[i]) {
        percentSegmentFilled = 100
        barFilled += encumbranceLevels[i] - barCovered
      } else if (i == 0 || totalEncumbrance > encumbranceLevels[i - 1]) {
        const divisor = totalEncumbrance - barFilled
        const dividend = encumbranceLevels[i] - barFilled
        percentSegmentFilled = 100 * (divisor / dividend)
      }
      const width = encumbranceLevels[i] - barCovered
      segments.push({
        level: encumbranceLevels[i],
        levelName: encumbranceLevelNames[i],
        percentFilled: percentSegmentFilled,
        width: width
      })
      barCovered += width
    }

    return segments
  }

  /**
   * Calculates a character's encumbrance based on their physical items
   * @param {*} items
   */
  private encumbranceCalc() {
    // Get all of the players owned items that are physical
    let encItems: PhysicalItemMythras[] = this.actor.items.filter(
      (item: ItemMythras): item is PhysicalItemMythras => {
        return itemIsPhysical(item)
      }
    )
    // Sum up and return all of the items' weights
    let totalEnc = 0
    let armorEnc = 0
    for (let item of encItems) {
      if (itemIsArmor(item) && item.isEquipped) {
        armorEnc = armorEnc + item.encumbranceTowardsTotal
      } else {
        totalEnc = totalEnc + item.encumbranceTowardsTotal
      }
    }
    totalEnc = totalEnc + Math.ceil(armorEnc / 2)
    return totalEnc
  }
}
