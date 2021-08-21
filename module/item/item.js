import { updateSkillValues, skillTypes } from './skill-helper.js'

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
        // Prepare hit location data is item is hit location
        this._prepareHitLocationData(itemData, actorData)
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
