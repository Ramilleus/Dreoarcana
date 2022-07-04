import { ArmorMythras } from '@item/armor/index.js'
import { ItemMythras } from '@item/base.js'
import { PhysicalItemMythras } from '@item/physical/index.js'
import { itemIsArmor, itemIsPhysical } from '@item/type-guards'
import { fatigueInfo, encInfo } from './actor-helper.js'
/**
 * Mythras Actor object. Contains logic for preparing dynamic data on the sheet.
 * @extends {Actor}
 */
export class ActorMythras extends Actor {
  constructor(data: any, context: any = {}) {
    if (context.mythras?.ready) {
      super(data, context)
    } else {
      mergeObject(context, { mythras: { ready: true } })
      const documentClasses: any = CONFIG.MYTHRAS.Actor.documentClasses
      const ActorConstructor = documentClasses[data.type]
      return ActorConstructor
        ? new ActorConstructor(data, context)
        : new ActorMythras(data, context)
    }
  }

  // Attribute getters

  get armorPenalty() {
    let equippedArmor: ArmorMythras[] = this.items.filter(function (item: any) {
      return item.type === 'armor' && item.isEquipped
    })
    let totalArmorEncumbrance = equippedArmor.reduce(
      (weight: number, armor: ArmorMythras) => weight + armor.encumbrance,
      0
    )
    return Math.ceil(Number(totalArmorEncumbrance) / 5)
  }

  get currentLevelOfFatigue() {
    let data: any = this.data.data
    return data.attributes.fatigue.value
  }

  get maxActionPoints() {
    let base = Math.ceil((this.characteristics.int + this.characteristics.dex) / 12)
    return (
      base +
      this.attributeMiscMods.actionPoints +
      (fatigueInfo as any)[this.currentLevelOfFatigue].ActionPoints(base)
    )
  }

  get damageMod() {
    return this.damageModCalc(
      this.characteristics.str + this.characteristics.siz,
      this.attributeMiscMods.damageMod
    )
  }

  get experienceMod() {
    return Math.ceil(this.characteristics.cha / 6 - 2) + this.attributeMiscMods.experienceMod
  }

  get healingRate() {
    return Math.ceil(this.characteristics.con / 6) + this.attributeMiscMods.healingRate
  }

  get initiativeBonus() {
    let base = Math.ceil((this.characteristics.int + this.characteristics.dex) / 2)
    return (
      base +
      this.attributeMiscMods.initiativeBonus +
      (fatigueInfo as any)[this.currentLevelOfFatigue].Initiative(base)
    )
  }

  get maxLuckPoints() {
    return Math.ceil(this.characteristics.pow / 6) + this.attributeMiscMods.luckPoints
  }

  get maxMagicPoints() {
    return this.characteristics.pow + this.attributeMiscMods.magicPoints
  }

  get maxTenacity() {
    return this.characteristics.pow + this.attributeMiscMods.tenacity
  }

  // Encumbrance getters
  get totalEncumbrance(): number {
    return this.encumbranceCalc()
  }

  get percentEncumbered(): number {
    return (this.totalEncumbrance / this.maxLoad) * 100
  }

  get burdenedCap(): number {
    return this.characteristics.str * 2
  }

  get isBurdened(): boolean {
    return this.totalEncumbrance > this.burdenedCap
  }

  get overloadedCap(): number {
    return this.characteristics.str * 3
  }

  get isOverloaded(): boolean {
    return this.totalEncumbrance > this.overloadedCap
  }

  get maxLoad(): number {
    return this.characteristics.str * 4
  }

  get isOverMaxLoad(): boolean {
    return this.totalEncumbrance > this.maxLoad
  }

