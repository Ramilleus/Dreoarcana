import { skillTypes } from '../../item/skill-helper.js'
import { fatigueInfo } from '../actor-helper.js'
import { doesTypeHaveTemplate } from '../actor-helper.js'
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ActorSheetMythras extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: ['.item'], dropSelector: null }]
    })
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
	const storages = []
	const cults = []
    const abilities = []

    const itemMapper = {
      hitLocation: hitLocations,
      standardSkill: standardSkills,
      professionalSkill: professionalSkills,
      combatStyle: combatStyles,
      magicSkill: magicSkills,
      passion: passions,
      'melee-weapon': meleeWeapons,
      'ranged-weapon': rangedWeapons,
      armor: armor,
      equipment: equipment,
      currency: currency,
      ability: abilities,
      storage: storages,
      cultBrotherhood: cults
    }

	let x = 0
    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of this.actor.items.values()) {
      let item = i.data
      //i.img = i.img || DEFAULT_TOKEN

      itemMapper[i.type].push(i)
      if (skillTypes.includes(i.type)) {
        skillsAndPassions.push(i)
      }
    }

    // Assign and return
    actorData.gear = gear
    hitLocations.sort(function (a, b) {
      return a.data.data.rollRangeStart - b.data.data.rollRangeStart
    })
    actorData.hitLocations = hitLocations
    standardSkills.sort(function (a, b) {
      return a.data.name.localeCompare(b.data.name)
    })
    actorData.standardSkills = standardSkills
    professionalSkills.sort(function (a, b) {
      return a.data.name.localeCompare(b.data.name)
    })
    actorData.professionalSkills = professionalSkills
    actorData.combatStyles = combatStyles
    magicSkills.sort(function (a, b) {
      return a.data.name.localeCompare(b.data.name)
    })
    actorData.magicSkills = magicSkills
    actorData.passions = passions
    actorData.skillsAndPassions = skillsAndPassions
    actorData.meleeWeapons = meleeWeapons
    actorData.rangedWeapons = rangedWeapons
    actorData.armor = armor
    actorData.equipment = equipment
    actorData.currency = currency
    storages.sort(function (a, b) {
      return a.data.name.localeCompare(b.data.name)
    })
    actorData.storages = storages
    cults.sort(function (a, b) {
      return a.data.name.localeCompare(b.data.name)
    })
    actorData.cults = cults
    actorData.abilities = abilities
  }

  /* -------------------------------------------- */
  /** @override */
  _updateObject(event, formData) {
    const actor = this.getData().actor
    const skills = actor.skillsAndPassions
    const hitLocations = actor.hitLocations
    if (event.target != null) {
      if (event.target.id.includes('characteristic-box')) {
        let affectedChar = event.target.id.slice(0, 3)
        skills.forEach((skill) => {
          let primChar = Number(
            formData[
              'data.characteristics.' + skill.data.data.primaryChar + '.value'
            ]
          )
          let secondChar = Number(
            formData[
              'data.characteristics.' + skill.data.data.secondaryChar + '.value'
            ]
          )
          if (
            skill.data.data.primaryChar === affectedChar ||
            skill.data.data.secondaryChar === affectedChar
          ) {
            this.actor.updateEmbeddedDocuments('Item', [
              {
                _id: skill.id,
                'data.data.baseVal.value': primChar + secondChar,
                'data.data.totalVal':
                  primChar +
                  secondChar +
                  Number(skill.data.data.trainingVal) +
                  Number(skill.data.data.miscBonus)
              }
            ])
          }
        })
      }

      if (event.target.id.includes('_equipped')) {
        let armorInfo = event.target.id.split('_')
        let armor = this.actor.items.get(armorInfo[1])
        let equipped = formData['item.data.data.equipped']
        if (Array.isArray(equipped)) {
          equipped = equipped[armorInfo[0]]
        }
        this.actor.updateEmbeddedDocuments('Item', [
          {
            _id: armor.id,
            'data.equipped': equipped
          }
        ])
      }

      if (event.target.id.includes('_carried')) {
        let thingInfo = event.target.id.split('_')
        let thing = this.actor.items.get(thingInfo[1])
        let carried = formData['item.'+thing.id+'.carried']
        if (Array.isArray(carried)) {
          carried = carried[thingInfo[0]]
        }
        this.actor.updateEmbeddedDocuments('Item', [
          {
            _id: thing.id,
            'data.carried': carried
          }
        ])
      }

      if (event.target.id.includes('_hitLoc')) {
        let fieldInfo = event.target.id.split('_')
        let hitLocIndex = fieldInfo[0]
        let hitLoc = this.actor.items.get(fieldInfo[1])
        let hitLocField = fieldInfo[2]
        let updateField = ''
        let newFieldValue = ''
        if (hitLocField === 'name') {
          updateField = 'name'
          newFieldValue = formData['item.data.name'][Number(hitLocIndex)]
        } else {
          updateField = 'data.' + hitLocField
          newFieldValue =
            formData['item.data.data.' + hitLocField][Number(hitLocIndex)]
        }
        this.actor.updateEmbeddedDocuments('Item', [
          {
            _id: hitLoc.id,
            [updateField]: newFieldValue
          }
        ])
      }
      if (
        event.target.id.includes('maxHpMod') ||
        event.target.id.includes('con_characteristic-box') ||
        event.target.id.includes('siz_characteristic-box')
      ) {
        hitLocations.forEach((hitLoc, index) => {
          let newHp =
            Number(hitLoc.data.data.baseHp) +
            Math.ceil(
              (Number(formData['data.characteristics.siz.value']) +
                Number(formData['data.characteristics.con.value'])) /
                5
            ) +
            Number(formData['data.attributes.hitPointMod.mod']) +
            Number(formData['item.data.data.maxHpMod'][index])
          if (newHp < 1) {
            newHp = 1
          }
          this.actor.updateEmbeddedDocuments('Item', [
            {
              _id: hitLoc.id,
              'data.data.maxHp': newHp,
              'data.data.maxHpMod': formData['item.data.data.maxHpMod'][index]
            }
          ])
        })
      }
    }

    return this.actor.update(formData)
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    const actor = this.actor

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    // Add Actor Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Actor Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = actor.items.get(li.data('itemId'))
      item.sheet.render(true)
    })

    // html.find('.skill-alpha-sort').click((ev) => {
    //   let data = this.getData()
    //   if (ev.currentTarget.id == 'professional-alpha-sort') {
    //   }
    // })

    // Delete Actor Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      let item = actor.items.get(li.data('itemId'))

      new Dialog({
        title: 'Delete',
        content: `Are you sure you want to delete ${item.data.name}`,
        buttons: {
          ok: {
            label: 'Yes',
            callback: async (html) => {
              item.delete()
            }
          },
          cancel: {
            label: 'Cancel'
          }
        }
      }).render(true)
      li.slideUp(200, () => this.render(false))
    })

    // Skill roll button listener
    html.find('.rollableSkill').click(this._onRollSkill.bind(this))

    // Melee Weapon roll button listener
    html.find('.rollableMeleeDamage').click(this._onRollMeleeDamage.bind(this))

    // Ranged Weapon roll button listener
    html
      .find('.rollableRangedDamage')
      .click(this._onRollRangedDamage.bind(this))

    // Hit Location roll button listener
    html.find('.roll-hitlocations-button').click(this._onRollHitLoc.bind(this))

    //Actor Point Minimizer
    // const pointToggle = [
    //   '#toggle-lp',
    //   '#toggle-mp',
    //   '#toggle-tp',
    //   '#toggle-ap',
    //   '#toggle-er'
    // ]
    // pointToggle.forEach((value) => {
    //   html.find(value).click(function (event) {
    //     event.preventDefault()
    //     const label = document.querySelector(value)
    //     const parent = label.parentNode
    //     const bubble = parent.querySelector('.number-input-container')
    //     if (bubble.classList.contains('hidden')) {
    //       bubble.classList.remove('hidden')
    //       label.classList.remove('sideways-text')
    //     } else {
    //       bubble.classList.add('hidden')
    //       label.classList.add('sideways-text')
    //     }
    //   })
    // })
    const pointToggleMap = {
      '#toggle-lp': 'luckPoints',
      '#toggle-mp': 'magicPoints',
      '#toggle-tp': 'tenacity',
      '#toggle-ap': 'actionPoints',
      '#toggle-er': 'experienceRoll'
    }
    for (const [key, value] of Object.entries(pointToggleMap)) {
      html.find(key).click(function (event) {
        event.preventDefault()
        const label = document.querySelector(key)
        const parent = label.parentNode
        const bubble = parent.querySelector('.number-input-container')
        if (bubble.classList.contains('hidden')) {
          actor.update({
            ['data.attributes.' + value + '.minimize']: 0
          })
          // bubble.classList.remove('hidden')
          // label.classList.remove('sideways-text')
        } else {
          actor.update({
            ['data.attributes.' + value + '.minimize']: 1
          })
          // bubble.classList.add('hidden')
          // label.classList.add('sideways-text')
        }
      })
    }
    // Actor Current Point increase listeners
    const pointIncreaseMapping = {
      '#increase-current-lp': 'luckPoints',
      '#increase-current-mp': 'magicPoints',
      '#increase-current-tp': 'tenacity',
      '#increase-current-ap': 'actionPoints',
      '#increase-current-er': 'experienceRolls'
    }
    for (const [key, value] of Object.entries(pointIncreaseMapping)) {
      html.find(key).click(function (event) {
        event.preventDefault()
        if (value == 'experienceRolls') {
          actor.update({
            ['data.' + value]: Number(actor.data.data[value]) + 1
          })
        } else {
          actor.update({
            ['data.attributes.' + value + '.value']:
              Number(actor.data.data.attributes[value].value) + 1
          })
        }
      })
    }

    // Actor Current Point decrease listenerss
    const pointDecreaseMapping = {
      '#decrease-current-lp': 'luckPoints',
      '#decrease-current-mp': 'magicPoints',
      '#decrease-current-tp': 'tenacity',
      '#decrease-current-ap': 'actionPoints',
      '#decrease-current-er': 'experienceRolls'
    }
    for (const [key, value] of Object.entries(pointDecreaseMapping)) {
      html.find(key).click(function (event) {
        event.preventDefault()
        if (value == 'experienceRolls') {
          actor.update({
            ['data.' + value]: Number(actor.data.data[value]) - 1
          })
        } else {
          actor.update({
            ['data.attributes.' + value + '.value']:
              Number(actor.data.data.attributes[value].value) - 1
          })
        }
      })
    }

    // Drag events for macros.
    if (actor.isOwner) {
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
    var name = `New ${type.capitalize().replace(/([a-z])([A-Z])/g, '$1 $2')}`
    if (game.i18n) {
      name = game.i18n.localize(`MYTHRAS.New_${type}`)
    }
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data['type']
    // Finally, create the item!
    return Item.create(itemData, { parent: this.actor })
  }

  _rollSkillAlt(event) {
    event.preventDefault()
    let skills = this.actor.items.filter(function (value) {
      return doesTypeHaveTemplate(value.data.type, 'skill')
    })
    let skillSelect = `<select id="skill-mod">`
    skills.forEach((skill, index) => {
      skillSelect += `<option value="${skill.data.name},${skill.data.data.totalVal}">${skill.data.name}</option>`
    })
    skillSelect += '</select>'
    if (event.ctrlKey) {
      new Dialog({
        title: 'Epic Dropdown Test',
        content: skillSelect,
        buttons: {
          ok: {
            label: 'Roll',
            callback: async (html) => {}
          },
          cancel: {
            label: 'Cancel'
          }
        }
      }).render(true)
    }
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
    let diffNames = [
      'Very Easy: ',
      'Easy: ',
      'Standard: ',
      'Hard: ',
      'Formidable: ',
      'Herculean: '
    ]
    if (game.i18n) {
      diffNames = [
        game.i18n.localize('MYTHRAS.very_easy_dif') + ': ',
        game.i18n.localize('MYTHRAS.easy_dif') + ': ',
        game.i18n.localize('MYTHRAS.standard_dif') + ': ',
        game.i18n.localize('MYTHRAS.hard_dif') + ': ',
        game.i18n.localize('MYTHRAS.formidable_dif') + ': ',
        game.i18n.localize('MYTHRAS.herculean_dif') + ': '
      ]
    }
    let fatigueValue = this.actor.data.data.attributes.fatigue.value
    let fatigueMessage = `<strong>Fatigue Modifier:</strong> ${fatigueInfo[fatigueValue]['Skill Grade']}`

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data)
      let label = dataset.label ? `Rolling ${dataLabel[0]}` : ''
      if (game.i18n) {
        label = dataset.label
          ? game.i18n.localize('MYTHRAS.Rolling') + ` ${dataLabel[0]}`
          : ''
      }

      const rolled = roll.roll()
      let contentString = `<h4>${fatigueMessage}</h4><p>
      <table>
       <tr>
         <th>Difficulty</th>
         <th>Roll</th>
         <th>    </th>
         <th>Skill %</th>
         <th>Result</th>
         
       </tr>`

      if (game.i18n) {
        contentString = `<h4>${fatigueMessage}</h4><p>
        <table>
         <tr>
           <th>${game.i18n.localize('MYTHRAS.Difficulty')}</th>
           <th>${game.i18n.localize('MYTHRAS.Roll')}</th>
           <th>    </th>
           <th>${game.i18n.localize('MYTHRAS.Skill')} %</th>
           <th>${game.i18n.localize('MYTHRAS.Result')}</th>
         
         </tr>`
      }
      rolled.then((result) => {
        contentString = this.rollTableString(
          diffNames,
          diffGrades,
          result,
          contentString
        )
        contentString += `</table></p>`
        roll.toMessage({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: contentString
        })
      })
    }
  }
  rollTableString(diffNames, diffGrades, rolled, contentString) {
    diffNames.forEach((name, index) => {
      let resultString = ''
      if (rolled.result >= 95) {
        if (
          rolled.result == 100 ||
          (rolled.result == 99 && diffGrades[index] <= 100)
        ) {
          resultString = " <span style='color:darkred;'> <b>FUMBLE!</b></span>"
          if (game.i18n) {
            resultString =
              " <span style='color:darkred;'> <b>" +
              game.i18n.localize('MYTHRAS.FUMBLE!') +
              '</b></span>'
          }
        } else {
          resultString = " <span style='color:red;'> <b>FAILURE!</b></span>"
          if (game.i18n) {
            resultString =
              " <span style='color:red;'> <b>" +
              game.i18n.localize('MYTHRAS.FAILURE!') +
              '</b></span>'
          }
        }
      } else if (rolled.result <= 5) {
        if (
          rolled.result == 1 ||
          rolled.result <= Math.ceil(diffGrades[index] * 0.1)
        ) {
          resultString =
            " <span style='color:goldenrod;'> <b>CRITICAL!</b></span>"
          if (game.i18n) {
            resultString =
              " <span style='color:goldenrod;'> <b>" +
              game.i18n.localize('MYTHRAS.CRITICAL!') +
              '</b></span>'
          }
        } else {
          resultString = " <span style='color:green;'> <b>SUCCESS!</b></span>"
          if (game.i18n) {
            resultString =
              " <span style='color:green;'> <b>" +
              game.i18n.localize('MYTHRAS.SUCCESS!') +
              '</b></span>'
          }
        }
      } else {
        if (rolled.result <= Math.ceil(diffGrades[index] * 0.1)) {
          resultString =
            " <span style='color:goldenrod;'> <b>CRITICAL!</b></span>"
          if (game.i18n) {
            resultString =
              " <span style='color:goldenrod;'> <b>" +
              game.i18n.localize('MYTHRAS.CRITICAL!') +
              '</b></span>'
          }
        } else {
          resultString = `${
            rolled.result <= diffGrades[index]
              ? " <span style='color:green;'> <b>SUCCESS!</b></span>"
              : " <span style='color:red;'> <b>FAILURE!</b></span>"
          }`
          if (game.i18n) {
            resultString = `${
              rolled.result <= diffGrades[index]
                ? " <span style='color:green;'> <b>" +
                  game.i18n.localize('MYTHRAS.SUCCESS!') +
                  '</b></span>'
                : " <span style='color:red;'> <b>" +
                  game.i18n.localize('MYTHRAS.FAILURE!') +
                  '</b></span>'
            } `
          }
        }
      }
      contentString += `<tr>
      <td><b>${name}</b></td>
      <td>[[${rolled.result}]]</td>
      <td> ≤ </td>
      <td>[[${diffGrades[index]}]]</td>
      <td>${resultString}</td>
      </tr> `
    })
    return contentString
  }
  _onRollMeleeDamage(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const weapon = this.actor.items.get(dataset.label)
    const damMod = weapon.data.data.damageModifier
    const combatEffect = weapon.data.data['combat-effects']
    const traits = weapon.data.data.traits
    const size = weapon.data.data.size
    const reach = weapon.data.data.reach
    if (dataset.roll) {
      let damage = dataset.roll
      if (damMod) {
        damage += '+' + this.actor.data.data.attributes.damageMod.value
      }
      let roll = new Roll(damage, this.actor.data.data)
      let label = dataset.label ? `Rolling ${weapon.data.name} ` : ''
      label +=
        '<br><strong>Combat-Effects: </strong>' +
        combatEffect +
        '<br><strong>Traits: </strong>' +
        traits

      if (game.i18n) {
        label = dataset.label
          ? `${game.i18n.localize('MYTHRAS.Rolling')} ${weapon.data.name} `
          : ''
        label +=
          '<br><strong>Size: </strong>' +
          size +
          '&#8195;<strong>Reach: </strong>' +
          reach +
          '<br><strong>' +
          game.i18n.localize('MYTHRAS.Combat_Effects') +
          ': </strong>' +
          combatEffect +
          '<br><strong>' +
          game.i18n.localize('MYTHRAS.Traits') +
          ': </strong>' +
          traits
      }

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
    const weapon = this.actor.items.get(dataset.label)
    const name = weapon.data.name
    const damMod = weapon.data.data.damageModifier
    const combatEffect = weapon.data.data['combat-effects']
    const force = weapon.data.data.force
    if (dataset.roll) {
      let damage = dataset.roll
      if (damMod) {
        damage += '+' + this.actor.data.data.attributes.damageMod.value
      }
      let roll = new Roll(damage, this.actor.data.data)
      let label = dataset.label ? `Rolling ${name} ` : ''
      label +=
        '<br><strong>Force: </strong>' +
        force +
        '<br><strong>Combat-Effects: </strong>' +
        combatEffect
      if (game.i18n) {
        let label = dataset.label
          ? `${game.i18n.localize('MYTHRAS.Rolling')} ${name} `
          : ''
        label +=
          '<br><strong>Force: </strong>' +
          force +
          '<br><strong>' +
          game.i18n.localize('MYTHRAS.Combat_Effects') +
          ': </strong>' +
          combatEffect
      }

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
      let label = dataset.label ? `Rolling Hit Location` : ''
      if (game.i18n) {
        label = dataset.label
          ? game.i18n.localize('MYTHRAS.Rolling_Location')
          : ''
      }
      rolled.then((result) => {
        const locHit = hitLoc.filter(function (value) {
          let loc = value.split('/')
          return (
            result.result >= Number(loc[1]) && result.result <= Number(loc[2])
          )
        })
        let loc = String(locHit).split('/')
        label += '<br><h2>' + loc[0] + '</h2>'
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        })
      })
    }
  }
}
