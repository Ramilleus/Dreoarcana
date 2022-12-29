import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { HitLocationMythras } from '@item/hit-location'
import { Roller } from '@module/roller'
import { SheetPostRender } from '@module/sheet-common/sheet-post-render'

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
  sheetPostRender!: SheetPostRender

  constructor(object: TActor, options: Partial<ActorSheetOptions>) {
    super(object, options)
    // Apply styles after renderActorSheet hook
    Hooks.on('renderActorSheet', () => {
      this.sheetPostRender = new SheetPostRender(this.element)
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
      fatigue: this.actor.fatigue,
      encumbrance: this.actor.encumbrance,
      movement: this.actor.movement,
      statTracker: this.actor.statTracker,
      magicSkillNames: this.actor.itemTypes.spell.map(spell => spell.magicSkillName).filter((v, i, a) => a.indexOf(v) === i),
      system: this.actor.system,
      tabs: [
        {
          name: "core",
          label: "MYTHRAS.Character"
        },
        {
          name: "combat",
          label: "MYTHRAS.Combat"
        },
        {
          name: "abilities",
          label: "MYTHRAS.Abilities"
        },
        {
          name: "equipment",
          label: "MYTHRAS.Equipment"
        },
        {
          name: "notes",
          label: "MYTHRAS.Journal"
        }
      ],

      stats: {
        actionPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.ACTION_POINTS',
          derivedName: 'maxActionPoints',
          currentValue: baseData.data.data.attributes.actionPoints.value,
          derivedValue: this.actor.maxActionPoints,
          modifierName: "data.attributes.actionPoints.mod",
          modifierValue: baseData.data.data.attributes.actionPoints.mod,
          minimized: baseData.data.data.attributes.actionPoints.minimize
        },
        damageMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.DAMAGE_MOD',
          derivedName: 'damageMod',
          derivedValue: this.actor.damageMod,
          modifierName: "data.attributes.damageMod.mod",
          modifierValue: baseData.data.data.attributes.damageMod.mod
        },
        experienceMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.EXPERIENCE_MOD',
          derivedName: 'experienceMod',
          derivedValue: this.actor.experienceMod,
          modifierName: "data.attributes.experienceMod.mod",
          modifierValue: baseData.data.data.attributes.experienceMod.mod
        },
        healingRate: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.HEALING_RATE',
          derivedName: 'healingRate',
          derivedValue: this.actor.healingRate,
          modifierName: "data.attributes.healingRate.mod",
          modifierValue: baseData.data.data.attributes.healingRate.mod
        },
        initiativeBonus: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.INITIATIVE_BONUS',
          derivedName: 'initiativeBonus',
          derivedValue: this.actor.initiativeBonus,
          modifierName: "data.attributes.initiativeBonus.mod",
          modifierValue: baseData.data.data.attributes.initiativeBonus.mod
        },
        luckPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.LUCK_POINTS',
          derivedName: 'maxLuckPoints',
          currentValue: baseData.data.data.attributes.luckPoints.value,
          derivedValue: this.actor.maxLuckPoints,
          modifierName: "data.attributes.luckPoints.mod",
          modifierValue: baseData.data.data.attributes.luckPoints.mod,
          minimized: baseData.data.data.attributes.luckPoints.minimize
        },
        magicPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.MAGIC_POINTS',
          derivedName: 'maxMagicPoints',
          currentValue: baseData.data.data.attributes.magicPoints.value,
          derivedValue: this.actor.maxMagicPoints,
          modifierName: "data.attributes.magicPoints.mod",
          modifierValue: baseData.data.data.attributes.magicPoints.mod,
          minimized: baseData.data.data.attributes.magicPoints.minimize
        },
        tenacity: {
          isAttribute: false,
          tracked: true,
          // TODO: Localize
          label: 'TENACITY',
          derivedName: 'maxTenacity',
          currentValue: baseData.data.data.attributes.tenacity.value,
          derivedValue: this.actor.maxTenacity,
          modifierName: "data.attributes.tenacity.mod",
          modifierValue: baseData.data.data.attributes.tenacity.mod,
          minimized: baseData.data.data.attributes.tenacity.minimize
        },
        experienceRoll: {
          isAttribute: false,
          tracked: true,
          label: 'MYTHRAS.EXPERIENCE_ROLLS',
          currentValue: baseData.data.data.experienceRolls,
          minimized: baseData.data.data.attributes.experienceRoll.minimize
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
      return a.system.rollRangeStart - b.system.rollRangeStart
    })
    sheetData.items.standardSkill.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.professionalSkill.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.magicSkill.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.storage.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.cultBrotherhood.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.spell.sort((a: any, b: any) => {
      return a.system.source.localeCompare(b.system.source)
    })
  }

  private postRender() {
    this.sheetPostRender.postRender()
    this.applyEncumbranceStyles()
    this.applyWoundedHitLocationStyles()
    this.hideMinimizedStats()
    this.filterSpells()
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

  private applyWoundedHitLocationStyles() {
    const hitLocations: HitLocationMythras[] = this.actor.items.filter(
      (item) => item.type == 'hitLocation'
    )
    for (let hitLocation of hitLocations) {
      let currentHp = (hitLocation.system as any).currentHp
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

  private hideMinimizedStats() {
    this.element.find('[data-stat-name]').each((_, stat: HTMLInputElement) => {
      const statName = $(stat).attr('data-stat-name')
      const bubble = $(stat).find('.number-input-container')
      const label = $(stat).find('.stat-minimizer')
      const actor: any = this.actor
      // if (actor.data.data.attributes[statName].minimize) {
      //   bubble.addClass('hidden')
      //   label.addClass('sideways-text')
      // } else {
      //   bubble.removeClass('hidden')
      //   label.removeClass('sideways-text')
      // }
    })
  }

  override activateListeners(html: JQuery) {
    super.activateListeners(html)
    const actor: any = this.actor

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
    
    // html.find('.stat-minimizer').on('click', function (event: any) {
    //   event.preventDefault()
    //   const statName = $(event.target.closest('[data-stat-name]')).attr('data-stat-name')
    //   if (actor.data.data.attributes[statName].minimize) {
    //     actor.update({
    //       ['data.attributes.' + statName + '.minimize']: 0
    //     })
    //   } else {
    //     actor.update({
    //       ['data.attributes.' + statName + '.minimize']: 1
    //     })
    //   }
    // })
    html.find('.stat-settings').on('click', (event) => {
      event.preventDefault()
      let statList = 'Coming soon :)'
      new Dialog({
        title: 'Stat Tracker',
        content: statList,
        buttons: {}
      }).render(true)
    })
    html.find('.stat-increase').on('click', (event) => {
      event.preventDefault()
      let data: any = actor.data.data
      const statID = $(event.target.closest('[data-stat-name]')).attr('data-stat-name')
      
      let trackedStats = data.trackedStats
      actor.update({
        ['data.trackedStats.' + statID + '.value']: Number(trackedStats[statID].value) + 1
      })
    })

    html.find('.stat-decrease').on('click', (event) => {
      event.preventDefault()
      let data: any = actor.data.data
      const statID = $(event.target.closest('[data-stat-name]')).attr('data-stat-name')
      
      let trackedStats = data.trackedStats
      actor.update({
        ['data.trackedStats.' + statID + '.value']: Number(trackedStats[statID].value) - 1
      })
    })

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

  private async filterSpells() {
    let data = this.actor.system as any
    let filterBy = data.spellFilterOption
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

}
