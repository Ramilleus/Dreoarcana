import { SkillMythras } from '@item/skill'

export class MagicSkillMythras extends SkillMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}
    
    const data = itemData.data
    let cultRank = 0
    let chaValue = 0
    let powValue = 0
    if (actorData !== undefined && actorData.items !== undefined) {
      const cults = actorData.items.filter(
        (item: any) => item.data.type === 'cultBrotherhood'
      )
      data.cults = cults
      if (data.cultId !== undefined) {
        const theCult = cults.find((item: any) => item.id === data.cultId)
        if (theCult !== undefined) {
          cultRank = Number(theCult.data.data.currentRank)
        }
      }
      chaValue = Number(actorData.data.characteristics['cha'].value)
      powValue = Number(actorData.data.characteristics['pow'].value)
    }
    switch (data.skillType) {
      case 'TR':
        this._setTRMagicValues(data, data.totalVal)
        break
      case 'BI':
        this._setBIMagicValues(data, data.totalVal, cultRank, chaValue)
        break
      case 'ME':
        this._setMEMagicValues(data, data.totalVal)
        break
      case 'MY':
        this._setMYMagicValues(data, data.totalVal)
        break
      case 'IN':
        this._setINMagicValues(data, data.totalVal)
        break
      case 'SH':
        this._setSHMagicValues(data, data.totalVal)
        break
      case 'DE':
        this._setDEMagicValues(data, data.totalVal, cultRank, powValue)
        break
      case 'EX':
        this._setEXMagicValues(data, data.totalVal)
        break
      default:
        this._setFMMagicValues(data, data.totalVal)
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
