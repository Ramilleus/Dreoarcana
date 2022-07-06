import { ArmorMythras } from './armor'
import { ItemMythras } from './base'
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
