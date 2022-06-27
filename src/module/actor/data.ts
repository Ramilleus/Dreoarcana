import { PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from './base'

interface InventorySection {
  label: string
  type: PhysicalItemType
  items: PhysicalItemMythras[]
}

// TODO: Add Encumbrance
export interface SheetInventoryMythras {
  sections: Record<PhysicalItemType, InventorySection>
}

export interface ActorSheetDataMythras<TActor extends ActorMythras> extends ActorSheetData<TActor> {
  inventory: SheetInventoryMythras
}
