import { ArmorMythras } from './armor'
import { ItemMythras } from './base'
import { CultBrotherhoodMythras } from './cult-brotherhood'
import { CyberModuleMythras } from './cyber-module'
import { MagicSkillMythras } from './magic-skill'
import { PhysicalItemMythras } from './physical'
import { SkillMythras } from './skill'
import { StorageMythras } from './storage'

export function itemIsPhysical(item: ItemMythras): item is PhysicalItemMythras {
  return (item as PhysicalItemMythras).isPhysical !== undefined
}

export function itemIsStorageType(item: ItemMythras): item is StorageMythras {
  return (item as StorageMythras).isStorage !== undefined
}

export function itemIsArmor(item: ItemMythras): item is ArmorMythras {
  return (item as ArmorMythras).isArmor !== undefined
}

export function itemIsSkill(item: ItemMythras): item is SkillMythras {
  return (item as SkillMythras).isSkill !== undefined
}

export function itemIsMagicSkill(item: ItemMythras): item is MagicSkillMythras {
  return (item as MagicSkillMythras).isMagicSkill !== undefined
}

export function itemIsCultBrotherhood(item: ItemMythras): item is CultBrotherhoodMythras {
  return (item as CultBrotherhoodMythras).isCultBrotherhood !== undefined
}

export function itemIsCyberModuleType(item: ItemMythras): item is CyberModuleMythras {
  return (item as CyberModuleMythras).isCyberModule !== undefined
}