  // Actor attribute misc modifier convenience getter
  get attributeMiscMods() {
    let data: any = this.data.data
    return {
      actionPoints: Number(data.attributes.actionPoints.mod) || 0,
      damageMod: Number(data.attributes.damageMod.mod) || 0,
      experienceMod: Number(data.attributes.experienceMod.mod) || 0,
      healingRate: Number(data.attributes.healingRate.mod) || 0,
      initiativeBonus: Number(data.attributes.initiativeBonus.mod) || 0,
      luckPoints: Number(data.attributes.luckPoints.mod) || 0,
      magicPoints: Number(data.attributes.magicPoints.mod) || 0,
      tenacity: Number(data.attributes.tenacity.mod) || 0
    }
  }

  // Actor characteristics convenience getter
  get characteristics() {
    let data: any = this.data.data
    return {
      str: Number(data.characteristics.str.value),
      con: Number(data.characteristics.con.value),
      siz: Number(data.characteristics.siz.value),
      dex: Number(data.characteristics.dex.value),
      int: Number(data.characteristics.int.value),
      pow: Number(data.characteristics.pow.value),
      cha: Number(data.characteristics.cha.value)
    }
  }

  static override async create(data: any, context: any): Promise<any> {
    data.token = data.token || {}
    if (data.type === 'character') {
      mergeObject(
        data.token,
        {
          vision: true,
          dimSight: 30,
          brightSight: 0,
          actorLink: true,
          disposition: 1
        },
        { overwrite: false }
      )
    }
    return super.create(data, context)
  }

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData()

    const actorData = this.data

