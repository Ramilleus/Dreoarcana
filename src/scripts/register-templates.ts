/** Handlebars partials */
export function registerTemplates() {
  const templatePaths = [
    // Global partials
    'systems/dreoarcana/templates/global/mythras-symbols.hbs',

    // Actor partials
    'systems/dreoarcana/templates/actor/tabs/actor-core.hbs',
    'systems/dreoarcana/templates/actor/tabs/actor-combat.hbs',
    'systems/dreoarcana/templates/actor/tabs/actor-abilities.hbs',
    'systems/dreoarcana/templates/actor/tabs/actor-equipment.hbs',
    'systems/dreoarcana/templates/actor/tabs/actor-notes.hbs',
    'systems/dreoarcana/templates/actor/tabs-space/actor-core.hbs',
    'systems/dreoarcana/templates/actor/tabs-space/actor-combat.hbs',
    'systems/dreoarcana/templates/actor/tabs-space/actor-abilities.hbs',
    'systems/dreoarcana/templates/actor/tabs-space/actor-equipment.hbs',
    'systems/dreoarcana/templates/actor/tabs-space/actor-notes.hbs',
    'systems/dreoarcana/templates/actor/skills/skill-table.hbs',
    'systems/dreoarcana/templates/common-components/derived-stat.hbs',
    'systems/dreoarcana/templates/actor/components/tracked-stat.hbs',
    'systems/dreoarcana/templates/actor/components/characteristic.hbs',
    'systems/dreoarcana/templates/common-components/basic-labelled-input.hbs',
    'systems/dreoarcana/templates/common-components/tab-navigator.hbs',
    'systems/dreoarcana/templates/common-components/loader.hbs',
    'systems/dreoarcana/templates/actor/encumbrance-bar.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/encounter-generator.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/detail/enemy-detail.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/detail/party-detail.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/tabs/enemies.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/tabs/parties.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/tabs/from-json.hbs',
    'systems/dreoarcana/templates/apps/encounter-generator/tabs/credits.hbs',

    // Combat partials
    'systems/dreoarcana/templates/combat/combat-tracker.hbs',
    'systems/dreoarcana/templates/combat/combat-config.hbs'
  ]
  return loadTemplates(templatePaths)
}
