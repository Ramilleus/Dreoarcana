/* global $ */
import { ActorData, ActorMythras } from '@actor/base'
import { ItemMythras } from '@item/base'
import { HitLocationMythras } from '@item/hit-location'
import { CultBrotherhoodMythras } from '@item/cult-brotherhood'
import { MagicSkillMythras } from '@item/magic-skill'
import { SkillMythras } from '@item/skill'
import { SpellMythras } from '@item/spell'
import { StorageMythras } from '@item/storage'
import { Roller } from '@module/roller'
import { SheetPostRender } from '@module/sheet-common/sheet-post-render'
import { ActorAttributes } from "@actor/attribute";
import { ActorCharacteristic, ActorCharacteristics } from "@actor/characteristic";
import { EquipmentTypes } from '@item/equipment'

export abstract class ActorSheetBase<TActor extends ActorMythras>
  extends ActorSheet<TActor, ItemMythras> {
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

  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      dragDrop: [{dragSelector: ['.item'], dropSelector: null}]
    })
  }

  /**
   * @returns All data needed to render the template of this actor
   */
  override async getData(options: ActorSheetOptions = this.options): Promise<ActorSheetData<TActor>> {
    options.id ||= this.id;

    let actorSystem: ActorData = this.actor.system;
    let actorAttributes: ActorAttributes = actorSystem.attributes;
    let actorChar: any = actorSystem.characteristics;

    const data: any = {
      items: {...this.actor.itemTypes},
      armorPenalty: this.actor.armorPenalty,
      fatigue: this.actor.fatigue,
      encumbrance: this.actor.encumbrance,
      movement: this.actor.movement,
      statTracker: this.actor.statTracker,
      magicSkillNames: this.actor.itemTypes.spell.map(spell => ({ value: spell.magicSkillName, label: spell.magicSkillName })).filter((v, i, a) => a.findIndex(o => o.value === v.value) === i),
      editable: this.isEditable,
      system: actorSystem,
      actor: this.actor,
      isClassicTheme: game.mythras.theme.isClassic(),
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
          currentValue: actorAttributes.actionPoints.value,
          derivedValue: this.actor.maxActionPoints,
          modifierName: "system.attributes.actionPoints.mod",
          modifierValue: actorAttributes.actionPoints.mod,
        },
        damageMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.DAMAGE_MOD',
          derivedName: 'damageMod',
          derivedValue: this.actor.damageMod,
          modifierName: "system.attributes.damageMod.mod",
          modifierValue: actorAttributes.damageMod.mod
        },
        experienceMod: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.EXPERIENCE_MOD',
          derivedName: 'experienceMod',
          derivedValue: this.actor.experienceMod,
          modifierName: "system.attributes.experienceMod.mod",
          modifierValue: actorAttributes.experienceMod.mod
        },
        healingRate: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.HEALING_RATE',
          derivedName: 'healingRate',
          derivedValue: this.actor.healingRate,
          modifierName: "system.attributes.healingRate.mod",
          modifierValue: actorAttributes.healingRate.mod
        },
        initiativeBonus: {
          isAttribute: true,
          tracked: false,
          label: 'MYTHRAS.INITIATIVE_BONUS',
          derivedName: 'initiativeBonus',
          derivedValue: this.actor.initiativeBonus,
          modifierName: "system.attributes.initiativeBonus.mod",
          modifierValue: actorAttributes.initiativeBonus.mod
        },
        luckPoints: {
          isAttribute: true,
          tracked: true,
          label: 'MYTHRAS.LUCK_POINTS',
          derivedName: 'maxLuckPoints',
          currentValue: actorAttributes.luckPoints.value,
          derivedValue: this.actor.maxLuckPoints,
          modifierName: "system.attributes.luckPoints.mod",
          modifierValue: actorAttributes.luckPoints.mod
        },
        magicPoints: {
          isAttribute: true,
          tracked: true,
          label: game.mythras.theme.getTheme().relabel("Actor-getData", 'MYTHRAS.MAGIC_POINTS'),
          derivedName: 'maxMagicPoints',
          currentValue: actorAttributes.magicPoints.value,
          derivedValue: this.actor.maxMagicPoints,
          modifierName: "system.attributes.magicPoints.mod",
          modifierValue: actorAttributes.magicPoints.mod
        },
        tenacity: {
          isAttribute: false,
          tracked: true,
          label: 'MYTHRAS.TENACITY',
          derivedName: 'maxTenacity',
          currentValue: actorAttributes.tenacity.value,
          derivedValue: this.actor.maxTenacity,
          modifierName: "system.attributes.tenacity.mod",
          modifierValue: actorAttributes.tenacity.mod
        },
        experienceRoll: {
          isAttribute: false,
          tracked: true,
          label: 'MYTHRAS.EXPERIENCE_ROLLS',
          currentValue: actorAttributes.experienceRoll
        }
      },
      characteristics: {
        str:{
          derivedValue: this.actor.characteristics.str,
          value: actorChar.str.value,
          mod: this.actor.characteristicsMod.str,
          label: "MYTHRAS.STRENGTH"
        },
        con:{
          derivedValue: this.actor.characteristics.con,
          value: actorChar.con.value,
          mod: this.actor.characteristicsMod.con,
          label: "MYTHRAS.CONSTITUTION"
        },
        siz:{
          derivedValue: this.actor.characteristics.siz,
          value: actorChar.siz.value,
          mod: this.actor.characteristicsMod.siz,
          label: "MYTHRAS.SIZE"
        },
        dex:{
          derivedValue: this.actor.characteristics.dex,
          value: actorChar.dex.value,
          mod: this.actor.characteristicsMod.dex,
          label: "MYTHRAS.DEXTERITY"
        },
        int:{
          derivedValue: this.actor.characteristics.int,
          value: actorChar.int.value,
          mod: this.actor.characteristicsMod.int,
          label: "MYTHRAS.INTELLIGENCE"
        },
        pow:{
          derivedValue: this.actor.characteristics.pow,
          value: actorChar.pow.value,
          mod: this.actor.characteristicsMod.pow,
          label: "MYTHRAS.POWER"
        },
        cha:{
          derivedValue: this.actor.characteristics.cha,
          value: actorChar.cha.value,
          mod: this.actor.characteristicsMod.cha,
          label: "MYTHRAS.CHARISMA"
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
      equipmentTypes: EquipmentTypes
    }

    // Journal HTML enrichment
    data.journalHTML = await TextEditor.enrichHTML(data.system.journal, {
      secrets: this.actor.isOwner,
      rollData: data.rollData
    });

    // Abilities HTML enrichment
    data.abilitiesDesc = await TextEditor.enrichHTML(data.system.abilitiesDesc, {
      secrets: this.actor.isOwner,
      rollData: data.rollData
    });
    
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
    const segments = $(`[id^="CharacterSheetMythras-"][id$="-Actor-${this.actor.id}"] .encumbrance-bar .percent-segment-filled`)
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

      if (currentHp <= hitLocation.maxHp * -1 && !!hitLocationElement) {
        hitLocationElement.style.backgroundColor = '#c5000094'

      } else if (currentHp <= 0 && !!hitLocationElement) {
        hitLocationElement.style.backgroundColor = '#ed5b1585'

      }
    }
  }

  private hideMinimizedStats() {
    this.element.find('[data-stat-name]').each((_: any, stat: HTMLInputElement) => {
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

    // Skill roll button listeners
    html.find('.rollableSkill').on('contextmenu', (event: any) => this.handleItemRoll(event, this.roller.rollSkill.bind(this.roller)));
    html.find('.rollableSkill').on('click', (event: any) => this.handleSkillRollClick(event));


    // Melee Weapon roll button listener
    html.find('.rollableMeleeDamage').on('click', (event: any) => this.handleItemRoll(event, this.roller.rollMeleeDamage.bind(this.roller)));

    // Ranged Weapon roll button listener
    html.find('.rollableRangedDamage').on('click', (event: any) => this.handleItemRoll(event, this.roller.rollRangedDamage.bind(this.roller)));

    // Hit Location roll button listener
    html.find('.roll-hitlocations-button').on('click', (event: any) => {
      event.preventDefault();
      this.roller.rollHitLocation();
    });

    // Skill roll button listener
    html.find('.recoverCharacteristicPools').on('click', (event: any) => this.handleRecoverCharacteristicPools(event))

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
    const data = foundry.utils.duplicate(header.dataset)
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

  //@ts-ignore
  private handleItemRoll(event: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>, rollFunction: (item: Item<ActorMythras>) => any) {
    event.preventDefault();
    const itemId = $(event.currentTarget.closest('[data-item-id]')).attr('data-item-id');
    const item = this.actor.items.get(itemId);
    rollFunction(item);
  }

  private async handleSkillRollClick(event: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
    event.preventDefault();
    // Identify which skill was clicked
    const li = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-item-id]');
    const skillId = li?.dataset.itemId;
    let skill: SkillMythras;
    if (!skillId) {
      skill = this.actor.sortedSkills[0];
      if (!skill) {
        return;
      }
    } else {
      skill = this.actor.items.get(skillId) as unknown as SkillMythras;
    }
    this.handleSkillRoll(skill);
   
  }  

  public async handleSkillRoll(skill: SkillMythras, contestedRollOptions?: { contestedSkill?: SkillMythras, contestedActor?: ActorMythras, contestedSuccess?: string, contestedScore?: number, contestedRollDifficulty?: number, contestedRollAugmentation?: string }) {    
    // Check if the roll is contested.
    let isContestedRoll = false;
    if (!!contestedRollOptions && !!contestedRollOptions.contestedSkill && !!contestedRollOptions.contestedActor && !!contestedRollOptions.contestedSuccess && !!contestedRollOptions.contestedScore && !!contestedRollOptions.contestedRollDifficulty) {
      isContestedRoll = true;
    }

    const targetTokenActor = game.user.targets.first()?.actor as ActorMythras;
    const isTokenTargeted = !!targetTokenActor && targetTokenActor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED);
    let targetName = ``;
    let targetAugmentSkills;      
    if (isTokenTargeted) {
      targetName = targetTokenActor.name;
      targetAugmentSkills = targetTokenActor.sortedSkills
      .map(i => {
        const s = i as unknown as SkillMythras;
        return { id: s.id, label: `${s.name} (${s.totalVal}%)` };
      });
    }

    // 1) Build a text summary of the current modifiers for the tooltip
    const modifiersList = this.roller.getSkillRollModifiers(skill);
    let modText = modifiersList
      .map(m => {
          return `<strong>${m.name}:</strong><br/> ${m.value}`;
      })
      .join('<br/>');
    let isModTextVisible = true;
    if (!modText) {
      modText = game.i18n.localize('MYTHRAS.No_Penalties');
      isModTextVisible = false;
    }

    // Prepare difficulty labels
    const difficulties = [
      game.i18n.localize('MYTHRAS.very_easy_dif'),
      game.i18n.localize('MYTHRAS.easy_dif'),
      game.i18n.localize('MYTHRAS.standard_dif'),
      game.i18n.localize('MYTHRAS.hard_dif'),
      game.i18n.localize('MYTHRAS.formidable_dif'),
      game.i18n.localize('MYTHRAS.herculean_dif')
    ].map((label, idx) => ({value: idx, label, selected: idx === 2}));

    // Prepare augmentable skills
    const augmentSkills = this.actor.sortedSkills
      //.filter(i => i.id !== skill.id) // prevent a character from augmenting a skill with their same skill (currently broken since it doesn't account for the ability to change the selected skill)
      .map(i => {
        const s = i as unknown as SkillMythras;
        return { id: s.id, label: `${s.name} (${s.totalVal}%)`, selected: s.id === skill.id };
      });

    const content = await renderTemplate('systems/mythras/templates/dialogs/skillRoll-dialog.hbs',
      {
        skillName: skill.name,
        skillTotal: skill.totalVal,
        modText,
        difficulties,
        augmentSkills,
        isTokenTargeted,
        targetName,
        targetAugmentSkills,
        isModTextVisible,
        areLuckPointsAvailable: (Number(this.actor.statTracker.trackedStats.luckPoints.value) > 0) ? true : false
      }
    );

    // Show the dialog
    new Dialog({
      title: `${isContestedRoll ? `${game.i18n.localize('MYTHRAS.Contested')} ` : ``}${game.i18n.localize('MYTHRAS.Roll')}`,
      content,

      buttons: {
        roll: {
          icon: '<i class="fas fa-dice"></i>',
          label: game.i18n.localize('MYTHRAS.Roll'),
          callback: (dlgHtml: JQuery) => {
            const form = dlgHtml.find('form')[0] as HTMLFormElement;
            const data = new FormData(form);

            const difficulty = Number(data.get('difficulty'));
            const augmentOption = String(data.get('augmentOption'));

            let capSkill: SkillMythras | undefined;
            let augmentSkill: SkillMythras | undefined;
            let targetAugmentSkill: SkillMythras | undefined;
            let customAugment: number | undefined;
            let customAugmentReason: string | undefined;
            const useLuckPoint : string = String(data.get('useLuckPoint'));

            switch (augmentOption) {
              case 'skillCap': {
                const cid = String(data.get('capSkill') || '');
                capSkill = cid
                  ? this.actor.items.get(cid) as unknown as SkillMythras
                  : undefined;
                break;
              }
              case 'skillAugment': {
                const aid = String(data.get('augmentSkill') || '');
                augmentSkill = aid
                  ? this.actor.items.get(aid) as unknown as SkillMythras
                  : undefined;
                break;
              }
              case 'customAugment': {
                customAugment = Number(data.get('augmentCustomValue'));
                customAugmentReason = String(data.get('augmentCustomReason'));
                break;
              }
              case 'targetSkillAugment': {
                const aid = String(data.get('targetAugmentSkill') || '');
                targetAugmentSkill = aid
                  ? targetTokenActor.items.get(aid) as unknown as SkillMythras
                  : undefined;
                break;
              }
            }

            this.roller.rollSkillWithOptions
            (
              skill, 
              { 
                difficulty, 
                capSkill, 
                augmentSkill, 
                customAugment, 
                customAugmentReason, 
                targetAugmentSkill, 
                targetName,
                isContestedRoll,
                useLuckPoint,
                contestedActor: contestedRollOptions?.contestedActor,
                contestedSkill: contestedRollOptions?.contestedSkill,
                contestedSuccess: contestedRollOptions?.contestedSuccess,
                contestedScore: contestedRollOptions?.contestedScore,
                contestedRollDifficulty: contestedRollOptions?.contestedRollDifficulty,
                contestedRollAugmentation: contestedRollOptions?.contestedRollAugmentation
              }
            );
          }
        }
      },
      default: 'roll',
      render: (dlgHtml: JQuery) => {
        // Find the form and containers
        const form = dlgHtml.find('form');
        const skillCap = form.find('#cap-skill-container');
        const skillAugment = form.find('#augment-skill-container');
        const customAugment = form.find('#augment-custom-container');
        const targetSkillAugment = form.find('#target-augment-skill-container');
        const augmentSkillSelect = form.find('#augment-skill-container select[name="augmentSkill"]');
        const capSkillSelect = form.find('#cap-skill-container select[name="capSkill"]');

        // Hide them all initially
        skillCap.hide();
        skillAugment.hide();
        customAugment.hide();
        targetSkillAugment.hide();

        // In the "Augment With..." dropdown, show all options then hide the picked one
        augmentSkillSelect.find('option').show();  
        augmentSkillSelect.find(`option[value="${skill.id}"]`).hide().prop('selected', false);
        if (augmentSkillSelect.val() === skill.id) {
          const availableOptions = augmentSkillSelect.find('option').not('[style*="display: none"]');
          if (availableOptions.length > 0) {
            augmentSkillSelect.val(availableOptions.first().val()); 
          } else {
            augmentSkillSelect.val(''); 
          }
        }

        // In the "Cap By..." dropdown, show all options then hide the picked one
        capSkillSelect.find('option').show();  
        capSkillSelect.find(`option[value="${skill.id}"]`).hide().prop('selected', false);
        if (capSkillSelect.val() === skill.id) {
          const availableOptions = capSkillSelect.find('option').not('[style*="display: none"]');
          if (availableOptions.length > 0) {
            capSkillSelect.val(availableOptions.first().val()); 
          } else {
            capSkillSelect.val(''); 
          }
        }

        // On radio change, show/hide appropriately
        form.on('change', 'input[name="augmentOption"]', ev => {
          const val = (ev.currentTarget as HTMLInputElement).value;
          skillCap.hide();
          skillAugment.hide();
          customAugment.hide();
          targetSkillAugment.hide();

          switch (val) {
            case 'skillCap':
              skillCap.show();
              break;
            case 'skillAugment':
              skillAugment.show();
              break;
            case 'customAugment':
              customAugment.show();
              break;
            case 'targetSkillAugment':
              targetSkillAugment.show();
              break;
          }
        });
        form.on('change', 'select[name="rolledSkill"]', (event) => {
          const select = event.currentTarget as HTMLSelectElement;
          const skillId = select.value; // same as $(select).val()

          // Lookup and reset your skill variable
          skill = this.actor.items.get(skillId) as unknown as SkillMythras;

          // In the "Augment With..." dropdown, show all options then hide the picked one
          augmentSkillSelect.find('option').show();
          augmentSkillSelect.find(`option[value="${skillId}"]`).hide().prop('selected', false);

          // In the "Cap By..." dropdown, show all options then hide the picked one
          capSkillSelect.find('option').show();  
          capSkillSelect.find(`option[value="${skillId}"]`).hide().prop('selected', false);
        });
      }
    }, {width: 600, height: 440, resizable: true}).render(true);
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

  /**
   * Theme M-Space introduced a conflict pool mechanic which is based on the primary characteristics.
   * These pools are depleted by use and need to be refilled by resting.
   */
  //@ts-ignore
  private handleRecoverCharacteristicPools(event: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
    let k: keyof ActorCharacteristics;
    for (k in this.actor.system.characteristics) {
      const actorCharacteristic: ActorCharacteristic = this.actor.system.characteristics[k];
      if (actorCharacteristic.value != actorCharacteristic.pool) {
        actorCharacteristic.pool = actorCharacteristic.value;
      }
    }
    this.render(false)
  }
}
