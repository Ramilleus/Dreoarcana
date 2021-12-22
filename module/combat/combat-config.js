import { CombatMythras } from './combat-mythras.js'

export class MythrasCombatTrackerConfig extends CombatTrackerConfig {
  prepareData() {
    super.prepareData()
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
