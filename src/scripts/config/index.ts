import { CharacterMythras } from '@actor'
import { ArmorMythras } from '@item/armor'
import { CombatStyleMythras } from '@item/combat-style'
import { CultBrotherhoodMythras } from '@item/cult-brotherhood'
import { CurrencyMythras } from '@item/currency'
import { EquipmentMythras } from '@item/equipment'
import { HitLocationMythras } from '@item/hit-location'
import { MagicSkillMythras } from '@item/magic-skill'
import { MeleeWeaponMythras } from '@item/weapon/melee-weapon'
import { RangedWeaponMythras } from '@item/weapon/ranged-weapon'
import { SkillMythras } from '@item/skill'
import { SpellMythras } from '@item/spell'
import { StorageMythras } from '@item/storage'
import { CyberModuleMythras } from '@module/item/cyber-module'

export const MYTHRASCONFIG = {
  Actor: {
    documentClasses: {
      character: CharacterMythras
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
      cyberModule: CyberModuleMythras,
      cultBrotherhood: CultBrotherhoodMythras
    }
  }
}
