import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { SkillMythras } from '@item/skill/index.js'
import { skillTypes } from '../../item/skill-helper.js'
import { fatigueInfo } from '../actor-helper.js'
import { encInfo } from '../actor-helper.js'
import { doesTypeHaveTemplate } from '../actor-helper.js'
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export abstract class ActorSheetMythras<TActor extends ActorMythras> extends ActorSheet<
  TActor,
  ItemMythras
> {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: ['.item'], dropSelector: null }]
    })
  }

  /* -------------------------------------------- */

  private get encumbranceBarSegments() {
    const encumbranceLevels = [this.actor.burdenedCap, this.actor.overloadedCap, this.actor.maxLoad]
    const encumbranceLevelNames = ['Burdened', 'Overloaded', 'Max Load']
    const segments = []
    const totalEncumbrance = this.actor.totalEncumbrance
    const maxLoad = this.actor.maxLoad
    let barCovered = 0
    let barFilled = 0

    for (let i = 0; i < encumbranceLevels.length; i++) {
      let percentSegmentFilled = 0
      if (totalEncumbrance >= encumbranceLevels[i]) {
        percentSegmentFilled = 100
        barFilled += encumbranceLevels[i] - barCovered
      } else if (i == 0 || totalEncumbrance > encumbranceLevels[i - 1]) {
        const divisor = totalEncumbrance - barFilled
        const dividend = encumbranceLevels[i] - barFilled
        percentSegmentFilled = 100 * (divisor / dividend)
      }
      const width = encumbranceLevels[i] - barCovered
      segments.push({
        level: encumbranceLevels[i],
        levelName: encumbranceLevelNames[i],
        percentFilled: percentSegmentFilled,
        width: width
      })
      barCovered += width
    }

    return segments
  }

  /** @override */
  getData() {
    const data: any = super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']

    //Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data)
    }

    return {
      ...data,
      armorPenalty: this.actor.armorPenalty,
      currentLevelOfFatigue: this.actor.currentLevelOfFatigue,
      maxActionPoints: this.actor.maxActionPoints,
      damageMod: this.actor.damageMod,
      experienceMod: this.actor.experienceMod,
      healingRate: this.actor.healingRate,
      initiativeBonus: this.actor.initiativeBonus,
      maxLuckPoints: this.actor.maxLuckPoints,
      maxMagicPoints: this.actor.maxMagicPoints,
      maxTenacity: this.actor.maxTenacity,
      encumbranceBarSegments: this.encumbranceBarSegments,
      totalEncumbrance: this.actor.totalEncumbrance
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData: any) {
    const actorData = sheetData.actor

    // Initialize containers.
    const hitLocations: any[] = []
    const standardSkills: any[] = []
    const professionalSkills: any[] = []
    const combatStyles: any[] = []
    const magicSkills: any[] = []
    const passions: any[] = []
    const skillsAndPassions: any[] = []
    const meleeWeapons: any[] = []
    const rangedWeapons: any[] = []
    const armor: any[] = []
    const equipment: any[] = []
    const currency: any[] = []
    const cults: any[] = []
    const storages: any[] = []
    const abilities: any[] = []
    const spells: any[] = []

    const itemMapper: any = {
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
      storage: storages,
      cultBrotherhood: cults,
      ability: abilities,
      spell: spells
    }

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
    actorData.spells = spells
    spells.sort(function (a, b) {
      return a.data.data.source.localeCompare(b.data.data.source)
    })
  }

  private modifyStatStyle(modifier: HTMLInputElement) {
    let statToModify = $(modifier).closest('[data-stat]').find('.modifiable')
    if (Number(modifier.value) > 0) {
      $(modifier).removeClass('decreased')
      statToModify.removeClass('decreased')
      $(modifier).addClass('increased')
      statToModify.addClass('increased')
    } else if (Number(modifier.value) < 0) {
      $(modifier).removeClass('increased')
      statToModify.removeClass('increased')
      $(modifier).addClass('decreased')
      statToModify.addClass('decreased')
    } else {
      $(modifier).removeClass('decreased')
      statToModify.removeClass('decreased')
      $(modifier).removeClass('increased')
      statToModify.removeClass('increased')
    }
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html)
    const actor = this.actor

    Hooks.once('renderActorSheet', () => {
      html.find('.modifier').each((_, modifier: HTMLInputElement) => {
        this.modifyStatStyle(modifier)
      })
      if (this.actor.isOverMaxLoad) {
        $('.encumbrance-bar .percent-segment-filled').removeClass('burdened')
        $('.encumbrance-bar .percent-segment-filled').removeClass('overloaded')
        $('.encumbrance-bar .percent-segment-filled').addClass('maxload')
      } else if (this.actor.isOverloaded) {
        $('.encumbrance-bar .percent-segment-filled').removeClass('burdened')
        $('.encumbrance-bar .percent-segment-filled').removeClass('maxload')
        $('.encumbrance-bar .percent-segment-filled').addClass('overloaded')
      } else if (this.actor.isBurdened) {
        $('.encumbrance-bar .percent-segment-filled').removeClass('overloaded')
        $('.encumbrance-bar .percent-segment-filled').removeClass('maxload')
        $('.encumbrance-bar .percent-segment-filled').addClass('burdened')
      }
    })

    html.find('.modifier').on('change', (event) => {
      let target = event.target as HTMLInputElement
      this.modifyStatStyle(target)
    })

    html.find('input').on('click', function (event) {
      this.select()
    })

    // Listens for item-input updates. Element with [data-item] that contain inputs
    // are listened to. If an input changes, update the embedded document associated with
    // that data-item using the data-item-id attribute on that same element
    html.find('[data-item] input, [data-item] select').on('change', async (event) => {
      let target = event.target as HTMLInputElement
      let itemId = $(target.closest('[data-item]')).attr('data-item-id')
      let propertyName = $(target).attr('data-item-property')
      let item = this.actor.items.get(itemId)
      let newValue: string | boolean = target.value
      if ($(target).is(':checkbox')) {
        newValue = target.checked
      }
      if (propertyName != 'name') {
        propertyName = 'data.' + propertyName
      }
      await this.actor.updateEmbeddedDocuments('Item', [
        {
          _id: item.id,
          [propertyName]: newValue
        }
      ])
    })

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    // Add Actor Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Actor Item
    html.find('.item-edit').click((ev: any) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = actor.items.get(li.data('itemId'))
      item.sheet.render(true)
    })

    html.find('#spellFilter').click(this._filterSpells.bind(this))
    this._createSpellFilterOptions()

    // html.find('.skill-alpha-sort').click((ev) => {
    //   let data = this.getData()
    //   if (ev.currentTarget.id == 'professional-alpha-sort') {
    //   }
    // })

    // Delete Actor Item
    html.find('.item-delete').click((ev: any) => {
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
    html.find('.rollableRangedDamage').click(this._onRollRangedDamage.bind(this))

    // Hit Location roll button listener
    html.find('.roll-hitlocations-button').click(this._onRollHitLoc.bind(this))

    const pointToggleMap = {
      '#toggle-lp': 'luckPoints',
      '#toggle-mp': 'magicPoints',
      '#toggle-tp': 'tenacity',
      '#toggle-ap': 'actionPoints',
      '#toggle-er': 'experienceRoll'
    }
    for (const [key, value] of Object.entries(pointToggleMap)) {
      html.find(key).click(function (event: any) {
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
      html.find(key).click(function (event: any) {
        event.preventDefault()
        let data: any = actor.data.data
        if (value == 'experienceRolls') {
          actor.update({
            ['data.' + value]: Number(data[value]) + 1
          })
        } else {
          let attributes = data.attributes
          actor.update({
            ['data.attributes.' + value + '.value']: Number(attributes[value].value) + 1
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
      html.find(key).click(function (event: any) {
        event.preventDefault()
        let data: any = actor.data.data
        if (value == 'experienceRolls') {
          actor.update({
            ['data.' + value]: Number(data[value]) - 1
          })
        } else {
          let attributes = data.attributes
          actor.update({
            ['data.attributes.' + value + '.value']: Number(attributes[value].value) - 1
          })
        }
      })
    }

    // Drag events for macros.
    if (actor.isOwner) {
      let sheet: any = this
      let handler = (ev: any) => sheet._onDragItemStart(ev)
      html.find('li.item').each((i: any, li: any) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }

    // Run Wounded Style Check
    this._styleWoundedHitLocations()
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event: any) {
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
    const itemData: any = {
      name: name,
      type: type,
      data: data,
      img: this._getItemImage(type)
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data['type']
    // Finally, create the item!
    return Item.create(itemData, { parent: this.actor })
  }

  _getItemImage(itemType: any) {
    switch (itemType) {
      case 'equipment':
        return 'icons/svg/item-bag.svg'
      case 'armor':
        return 'icons/svg/shield.svg'
      case 'melee-weapon':
        return 'icons/svg/sword.svg'
      case 'ranged-weapon':
        return 'icons/svg/sword.svg'
      case 'currency':
        return 'icons/svg/coins.svg'
      case 'combatStyle':
        return 'icons/svg/combat.svg'
      case 'storage':
        return 'icons/svg/chest.svg'
      case 'cultBrotherhood':
        return 'icons/svg/hanging-sign.svg'
      case 'magicSkill':
        return 'icons/svg/daze.svg'
      default:
        return 'icons/svg/book.svg'
    }
  }

  _rollSkillAlt(event: any) {
    event.preventDefault()
    let skills = this.actor.items.filter(function (value) {
      return doesTypeHaveTemplate(value.data.type, 'skill')
    })
    let skillSelect = `<select id="skill-mod">`
    skills.forEach((skill: any, index) => {
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
  async _onRollSkill(event: any) {
    event.preventDefault()

    // Gets the data-label attribute of the skill's html tag
    // attr is in format <skill_name>,<skill_value>,<foundry_item_id>
    const element = event.currentTarget
    const dataset = element.dataset
    const dataLabel = dataset.label.split(',')

    let skillName = dataLabel[0]
    let skillValue = dataLabel[1]
    let itemId = dataLabel[2]

    // Gets the skill item data using the item's id
    let item: SkillMythras = this.actor.items.get(itemId)
    let encPenalty = item.encPenalty

    // Calculate difficulty grades based on skill value
    let difficultyGrades = [2, 1.5, 1, 2 / 3, 0.5, 0.1].map(function (x) {
      return Math.ceil(x * Number(skillValue))
    })

    // Difficulty name code. Are localized in the template
    let difficultyNames = [
      'MYTHRAS.very_easy_dif',
      'MYTHRAS.easy_dif',
      'MYTHRAS.standard_dif',
      'MYTHRAS.hard_dif',
      'MYTHRAS.formidable_dif',
      'MYTHRAS.herculean_dif'
    ]

    if (dataset.roll) {
      // Get encumberance and fatigue modifier text
      let modifiers = this.getModifiers(encPenalty)
      console.log(modifiers)

      // Create roll label, like "Rolling: <skill_name>"
      let rollLabel = dataset.label ? game.i18n.localize('MYTHRAS.Rolling') + ` ${skillName}` : ''

      // Make the roll
      let roll = new Roll(dataset.roll, this.actor.data.data)
      const rolled = roll.evaluate({ async: true })

      rolled.then(async (result) => {
        // Get results of the rolls at given grades, (e.g. Success, Failure, Critical, Fumble)
        let rollResults = this.getRollResults(difficultyNames, difficultyGrades, result)

        // Render the skill roll chat message content
        let htmlContent = await renderTemplate('systems/mythras/templates/chat/skill-roll.html', {
          game: game,
          rollResults: rollResults,
          modifiers: modifiers
        })

        // Display the roll
        roll.toMessage({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: rollLabel,
          content: htmlContent
        })
      })
    }
  }

  getModifiers(encPenalty: any) {
    let modifiers = []

    // Include Fatigue Penalty value if character is not fresh
    let fatigueValue = this.actor.currentLevelOfFatigue
    if (fatigueValue !== 'fresh') {
      modifiers.push({
        name: 'Fatigue Mod',
        value: (fatigueInfo as any)[fatigueValue]['Skill Grade']
      })
    }

    //Include ENC Penalty if skill suffers ENC penalty and character is encumbered
    if (encPenalty) {
      if (this.actor.isOverloaded) {
        modifiers.push({
          name: 'ENC Mod',
          value: encInfo['overloaded']['Skill Grade']
        })
      } else if (this.actor.isBurdened) {
        modifiers.push({
          name: 'ENC Mod',
          value: encInfo['burdened']['Skill Grade']
        })
      }
    }
    return modifiers
  }

  getRollResults(difficultyNames: any, difficultyGrades: any, rolled: any) {
    let results: any[] = []

    // For each difficulty grade, determine if the roll is a
    // Success, Failure, Critical, or Fumble
    difficultyNames.forEach((name: any, index: any) => {
      let result: any = {}
      result.difficultyName = name
      result.difficultyGrade = difficultyGrades[index]
      result.rollValue = rolled.result

      // Rolls above 95 are guaranteed Failures or Fumbles
      if (rolled.result >= 95) {
        // If the roll is 99 or 100, the roll is a fumble
        // (unless the character has a skill >= 100. Then 99 is only a Failure)
        if (rolled.result == 100 || (rolled.result == 99 && difficultyGrades[index] <= 100)) {
          result.description = 'MYTHRAS.FUMBLE!'
          result.descriptionClass = 'text-darkred'
        } else {
          result.description = 'MYTHRAS.FAILURE!'
          result.descriptionClass = 'text-red'
        }
        // Rolls below 5 are guaranteed Successes or Criticals
      } else if (rolled.result <= 5) {
        // If the roll is 1 or less than 1/10th the character's skill, its a Critical
        if (rolled.result == 1 || rolled.result <= Math.ceil(difficultyGrades[index] * 0.1)) {
          result.description = 'MYTHRAS.CRITICAL!'
          result.descriptionClass = 'text-goldenrod'
        } else {
          result.description = 'MYTHRAS.SUCCESS!'
          result.descriptionClass = 'text-green'
        }
      } else {
        if (rolled.result <= Math.ceil(difficultyGrades[index] * 0.1)) {
          result.description = 'MYTHRAS.CRITICAL!'
          result.descriptionClass = 'text-goldenrod'
        } else if (rolled.result <= difficultyGrades[index]) {
          result.description = 'MYTHRAS.SUCCESS!'
          result.descriptionClass = 'text-green'
        } else {
          result.description = 'MYTHRAS.FAILURE!'
          result.descriptionClass = 'text-red'
        }
      }
      results.push(result)
    })

    return results
  }

  async _onRollMeleeDamage(event: any) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const weapon: any = this.actor.items.get(dataset.label)
    const damMod = weapon.data.data.damageModifier
    const combatEffects = weapon.data.data['combat-effects']
    const traits = weapon.data.data.traits
    const size = weapon.data.data.size
    const reach = weapon.data.data.reach
    if (dataset.roll) {
      let data: any = this.actor.data.data
      let damage = dataset.roll
      if (damMod) {
        damage += '+' + data.attributes.damageMod.value
      }
      let roll = new Roll(damage, this.actor.data.data)

      let labelHtml = await renderTemplate(
        'systems/mythras/templates/chat/damage/melee-roll.html',
        {
          weaponName: weapon.data.name,
          size: size,
          reach: reach,
          combatEffects: combatEffects,
          traits: traits
        }
      )

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: labelHtml
      })
    }
  }

  async _onRollRangedDamage(event: any) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const weapon: any = this.actor.items.get(dataset.label)
    const damMod = weapon.data.data.damageModifier
    const combatEffects = weapon.data.data['combat-effects']
    const force = weapon.data.data.force
    if (dataset.roll) {
      let damage = dataset.roll
      if (damMod) {
        let data: any = this.actor.data.data
        damage += '+' + data.attributes.damageMod.value
      }
      let roll = new Roll(damage, this.actor.data.data)

      let labelHtml = await renderTemplate(
        'systems/mythras/templates/chat/damage/ranged-roll.html',
        {
          weaponName: weapon.data.name,
          force: force,
          combatEffects: combatEffects
        }
      )

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: labelHtml
      })
    }
  }
  _onRollHitLoc(event: any) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const hitLoc = dataset.label.split(',')
    if (dataset.roll) {
      let roll: any = new Roll(dataset.roll, this.actor.data.data)
      const rolled = roll.roll()
      let label = dataset.label ? `Rolling Hit Location` : ''
      if (game.i18n) {
        label = dataset.label ? game.i18n.localize('MYTHRAS.Rolling_Location') : ''
      }
      rolled.then((result: any) => {
        const locHit = hitLoc.filter(function (value: any) {
          let loc = value.split('/')
          return result.result >= Number(loc[1]) && result.result <= Number(loc[2])
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
  async _filterSpells(event: any) {
    event.preventDefault()
    let filterBy = event.currentTarget.value
    let items: any[] = [...document.querySelectorAll('.spell-list-table .item')]
    for (let item of items) {
      switch (filterBy) {
        case 'All':
          item.classList.add('active')
          break

        case `${filterBy}`:
          item.dataset.itemSource !== `${filterBy}`
            ? item.classList.remove('active')
            : item.classList.add('active')
          break
      }
    }
  }
  _createSpellFilterOptions() {
    let spells: any[] = this.actor.items.filter((i) => i.type === 'spell')
    for (let spell of spells) {
      let isDuplicate = [...document.querySelectorAll('[data-source]')].some(
        (i: any) => i.dataset.source == spell.data.data.source
      )

      switch (isDuplicate) {
        case true:
          break

        case false:
          let option = document.createElement('option')
          option.dataset.source = spell.data.data.source
          option.innerHTML = `${spell.data.data.source}`
          document.querySelector('#spellFilter').append(option)
      }
    }
  }
  _styleWoundedHitLocations() {
    const hitLocations: any[] = this.actor.items.filter((item) => item.type == 'hitLocation')
    for (let hitLocation of hitLocations) {
      let hitLocationElement: any = document.querySelector(
        `.hitLocation-table [data-item-id="${hitLocation.id}"]`
      )
      if (hitLocation.data.data.currentHp <= hitLocation.data.data.maxHp * -1) {
        hitLocationElement.style.backgroundColor = '#c5000094'
        continue
      } else if (hitLocation.data.data.currentHp <= 0) {
        hitLocationElement.style.backgroundColor = '#ed5b1585'
        continue
      }
    }
  }
}
