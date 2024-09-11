import { PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from '@module/actor'

export class EquipmentMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends PhysicalItemMythras<TParent> {
  override prepareData(): void {
    super.prepareData()
  }
}
