import { ArmorSheetMythras } from '@item/armor/sheet'
import { SkillSheetMythras } from '@item/skill/sheet'
import { ItemSheetMythras } from '@item/sheet/base'
import { CharacterSheetMythras } from '@actor/character/sheet'

export function registerSheets() {
  registerItemSheet()
  registerActorSheet()
}

/**
 * Unregisters the default Foundry item sheet and registers the custom Mythras sheet
 */
function registerItemSheet() {
  Items.unregisterSheet('core', ItemSheet)

  const itemTypes = [
    'hitLocation',
    'melee-weapon',
    'ranged-weapon',
    'equipment',
    'currency',
    'ability',
    'spell',
    'storage',
    'cultBrotherhood'
  ]
  for (const itemType of itemTypes) {
    Items.registerSheet('mythras', ItemSheetMythras, {
      types: [itemType],
      makeDefault: true
    })
  }

  const sheetEntries = [
    ['armor', ArmorSheetMythras],
    ['standardSkill', SkillSheetMythras],
    ['professionalSkill', SkillSheetMythras],
    ['combatStyle', SkillSheetMythras],
    ['magicSkill', SkillSheetMythras],
    ['passion', SkillSheetMythras]
  ] as const
  for (const [type, Sheet] of sheetEntries) {
    Items.registerSheet('mythras', Sheet, {
      types: [type],
      makeDefault: true
    })
  }
}

/**
 * Unregisters the default Foundry actor sheet and registers the custom Mythras sheet
 */
function registerActorSheet() {
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('mythras', CharacterSheetMythras as any, {
    types: ['character'],
    makeDefault: true
  })
}
