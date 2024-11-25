import { ActorMythras } from '@actor/base'
import { ItemMythras } from '@module/item/base'
import { SkillMythras } from '@module/item/skill'

export class ActorMythrasMovement {
  constructor(private actor: ActorMythras) {}

  public get stats() {
    const actorData = this.actor.system
    return {
      walk: {
        label: 'MYTHRAS.WALK',
        derivedName: 'movement.walk',
        derivedValue: this.walk,
        modifierName: 'system.attributes.movement.mod',
        modifierValue: actorData.attributes.movement.mod
      },
      run: {
        label: 'MYTHRAS.RUN',
        derivedName: 'movement.run',
        derivedValue: this.run,
        modifierName: 'system.attributes.run.mod',
        modifierValue: actorData.attributes.run.mod
      },
      sprint: {
        label: 'MYTHRAS.SPRINT',
        derivedName: 'movement.sprint',
        derivedValue: this.sprint,
        modifierName: 'system.attributes.sprint.mod',
        modifierValue: actorData.attributes.sprint.mod
      },
      climb: {
        label: 'MYTHRAS.CLIMB',
        derivedName: 'movement.climb',
        derivedValue: this.climb,
        modifierName: 'system.attributes.climb.mod',
        modifierValue: actorData.attributes.climb.mod
      },
      swim: {
        label: 'MYTHRAS.SWIM',
        derivedName: 'movement.swim',
        derivedValue: this.swim,
        modifierName: 'system.attributes.swim.mod',
        modifierValue: actorData.attributes.swim.mod
      },
      jumpVertical: {
        label: 'MYTHRAS.V._JUMP',
        derivedName: 'movement.jumpVertical',
        derivedValue: this.jumpVertical,
        modifierName: 'system.attributes.jumpVertical.mod',
        modifierValue: actorData.attributes.jumpVertical.mod
      },
      jumpHorizontal: {
        label: 'MYTHRAS.H._JUMP',
        derivedName: 'movement.jumpHorizontal',
        derivedValue: this.jumpHorizontal,
        modifierName: 'system.attributes.jumpHorizontal.mod',
        modifierValue: actorData.attributes.jumpHorizontal.mod
      }
    }
  }

  public get walk(): number {
    return this.baseWalk + this.movementPenalty
  }

  public get run(): number {

    return (
      3 * (this.walk + Math.floor(this.athleticsSkillValue / 50)) -
      this.actor.armorPenalty +
      this.getStatMod('run')
    )
  }

  public get sprint(): number {
    return (
      5 * (this.walk + Math.floor(this.athleticsSkillValue / 25)) -
      this.actor.armorPenalty +
      this.getStatMod('sprint')
    )
  }

  public get climb(): number {
    return this.walk + this.getStatMod('climb')
  }

  //TODO: Swim? Based on walk, should probably have its own base
  public get swim(): number {
    return this.walk + Math.floor(this.swimSkillValue / 20) + this.getStatMod('swim')
  }

  public get jumpVertical(): number {
    return (
      Math.floor(
        Math.max(
          (this.actorHeight / 2) / 100 + //convert to meters
          (this.athleticsSkillValue / 100) + // 20 cm per 20% in Athletics
          this.getStatMod('jumpVertical') - 
          (this.actor.armorPenalty / 2), 
          0 // minimum height of 1 step
        ) * 100
      ) / 100 //truncate to 2 decimal places
    )
  }

  public get jumpHorizontal(): number {
    return (
      Math.floor(
        Math.max(
          (this.actorHeight * 2) / 100 + //convert to meters
          (this.athleticsSkillValue / 20) + //1 meter per 20% in Athletics
          this.getStatMod('jumpHorizontal') - 
          (this.actor.armorPenalty / 2), //jumping in Armor is hard
          0 //minimum jump of 1 step
        ) * 100
      ) / 100 //truncate to 2 decimal places
    )
  }

  private getStatMod(statName: 'run' | 'sprint' | 'jumpHorizontal' | 'jumpVertical' | 'climb' | 'swim'): number {
    return Number(this.actor.system.attributes[statName].mod) || 0
  }

  private get actorHeight(): number {
    return this.actor.system.height
  }

  private get athleticsSkillValue(): number {
    let athletics: SkillMythras = this.actor.items.find(
      (entry: ItemMythras) => entry.name === game.i18n.localize('MYTHRAS.Athletics')
    )
    return athletics ? athletics.totalVal : 0
  }

  private get swimSkillValue(): number {
    let swim: SkillMythras = this.actor.items.find(
      (entry: ItemMythras) => entry.name === game.i18n.localize('MYTHRAS.Swim')
    )
    return swim ? swim.totalVal : 0
  }

  private get baseWalk(): number {
    const baseMod = this.actor.system.attributes.movement.mod
    let walk = this.actor.system.attributes.movement.walk
    if (!walk) walk = 6
    return Number(walk) + Number(baseMod) || 0
  }

  private get movementPenalty(): number {
    let movementPenalty =
      this.actor.fatigue.currentLevel.movementPenalty(this.baseWalk) +
      this.actor.encumbrance.movementPenalty(this.baseWalk)

    return movementPenalty
  }
}
