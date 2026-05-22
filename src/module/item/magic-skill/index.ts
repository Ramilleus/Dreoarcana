import { SkillData, SkillMythras } from '@item/skill'
import { ActorData, ActorMythras } from '@module/actor/base'
import { ItemMythras } from '../base'
import { CultBrotherhoodMythras } from '../cult-brotherhood'
import { itemIsCultBrotherhood } from '../type-guards'

interface MagicSkillAttribute {
  min?: number
  max: number
  base?: number
  used?: number
}

interface MagicSkillData extends SkillData {
  cults: CultBrotherhoodMythras[]
  cultId: string
  skillType: string
  intensity: MagicSkillAttribute
  magnitude: MagicSkillAttribute
  spiritBounded: MagicSkillAttribute
  combinedTalentIntensity: MagicSkillAttribute
  devotionalPool: MagicSkillAttribute
  maxSpiritBoundedPow: number
  maxShapingPoints: number
}

interface MagicSkillMythras {
  readonly system: MagicSkillData
}

class MagicSkillMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends SkillMythras<TParent> {
  isMagicSkill: boolean = true

  get intensity() {
    return this.system.intensity.max
  }

  get magnitude() {
    return this.system.magnitude.max
  }

override prepareData(): void {
  super.prepareData();

  const system = this.system;
  const actorData = this.actor?.system ?? { characteristics: {} } as ActorData;
  const actorItemData = this.actor ? Array.from(this.actor.items.values()) : [] as ItemMythras[];

  let cultRank = 0;
  let chaValue = Number(actorData.characteristics?.['cha']?.value ?? 0);
  let powValue = Number(actorData.characteristics?.['pow']?.value ?? 0);

  if (actorItemData.length > 0) {
    const cults: CultBrotherhoodMythras[] = actorItemData.filter(
      itemIsCultBrotherhood
    ) as CultBrotherhoodMythras[];
    system.cults = cults;

    if (system.cultId) {
      const theCult = cults.find(item => item.id === system.cultId);
      if (theCult) {
        cultRank = Number(theCult.system.currentRank ?? 0);
      }
    }
  } else {
    system.cults = [];
  }

  switch (system.skillType) {
    case 'TR': this._setTRMagicValues(system, this.totalVal); break;
    case 'BI': this._setBIMagicValues(system, this.totalVal, cultRank, chaValue); break;
    case 'ME': this._setMEMagicValues(system, this.totalVal); break;
    case 'MY': this._setMYMagicValues(system, this.totalVal); break;
    case 'IN': this._setINMagicValues(system, this.totalVal); break;
    case 'SH': this._setSHMagicValues(system, this.totalVal); break;
    case 'DE': this._setDEMagicValues(system, this.totalVal, cultRank, powValue); break;
    case 'EX': this._setEXMagicValues(system, this.totalVal); break;
    default: this._setFMMagicValues(system, this.totalVal); break;
  }
}

  /**
   * Set value for Folk Magic magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setFMMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 1, max: 1, base: 1 }
    data.magnitude = { min: 1, max: 1, base: 1 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Trance magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setTRMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Binding magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   * @param {*} cult rank
   * @param {*} charisma Value
   */
  _setBIMagicValues(data: MagicSkillData, skillValue: number, cultRank: number, chaValue: number) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = Math.ceil((chaValue * cultRank) / 4)
    data.maxSpiritBoundedPow = Math.ceil((skillValue * 3) / 10)
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Mediation magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setMEMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = Math.ceil(skillValue / 10)
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Mysticism magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setMYMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 1, max: Math.ceil(skillValue / 20), base: 1 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Invocation magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setINMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = {
      min: 1,
      max: Math.ceil(skillValue / 10),
      base: Math.ceil(skillValue / 10)
    }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Shaping magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setSHMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 1, max: Math.ceil(skillValue / 10), base: 1 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = Math.ceil(skillValue / 10)
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Devotion magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   * @param {*} cult rank
   * @param {*} power Value
   */
  _setDEMagicValues(data: MagicSkillData, skillValue: number, cultRank: number, powValue: number) {
    data.intensity = {
      min: Math.ceil(skillValue / 10),
      max: Math.ceil(skillValue / 10),
      base: Math.ceil(skillValue / 10)
    }
    data.magnitude = {
      min: Math.ceil(skillValue / 10),
      max: Math.ceil(skillValue / 10),
      base: Math.ceil(skillValue / 10)
    }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = Math.ceil((powValue * cultRank) / 4)
  }

  /**
   * Set value for Exhort magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setEXMagicValues(data: MagicSkillData, skillValue: number) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }
}

export { MagicSkillData, MagicSkillMythras }