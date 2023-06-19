/** Handlebars partials */
export function registerTemplates() {
  const templatePaths = [
    // Global partials
    'systems/mythras/templates/global/mythras-symbols.hbs',

    // Actor partials
    'systems/mythras/templates/actor/tabs/actor-core.hbs',
    'systems/mythras/templates/actor/tabs/actor-combat.hbs',
    'systems/mythras/templates/actor/tabs/actor-abilities.hbs',
    'systems/mythras/templates/actor/tabs/actor-equipment.hbs',
    'systems/mythras/templates/actor/tabs/actor-notes.hbs',
    'systems/mythras/templates/actor/tabs-space/actor-core.hbs',
    'systems/mythras/templates/actor/tabs-space/actor-combat.hbs',
    'systems/mythras/templates/actor/tabs-space/actor-abilities.hbs',
    'systems/mythras/templates/actor/tabs-space/actor-equipment.hbs',
    'systems/mythras/templates/actor/tabs-space/actor-notes.hbs',
    'systems/mythras/templates/actor/skills/skill-table.hbs',
    'systems/mythras/templates/common-components/derived-stat.hbs',
    'systems/mythras/templates/actor/components/tracked-stat.hbs',
    'systems/mythras/templates/actor/components/characteristic.hbs',
    'systems/mythras/templates/common-components/basic-labelled-input.hbs',
    'systems/mythras/templates/common-components/tab-navigator.hbs',
    'systems/mythras/templates/common-components/loader.hbs',
    'systems/mythras/templates/actor/encumbrance-bar.hbs',
    'systems/mythras/templates/apps/encounter-generator/encounter-generator.hbs',
    'systems/mythras/templates/apps/encounter-generator/detail/enemy-detail.hbs',
    'systems/mythras/templates/apps/encounter-generator/detail/party-detail.hbs',
    'systems/mythras/templates/apps/encounter-generator/tabs/enemies.hbs',
    'systems/mythras/templates/apps/encounter-generator/tabs/parties.hbs',
    'systems/mythras/templates/apps/encounter-generator/tabs/from-json.hbs',
    'systems/mythras/templates/apps/encounter-generator/tabs/credits.hbs',

    // Combat partials
    'systems/mythras/templates/combat/combat-tracker.hbs',
    'systems/mythras/templates/combat/combat-config.hbs'
  ]
  return loadTemplates(templatePaths)
}
