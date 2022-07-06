import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { HitLocationMythras } from '@module/item/hit-location'
import { Roller } from '@module/roller'

export abstract class ActorSheetMythras<TActor extends ActorMythras> extends ActorSheet<
  TActor,
  ItemMythras
> {
  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: ['.item'], dropSelector: null }]
    })
  }

  roller!: Roller

  constructor(object: TActor, options: Partial<ActorSheetOptions>) {
    super(object, options)
    // Apply styles after renderActorSheet hook
    Hooks.on('renderActorSheet', () => {
      this.postRender()
    })

    this.roller = new Roller(this.actor)
  }

  override getData() {
    const baseData: any = super.getData()
    baseData.dtypes = ['String', 'Number', 'Boolean']

    const data = {
      items: { ...this.actor.itemTypes },
      armorPenalty: this.actor.armorPenalty,
      currentLevelOfFatigue: this.actor.currentLevelOfFatigue,
      maxTenacity: this.actor.maxTenacity,
      encumbrance: this.actor.encumbrance,

      stats: {
        actionPoints: {
          label: 'MYTHRAS.ACTION_POINTS',
          derivedName: 'maxActionPoints',
          derivedValue: this.actor.maxActionPoints,
          modifierValue: baseData.data.data.attributes.actionPoints.mod
        },
        damageMod: {
          label: 'MYTHRAS.DAMAGE_MOD',
          derivedName: 'damageMod',
          derivedValue: this.actor.damageMod,
          modifierValue: baseData.data.data.attributes.damageMod.mod
        },
        experienceMod: {
          label: 'MYTHRAS.EXPERIENCE_MOD',
          derivedName: 'experienceMod',
          derivedValue: this.actor.experienceMod,
          modifierValue: baseData.data.data.attributes.experienceMod.mod
        },
        healingRate: {
          label: 'MYTHRAS.HEALING_RATE',
          derivedName: 'healingRate',
          derivedValue: this.actor.healingRate,
          modifierValue: baseData.data.data.attributes.healingRate.mod
        },
        initiativeBonus: {
          label: 'MYTHRAS.INITIATIVE_BONUS',
          derivedName: 'initiativeBonus',
          derivedValue: this.actor.initiativeBonus,
          modifierValue: baseData.data.data.attributes.initiativeBonus.mod
        },
        luckPoints: {
          label: 'MYTHRAS.LUCK_POINTS',
          derivedName: 'maxLuckPoints',
          derivedValue: this.actor.maxLuckPoints,
          modifierValue: baseData.data.data.attributes.luckPoints.mod
        },
        magicPoints: {
          label: 'MYTHRAS.MAGIC_POINTS',
          derivedName: 'maxMagicPoints',
          derivedValue: this.actor.maxMagicPoints,
          modifierValue: baseData.data.data.attributes.magicPoints.mod
        }
      },
      characteristics: {
        str: {
          value: this.actor.characteristics.str,
          label: 'MYTHRAS.STRENGTH'
        },
        con: {
          value: this.actor.characteristics.con,
          label: 'MYTHRAS.CONSTITUTION'
        },
        siz: {
          value: this.actor.characteristics.siz,
          label: 'MYTHRAS.SIZE'
        },
        dex: {
          value: this.actor.characteristics.dex,
          label: 'MYTHRAS.DEXTERITY'
        },
        int: {
          value: this.actor.characteristics.int,
          label: 'MYTHRAS.INTELLIGENCE'
        },
        pow: {
          value: this.actor.characteristics.pow,
          label: 'MYTHRAS.POWER'
        },
        cha: {
          value: this.actor.characteristics.cha,
          label: 'MYTHRAS.CHARISMA'
        }
      }
    }

    this.sortItems(data)

    return mergeObject(baseData, data)
  }

  private sortItems(sheetData: any) {
    // Assign and return
    sheetData.items.hitLocation.sort((a: any, b: any) => {
      return a.data.data.rollRangeStart - b.data.data.rollRangeStart
    })
    sheetData.items.standardSkill.sort((a: any, b: any) => {
      return a.data.name.localeCompare(b.data.name)
    })
    sheetData.items.professionalSkill.sort((a: any, b: any) => {
      return a.data.name.localeCompare(b.data.name)
    })
    sheetData.items.magicSkill.sort((a: any, b: any) => {
      return a.data.name.localeCompare(b.data.name)
    })
    sheetData.items.storage.sort((a: any, b: any) => {
      return a.data.name.localeCompare(b.data.name)
    })
    sheetData.items.cultBrotherhood.sort((a: any, b: any) => {
      return a.data.name.localeCompare(b.data.name)
    })
    sheetData.items.spell.sort((a: any, b: any) => {
      return a.data.data.source.localeCompare(b.data.data.source)
    })
  }

  private postRender() {
    this.applyStatStyles()
    this.applyEncumbranceStyles()
    this.applyWoundedHitLocationStyles()
  }

  private applyStatStyles() {
    this.element.find('.modifier').each((_, modifier: HTMLInputElement) => {
      let statToModify = $(modifier).closest('[data-stat]').find('.modifiable')
      if (Number(modifier.value) > 0) {
        $(modifier).removeClass('decreased').addClass('increased')
        statToModify.removeClass('decreased').addClass('increased')
      } else if (Number(modifier.value) < 0) {
        $(modifier).removeClass('increased').addClass('decreased')
        statToModify.removeClass('increased').addClass('decreased')
      } else {
        $(modifier).removeClass('decreased increased')
        statToModify.removeClass('decreased increased')
      }
    })
  }

  private applyEncumbranceStyles() {
    const segments = $('.encumbrance-bar .percent-segment-filled')
    if (this.actor.encumbrance.isOverMaxLoad) {
      segments.removeClass('burdened overloaded').addClass('maxload')
    } else if (this.actor.encumbrance.isOverloaded) {
      segments.removeClass('burdened maxload').addClass('overloaded')
    } else if (this.actor.encumbrance.isBurdened) {
      segments.removeClass('overloaded maxload').addClass('burdened')
    }
  }

  override activateListeners(html: JQuery) {
    super.activateListeners(html)
    const actor: ActorMythras = this.actor

    html.find('input').on('click', function () {
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
    html.find('.item-create').on('click', this.onItemCreate.bind(this))

    // Update Actor Item
    html.find('.item-edit').on('click', (ev: any) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = actor.items.get(li.data('itemId'))
      item.sheet.render(true)
    })

    // Delete Actor Item
    html.find('.item-delete').on('click', (ev: any) => {
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

    html.find('#spellFilter').on('click', this.filterSpells.bind(this))
    this.createSpellFilterOptions()

    // html.find('.skill-alpha-sort').on('click', (ev) => {
    //   let data = this.getData()
    //   if (ev.currentTarget.id == 'professional-alpha-sort') {
    //   }
    // })

    // Skill roll button listener
    html.find('.rollableSkill').on('click', (event) => this.handleItemRoll(event, this.roller.rollSkill.bind(this.roller)))

    // Melee Weapon roll button listener
    html.find('.rollableMeleeDamage').on('click', (event) => this.handleItemRoll(event, this.roller.rollMeleeDamage.bind(this.roller)))

    // Ranged Weapon roll button listener
    html.find('.rollableRangedDamage').on('click', (event) => this.handleItemRoll(event, this.roller.rollRangedDamage.bind(this.roller)))

    // Hit Location roll button listener
    html.find('.roll-hitlocations-button').on('click', (event) => {
      event.preventDefault()
      this.roller.rollHitLocation()
    })

    const pointToggleMap = {
      '#toggle-lp': 'luckPoints',
      '#toggle-mp': 'magicPoints',
      '#toggle-tp': 'tenacity',
      '#toggle-ap': 'actionPoints',
      '#toggle-er': 'experienceRoll'
    }
    for (const [key, value] of Object.entries(pointToggleMap)) {
      html.find(key).on('click', function (event: any) {
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
      html.find(key).on('click', function (event: any) {
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
      html.find(key).on('click', function (event: any) {
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
      let handler = (ev: any) => sheet.onDragItemStart(ev)
      html.find('li.item').each((i: any, li: any) => {
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
  private onItemCreate(event: any) {
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
    delete data['type']
    // Prepare the item object.
    const itemData: any = {
      name: name,
      type: type,
      data: data
    }

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments('Item', [itemData])
  }

  private doesTypeHaveTemplate(type: any, template: any) {
    let system: any = game.system
    let itemTemplates = system.template.Item[type].templates
    if (itemTemplates === undefined) return false

    return itemTemplates.includes(template)
  }

  private rollSkillAlt(event: any) {
    event.preventDefault()
    let skills = this.actor.items.filter(function (value) {
      return this.doesTypeHaveTemplate(value.data.type, 'skill')
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

  private handleItemRoll<TItem extends ItemMythras>(event: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>, rollFunction: (item: TItem) => any) {
    event.preventDefault()
    const itemId = $(event.currentTarget.closest('[data-item-id]')).attr('data-item-id')
    const item: TItem = this.actor.items.get(itemId)
    rollFunction(item)
  }

  private async filterSpells(event: any) {
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

  private createSpellFilterOptions() {
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

  private applyWoundedHitLocationStyles() {
    const hitLocations: HitLocationMythras[] = this.actor.items.filter(
      (item) => item.type == 'hitLocation'
    )
    for (let hitLocation of hitLocations) {
      let currentHp = (hitLocation.data.data as any).currentHp
      let hitLocationElement: any = document.querySelector(
        `.hitLocation-table [data-item-id="${hitLocation.id}"]`
      )
      if (currentHp <= hitLocation.maxHp * -1) {
        hitLocationElement.style.backgroundColor = '#c5000094'
        continue
      } else if (currentHp <= 0) {
        hitLocationElement.style.backgroundColor = '#ed5b1585'
        continue
      }
    }
  }
}
