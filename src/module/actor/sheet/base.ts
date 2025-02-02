import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { HitLocationMythras } from '@item/hit-location'
import { CultBrotherhoodMythras } from '@module/item/cult-brotherhood'
import { MagicSkillMythras } from '@module/item/magic-skill'
import { SkillMythras } from '@module/item/skill'
import { SpellMythras } from '@module/item/spell'
import { StorageMythras } from '@module/item/storage'
import { Roller } from '@module/roller'
import { SheetPostRender } from '@module/sheet-common/sheet-post-render'
import { duplicate } from 'types/foundry/common/utils/helpers'
import { EquipmentTypes } from '@item/equipment'

abstract class ActorSheetMythras<TActor extends ActorMythras> extends ActorSheet<
  TActor,
  ItemMythras
> {
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  override async getData(options: ActorSheetOptions = this.options): Promise<ActorSheetData<TActor>> {
    options.id ||= this.id;

    const actorData = this.actor.toObject(false) as any
    const data: any = {
      items: { ...this.actor.itemTypes },
      armorPenalty: this.actor.armorPenalty,
      fatigue: this.actor.fatigue,
      encumbrance: this.actor.encumbrance,
      movement: this.actor.movement,
      statTracker: this.actor.statTracker,
      magicSkillNames: this.actor.itemTypes.spell.map(spell => ({ value: spell.magicSkillName, label: spell.magicSkillName })).filter((v, i, a) => a.findIndex(o => o.value === v.value) === i),
      editable: this.isEditable,
      system: actorData.system,
      actor: actorData,
      options,
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
          currentValue: actorData.system.attributes.actionPoints.value,
          derivedValue: this.actor.maxActionPoints,
          modifierName: "system.attributes.actionPoints.mod",
          modifierValue: actorData.system.attributes.actionPoints.mod,
          minimized: actorData.system.attributes.actionPoints.minimize
        },
        damageMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.DAMAGE_MOD',
          derivedName: 'damageMod',
          derivedValue: this.actor.damageMod,
          modifierName: "system.attributes.damageMod.mod",
          modifierValue: actorData.system.attributes.damageMod.mod
        },
        experienceMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.EXPERIENCE_MOD',
          derivedName: 'experienceMod',
          derivedValue: this.actor.experienceMod,
          modifierName: "system.attributes.experienceMod.mod",
          modifierValue: actorData.system.attributes.experienceMod.mod
        },
        healingRate: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.HEALING_RATE',
          derivedName: 'healingRate',
          derivedValue: this.actor.healingRate,
          modifierName: "system.attributes.healingRate.mod",
          modifierValue: actorData.system.attributes.healingRate.mod
        },
        initiativeBonus: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.INITIATIVE_BONUS',
          derivedName: 'initiativeBonus',
          derivedValue: this.actor.initiativeBonus,
          modifierName: "system.attributes.initiativeBonus.mod",
          modifierValue: actorData.system.attributes.initiativeBonus.mod
        },
        luckPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.LUCK_POINTS',
          derivedName: 'maxLuckPoints',
          currentValue: actorData.system.attributes.luckPoints.value,
          derivedValue: this.actor.maxLuckPoints,
          modifierName: "system.attributes.luckPoints.mod",
          modifierValue: actorData.system.attributes.luckPoints.mod,
          minimized: actorData.system.attributes.luckPoints.minimize
        },
        magicPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.MAGIC_POINTS',
          derivedName: 'maxMagicPoints',
          currentValue: actorData.system.attributes.magicPoints.value,
          derivedValue: this.actor.maxMagicPoints,
          modifierName: "system.attributes.magicPoints.mod",
          modifierValue: actorData.system.attributes.magicPoints.mod,
          minimized: actorData.system.attributes.magicPoints.minimize
        },
        tenacity: {
          isAttribute: false,
          tracked: true,
          // TODO: Localize
          label: 'MYTHRAS.TENACITY',
          derivedName: 'maxTenacity',
          currentValue: actorData.system.attributes.tenacity.value,
          derivedValue: this.actor.maxTenacity,
          modifierName: "system.attributes.tenacity.mod",
          modifierValue: actorData.system.attributes.tenacity.mod,
          minimized: actorData.system.attributes.tenacity.minimize
        },
        experienceRoll: {
          isAttribute: false,
          tracked: true,
          label: 'MYTHRAS.EXPERIENCE_ROLLS',
          currentValue: actorData.system.experienceRolls,
          minimized: actorData.system.attributes.experienceRoll.minimize
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
      },    
      fatigueLevelLabels: [
        { value: 'fresh', label: 'MYTHRAS.Fresh' },
        { value: 'winded', label: 'MYTHRAS.Winded' },
        { value: 'tired', label: 'MYTHRAS.Tired' },
        { value: 'wearied', label: 'MYTHRAS.Wearied' },
        { value: 'exhausted', label: 'MYTHRAS.Exhausted' },
        { value: 'debilitated', label: 'MYTHRAS.Debilitated' },
        { value: 'incapacitated', label: 'MYTHRAS.Incapacitated' },
        { value: 'semi-conscious', label: 'MYTHRAS.Semi-Conscious' },
        { value: 'comatose', label: 'MYTHRAS.Comatose' },
        { value: 'dead', label: 'MYTHRAS.Dead' }
      ],
      equipmentTypeLabels: EquipmentTypes
    }
    
    this.sortItems(data)
    return data
  }

  private sortItems(sheetData: any) {
    // Assign and return
    sheetData.items.hitLocation.sort((a: HitLocationMythras, b: HitLocationMythras) => {
      return a.system.rollRangeStart - b.system.rollRangeStart
    })
    sheetData.items.standardSkill.sort((a: SkillMythras, b: SkillMythras) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.professionalSkill.sort((a: SkillMythras, b: SkillMythras) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.magicSkill.sort((a: MagicSkillMythras, b: MagicSkillMythras) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.storage.sort((a: StorageMythras, b: StorageMythras) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.cultBrotherhood.sort((a: CultBrotherhoodMythras, b: CultBrotherhoodMythras) => {
      return a.name.localeCompare(b.name)
    })
    sheetData.items.spell.sort((a: SpellMythras, b: SpellMythras) => {
      return a.magicSkillName.localeCompare(b.magicSkillName)
    })
  }

  private postRender() {
    this.sheetPostRender.postRender()
    this.applyEncumbranceStyles()
    this.applyWoundedHitLocationStyles()
    this.hideMinimizedStats()
    this.filterSpells()
    this.filterEquipment()
    //this.applySkillFumbledNotifier()
  }

  private applyEncumbranceStyles() {
    const segments = $('[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .encumbrance-bar .percent-segment-filled')
    if (this.actor.encumbrance.isOverMaxLoad) {
      segments.removeClass('burdened overloaded').addClass('maxload')
    } else if (this.actor.encumbrance.isOverloaded) {
      segments.removeClass('burdened maxload').addClass('overloaded')
    } else if (this.actor.encumbrance.isBurdened) {
      segments.removeClass('overloaded maxload').addClass('burdened')
    }
  }

  private applyWoundedHitLocationStyles() {
    //@ts-ignore
    const hitLocations: HitLocationMythras[] = this.actor.items.filter(
      (item) => item.type == 'hitLocation'
    )
    for (let hitLocation of hitLocations) {
      let currentHp = hitLocation.system.currentHp
      let hitLocationElement: any = document.querySelector(
        `[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .hitLocation-table [data-item-id="${hitLocation.id}"]`
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
      // if (actor.system.attributes[statName].minimize) {
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
    html.find('[data-item] input, [data-item] select').on('change', async (event: any) => {
      let target = event.target as HTMLInputElement
      let itemId = $(target.closest('[data-item]')).attr('data-item-id')
      let propertyName = $(target).attr('data-item-property')
      let item = this.actor.items.get(itemId)
      let newValue: string | boolean = target.value
      if ($(target).is(':checkbox')) {
        newValue = target.checked
      }
      if (propertyName != 'name') {
        propertyName = 'system.' + propertyName
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
        content: `Are you sure you want to delete ${item.name}`,
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
    html.find('.rollableSkill').on('click', (event: any) => this.handleItemRoll(event, this.roller.rollSkill.bind(this.roller)))

    // Melee Weapon roll button listener
    html.find('.rollableMeleeDamage').on('click', (event: any) => this.handleItemRoll(event, this.roller.rollMeleeDamage.bind(this.roller)))

    // Ranged Weapon roll button listener
    html.find('.rollableRangedDamage').on('click', (event: any) => this.handleItemRoll(event, this.roller.rollRangedDamage.bind(this.roller)))

    // Hit Location roll button listener
    html.find('.roll-hitlocations-button').on('click', (event: any) => {
      event.preventDefault()
      this.roller.rollHitLocation()
    })

    html.find('.stat-settings').on('click', (event: any) => {
      event.preventDefault()
      let statList = 'Coming soon :)'
      new Dialog({
        title: 'Stat Tracker',
        content: statList,
        buttons: {}
      }).render(true)
    })
    html.find('.stat-increase').on('click', (event: any) => {
      event.preventDefault()
      let data: any = actor.system
      const statID = $(event.target.closest('[data-stat-name]')).attr('data-stat-name')
      
      let trackedStats = data.trackedStats
      actor.update({
        ['system.trackedStats.' + statID + '.value']: Number(trackedStats[statID].value) + 1
      })
    })

    html.find('.stat-decrease').on('click', (event: any) => {
      event.preventDefault()
      let data: any = actor.system
      const statID = $(event.target.closest('[data-stat-name]')).attr('data-stat-name')
      
      let trackedStats = data.trackedStats
      actor.update({
        ['system.trackedStats.' + statID + '.value']: Number(trackedStats[statID].value) - 1
      })
    })

    html.find('#equipmentSearch').on('input', async (event: any) => {
      let target = event.target as HTMLInputElement;
      this.searchEquipment($(target).val());
    });

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
      system: data
    }

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments('Item', [itemData])
  }

  private handleItemRoll(event: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>, rollFunction: (item: Item) => any) {
    event.preventDefault()
    const itemId = $(event.currentTarget.closest('[data-item-id]')).attr('data-item-id')
    const item = this.actor.items.get(itemId)
    rollFunction(item)
  }

  private async filterSpells() {
    const actorData = this.actor.system
    let filterBy = actorData.spellFilterOption
    let items: any[] = [...document.querySelectorAll(`[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .spell-list-table .item`)]
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

  private async filterEquipment() {
    const actorData = this.actor.system
    let filterBy = actorData.equipmentFilterOption
    let items: any[] = [...document.querySelectorAll(`[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .equipment-table .item`)]
    for (let item of items) {
      switch (filterBy) {
        case 'All':
          item.classList.add('active')
          break

        case `${filterBy}`:
          item.dataset.itemType !== `${filterBy}`
            ? item.classList.remove('active')
            : item.classList.add('active')
          break
      }
    }
  }

  private async searchEquipment(searchBy: string) {
    this.filterEquipment();
    
    let items: any[] = [...document.querySelectorAll(`[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .equipment-table .item.active`)]
    for (let item of items) {      
      item.dataset.itemName.toLocaleLowerCase().includes(searchBy.toLocaleLowerCase())
        ? item.classList.add('active')
        : item.classList.remove('active');
    }
  }

    // applySkillFumbledNotifier() {
    //     event.preventDefault();
    //     console.error(this.actor.items.entries())
    //     this.actor.items.forEach((item) => {
    //         if (item.type == "standardSkill" || item.type == "professionalSkill" || item.type == "passion" || item.type == "combatStyle") {
    //             console.error(item)
    //             if (item.system.fumbled) {
    //                 item.applyClass = "fumbled-notifier";
    //             } else {
    //                 item.applyClass = "";
    //             }
    //         }
    //     });
    // }

}

export { ActorSheetMythras }