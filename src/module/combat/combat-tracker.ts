import { MythrasCombatTrackerConfig } from './combat-config.js'

export class MythrasCombatTracker extends CombatTracker<any> {
  get template() {
    return 'systems/mythras/templates/combat/combat-tracker.hbs'
  }
  activateListeners(html: any) {
    super.activateListeners(html)
    html.find('.combat-setting').click((ev: any) => {
      ev.preventDefault()
      new MythrasCombatTrackerConfig().render(true)
    })
  }
}
