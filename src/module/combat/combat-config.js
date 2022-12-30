import { CombatMythras } from './combat-mythras'

export class MythrasCombatTrackerConfig extends CombatTrackerConfig {
  prepareData() {
    super.prepareData()
  }
  constructor() {
    super()
  }
  get template() {
    return 'systems/mythras/templates/combat/combat-config.hbs'
  }
  async _updateObject(event, formData) {
    return game.settings.set('core', CombatMythras.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated,
      reduceAP: formData.reduceAP
    })
  }
}
