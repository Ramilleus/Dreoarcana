import { ArmorMythras } from '@item/armor/index.js'
import { MYTHRASCONFIG } from '@scripts/config'
import { ActorAttributes } from './attribute'
import { ActorCharacteristics } from './characteristic'
import { ActorMythrasEncumbrance } from './encumbrance'
import { ActorMythrasFatigue } from './fatigue'
import { ActorMythrasMovement } from './movement'
import { ActorMythrasStatTracker } from './stat-tracker'
import { TokenDocumentMythras } from '@module/scene/token-document/document'
import { type SkillMythras } from '@item/skill'; // Type-only import to avoid circular reference.



interface ActorData {
  initiativeBonus: number
  attributes: ActorAttributes
  characteristics: ActorCharacteristics
  height: number
  spellFilterOption: string
  items: ItemTypeMap
  equipmentFilterOption: string
}

interface ActorMythras {
  readonly system: ActorData
}


/**
 * Mythras Actor object. Contains logic for preparing dynamic data on the sheet.
 * @extends {Actor}
 */
class ActorMythras<TParent extends TokenDocumentMythras | null = TokenDocumentMythras | null> extends Actor<TParent> {
  public encumbrance!: ActorMythrasEncumbrance
  public fatigue!: ActorMythrasFatigue
  public movement!: ActorMythrasMovement
  public statTracker!: ActorMythrasStatTracker

  constructor(data: any, context: any = {}) {
    if (context.mythras?.ready) {
      super(data, context)
    } else {
      foundry.utils.mergeObject(context, { mythras: { ready: true } })
      const documentClasses = CONFIG.MYTHRAS.Actor.documentClasses
      let type: keyof typeof documentClasses = data.type
      const ActorConstructor = documentClasses[type]
      return ActorConstructor
        ? new ActorConstructor(data, context)
        : new ActorMythras(data, context)
    }
  }
  override get itemTypes(){
    return super.itemTypes as ItemTypeMap
  }
  // Attribute getters

  get armorPenalty() {
    //@ts-ignore
    let equippedArmor: ArmorMythras[] = this.items.filter(function (item: any) {
      return item.type === 'armor' && item.isEquipped && item.isArmor
    })
    let totalArmorEncumbrance = equippedArmor.reduce(
      (weight: number, armor: ArmorMythras) => weight + Number(armor.encumbrance),
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
    let initiativeBonus = base + this.attributeMiscMods.initiativeBonus + this.fatigue.currentLevel.initiativePenalty(base) - this.armorPenalty
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

  get sortedSkills(): SkillMythras[] {
    const skillTypes = [
      'standardSkill',
      'professionalSkill',
      'combatStyle',
      'magicSkill',
      'passion'
    ];

    return skillTypes.flatMap(t => {
      return this.items
        .filter(i => i.type === t)
        .map(i => i as unknown as SkillMythras)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    });
  }

  // Actor attribute misc modifier convenience getter
  get attributeMiscMods() {
    return {
      actionPoints: Number(this.system.attributes.actionPoints.mod) || 0,
      damageMod: Number(this.system.attributes.damageMod.mod) || 0,
      experienceMod: Number(this.system.attributes.experienceMod.mod) || 0,
      healingRate: Number(this.system.attributes.healingRate.mod) || 0,
      initiativeBonus: Number(this.system.attributes.initiativeBonus.mod) || 0,
      luckPoints: Number(this.system.attributes.luckPoints.mod) || 0,
      magicPoints: Number(this.system.attributes.magicPoints.mod) || 0,
      tenacity: Number(this.system.attributes.tenacity.mod) || 0
    }
  }

  // Actor characteristics mod convenience getter
  get characteristicsMod() {
    return {
      str: Number(this.system.characteristics.str.mod),
      con: Number(this.system.characteristics.con.mod),
      siz: Number(this.system.characteristics.siz.mod),
      dex: Number(this.system.characteristics.dex.mod),
      int: Number(this.system.characteristics.int.mod),
      pow: Number(this.system.characteristics.pow.mod),
      cha: Number(this.system.characteristics.cha.mod)
    }
  }

  // Actor characteristics convenience getter
  get characteristics() {
    return {
      str: Number(this.system.characteristics.str.value) + this.characteristicsMod.str,
      con: Number(this.system.characteristics.con.value) + this.characteristicsMod.con,
      siz: Number(this.system.characteristics.siz.value) + this.characteristicsMod.siz,
      dex: Number(this.system.characteristics.dex.value) + this.characteristicsMod.dex,
      int: Number(this.system.characteristics.int.value) + this.characteristicsMod.int,
      pow: Number(this.system.characteristics.pow.value) + this.characteristicsMod.pow,
      cha: Number(this.system.characteristics.cha.value) + this.characteristicsMod.cha
    }
  }

  // static override async create(data: any, context: any): Promise<any> {
  //   return super.create(data, context)
  // }

  prepareData() {
    super.prepareData()

    this.encumbrance = new ActorMythrasEncumbrance(this)
    this.fatigue = new ActorMythrasFatigue(this)
    this.movement = new ActorMythrasMovement(this)
    this.statTracker = new ActorMythrasStatTracker(this)
    this.system.initiativeBonus = this.initiativeBonus
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
  [K in ItemType]: InstanceType<ConfigMythras["MYTHRAS"]["Item"]["documentClasses"][K]>[];

};

export { ActorData, ActorMythras }