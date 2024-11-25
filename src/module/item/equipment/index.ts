import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from '@module/actor'

interface EquipmentData extends PhysicalItemData {
  equipmentType: string
}

interface EquipmentMythras {
  readonly system: EquipmentData
}

class EquipmentMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends PhysicalItemMythras<TParent> {
  override prepareData(): void {
    super.prepareData()
  }
}

const EquipmentTypes = [
  { type: "MYTHRAS.Clothing" },
  { type: "MYTHRAS.Consumables" },
  { type: "MYTHRAS.Materials" },
  { type: "MYTHRAS.Texts" },
  { type: "MYTHRAS.Tools" },
  { type: "MYTHRAS.Trinkets" },
  { type: "MYTHRAS.Other" }
]

export { EquipmentMythras, EquipmentTypes }