export class EncounterGenerator extends Application {
  private skollProxyBaseUrl: string = "http://3.13.17.94/"

  filters!: {
    search: {
      text: string
    }
  }
  scrollLimit: number = 100
  totalTemplateCount: number = 0
  totalFilteredCount: number = 0
  lastScrollTop: number = 0
  constructor(options = {}) {
    super(options);

    this.injectActorDirectory()
    this.loadTemplates()
    this.prepareFilters()
  }

  prepareFilters() {
    this.filters = {
      search: {
        text: ""
      }
    }
  }

  get $templateList() {
    return this.element.find("div.template-list-rows");
  }
  

  override get title() {
    return "Mythras Encounter Generator";
  }

  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "encounter-generator",
      classes: [],
      template: "systems/mythras/templates/apps/encounter-generator/encounter-generator.html",
      width: 800,
      height: 700,
      resizable: true,
    });
  }

  override async _render(force?: boolean, options?: RenderOptions) {
    await super._render(force, options);
    const $list = this.$templateList
    if (this.scrollLimit < this.totalFilteredCount) {
      $list.scrollTop(this.lastScrollTop)
    }
    this.activateGeneratorListeners();
  }

  override async getData(options?: Partial<ApplicationOptions>): Promise<object> {
    return {
      templates: await this.getTemplatesPage(),
      filters: this.filters
    }
  }

  async getTemplatesPage() {
    let filtered = (await this.loadTemplates()).filter(this.filterTemplates.bind(this))
    this.totalFilteredCount = filtered.length
    return filtered.slice(0, this.scrollLimit)
  }

  filterTemplates(template: any) {
    const searchText = this.filters.search.text
    if (!searchText) {
      return true
    }
    if (template.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) {
      return true
    }
    if (template.race.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) {
      return true
    }

    return false
  }

  async loadTemplates(): Promise<any[]> {
    let response = await fetch(`${this.skollProxyBaseUrl}get_template_list`)
    let templates = await response.json()
    this.totalTemplateCount = templates.length
    return templates
  }

  override activateListeners($html: JQuery<HTMLElement>): void {
    super.activateListeners($html)
    const $filters = $html.find(".template-list-filters");
    const $searchInput = $filters.find('input[name=searchTerm]')
    $searchInput.on('keypress', (event) => {
      if(event.key === 'Enter')
      {
        this.search($searchInput)
      }
    });
    $filters.find('.search-button').on('click', (event) => {
      this.search($searchInput)
    })
  }

  private search($searchInput: JQuery<HTMLElement>) {
    this.filters.search.text = $searchInput.val() as string
    this.scrollLimit = 100
    this.lastScrollTop = 0
    this.render(true);
  }

  private activateGeneratorListeners() {
    const $list = this.$templateList
    //if ($list.length === 0) return;
  
    $list.on("scroll", async (event) => {
      if (this.scrollLimit >= this.totalFilteredCount) {
        return
      }
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight === target.scrollHeight) {
          const currentValue = this.scrollLimit;
          const maxValue = this.totalTemplateCount ?? 0;
          if (currentValue < maxValue) {
              const newValue = Math.clamped(currentValue + 100, 100, maxValue);
              this.scrollLimit = newValue;
              this.lastScrollTop = target.scrollTop
              this.render(true);
          }
      }
    });

    const  $importButtons = this.element.find('.import-button')
    $importButtons.on('click', (event) => {
      let target = event.target
      let id = $(target.closest('[data-template-id]')).attr('data-template-id')
      this.import(id)
    })
  }

  injectActorDirectory() {
    const $html = ui.actors.element
    if ($html.find('.encounter-generator-btn').length > 0) return

    // Bestiary Browser Buttons
    const encounterGeneratorButton = $(
      `<div class="encounter-generator-btn-container"><button class="encounter-generator-btn">Mythras Encounter Generator</button></div>`
    )

    if (game.user.isGM) {
      $html.find('footer').append(encounterGeneratorButton)
    }
    
      // Handle button clicks
    encounterGeneratorButton.on("click", (ev) => {
      ev.preventDefault();
      this._render(true)
    });
  }

  private async import(id: string) {
    let response = await fetch(`${this.skollProxyBaseUrl}generate_enemy_json?id=${id}`)
    let template = await response.json()
    let skollEnemy = template[0]
    await this.createActor(skollEnemy, null)
  }
  
  private async createActor(skollEnemy: any, folder: string) {
    /**************** Setup ******************/
    let actorData: any = {}
    actorData.characteristics = {}
    let actorItems: any = []

    let standardSkills: any = {}
    let professionalSkills: any = {}
    let magicSkills = [
      'Folk Magic',
      'Binding',
      'Trance',
      'Mysticism',
      'Meditation',
      'Devotion',
      'Exhort',
      'Invocation',
      'Shaping'
    ]
    let featuresList: any = []
    let abilities = ''
    let promiseChain = Promise.resolve()

    // Load standard skills from compendium
    promiseChain.then(
      await game.packs
        .get('mythras.standardSkill')
        .getDocuments()
        .then((result) => {
          result.forEach((skill: any, index) => {
            standardSkills[skill.data.name.toLocaleLowerCase()] = skill.data.data
          })
        }) as any
    )

    // Load professional skills from compendium
    promiseChain.then(
      await game.packs
        .get('mythras.professionalSkill')
        .getDocuments()
        .then((result) => {
          result.forEach((skill: any, index) => {
            professionalSkills[skill.data.name.toLocaleLowerCase()] = skill.data.data
          })
        }) as any
    )

    /******* Map Skoll Data to Actor Data *********/
    // Characteristics
    promiseChain.then(() => {
      skollEnemy.stats.forEach((stat: any) => {
        let statName = Object.keys(stat)[0]
        let statNameLower = statName.toLocaleLowerCase()
        actorData.characteristics[statNameLower] = {
          value: stat[statName],
          mod: 0
        }
      })
    })
    // Combat Styles and Weapons
    promiseChain.then(() => {
      skollEnemy['combat_styles'].forEach((skill: any) => {
        let skillName = skill.name
        let skillType = 'combatStyle'
        let skillData: any = {}
        let baseScore =
          actorData.characteristics['str'].value + actorData.characteristics['dex'].value
        let trainingScore = Number(skill.value) - Number(baseScore)
        skillData.trainingVal = trainingScore
        let weaponNames: any = []
        skill.weapons.forEach((weapon: any) => {
          weaponNames.push(weapon.name)
          let weaponData: any = {}
          let name = ''
          let type = 'melee-weapon'

          name = weapon.name
          weaponData.ap = weapon.ap
          weaponData.hp = weapon.hp
          weaponData.damage = weapon.damage
          weaponData.damageModifier = weapon['add_damage_modifier']
          weaponData['combat-effects'] = weapon.effects
          if (weapon.type === 'ranged') {
            type = 'ranged-weapon'
            let rangeInc = weapon.range.split('/')
            if (rangeInc.length === 3) {
              weaponData.range = {
                close: rangeInc[0],
                effective: rangeInc[1],
                long: rangeInc[2]
              }
            }
            weaponData.force = weapon.size
          } else {
            type = 'melee-weapon'
            name += weapon.type.includes('2h') ? ' (Two-handed)' : ''
            weaponData.reach = weapon.reach
            weaponData.size = weapon.size
          }
          actorItems.push({
            name: name,
            type: type,
            data: weaponData
          })
        })
        skillData.weapons = weaponNames.join(', ')
        actorItems.push({
          name: skillName,
          type: skillType,
          data: skillData
        })
      })
    })
    // Skills
    promiseChain.then(() => {
      skollEnemy.skills.forEach((skill: any) => {
        let skillName = Object.keys(skill)[0]
        let skillNameLower = skillName.toLocaleLowerCase()
        let skillType = ''
        let skillData: any = {}
        let primaryChar = 11
        if (actorData.characteristics[skillData.primaryChar] !== undefined) {
          primaryChar = actorData.characteristics[skillData.primaryChar].value
        }
        let secondaryChar = 11
        if (actorData.characteristics[skillData.secondaryChar] !== undefined) {
          secondaryChar = actorData.characteristics[skillData.secondaryChar].value
        }
        if (standardSkills[skillNameLower]) {
          skillType = 'standardSkill'
          skillData = standardSkills[skillNameLower]
          let baseScore = primaryChar + secondaryChar
          let trainingScore = skill[skillName] - baseScore
          skillData.trainingVal = trainingScore
        } else if (magicSkills.includes(skillName)) {
          skillType = 'magicSkill'
          skillData = professionalSkills[skillNameLower]
          let baseScore = primaryChar + secondaryChar
          let trainingScore = skill[skillName] - baseScore
          skillData.trainingVal = trainingScore
        } else if (professionalSkills[skillNameLower]) {
          skillType = 'professionalSkill'
          skillData = professionalSkills[skillNameLower]
          let baseScore = primaryChar + secondaryChar
          let trainingScore = skill[skillName] - baseScore
          skillData.trainingVal = trainingScore
        } else if (skillName.split(':')[0].trim() === 'Passion') {
          let oldSkillName = skillName
          skillName = skillName.split(':')[1].trim()
          skillType = 'passion'
          let baseScore = primaryChar + secondaryChar
          let trainingScore = skill[oldSkillName] - baseScore
          skillData = {
            description: '',
            primaryChar: 'int',
            secondaryChar: 'int',
            baseVal: { value: 0, init: 0 },
            trainingVal: trainingScore,
            miscBonus: 0,
            totalVal: 0
          }
        } else {
          skillType = 'professionalSkill'
          let baseScore =
            actorData.characteristics['str'].value + actorData.characteristics['str'].value
          let trainingScore = skill[skillName] - baseScore
          skillData = {
            description: '',
            primaryChar: 'str',
            secondaryChar: 'str',
            baseVal: { value: baseScore, init: baseScore },
            trainingVal: trainingScore,
            miscBonus: 0,
            totalVal: skill[skillName]
          }
        }

        actorItems.push({
          name: skillName,
          type: skillType,
          data: skillData
        })
      })
    })
    // Hit Locations
    promiseChain.then(() => {
      skollEnemy.hit_locations.forEach((hitLocation: any) => {
        let type = 'hitLocation'

        let name = hitLocation.name

        let rollRanges = hitLocation.range.split('-')
        let rollRangeStart = parseInt(rollRanges[0], 10)
        let rollRangeEnd = parseInt(rollRanges[1], 10)

        let con = 11
        if (actorData.characteristics['con'] !== undefined) {
          con = actorData.characteristics['con'].value
        }
        let siz = 11
        if (actorData.characteristics['siz'] !== undefined) {
          siz = actorData.characteristics['siz'].value
        }
        let hpBonus = Math.ceil((Number(con) + Number(siz)) / 5)
        let baseHp = hitLocation.hp - hpBonus
        let currentHp = hitLocation.hp

        let data = {
          rollRangeStart: rollRangeStart,
          rollRangeEnd: rollRangeEnd,
          baseHp: baseHp,
          naturalArmor: hitLocation.ap,
          maxHp: 0,
          currentHp: currentHp
        }

        actorItems.push({
          name: name,
          type: type,
          data: data
        })
      })
    })
    // Abilities and Journal
    promiseChain.then(() => {
      if (skollEnemy.features.length > 0) {
        featuresList.push('<h2>Features</h2>')
        skollEnemy.features.forEach((feature: any) => {
          if (feature.includes('Ability')) {
            let featureSplit = feature.split('***')
            let featureJoin = '<strong>' + featureSplit[1] + ':</strong> ' + featureSplit[2]
            featuresList.push(featureJoin)
          } else {
            featuresList.push(feature)
          }
        })
      }
      if (skollEnemy['folk_spells'].length > 0) {
        featuresList.push('<br>')
        featuresList.push('<h2>Folk Magic</h2>')
        featuresList = featuresList.concat(skollEnemy['folk_spells'])
      }
      if (skollEnemy['theism_spells'].length > 0) {
        featuresList.push('<br>')
        featuresList.push('<h2>Theism</h2>')
        featuresList = featuresList.concat(skollEnemy['theism_spells'])
      }
      if (skollEnemy['sorcery_spells'].length > 0) {
        featuresList.push('<br>')
        featuresList.push('<h2>Sorcery</h2>')
        featuresList = featuresList.concat(skollEnemy['sorcery_spells'])
      }
      if (skollEnemy['spirits'].length > 0) {
        featuresList.push('<br>')
        featuresList.push('<h2>Animism</h2>')
        let spiritList = ''
        skollEnemy.spirits.forEach((spirit: any) => {
          spiritList += '<h3>' + spirit.name + '</h3>'
          spiritList += '<ul>'
          if (spirit.features.length > 0) {
            spiritList += '<li><strong>Spirit Abilities</strong></li>'
            spiritList += '<ul><li>'
            spiritList += spirit.features.join('</li><li>')
            spiritList += '</li></ul>'
          }
          spiritList += `<li><strong>Characteristics:</strong> INT: ${spirit.stats[0].INT}, POW: ${spirit.stats[1].POW}, CHA: ${spirit.stats[2].CHA}`
          spiritList += `<li><strong>Attributes:</strong> 
            Intensity: ${spirit.attributes['spirit_intensity']}, 
            Magic Points: ${spirit.attributes['magic_points']}, 
            Spirit Damage: ${spirit.attributes['spirit_damage']}, 
            Initiative: ${spirit.attributes['strike_rank']}, 
            Action Points: ${spirit.attributes['action_points']}</li>`
          if (spirit.skills.length > 0) {
            spiritList += '<li><strong>Skills:</strong> '
            let tempSkillList: any = []
            spirit.skills.forEach((skill: any) => {
              let skillName = Object.keys(skill)[0]
              tempSkillList.push(skillName + ': ' + skill[skillName])
            })
            spiritList += tempSkillList.join(', ')
          }
          if (spirit['folk_spells'].length > 0) {
            spiritList +=
              '<li><strong>Folk Magic:</strong> ' + spirit['folk_spells'].join(', ') + '</li>'
          }
          if (spirit['theism_spells'].length > 0) {
            spiritList +=
              '<li><strong>Theism:</strong> ' + spirit['theism_spells'].join(', ') + '</li>'
          }
          if (spirit['sorcery_spells'].length > 0) {
            spiritList +=
              '<li><strong>Sorcery:</strong> ' + spirit['sorcery_spells'].join(', ') + '</li>'
          }
          if (spirit.notes.length > 0) {
            spiritList += '<li><strong>Notes:</strong> ' + spirit.notes
          }
          spiritList += '</ul>'
        })

        featuresList.push(spiritList)
      }
      abilities += featuresList.join('<br>')
      actorData.abilitiesDesc = abilities
      actorData.journal = skollEnemy.notes
    })
    // Add additional promises to the chain here for weapons and other stuff
    // (adding to the chain is not strictly necessary but helpful for organization. Also guarantees the order things will be run)

    /*********** Create the Actor *************/
    promiseChain.then(() => {
      Actor.create({
        name: skollEnemy.name,
        type: 'character',
        data: actorData,
        items: actorItems,
        folder: folder
      }).then((actor) => {
        // May need to add armor to the actor here since hitlocs exists here (or add another promise to the chain after the actor create one? i dunno)
        // Testing that hitlocs exist here
        let skollmod = skollEnemy.attributes.strike_rank
        let mod: any = 0
        if (skollmod.includes('-')) {
          let splitArray = skollmod.split('-')
          mod = '-' + splitArray[splitArray.length - 1].split(')')[0]
        } else if (skollmod.includes('+')) {
          let splitArray = skollmod.split('+')
          mod = splitArray[splitArray.length - 1].split(')')[0]
        }
        if (mod !== 0) {
          actor.update({
            ['data.attributes.initiativeBonus.mod']: Number(mod)
          })
        }
      })
    })
  }
}