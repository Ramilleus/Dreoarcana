import { ArmorMythras } from '@item/armor/index.js'
import { SkillMythras } from '@module/item/skill/index.js'
import { MYTHRASCONFIG } from '@scripts/config'
import { ActorMythrasEncumbrance } from './encumbrance'
import { fatigueLevels } from './fatigue'
/**
 * Mythras Actor object. Contains logic for preparing dynamic data on the sheet.
 * @extends {Actor}
 */
export class ActorMythras extends Actor<TokenDocument<ActorMythras>, ItemTypeMap> {
  public encumbrance!: ActorMythrasEncumbrance

  constructor(data: any, context: any = {}) {
    if (context.mythras?.ready) {
      super(data, context)
    } else {
      mergeObject(context, { mythras: { ready: true } })
      const documentClasses = CONFIG.MYTHRAS.Actor.documentClasses
      let type: keyof typeof documentClasses = data.type
      const ActorConstructor = documentClasses[type]
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
      fatigueLevels[this.currentLevelOfFatigue].actionPointsPenalty(base)
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
      fatigueLevels[this.currentLevelOfFatigue].initiativePenalty(base)
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
    return super.create(data, context)
  }

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData()
    this.encumbrance = new ActorMythrasEncumbrance(this)

    const actorData: any = this.data
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
    let athletics: SkillMythras = items.find(
      (entry: any) => entry.data.name === game.i18n.localize('MYTHRAS.Athletics')
    )
    let swim: SkillMythras = items.find((entry: any) => entry.data.name === game.i18n.localize('MYTHRAS.Swim'))
    let movementMiscMod =
      Number(data.attributes.movement.mod) +
      fatigueLevels[this.currentLevelOfFatigue].movementPenalty(data.attributes.movement.walk)
    if (this.encumbrance.isOverloaded) {
      movementMiscMod += this.encumbrance.levels.overloaded.movementPenalty(data.attributes.movement.walk)
    } else if (this.encumbrance.isBurdened) {
      movementMiscMod += this.encumbrance.levels.burdened.movementPenalty(data.attributes.movement.walk)
    }

    // Default walk speed for a human is 6
    data.attributes.movement.walk = 6 + movementMiscMod
    let walkSpeed = data.attributes.movement.walk

    // Calculate run speed
    data.attributes.movement.run = this.moveRateCalc(walkSpeed, athletics, 'run') - this.armorPenalty

    // Calculate sprint speed
    data.attributes.movement.sprint = this.moveRateCalc(walkSpeed, athletics, 'sprint') - this.armorPenalty

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
  moveRateCalc(move: any, skill: SkillMythras, type: any) {
    if (skill === undefined) {
      return move
    }
    switch (type) {
      case 'run':
        return 3 * (move + Math.floor(skill.totalVal / 50))
      case 'sprint':
        return 5 * (move + Math.floor(skill.totalVal / 25))
      case 'climb':
        return move
      case 'swim':
        return move + Math.floor(skill.totalVal / 20)
      case 'hJump':
        return (move * 2 + 100 * Math.floor(skill.totalVal / 20)) / 100
      case 'vJump':
        return (Math.floor(move / 2) + 20 * Math.floor(skill.totalVal / 20)) / 100
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

type ItemType = keyof typeof MYTHRASCONFIG.Item.documentClasses
type ItemTypeMap = {
  [K in ItemType]: InstanceType<ConfigMythras["MYTHRAS"]["Item"]["documentClasses"][K]>;
};
