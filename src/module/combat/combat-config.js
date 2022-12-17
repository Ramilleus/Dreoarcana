import { CombatMythras } from './combat-mythras.js'

export class MythrasCombatTrackerConfig extends CombatTrackerConfig {
  prepareData() {
    console.log('TESTTSETSETASDFASDLK;FJASD;LKFJ')
    super.prepareData()
    console.log(this)
    console.log('TESTTSETSETASDFASDLK;FJASD;LKFJ')
  }
  constructor() {
    super()
    console.log('TESTTSETSETASDFASDLK;FJASD;LKFJ')
    console.log(this)
  }
  get template() {
    return 'systems/mythras/templates/combat/combat-config.html'
  }
  async _updateObject(event, formData) {
    return game.settings.set('core', CombatMythras.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated,
      reduceAP: formData.reduceAP
    })
  }
}
