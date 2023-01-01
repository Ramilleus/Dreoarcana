import { ActorMythras } from '@actor'
import { HitLocationMythras } from '@item/hit-location'
import { MeleeWeaponMythras } from '@item/weapon/melee-weapon'
import { RangedWeaponMythras } from '@item/weapon/ranged-weapon'
import { SkillMythras } from '@item/skill'
import { WeaponMythras } from '@module/item/weapon/base'

export class Roller {
  constructor(private actor: ActorMythras) {}

  public async rollMeleeDamage(weapon: MeleeWeaponMythras) {
    await this.rollDamage('systems/mythras/templates/chat/damage/melee-roll.hbs', weapon)
  }

  public async rollRangedDamage(weapon: RangedWeaponMythras) {
    await this.rollDamage('systems/mythras/templates/chat/damage/ranged-roll.hbs', weapon)
  }

  private async rollDamage(rollTemplate: string, weapon: WeaponMythras) {
    let roll = new Roll(weapon.damageRoll, this.actor.system as any)

    let labelHtml = await renderTemplate(rollTemplate, {
      weapon: weapon
    })

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: labelHtml
    })
  }

  public async rollHitLocation() {
    let roll = new Roll('1d20', this.actor.system as any)
    const result: number = Number((await roll.evaluate({ async: true })).result) || 0
    let label = game.i18n.localize('MYTHRAS.Rolling_Location')

    const locationsHit = this.actor.itemTypes.hitLocation.filter((location: HitLocationMythras) => {
      return result >= Number(location.rollRangeStart) && result <= Number(location.rollRangeEnd)
    })
    locationsHit.forEach((location) => {
      label += '<br><h2>' + location.name + '</h2>'
    })

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    })
  }

  public async rollSkill(
    skill: SkillMythras
  ): Promise<ChatMessage> {
    // Calculate difficulty grades based on skill value
    let difficultyGrades = [2, 1.5, 1, 2 / 3, 0.5, 0.1].map(function (x) {
      return Math.ceil(x * Number(skill.totalVal))
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

    // Get encumberance and fatigue modifier text
    let modifiers = this.getSkillRollModifiers(skill)

    // Create roll label, like "Rolling: <skill_name>"
    let rollLabel = game.i18n.localize('MYTHRAS.Rolling') + ` ${skill.name}`

    // Make the roll
    let roll = new Roll('1d100', this.actor.system as any)
    const rolled = await roll.evaluate({ async: true })

    // Get results of the rolls at given grades, (e.g. Success, Failure, Critical, Fumble)
    let rollResults = this.getSkillRollResults(difficultyNames, difficultyGrades, rolled)

    // Render the skill roll chat message content
    let htmlContent = await renderTemplate('systems/mythras/templates/chat/skill-roll.hbs', {
      game: game,
      rollResults: rollResults,
      modifiers: modifiers
    })

    // Display the roll
    return roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: rollLabel,
      content: htmlContent
    })
  }

  private getSkillRollModifiers(skill: SkillMythras) {
    let modifiers = []

    // Include Fatigue Penalty value if character is not fresh
    let fatigueLevelName = this.actor.fatigue.currentLevelName
    if (fatigueLevelName !== 'fresh') {
      modifiers.push({
        name: 'Fatigue Mod',
        value: this.actor.fatigue.currentLevel.skillGrade
      })
    }

    //Include ENC Penalty if skill suffers ENC penalty and character is encumbered
    if (skill.encPenalty) {
      if (this.actor.encumbrance.skillPenalty) {
        modifiers.push({
          name: 'ENC Mod',
          value: this.actor.encumbrance.skillPenalty
        })
      }
    }
    return modifiers
  }

  private getSkillRollResults(difficultyNames: any, difficultyGrades: any, rolled: any) {
    let results: any[] = []

    // For each difficulty grade, determine if the roll is a
    // Success, Failure, Critical, or Fumble
    difficultyNames.forEach((name: any, index: any) => {
      let result: any = {}
      result.difficultyName = name
      result.difficultyGrade = difficultyGrades[index]
      result.rollValue = rolled.result

      // Rolls above 95 are guaranteed Failures or Fumbles
      if (rolled.result > 95) {
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
}
