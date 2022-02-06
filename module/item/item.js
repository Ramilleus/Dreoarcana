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
    if(itemData.type === 'magicSkill' && actorData !== undefined && actorData.items !==  undefined) {
      const cults = actorData.items.filter((item)=> item.data.type === 'cultBrotherhood')
      itemData.data.cults = cults
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
