/** Handlebars partials */
export function registerTemplates() {
  const templatePaths = [
    // Global partials
    'systems/mythras/templates/global/mythras-symbols.html',

    // Actor partials
    'systems/mythras/templates/actor/tabs/actor-core.html',
    'systems/mythras/templates/actor/tabs/actor-skills.html',
    'systems/mythras/templates/actor/tabs/actor-combat.html',
    'systems/mythras/templates/actor/tabs/actor-abilities.html',
    'systems/mythras/templates/actor/tabs/actor-equipment.html',
    'systems/mythras/templates/actor/tabs/actor-notes.html',
    'systems/mythras/templates/actor/skills/skill-table.html',
    'systems/mythras/templates/actor/encumbrance-bar.html',
    'systems/mythras/templates/apps/encounter-generator/encounter-generator.html',

    // Combat partials
    'systems/mythras/templates/combat/combat-tracker.html',
    'systems/mythras/templates/combat/combat-config.html'
  ]
  return loadTemplates(templatePaths)
}
