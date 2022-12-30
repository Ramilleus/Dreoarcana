import { SkillMythras } from '@item/skill'

export class MagicSkillMythras extends SkillMythras {
  isMagicSkill: boolean = true

  get intensity() {
    return (this.system as any).intensity.max
  }

  get magnitude() {
    return (this.system as any).magnitude.max
  }

  override prepareData(): void {
    super.prepareData()

    const system: any = this.system
    const actorData: any = this.actor ? this.actor.system : {}
    
    let cultRank = 0
    let chaValue = 0
    let powValue = 0
    if (actorData !== undefined && actorData.items !== undefined) {
      const cults = actorData.items.filter(
        (item: any) => item.type === 'cultBrotherhood'
      )
      system.cults = cults
      if (system.cultId !== undefined) {
        const theCult = cults.find((item: any) => item.id === system.cultId)
        if (theCult !== undefined) {
          cultRank = Number(theCult.data.data.currentRank)
        }
      }
      chaValue = Number(actorData.characteristics['cha'].value)
      powValue = Number(actorData.characteristics['pow'].value)
    }
    switch (system.skillType) {
      case 'TR':
        this._setTRMagicValues(system, this.totalVal)
        break
      case 'BI':
        this._setBIMagicValues(system, this.totalVal, cultRank, chaValue)
        break
      case 'ME':
        this._setMEMagicValues(system, this.totalVal)
        break
      case 'MY':
        this._setMYMagicValues(system, this.totalVal)
        break
      case 'IN':
        this._setINMagicValues(system, this.totalVal)
        break
      case 'SH':
        this._setSHMagicValues(system, this.totalVal)
        break
      case 'DE':
        this._setDEMagicValues(system, this.totalVal, cultRank, powValue)
        break
      case 'EX':
        this._setEXMagicValues(system, this.totalVal)
        break
      default:
        this._setFMMagicValues(system, this.totalVal)
        break
    }
  }

  /**
   * Set value for Folk Magic magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setFMMagicValues(data: any, skillValue: any) {
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
  _setTRMagicValues(data: any, skillValue: any) {
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
  _setBIMagicValues(data: any, skillValue: any, cultRank: any, chaValue: any) {
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
  _setMEMagicValues(data: any, skillValue: any) {
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
  _setMYMagicValues(data: any, skillValue: any) {
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
  _setINMagicValues(data: any, skillValue: any) {
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
  _setSHMagicValues(data: any, skillValue: any) {
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
  _setDEMagicValues(data: any, skillValue: any, cultRank: any, powValue: any) {
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
  _setEXMagicValues(data: any, skillValue: any) {
    data.intensity = { min: 0, max: 0, base: 0 }
    data.magnitude = { min: 0, max: 0, base: 0 }
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }
}
