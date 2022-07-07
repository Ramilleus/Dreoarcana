import { ActorMythras } from '@actor/base'
import { ItemMythras } from '@module/item/base'
import { SkillMythras } from '@module/item/skill'

export class ActorMythrasMovement {
  constructor(private actor: ActorMythras) {}
  public get walk(): number {
    return this.baseWalk + this.movementPenalty
  }

  public get run(): number {
    return 3 * (this.walk + Math.floor(this.athleticsSkillValue / 50)) - this.actor.armorPenalty
  }

  public get sprint(): number {
    return 5 * (this.walk + Math.floor(this.athleticsSkillValue / 25)) - this.actor.armorPenalty
  }

  public get climb(): number {
    return this.walk
  }

  public get swim(): number {
    return this.walk + Math.floor(this.swimSkillValue / 20)
  }

  public get jumpVertical(): number {
    return (this.actorHeight * 2 + 100 * Math.floor(this.athleticsSkillValue / 20)) / 100
  }

  public get jumpHorizontal(): number {
    return (this.actorHeight * 2 + 100 * Math.floor(this.athleticsSkillValue / 20)) / 100
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
    return Number(walk) + Number(baseMod)
  }

  private get movementPenalty(): number {
    let movementPenalty =
      this.actor.fatigue.currentLevel.movementPenalty(this.baseWalk) +
      this.actor.encumbrance.movementPenalty(this.baseWalk)

    return movementPenalty
  }
}
