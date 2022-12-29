import { ArmorMythras } from '@item/armor/index.js'
import { MYTHRASCONFIG } from '@scripts/config'
import { ActorMythrasEncumbrance } from './encumbrance'
import { ActorMythrasFatigue } from './fatigue'
import { ActorMythrasMovement } from './movement'
import { ActorMythrasStatTracker } from './stat-tracker'
/**
 * Mythras Actor object. Contains logic for preparing dynamic data on the sheet.
 * @extends {Actor}
 */
export class ActorMythras extends Actor<TokenDocument<ActorMythras>, ItemTypeMap> {
  public encumbrance!: ActorMythrasEncumbrance
  public fatigue!: ActorMythrasFatigue
  public movement!: ActorMythrasMovement
  public statTracker!: ActorMythrasStatTracker

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

  get maxActionPoints() {
    let base = Math.ceil((this.characteristics.int + this.characteristics.dex) / 12)
    return (
      base +
      this.attributeMiscMods.actionPoints +
      this.fatigue.currentLevel.actionPointsPenalty(base)
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
    let initiativeBonus = base + this.attributeMiscMods.initiativeBonus + this.fatigue.currentLevel.initiativePenalty(base)
    return initiativeBonus
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
    let data: any = this.system
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
    let data: any = this.system
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

  prepareData() {
    super.prepareData()
    this.encumbrance = new ActorMythrasEncumbrance(this)
    this.fatigue = new ActorMythrasFatigue(this)
    this.movement = new ActorMythrasMovement(this)
    this.statTracker = new ActorMythrasStatTracker(this)
    let data = this.system as any
    data.initiativeBonus = this.initiativeBonus
  }

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
