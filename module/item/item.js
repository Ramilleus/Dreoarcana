import { updateSkillValues, skillTypes } from './skill-helper.js'
import { physicalItems } from '../actor/actor-helper.js'

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MythrasItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData()

    // Get the Item's data
    const itemData = this.data
    const itemType = itemData.type

    // Get the data of the actor that owns the item
    const actorData = this.actor ? this.actor.data : {}

    if (this.actor !== null) {
      if (skillTypes.includes(itemType)) {
        // Prepare skill data if item is a skill
        this._prepareSkillData(itemData, actorData)
      } else if (itemType === 'armor') {
        // Prepare armor data if item is armor
        this._prepareArmorData(itemData, actorData)
      } else if (itemType === 'hitLocation') {
        // Prepare hit location data if item is hit location
        this._prepareHitLocationData(itemData, actorData)
      } else if (itemType === 'storage') {
        // Prepare storage data if item is storage
        this._prepareStorageData(itemData, actorData)
      } else if (itemType === 'cultBrotherhood') {
        // Prepare cult/brotherhood data if item is cultBrotherhood
        this._prepareCultBrotherhoodData(itemData, actorData)
      }
      if(actorData!== undefined && actorData.items!== undefined
         && physicalItems.includes(itemType)) {
		let storageList = actorData.items.filter((item) => {
			return item.type == 'storage'
		})
		this._prepareStorageList(itemData, storageList)
      }
    }
  }

  /**
   * Prepare data specific to skill items
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareSkillData(itemData, actorData) {
    const data = itemData.data
    if (data.baseVal.init === 0) {
      updateSkillValues(itemData, actorData)
      // Set the base skill value initialization flag to 1, this way, this code only gets run once
      data.baseVal.init = 1
    }
    if(itemData.type === 'magicSkill') {
      this._prepareMagicSkillData(itemData, actorData)
    }
  }

  /**
   * Prepare data specific to magic skills
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareMagicSkillData(itemData, actorData) {
    const data = itemData.data
    let cultRank = 0
    let chaValue = 0
    let powValue = 0
    if(actorData !== undefined && actorData.items !==  undefined) {
      const cults = actorData.items.filter((item)=> item.data.type === 'cultBrotherhood')
      data.cults = cults
      if(data.cultId !== undefined) {
        const theCult = cults.find((item) => item.id === data.cultId)
        if(theCult !== undefined) {
            cultRank = Number(theCult.data.data.currentRank)
        }
      }
      chaValue = Number(actorData.data.characteristics["cha"].value)
      powValue = Number(actorData.data.characteristics["pow"].value)
    }
    switch (data.skillType) {
        case "TR":
            this._setTRMagicValues(data, data.totalVal)
            break;
        case "BI":
            this._setBIMagicValues(data, data.totalVal, cultRank, chaValue)
            break;
        case "ME":
            this._setMEMagicValues(data, data.totalVal)
            break;
        case "MY":
            this._setMYMagicValues(data, data.totalVal)
            break;
        case "IN":
            this._setINMagicValues(data, data.totalVal)
            break;
        case "SH":
            this._setSHMagicValues(data, data.totalVal)
            break;
        case "DE":
            this._setDEMagicValues(data, data.totalVal, cultRank, powValue)
            break;
        case "EX":
            this._setEXMagicValues(data, data.totalVal)
            break;
        default:
            this._setFMMagicValues(data, data.totalVal)
            break;
    }
  }

  /**
   * Set value for Folk Magic magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setFMMagicValues(data, skillValue) {
    data.intensity = {min: 1, max: 1, base: 1}
    data.magnitude = {min: 1, max: 1, base: 1}
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
  _setTRMagicValues(data, skillValue) {
    data.intensity = {min: 0, max: 0, base: 0}
    data.magnitude = {min: 0, max: 0, base: 0}
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
  _setBIMagicValues(data, skillValue, cultRank, chaValue) {
    data.intensity = {min: 0, max: 0, base: 0}
    data.magnitude = {min: 0, max: 0, base: 0}
    data.spiritBounded.max = Math.ceil(chaValue * cultRank / 4)
    data.maxSpiritBoundedPow = Math.ceil(skillValue * 3/10)
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Set value for Mediation magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setMEMagicValues(data, skillValue) {
    data.intensity = {min: 0, max: 0, base: 0}
    data.magnitude = {min: 0, max: 0, base: 0}
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
  _setMYMagicValues(data, skillValue) {
    data.intensity = {min: 1, max: Math.ceil(skillValue / 20), base: 1}
    data.magnitude = {min: 0, max: 0, base: 0}
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
  _setINMagicValues(data, skillValue) {
    data.intensity = {min: 1, max: Math.ceil(skillValue / 10), base: Math.ceil(skillValue / 10)}
    data.magnitude = {min: 0, max: 0, base: 0}
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
  _setSHMagicValues(data, skillValue) {
    data.intensity = {min: 0, max: 0, base: 0}
    data.magnitude = {min: 1, max: Math.ceil(skillValue / 10), base: 1}
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
  _setDEMagicValues(data, skillValue, cultRank, powValue) {
    data.intensity = {min: Math.ceil(skillValue / 10), max: Math.ceil(skillValue / 10), base: Math.ceil(skillValue / 10)}
    data.magnitude = {min: Math.ceil(skillValue / 10), max: Math.ceil(skillValue / 10), base: Math.ceil(skillValue / 10)}
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = Math.ceil(powValue * cultRank / 4)
  }

  /**
   * Set value for Exhort magic skill
   * @param {*} itemData data
   * @param {*} skillValue
   */
  _setEXMagicValues(data, skillValue) {
    data.intensity = {min: 0, max: 0, base: 0}
    data.magnitude = {min: 0, max: 0, base: 0}
    data.spiritBounded.max = 0
    data.maxSpiritBoundedPow = 0
    data.combinedTalentIntensity.max = 0
    data.maxShapingPoints = 0
    data.devotionalPool.max = 0
  }

  /**
   * Prepare data specific to cults/brotherhoods
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareCultBrotherhoodData(itemData, actorData) {
    const data = itemData.data
    switch (data.currentRank) {
        case "4":
          data.currentRankName = data.rankName4
          break
        case "3":
          data.currentRankName = data.rankName3
          break
        case "2":
          data.currentRankName = data.rankName2
          break
        case "1":
          data.currentRankName = data.rankName1
          break
        default:
          data.currentRankName = data.rankName0
          break
    }
  }

  /**
   * Prepare data specific to storage items
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareStorageData(itemData, actorData) {
    itemData.data.contentEncumbrance = 0
    itemData.data.contentValue = 0
    itemData.data.storageName = ""
    if(itemData.data.storage !== undefined && actorData!== undefined && actorData.items !== undefined) {
		let storage = actorData.items.find((item) => item.id === itemData.data.storage)
		if(storage !== undefined) {
			itemData.data.carried = storage.data.data.carried
		}
	}
  }

  /**
   * Prepare data specific to storage list
   * @param {*} itemData
   * @param {*} storageList
   */
  _prepareStorageList(itemData, storageList) {
	if(storageList != undefined) {
    	let storageName = ""
		let storage = storageList.find((item) => item.id === itemData.data.storage)
		if (storage != undefined) {
			storageName = storage.name
		}
		if(itemData.type === 'storage') {
			let otherStorages = storageList.filter((item) => item.id !== itemData._id)
			itemData.data.storageList = otherStorages
		}
		else {
			itemData.data.storageList = storageList
		}
		itemData.data.storageName = storageName
	}
  }

  /**
   * Prepare data specific to armor items
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareArmorData(itemData, actorData) {
    const data = itemData.data
    if (actorData != undefined) {
      data.hitLoc = actorData.items.filter(function (value) {
        return value.type === 'hitLocation'
      })
      if (data.location === 'Unequipped' && data.locationName.length > 0) {
        let hitlocID = data.hitLoc.filter(function (value) {
          return value.name === data.locationName
        })
        data.location = hitlocID[0].id
      }
      let hitLocName = data.hitLoc.filter(function (value) {
        return value.id === data.location
      })
      if (hitLocName.length > 0) {
        data.locationName = hitLocName[0].name
      }
    }
  }

  /**
   * Prepare data specific to hit location items
   * @param {*} itemData
   * @param {*} actorData
   */
  _prepareHitLocationData(itemData, actorData) {
    const data = itemData.data
    const id = itemData._id
    if (actorData != undefined) {
      let armors = actorData.items.filter(function (value) {
        return value.type === 'armor'
      })

      let armorEquipped = []
      let ap = 0
      armors.forEach(function (piece, index) {
        if (piece.data.data.location === id && piece.data.data.equipped) {
          armorEquipped.push(piece.name)
          ap += Number(piece.data.data.ap)
        }
      })
      data.armors = armorEquipped.join(', ')
      data.ap = Math.max(ap||0, data.naturalArmor||0)
      if (data.maxHp == 0) {
        data.maxHp =
          Number(data.baseHp) +
          Math.ceil(
            (Number(actorData.data.characteristics.siz.value) +
              Number(actorData.data.characteristics.con.value)) /
              5
          ) +
          Number(actorData.data.attributes.hitPointMod.mod) +
          Number(data.maxHpMod)
        if (data.maxHp < 1) {
          data.maxHp = 1
        }
      }
    }
  }

  // /**
  //  * Handle clickable rolls.
  //  * @param {Event} event   The originating click event
  //  * @private
  //  */
  // async roll() {
  //   // Basic template rendering data
  //   const item = this.data
  //   const actorData = this.actor ? this.actor.data.data : {}

  //   let roll = new Roll('d20+@abilities.str.mod', actorData)
  //   let label = `Rolling ${item.name}`
  //   roll.roll().toMessage({
  //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
  //     flavor: label
  //   })
  // }
}
