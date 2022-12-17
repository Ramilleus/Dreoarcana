/** Handlebars partials */
export function registerTemplates() {
  const templatePaths = [
    // Global partials
    'systems/mythras/templates/global/mythras-symbols.html',

    // Actor partials
    'systems/mythras/templates/actor/tabs/actor-core.html',
    'systems/mythras/templates/actor/tabs/actor-combat.html',
    'systems/mythras/templates/actor/tabs/actor-abilities.html',
    'systems/mythras/templates/actor/tabs/actor-equipment.html',
    'systems/mythras/templates/actor/tabs/actor-notes.html',
    'systems/mythras/templates/actor/skills/skill-table.html',
    'systems/mythras/templates/common-components/derived-stat.html',
    'systems/mythras/templates/actor/components/tracked-stat.html',
    'systems/mythras/templates/actor/components/characteristic.html',
    'systems/mythras/templates/common-components/basic-labelled-input.html',
    'systems/mythras/templates/common-components/tab-navigator.html',
    'systems/mythras/templates/common-components/loader.html',
    'systems/mythras/templates/actor/encumbrance-bar.html',
    'systems/mythras/templates/apps/encounter-generator/encounter-generator.html',
    'systems/mythras/templates/apps/encounter-generator/detail/enemy-detail.html',
    'systems/mythras/templates/apps/encounter-generator/detail/party-detail.html',
    'systems/mythras/templates/apps/encounter-generator/tabs/enemies.html',
    'systems/mythras/templates/apps/encounter-generator/tabs/parties.html',
    'systems/mythras/templates/apps/encounter-generator/tabs/from-json.html',
    'systems/mythras/templates/apps/encounter-generator/tabs/credits.html',

    // Combat partials
    'systems/mythras/templates/combat/combat-tracker.html',
    'systems/mythras/templates/combat/combat-config.html'
  ]
  return loadTemplates(templatePaths)
}
