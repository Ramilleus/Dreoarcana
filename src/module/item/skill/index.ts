import { ItemMythras } from '@item/base'
import { ActorMythras } from '@module/actor'
import { CharacteristicOption } from '@module/actor/characteristic'

interface SkillData {
  totalVal: any
  primaryChar: string
  secondaryChar: string
  trainingVal: number
  miscBonus: number
}

interface SkillMythras {
  readonly system: SkillData
}

class SkillMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends ItemMythras<TParent> {
  isSkill: boolean = true

  override prepareData(): void {
    super.prepareData()
  }


  get encPenalty() {
    const data = this.system
    return (
      data.primaryChar === 'str' ||
      data.primaryChar === 'dex' ||
      data.secondaryChar === 'str' ||
      data.secondaryChar === 'dex'
    )
  }

  get totalVal() {
    const systemData = this.system
    //Was intended to fix the issue where an item sheet is already rendered and its base values from the character sheet are changed (which wouldn't change the item data).
    //Is commented out because it breaks magic skills for some reason
    //TODO: figure out why it breaks magic skills
    //this.reRenderOpenSheet()

    return this.baseVal + Number(systemData.trainingVal) + Number(systemData.miscBonus)
  }

  get baseVal() {
    if (this.actor && this.actor.system) {
      const system = this.system
      let primaryChar = system.primaryChar as CharacteristicOption
      let secondaryChar = system.secondaryChar as CharacteristicOption
      let primaryCharValue = Number(this.getCharacteristicValue(primaryChar))
      let secondaryCharValue = Number(this.getCharacteristicValue(secondaryChar))
      return primaryCharValue + secondaryCharValue
    } else {
      return 0
    }
  }

  protected reRenderOpenSheet() {
    if (this.sheet) {
      // If the sheet for this skill is rendered (i.e. open), re-render to display the changed values
      if (this.sheet._state == 2) {
        this.sheet.render()
      }
    }
  }

  private getCharacteristicValue(characteristicName?: CharacteristicOption) {
    return characteristicName ? Number(this.actor.system.characteristics[characteristicName].value) + Number(this.actor.system.characteristics[characteristicName].mod) : 0
  }
}

export { SkillData, SkillMythras }