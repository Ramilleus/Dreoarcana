import { updateSkillValues, skillTypes } from './skill-helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MythrasItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['mythras', 'sheet', 'item'],
      width: 495,
      height: 550,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  /** @override */
  get template() {
    const path = 'systems/mythras/templates/item'

    const itemType = this.item.data.type

    // Return a unique template based on item type
    if (itemType === 'combatStyle') {
      // Combat style is considered a skill, but has a unique sheet. This serves as an override
      return `${path}/item-combatStyle-sheet.html`
    } else if (skillTypes.includes(itemType)) {
      // Loads the default skill sheet that applies to all other skills
      return `${path}/item-skill-sheet.html`
    } else {
      // Loads a unique sheet for all remaining types (armor, melee-weapon, etc.)
      return `${path}/item-${itemType}-sheet.html`
    }
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData()
    return data
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 192
    sheetBody.css('height', bodyHeight)
    return position
  }

  /** @override */
  _updateObject(event, formData) {
    super._updateObject(event, formData)
    const itemData = this.item.data
    const itemType = itemData.type
    const actorData = this.actor ? this.actor.data : {}

    if (this.actor != null && event.target != null) {
      if (skillTypes.includes(itemType)) {
        this._updateSkill(itemData, actorData, formData, event)
      } else if (itemType === 'armor') {
        this._updateArmor(itemData, actorData, formData, event)
      }
    }
    return this.item.update(formData)
  }

  _updateSkill(itemData, actorData, formData, event) {
    const data = itemData.data
    switch (event.target.id) {
      case 'char-change':
        data.primaryChar = formData['data.primaryChar']
        data.secondaryChar = formData['data.secondaryChar']
        updateSkillValues(itemData, actorData)
        break
      case 'skill-mod':
        data.totalVal =
          data.baseVal.value +
          Number(formData['data.trainingVal']) +
          Number(formData['data.miscBonus'])
        break
      default:
    }
  }

  _updateArmor(itemData, actorData, formData, event) {
    const data = itemData.data
    if (event.target.id.includes('armorChange')) {
      // Get the hit location the armor is on
      let hitLoc = this.actor.getOwnedItem(String(data.location))
      // Run if equipped checkbox changes
      if (event.target.id.includes('equipped')) {
        this.toggleArmorEquipped(itemData, formData, hitLoc)
      } else if (
        (event.target.id.includes('ap') || event.target.id.includes('name')) &&
        hitLoc
      ) {
        this.updateArmorValues(itemData, formData, hitLoc)
      }
    }
  }

  toggleArmorEquipped(itemData, formData, hitLoc) {
    const data = itemData.data
    const id = itemData._id
    let attached = {}
    if (hitLoc.data.data.attached !== undefined) {
      attached = hitLoc.data.data.attached
    }

    if (Boolean(formData['data.equipped'])) {
      // If the armor is equipped, add it to list of armors attached to hit location
      attached[id] = [itemData.name, data.ap]
    } else {
      // If the armor is not equipped, remove it from list of armors attached to hit location
      delete attached[id]
    }

    // Get new list of armors attached to a hit location and total ap for that location
    let armors = []
    let ap = 0
    for (var key in attached) {
      armors.push(attached[key][0])
      ap += Number(attached[key][1])
    }

    // Update the hit location with the new armor list/ap total
    this.actor.updateEmbeddedEntity('OwnedItem', {
      _id: hitLoc._id,
      'data.armors': armors.join(','),
      'data.ap': ap,
      'data.attached': attached
    })
  }

  updateArmorValues(itemData, formData, hitLoc) {
    const data = itemData.data
    const id = itemData._id
    let attached = {}
    if (hitLoc.data.data.attached !== undefined) {
      attached = hitLoc.data.data.attached
    }

    if (Boolean(data.equipped)) {
      attached[id] = [formData['name'], data.ap]
      let armors = []
      let ap = 0
      for (var key in attached) {
        armors.push(attached[key][0])
        ap += Number(attached[key][1])
      }

      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: hitLoc._id,
        'data.armors': armors.join(','),
        'data.ap': ap,
        'data.attached': attached
      })
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    let itemData = this.item.data.data
    let itemType = this.item.data.type
    if (
      itemType === 'standardSkill' ||
      itemType === 'professionalSkill' ||
      itemType === 'combatStyle' ||
      itemType === 'magicSkill' ||
      itemType === 'passion'
    ) {
      if (
        (itemData.primaryChar + itemData.secondaryChar).includes('str') ||
        (itemData.primaryChar + itemData.secondaryChar).includes('dex')
      ) {
        html.find('.char-enc')[0].checked = true
      } else {
        html.find('.char-enc')[0].checked = false
      }
    }

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return
  }
}
