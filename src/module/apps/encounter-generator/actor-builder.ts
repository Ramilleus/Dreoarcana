import { ActorMythras } from "@module/actor"

export class EncounterGeneratorActorBuilder {
  public async createActor(skollEnemy: any, folder: string) {
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
      (await game.packs
        .get('mythras.standardSkill')
        .getDocuments()
        .then((result: any) => {
          result.forEach((skill: any, index: any) => {
            standardSkills[skill.name.toLocaleLowerCase()] = skill.system
          })
        })) as any
    )

    // Load professional skills from compendium
    promiseChain.then(
      (await game.packs
        .get('mythras.professionalSkill')
        .getDocuments()
        .then((result: any) => {
          result.forEach((skill: any, index: any) => {
            professionalSkills[skill.name.toLocaleLowerCase()] = skill.system
          })
        })) as any
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
            system: weaponData
          })
        })
        skillData.weapons = weaponNames.join(', ')
        actorItems.push({
          name: skillName,
          type: skillType,
          system: skillData
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
          system: skillData
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
          system: data
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
      ActorMythras.create({
        name: skollEnemy.name,
        type: 'character',
        system: actorData,
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

  public parseAbilites() {

  }
}
