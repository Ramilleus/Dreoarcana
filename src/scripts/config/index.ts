import { CharacterMythras } from '@actor'
import { ArmorMythras } from '@item/armor'
import { CombatStyleMythras } from '@item/combat-style'
import { CultBrotherhoodMythras } from '@item/cult-brotherhood'
import { CurrencyMythras } from '@item/currency'
import { EquipmentMythras } from '@item/equipment'
import { HitLocationMythras } from '@item/hit-location'
import { MagicSkillMythras } from '@item/magic-skill'
import { MeleeWeaponMythras } from '@item/weapon/melee-weapon'
import { RangedWeaponMythras } from '@module/item/weapon/ranged-weapon'
import { SkillMythras } from '@item/skill'
import { SpellMythras } from '@item/spell'
import { StorageMythras } from '@item/storage'
import { SkillSheetMythras } from '@item/skill/sheet'
import { ArmorSheetMythras } from '@item/armor/sheet'
import { ItemSheetMythras } from '@item/sheet/base'
import { PhysicalItemSheetMythras } from '@item/physical/sheet'
import { CharacterSheetMythras } from '@actor/character/sheet'

export const MYTHRASCONFIG = {
  Actor: {
    documentClasses: {
      character: CharacterMythras
    },
    sheetClasses: {
      character: CharacterSheetMythras
    }
  },

  Item: {
    documentClasses: {
      standardSkill: SkillMythras,
      hitLocation: HitLocationMythras,
      professionalSkill: SkillMythras,
      combatStyle: CombatStyleMythras,
      magicSkill: MagicSkillMythras,
      passion: SkillMythras,
      'melee-weapon': MeleeWeaponMythras,
      'ranged-weapon': RangedWeaponMythras,
      armor: ArmorMythras,
      equipment: EquipmentMythras,
      currency: CurrencyMythras,
      spell: SpellMythras,
      storage: StorageMythras,
      cultBrotherhood: CultBrotherhoodMythras
    },
    sheetClasses: {
      standardSkill: SkillSheetMythras,
      hitLocation: ItemSheetMythras,
      professionalSkill: SkillSheetMythras,
      combatStyle: SkillSheetMythras,
      magicSkill: SkillSheetMythras,
      passion: SkillSheetMythras,
      'melee-weapon': PhysicalItemSheetMythras,
      'ranged-weapon': PhysicalItemSheetMythras,
      armor: ArmorSheetMythras,
      equipment: PhysicalItemSheetMythras,
      currency: PhysicalItemSheetMythras,
      spell: ItemSheetMythras,
      storage: PhysicalItemSheetMythras,
      cultBrotherhood: ItemSheetMythras
    }
  }
}
