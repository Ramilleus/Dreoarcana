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

  private async rollDamage(rollTemplate: string, weapon: WeaponMythras): Promise<ChatMessage> {
    
    let roll = new Roll(weapon.damageRoll, this.actor.system as any)
    let labelHtml = await renderTemplate(rollTemplate, {
      weapon: weapon
    })
    console.log(weapon.system.damage)
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: labelHtml
    })
  }

  public async rollHitLocation() {
      let roll = new Roll('1d20', this.actor.system as any)
      const normalRoll: number = Number((await roll.evaluate()).result) || 0
      let label = game.i18n.localize('MYTHRAS.Rolling_Location')

      let lowerRoll = Math.ceil(Number(normalRoll) / 2);
      let upperRoll = lowerRoll + 10;

      //hit location roll with half the d20 roll + 10 (similar to rolling a d10 but I prefered to keep the roll the same)
      //for upper body hits (such as when striking someone behind cover and such)
      const upperHitLocation = this.actor.itemTypes.hitLocation.filter((location: HitLocationMythras) => {
        return upperRoll >= Number(location.rollRangeStart) && upperRoll <= Number(location.rollRangeEnd)
      })[0];
      let upperHit = upperHitLocation.name;
      if (upperHitLocation.wardLocation) {
        upperHit += " (Warded)";
      }

      //normal hit location roll of d20
      const normalHitLocation = this.actor.itemTypes.hitLocation.filter((location: HitLocationMythras) => {
        return normalRoll >= Number(location.rollRangeStart) && normalRoll <= Number(location.rollRangeEnd)
      })[0];
      let normalHit = normalHitLocation.name;
      if (normalHitLocation.wardLocation) {
        normalHit += " (Warded)";
      }

      //hit location roll with half the d20 roll
      //for lower body hits (such as when striking a rider)
      const lowerHitLocation = this.actor.itemTypes.hitLocation.filter((location: HitLocationMythras) => {
        return lowerRoll >= Number(location.rollRangeStart) && lowerRoll <= Number(location.rollRangeEnd)
      })[0];
      let lowerHit = lowerHitLocation.name;
      if (lowerHitLocation.wardLocation) {
        lowerHit += " (Warded)";
      }

      roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
      });

      let htmlContent = await renderTemplate("systems/mythras/templates/chat/location-roll.hbs", {
          game: game,
          upperHit: upperHit,
          upperRoll: upperRoll,
          normalHit: normalHit,
          normalRoll: normalRoll,
          lowerHit: lowerHit,
          lowerRoll: lowerRoll
      });
      return roll.toMessage({
          //user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: htmlContent
      });
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
    // @ts-ignore
    const rolled = await roll.evaluate()

    // Get results of the rolls at given grades, (e.g. Success, Failure, Critical, Fumble)
    let rollResults = this.getSkillRollResults(difficultyNames, difficultyGrades, rolled)

    // Render the skill roll chat message content
    let htmlContent = await renderTemplate('systems/mythras/templates/chat/skill-roll.hbs', {
      game: game,
      rollResults: rollResults,
      modifiers: modifiers,
      isRollWithOptions: false
    })

    // Display the roll
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: rollLabel,
      content: htmlContent
    })
  }

  /**
   * Roll a single difficulty of a skill, optionally augmented by another skill.
   * Also account for a contested roll.
   */
  public async rollSkillWithOptions(
    skill: SkillMythras,
    options: { difficulty: number; capSkill?: SkillMythras; augmentSkill?: SkillMythras; customAugment?: number; customAugmentReason?: string; targetAugmentSkill?: SkillMythras; targetName?: string; isContestedRoll: boolean; useLuckPoint: string; contestedActor?: ActorMythras; contestedSkill?: SkillMythras; contestedSuccess?: string; contestedRollDifficulty?: number; contestedScore?: number; contestedRollAugmentation?: string; }
  ): Promise<ChatMessage> {
    const difficultyMultipliers = [2, 1.5, 1, 2 / 3, 0.5, 0.1];
    const actor = skill.actor;

    if (options.useLuckPoint == "character") {
      await actor.update({'system.trackedStats.luckPoints.value' : actor.statTracker.trackedStats.luckPoints.value - 1});
    }

    // Apply difficulty multiplier to skill value
    let skillScore = Math.ceil(Number(skill.totalVal) * difficultyMultipliers[options.difficulty]);

    // Apply skill augmentation/cap
    let augmentValue = 0;
    let augmentDesc = "";
    if (!!options.capSkill && options.capSkill.totalVal < skill.totalVal) {
      skillScore = Math.ceil(Number(options.capSkill.totalVal) * difficultyMultipliers[options.difficulty]);
      augmentDesc = `${game.i18n.localize('MYTHRAS.Capped_By')}: ${options.capSkill.name} (${options.capSkill.totalVal}%) (Max: ${skillScore}%)`;
    }
    else if (!!options.augmentSkill) {
      augmentValue = Math.ceil(Number(options.augmentSkill.totalVal) * 0.2 * difficultyMultipliers[options.difficulty]);
      skillScore += augmentValue;
      augmentDesc = `${game.i18n.localize('MYTHRAS.Augmented_By')}: ${options.augmentSkill.name} (${options.augmentSkill.totalVal}%) (+${augmentValue})`;
    }
    else if (!!options.customAugment) {
      augmentValue = options.customAugment;
      skillScore += augmentValue;
      augmentDesc = `${game.i18n.localize('MYTHRAS.Augmented_By')}: ${!options.customAugmentReason ? game.i18n.localize('MYTHRAS.Custom_Augment') : options.customAugmentReason}  (+${augmentValue})`;
    }
    else if (!!options.targetAugmentSkill) {
      augmentValue = Math.ceil(Number(options.targetAugmentSkill.totalVal) * 0.2 * difficultyMultipliers[options.difficulty]);
      skillScore += augmentValue;
      augmentDesc = `${game.i18n.localize('MYTHRAS.Augmented_By')} ${options.targetName ?? ``}: ${options.targetAugmentSkill.name} (${options.targetAugmentSkill.totalVal}%) (+${augmentValue})`;
    }

    // Roll the dice
    const roll = await new Roll("1d100", this.actor.system as any).evaluate();
    const score = Number(roll.result);

    // Determine success/failure/fumble/critical
    let description: string;
    if (score > 95) {
      description = (score === 100 || (score === 99 && skillScore <= 100))
        ? "MYTHRAS.FUMBLE!" : "MYTHRAS.FAILURE!";
    } else if (score <= 5) {
      description = (score === 1 || score <= Math.ceil(skillScore * 0.1))
        ? "MYTHRAS.CRITICAL!" : "MYTHRAS.SUCCESS!";
    } else {
      description = (score <= Math.ceil(skillScore * 0.1))
        ? "MYTHRAS.CRITICAL!"
        : (score <= skillScore)
          ? "MYTHRAS.SUCCESS!"
          : "MYTHRAS.FAILURE!";
    }

    let htmlContent = ``;
    
    // Handle CONTESTED ROLLS if applicable
    if (options.isContestedRoll) {
      let levelsOfSuccess = 0;
      let opposedRollWinner = ``;
      const selectedActor = `@UUID[${skill.actor.uuid}]`;
      const contestedActor = `@UUID[${options.contestedActor.uuid}]`;
      const successNames = [
        "fumble",
        "failure",
        "success",
        "critical"
      ];
      // Determine Roll Winner
      const idxRollSuccess = successNames.findIndex(desc => description.toLocaleLowerCase().includes(desc));
      const idxContestedRollSuccess = successNames.findIndex(desc => options.contestedSuccess.toLocaleLowerCase().includes(desc));

      levelsOfSuccess = Math.abs(idxRollSuccess - idxContestedRollSuccess);

      if (idxRollSuccess > idxContestedRollSuccess) {
          opposedRollWinner = selectedActor;
      }
      else if (idxRollSuccess < idxContestedRollSuccess) {
          opposedRollWinner = contestedActor;
      }
      else {
        if (score > options.contestedScore) {
          opposedRollWinner = selectedActor;
        } else if (score < options.contestedScore) {
          opposedRollWinner = contestedActor;
        } else {
          // same roll value = tie (no winner)
          opposedRollWinner = `None`;
        }
      }
      
      // Render Handlebars template for contested skill roll
      htmlContent = await renderTemplate(
        "systems/mythras/templates/chat/contested-skill-roll.hbs",
        {
          game,
          rollResults: [{
            difficultyName: game.i18n.localize([
              "MYTHRAS.very_easy_dif",
              "MYTHRAS.easy_dif",
              "MYTHRAS.standard_dif",
              "MYTHRAS.hard_dif",
              "MYTHRAS.formidable_dif",
              "MYTHRAS.herculean_dif"
            ][options.difficulty]),
            difficultyGrade: skillScore,
            difficulty: options.difficulty,
            rollValue: score,
            description,
            descriptionClass: description === "MYTHRAS.CRITICAL!"
              ? "text-goldenrod"
              : description === "MYTHRAS.SUCCESS!"
                ? "text-green"
                : description === "MYTHRAS.FUMBLE!"
                  ? "text-darkred"
                  : "text-red"
          }],
          contestedRollResults: [{
            difficultyName: game.i18n.localize([
              "MYTHRAS.very_easy_dif",
              "MYTHRAS.easy_dif",
              "MYTHRAS.standard_dif",
              "MYTHRAS.hard_dif",
              "MYTHRAS.formidable_dif",
              "MYTHRAS.herculean_dif"
            ][options.contestedRollDifficulty]),
            rollValue: options.contestedScore,
            difficulty: options.contestedRollDifficulty,
            description: options.contestedSuccess,
            descriptionClass: options.contestedSuccess === "MYTHRAS.CRITICAL!"
              ? "text-goldenrod"
              : options.contestedSuccess === "MYTHRAS.SUCCESS!"
                ? "text-green"
                : options.contestedSuccess === "MYTHRAS.FUMBLE!"
                  ? "text-darkred"
                  : "text-red"
          }],
          isRollWithOptions: true,
          modifiers: this.getSkillRollModifiers(skill),
          augmentationDescription: augmentDesc,
          actorId: skill.actor.id,
          skillId: skill.id,
          selectedActor,
          contestedActor,
          opposedRollWinner,
          contestedRollAugmentation: options.contestedRollAugmentation,
          contestedSkillName: options.contestedSkill.name,
          contestedSkillValue: options.contestedSkill.totalVal,
          levelsOfSuccess
        }
      );
    }
    else {
      // Render Handlebars template for normal skill roll
      htmlContent = await renderTemplate(
        "systems/mythras/templates/chat/skill-roll.hbs",
        {
          game,
          rollResults: [{
            difficultyName: game.i18n.localize([
              "MYTHRAS.very_easy_dif",
              "MYTHRAS.easy_dif",
              "MYTHRAS.standard_dif",
              "MYTHRAS.hard_dif",
              "MYTHRAS.formidable_dif",
              "MYTHRAS.herculean_dif"
            ][options.difficulty]),
            difficultyGrade: skillScore,
            difficulty: options.difficulty,
            rollValue: score,
            description,
            descriptionClass: description === "MYTHRAS.CRITICAL!"
              ? "text-goldenrod"
              : description === "MYTHRAS.SUCCESS!"
                ? "text-green"
                : description === "MYTHRAS.FUMBLE!"
                  ? "text-darkred"
                  : "text-red"
          }],
          isRollWithOptions: true,
          modifiers: this.getSkillRollModifiers(skill),
          augmentationDescription: augmentDesc,
          actorId: skill.actor.id,
          skillId: skill.id
        }
      );
    }

    // Default Flavor Text: Rolling SkillName (Skill%)
    let flavorText = `${game.i18n.localize("MYTHRAS.Rolling")} ${skill.name} (${skill.totalVal}%)`;

    // Flavor is expanded with relevant details if a luck point was spent or the roll is augmented/capped.
    if (options.useLuckPoint == "character") {
      flavorText += `<br/>${game.i18n.localize("MYTHRAS.MSG_Used_A_Character_Luck_Point")} (${actor.statTracker.trackedStats.luckPoints.value} ${game.i18n.localize("MYTHRAS.Remaining")})`;
    } else if (options.useLuckPoint == "group") {
      flavorText += `<br/>${game.i18n.localize("MYTHRAS.MSG_Used_A_Group_Luck_Point")}`;
    }
    if (!!augmentDesc) {
      flavorText += `<br/>${augmentDesc}`;
    }

    // Send to chat
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: flavorText,
      content: htmlContent
    });
  }


  public getSkillRollModifiers(skill: SkillMythras) {
    let modifiers = []

    // Include Fatigue Penalty value if character is not fresh
    let fatigueLevelName = this.actor.fatigue.currentLevelName
    if (fatigueLevelName !== 'fresh') {
      modifiers.push({
        name: `Fatigue (${fatigueLevelName})`,
        value: this.actor.fatigue.currentLevel.skillGrade
      })
    }

    //Include ENC Penalty if skill suffers ENC penalty and character is encumbered
    if (skill.encPenalty) {
      if (this.actor.encumbrance.skillPenalty) {
        modifiers.push({
          name: 'Encumbered',
          value: this.actor.encumbrance.skillPenalty
        })
      }
      
      //Include Optional Penalty for Serious Wounds in locations only for skills that suffer ENC penalty
      //Also note if a Major Wound incapacitates target
      const hitLocations: HitLocationMythras[] = this.actor.items.filter(
        (item) => item.type == 'hitLocation'
      )
      for (let hitLocation of hitLocations) {
        let currentHp = hitLocation.system.currentHp
        if (currentHp <= hitLocation.maxHp * -1) {
          modifiers.push({
            name: 'M. Wound ' + hitLocation.name,
            value: 'Herculean Difficulty'
          })
          continue
        } else if (currentHp <= 0) {
          modifiers.push({
            name: 'S. Wound ' + hitLocation.name,
            value: 'One Step Penalty'
          })
          continue
        }
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
