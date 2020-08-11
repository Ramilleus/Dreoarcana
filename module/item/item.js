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
    const actorData = this.actor ? this.actor.data : {}
    const data = itemData.data

    if (
      (itemType === 'standardSkill' ||
        itemType === 'professionalSkill' ||
        itemType === 'combatStyle' ||
        itemType === 'magicSkill' ||
        itemType === 'passion') &&
      this.actor !== null &&
      itemData.data.baseVal.init === 0
    ) {
      let primChar = Number(
        eval(
          'actorData.data.characteristics.' +
            itemData.data.primaryChar +
            '.value'
        )
      )
      let secondChar = Number(
        eval(
          'actorData.data.characteristics.' +
            itemData.data.secondaryChar +
            '.value'
        )
      )
      itemData.data.baseVal.init = 1
      itemData.data.baseVal.value = primChar + secondChar
      itemData.data.totalVal =
        itemData.data.baseVal.value +
        Number(itemData.data.trainingVal) +
        Number(itemData.data.miscBonus)
    }
    if (itemType === 'armor' && this.actor !== null) {
      itemData.data.hitLoc = actorData.data.hitLoc
      if (itemData.data.hitLoc[0].location !== 'Unequipped') {
        itemData.data.hitLoc.unshift({
          location: 'Unequipped'
        })
      }
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token
    const item = this.data
    const actorData = this.actor ? this.actor.data.data : {}
    const itemData = item.data

    let roll = new Roll('d20+@abilities.str.mod', actorData)
    let label = `Rolling ${item.name}`
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    })
  }
}