    // Prepare character specific data
    if (actorData.type === 'character') this._prepareCharacterData(actorData)
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData: any) {
    const data = actorData.data
    let items = actorData.items

    // Prepare a character's movement rates
    this.prepareMovement(data, items)

    // Prepare a character's fatigue recovery time
    data.attributes.fatigue.recoveryTime = this.recoveryTimeCalc(
      this.currentLevelOfFatigue,
      this.healingRate
    )
  }

  /**
   * Calculates and sets a character's movement rates
   * @param {*} data
   * @param {*} items
   */
  prepareMovement(data: any, items: any) {
    // Get athletics and swim item objects
    let athletics = items.find(
      (entry: any) => entry.data.name === game.i18n.localize('MYTHRAS.Athletics')
    )
    let swim = items.find((entry: any) => entry.data.name === game.i18n.localize('MYTHRAS.Swim'))
    let ap = Number(data.attributes.armorPenalty.value)
    let movementMiscMod =
      Number(data.attributes.movement.mod) +
      (fatigueInfo as any)[data.attributes.fatigue.value].Movement(data.attributes.movement.walk)
    if (this.isOverloaded) {
      movementMiscMod += encInfo['overloaded'].Movement(data.attributes.movement.walk)
    } else if (this.isBurdened) {
      movementMiscMod += encInfo['burdened'].Movement(data.attributes.movement.walk)
    }

    // Default walk speed for a human is 6
    data.attributes.movement.walk = 6 + movementMiscMod
    let walkSpeed = data.attributes.movement.walk

    // Calculate run speed
    data.attributes.movement.run = this.moveRateCalc(walkSpeed, athletics, 'run') - ap

    // Calculate sprint speed
    data.attributes.movement.sprint = this.moveRateCalc(walkSpeed, athletics, 'sprint') - ap

    // Calculate climb speed
    data.attributes.climb.value = this.moveRateCalc(walkSpeed, athletics, 'climb')

    // Calculate swim speed
    data.attributes.swim.value = this.moveRateCalc(walkSpeed, swim, 'swim')

    // Calculate horizontal jump speed
    data.attributes.jump.horizontal = this.moveRateCalc(Number(data.height), athletics, 'hJump')

    // Calculate vertical jump speed
    data.attributes.jump.vertical = this.moveRateCalc(Number(data.height), athletics, 'vJump')
  }

  /**
   * Calculates a character's encumbrance based on their physical items
   * @param {*} items
   */
  encumbranceCalc() {
    // Get all of the players owned items that are physical
    let encItems: PhysicalItemMythras[] = this.items.filter((item: ItemMythras): item is PhysicalItemMythras => {
      return itemIsPhysical(item)
    })
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

  /**
   * Calculates a character's recovery time based on their fatigue level and healing rate
   * @param {*} fatigueLevel
   * @param {*} healRate
   */
  recoveryTimeCalc(fatigueLevel: any, healRate: any) {
    let levels: any = {
      fresh: 'Feeling fresh!',
      winded: 15,
      tired: 3,
      wearied: 6,
      exhausted: 12,
      debilitated: 18,
      incapacitated: 24,
      'semi-conscious': 36,
      comatose: 48,
      dead: 'There is no hope.'
    }
    if (game.i18n) {
      levels.fresh = game.i18n.localize('MYTHRAS.Fresh')
      levels.dead = game.i18n.localize('MYTHRAS.Dead')
    }

    let recoveryMsg = ' '
    if (healRate < 1) healRate = 1
    if (fatigueLevel == 'fresh') {
      return levels[fatigueLevel]
    } else if (fatigueLevel == 'dead') {
      return levels[fatigueLevel]
    } else if (fatigueLevel == 'winded') {
      recoveryMsg = ' minutes until Fresh.'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.minrecovermsg')
      }
      return Math.ceil(levels[fatigueLevel] / healRate) + recoveryMsg
    } else {
      recoveryMsg = ' hours until Fresh'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.hoursrecovermsg')
      }
      return Math.ceil(levels[fatigueLevel] / healRate) + recoveryMsg
    }
  }

  /**
   * Calcalates a character's movement rate for a particular movement type
   * @param {*} move
   * @param {*} skill
   * @param {*} type
   */
  moveRateCalc(move: any, skill: any, type: any) {
    if (skill === undefined) {
      return move
    }
    let actor: any = this.data.data
    let skillVal =
      Number(skill.data.data.trainingVal) +
      Number(skill.data.data.miscBonus) +
      Number(actor.characteristics.dex.value) +
      Number(actor.characteristics.str.value)
    switch (type) {
      case 'run':
        return 3 * (move + Math.floor(skillVal / 50))
      case 'sprint':
        return 5 * (move + Math.floor(skillVal / 25))
      case 'climb':
        return move
      case 'swim':
        return move + Math.floor(skillVal / 20)
      case 'hJump':
        return (move * 2 + 100 * Math.floor(skillVal / 20)) / 100
      case 'vJump':
        return (Math.floor(move / 2) + 20 * Math.floor(skillVal / 20)) / 100
      default:
        return move
    }
  }

  /**
   * Calculates a character's damage modifier
   * @param {*} total
   * @param {*} stepInc
   */
  damageModCalc(total: any, stepInc: any) {
    // The different possible values for damage mod
    const damageSteps = [
      '-1d8',
      '-1d6',
      '-1d4',
      '-1d2',
      '0',
      '1d2',
      '1d4',
      '1d6',
      '1d8',
      '1d10',
      '1d12',
      '2d6',
      '1d8+1d6',
      '2d8',
      '1d10+1d8',
      '2d10'
    ]

    let damMod = ''
    let damInfinite = damageSteps.slice(5)
    let infFlag = false

    let index = -1
    if (total < 51) {
      index = Math.ceil(total / 5) - 1
    } else if (total + stepInc * 10 < 111) {
      index = 9 + Math.ceil((total - 50) / 10)
    }

    if (index !== -1) {
      if (index + stepInc >= damageSteps.length) {
        infFlag = true
      } else {
        damMod = damageSteps[index + stepInc]
      }
    }

    if (total >= 111 || infFlag) {
      total += stepInc * 10
      let excess = Math.floor(total / 110)
      damMod = excess * 2 + 'd10'
      if (total % 110 != 0) damMod += '+' + damInfinite[Math.floor((total - 110 * excess) / 10)]
    }
    return damMod
  }
}
