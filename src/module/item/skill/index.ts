import { ItemMythras } from '@item/base'

export class SkillMythras extends ItemMythras {
  isSkill: boolean = true

  get encPenalty() {
    const data: any = this.system
    return (
      data.primaryChar === 'str' ||
      data.primaryChar === 'dex' ||
      data.secondaryChar === 'str' ||
      data.secondaryChar === 'dex'
    )
  }

  get totalVal() {
    let data: any = this.data
    //Was intended to fix the issue where an item sheet is already rendered and its base values from the character sheet are changed (which wouldn't change the item data).
    //Is commented out because it breaks magic skills for some reason
    //TODO: figure out why it breaks magic skills
    //this.reRenderOpenSheet()
    return this.baseVal + Number(data.data.trainingVal) + Number(data.data.miscBonus)
  }

  get baseVal() {
    if (this.actor && this.actor.data) {
      let data: any = this.data
      let actorData: any = this.actor.system
      let primaryChar = data.data.primaryChar
      let secondaryChar = data.data.secondaryChar
      let primaryCharValue = primaryChar ? Number(actorData.characteristics[primaryChar].value) : 0
      let secondaryCharValue = secondaryChar
        ? Number(actorData.characteristics[secondaryChar].value)
        : 0
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
}
