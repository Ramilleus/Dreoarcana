import { ActorMythras } from '@actor/base'
import { ItemMythras } from '@module/item/base'
import { SkillMythras } from '@module/item/skill'

export class ActorMythrasMovement {
  constructor(private actor: ActorMythras) {}

  public get stats() {
    let data: any = this.actor.data
    return {
      walk: {
        label: 'MYTHRAS.WALK',
        derivedName: 'movement.walk',
        derivedValue: this.walk,
        modifierName: 'data.attributes.movement.mod',
        modifierValue: data.data.attributes.movement.mod
      },
      run: {
        label: 'MYTHRAS.RUN',
        derivedName: 'movement.run',
        derivedValue: this.run,
        modifierName: 'data.attributes.run.mod',
        modifierValue: data.data.attributes.run.mod
      },
      sprint: {
        label: 'MYTHRAS.SPRINT',
        derivedName: 'movement.sprint',
        derivedValue: this.sprint,
        modifierName: 'data.attributes.sprint.mod',
        modifierValue: data.data.attributes.sprint.mod
      },
      climb: {
        label: 'MYTHRAS.CLIMB',
        derivedName: 'movement.climb',
        derivedValue: this.climb,
        modifierName: 'data.attributes.climb.mod',
        modifierValue: data.data.attributes.climb.mod
      },
      swim: {
        label: 'MYTHRAS.SWIM',
        derivedName: 'movement.swim',
        derivedValue: this.swim,
        modifierName: 'data.attributes.swim.mod',
        modifierValue: data.data.attributes.swim.mod
      },
      jumpVertical: {
        label: 'MYTHRAS.V._JUMP',
        derivedName: 'movement.jumpVertical',
        derivedValue: this.jumpVertical,
        modifierName: 'data.attributes.jumpVertical.mod',
        modifierValue: data.data.attributes.jumpVertical.mod
      },
      jumpHorizontal: {
        label: 'MYTHRAS.H._JUMP',
        derivedName: 'movement.jumpHorizontal',
        derivedValue: this.jumpHorizontal,
        modifierName: 'data.attributes.jumpHorizontal.mod',
        modifierValue: data.data.attributes.jumpHorizontal.mod
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
      (this.actorHeight * 2 + 100 * Math.floor(this.athleticsSkillValue / 20)) / 100 +
      this.getStatMod('jumpVertical')
    )
  }

  public get jumpHorizontal(): number {
    return (
      (this.actorHeight * 2 + 100 * Math.floor(this.athleticsSkillValue / 20)) / 100 +
      this.getStatMod('jumpHorizontal')
    )
  }

  private getStatMod(statName: string): number {
    return Number((this.actor.data as any).data.attributes[statName].mod) || 0
  }

  private get actorHeight(): number {
    return (this.actor.data.data as any).height
  }

  private get athleticsSkillValue(): number {
    let athletics: SkillMythras = this.actor.items.find(
      (entry: ItemMythras) => entry.data.name === game.i18n.localize('MYTHRAS.Athletics')
    )
    return athletics ? athletics.totalVal : 0
  }

  private get swimSkillValue(): number {
    let swim: SkillMythras = this.actor.items.find(
      (entry: ItemMythras) => entry.data.name === game.i18n.localize('MYTHRAS.Swim')
    )
    return swim ? swim.totalVal : 0
  }

  private get baseWalk(): number {
    const baseMod = (this.actor.data.data as any).attributes.movement.mod
    let walk = (this.actor.data.data as any).attributes.movement.walk
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
