import { MythrasCombatTrackerConfig } from './combat-config.js'

export class MythrasCombatTracker extends CombatTracker {
  get template() {
    return 'systems/mythras/templates/combat/combat-tracker.html'
  }
  activateListeners(html) {
    super.activateListeners(html)
    html.find('.combat-setting').click((ev) => {
      ev.preventDefault()
      new MythrasCombatTrackerConfig().render(true)
    })
  }
}
