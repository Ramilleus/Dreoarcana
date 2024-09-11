import { MythrasCombatTrackerConfig } from './combat-config.js'
import { CombatMythras } from './combat-mythras.js'


export class MythrasCombatTracker<TCombat extends CombatMythras | null> extends CombatTracker<TCombat> {
  get template() {
    return 'systems/mythras/templates/combat/combat-tracker.hbs'
  }

  activateListeners(html: any) {
    super.activateListeners(html)
    html.find('#combat-setting').click((ev: any) => {
      ev.preventDefault()
      new MythrasCombatTrackerConfig().render(true)
    })
  }
}
