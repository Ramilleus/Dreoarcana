/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ActorSheetMythras extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return super.defaultOptions
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']

    //Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data)
    }

    return data
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor

    // Initialize containers.
    const gear = []
    const hitLocations = []
    const standardSkills = []
    const professionalSkills = []
    const combatStyles = []
    const magicSkills = []
    const passions = []
    const skillsAndPassions = []
    const meleeWeapons = []
    const rangedWeapons = []
    const armor = []
    const equipment = []
    const currency = []
    const abilities = []
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    }

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data
      i.img = i.img || DEFAULT_TOKEN
      // Append to gear.
      if (i.type === 'hitLocation') {
        hitLocations.push(i)
      } else if (i.type === 'standardSkill') {
        standardSkills.push(i)
        skillsAndPassions.push(i)
      } else if (i.type === 'professionalSkill') {
        professionalSkills.push(i)
        skillsAndPassions.push(i)
      } else if (i.type === 'combatStyle') {
        combatStyles.push(i)
        skillsAndPassions.push(i)
      } else if (i.type === 'magicSkill') {
        magicSkills.push(i)
        skillsAndPassions.push(i)
      } else if (i.type === 'passion') {
        passions.push(i)
        skillsAndPassions.push(i)
      } else if (i.type === 'melee-weapon') {
        meleeWeapons.push(i)
      } else if (i.type === 'ranged-weapon') {
        rangedWeapons.push(i)
      } else if (i.type === 'armor') {
        armor.push(i)
      } else if (i.type === 'equipment') {
        equipment.push(i)
      } else if (i.type === 'currency') {
        currency.push(i)
      }
      // Append to features.
      else if (i.type === 'ability') {
        abilities.push(i)
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i)
        }
      }
    }
    // Assign and return
    actorData.gear = gear
    actorData.hitLocations = hitLocations
    actorData.standardSkills = standardSkills
    actorData.professionalSkills = professionalSkills
    actorData.combatStyles = combatStyles
    actorData.magicSkills = magicSkills
    actorData.passions = passions
    actorData.skillsAndPassions = skillsAndPassions
    actorData.meleeWeapons = meleeWeapons
    actorData.rangedWeapons = rangedWeapons
    actorData.armor = armor
    actorData.equipment = equipment
    actorData.currency = currency
    actorData.abilities = abilities
    actorData.spells = spells
  }

  /* -------------------------------------------- */
  /** @override */
  _updateObject(event, formData) {
    const actor = this.getData().actor
    const skills = actor.skillsAndPassions
    const hitLocations = actor.hitLocations
    if (
      event.target != null &&
      event.target.id.includes('characteristic-box')
    ) {
      let affectedChar = event.target.id.slice(0, 3)
      skills.forEach((skill) => {
        let primChar = Number(
          formData['data.characteristics.' + skill.data.primaryChar + '.value']
        )
        let secondChar = Number(
          formData[
            'data.characteristics.' + skill.data.secondaryChar + '.value'
          ]
        )
        if (
          skill.data.primaryChar === affectedChar ||
          skill.data.secondaryChar === affectedChar
        ) {
          this.actor.updateEmbeddedEntity('OwnedItem', {
            _id: skill._id,
            'data.baseVal.value': primChar + secondChar,
            'data.totalVal':
              primChar +
              secondChar +
              Number(skill.data.trainingVal) +
              Number(skill.data.miscBonus)
          })
        }
      })
    }
    if (event.target != null && event.target.id.includes('_equipped')) {
      let armorInfo = event.target.id.split('_')
      let armor = this.actor.getOwnedItem(armorInfo[1])
      let equipped = formData['item.data.equipped']
      if (Array.isArray(equipped)) {
        equipped = equipped[armorInfo[0]]
      }
      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: armor._id,
        'data.equipped': equipped
      })
      let hitLoc = this.actor.getOwnedItem(armor.data.data.location)
      let armors = hitLoc.data.data.armors.split(',')
      let ap = hitLoc.data.data.ap
      let attached = {}
      if (Boolean(equipped)) {
        if (hitLoc.data.data.attached !== undefined) {
          attached = hitLoc.data.data.attached
        }
        attached[armor._id] = [armor.data.name, armor.data.data.ap]
        armors.push(armor.data.name)
        ap += armor.data.data.ap
      } else {
        delete attached[armor._id]
        armors = armors.filter(function (value) {
          return armor.data.name !== value
        })
        ap -= armor.data.data.ap
      }
      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: hitLoc._id,
        'data.armors': armors.join(','),
        'data.ap': ap,
        'data.attached': attached
      })
    }

    if (event.target != null && event.target.id.includes('_hitLoc')) {
      let fieldInfo = event.target.id.split('_')
      let hitLocIndex = fieldInfo[0]
      let hitLoc = this.actor.getOwnedItem(fieldInfo[1])
      let hitLocField = fieldInfo[2]
      let updateField = ''
      let newFieldValue = ''
      if (hitLocField === 'name') {
        updateField = 'name'
        newFieldValue = formData['item.name'][Number(hitLocIndex)]
      } else {
        updateField = 'data.' + hitLocField
        newFieldValue =
          formData['item.data.' + hitLocField][Number(hitLocIndex)]
      }
      console.log(updateField)
      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: hitLoc._id,
        [updateField]: newFieldValue
      })
    }
    if (
      event.target != null &&
      (event.target.id.includes('maxHpMod') ||
        event.target.id.includes('con_characteristic-box') ||
        event.target.id.includes('siz_characteristic-box'))
    ) {
      hitLocations.forEach((hitLoc, index) => {
        console.log(formData)

        let newHp =
          Number(hitLoc.data.baseHp) +
          Math.ceil(
            (Number(formData['data.characteristics.siz.value']) +
              Number(formData['data.characteristics.con.value'])) /
              5
          ) +
          Number(formData['data.attributes.hitPointMod.mod']) +
          Number(formData['item.data.maxHpMod'][index])
        if (newHp < 1) {
          newHp = 1
        }
        console.log(newHp)
        this.actor.updateEmbeddedEntity('OwnedItem', {
          _id: hitLoc._id,
          'data.maxHp': newHp
        })
        console.log(this.actor.getOwnedItem(hitLoc._id))
      })
    }

    return this.actor.update(formData)
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.getOwnedItem(li.data('itemId'))
      item.sheet.render(true)
    })

    // Delete Inventory Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      this.actor.deleteOwnedItem(li.data('itemId'))
      li.slideUp(200, () => this.render(false))
    })

    // rollableSkill abilities.
    html.find('.rollableSkill').click(this._onRollSkill.bind(this))

    html.find('.rollableMeleeDamage').click(this._onRollMeleeDamage.bind(this))

    html
      .find('.rollableRangedDamage')
      .click(this._onRollRangedDamage.bind(this))
    html.find('.roll-hitlocations-button').click(this._onRollHitLoc.bind(this))

    // Current Point Increase/Decrease
    html.find('#increase-current-lp').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.currentLuckPoints':
            Number(this.actor.data.data.currentLuckPoints) + 1
        })
      }.bind(this)
    )
    html.find('#increase-current-mp').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.currentMagicPoints':
            Number(this.actor.data.data.currentMagicPoints) + 1
        })
      }.bind(this)
    )
    html.find('#increase-current-er').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.experienceRolls':
            Number(this.actor.data.data.experienceRolls) + 1
        })
      }.bind(this)
    )

    html.find('#decrease-current-lp').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.currentLuckPoints':
            Number(this.actor.data.data.currentLuckPoints) - 1
        })
      }.bind(this)
    )
    html.find('#decrease-current-mp').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.currentMagicPoints':
            Number(this.actor.data.data.currentMagicPoints) - 1
        })
      }.bind(this)
    )
    html.find('#decrease-current-er').click(
      function (event) {
        event.preventDefault()
        this.actor.update({
          'data.experienceRolls':
            Number(this.actor.data.data.experienceRolls) - 1
        })
      }.bind(this)
    )

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = (ev) => this._onDragItemStart(ev)
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault()
    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
    // Initialize a default name.
    const name = `New ${type.capitalize().replace(/([a-z])([A-Z])/g, '$1 $2')}`
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data['type']
    // Finally, create the item!
    return this.actor.createOwnedItem(itemData)
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollSkill(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const dataLabel = dataset.label.split(',')
    const diffGrades = [2, 1.5, 1, 2 / 3, 0.5, 0.1].map(function (x) {
      return Math.ceil(x * Number(dataLabel[1]))
    })
    const diffNames = [
      'Very Easy: ',
      'Easy: ',
      'Standard: ',
      'Hard: ',
      'Formidable: ',
      'Herculean: '
    ]

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data)
      let label = dataset.label ? `Rolling ${dataLabel[0]}` : ''
      const rolled = roll.roll()
      let diffRolled = diffNames.map(function (x) {
        return '<strong>' + x + '</strong>' + rolled.result + ' <b>≤</b> '
      })
      let contentString =
        '<h3><strong>Roll: ' + rolled.result + '</strong></h3>'
      diffRolled.forEach((rollStr, index) => {
        contentString += rollStr + diffGrades[index] + '<br>'
      })
      let chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: contentString
      }
      ChatMessage.create(chatData)
    }
  }
  _onRollMeleeDamage(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const dataLabel = dataset.label.split(',')
    const name = dataLabel[0]
    const weaponDam = dataLabel[1]
    const damMod = dataLabel[2] === 'true'
    const combatEffect = dataLabel[3]
    const traits = dataLabel[4]
    if (dataset.roll) {
      if (damMod) {
        dataset.roll += '+' + this.actor.data.data.attributes.damageMod.value
      }
      let roll = new Roll(dataset.roll, this.actor.data.data)
      let label = dataset.label ? `Rolling ${name}` : ''
      label +=
        '<br><strong>Combat-Effects: </strong>' +
        combatEffect +
        '<br><strong>Traits: </strong>' +
        traits
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      })
    }
  }
  _onRollRangedDamage(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const dataLabel = dataset.label.split(',')
    const name = dataLabel[0]
    const weaponDam = dataLabel[1]
    const damMod = dataLabel[2] === 'true'
    const combatEffect = dataLabel[3]
    if (dataset.roll) {
      if (damMod) {
        dataset.roll += '+' + this.actor.data.data.attributes.damageMod.value
      }
      let roll = new Roll(dataset.roll, this.actor.data.data)
      let label = dataset.label ? `Rolling ${name}` : ''
      label += '<br><strong>Combat-Effects: </strong>' + combatEffect
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      })
    }
  }
  _onRollHitLoc(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const hitLoc = dataset.label.split(',')
    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data)
      const rolled = roll.roll()
      const rollResult = Number(rolled.result)
      let label = dataset.label ? `Rolling Hit Location` : ''
      const locHit = hitLoc.filter(function (value) {
        let loc = value.split('/')
        return rollResult >= Number(loc[1]) && rollResult <= Number(loc[2])
      })
      let loc = String(locHit).split('/')
      label += '<br><h2>' + loc[0] + '</h2>'
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      })
    }
  }
}
