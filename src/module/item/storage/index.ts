import { ItemMythras } from '@item/base'
import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'
import { itemIsPhysical } from '@item/type-guards'
import { ActorMythras } from '@module/actor'

interface StorageData extends PhysicalItemData {
  carried: boolean
  maxEncumbrance: number
}

interface StorageMythras {
  readonly system: StorageData
}

class StorageMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends  PhysicalItemMythras<TParent> {
  isStorage: boolean = true

  get contentEncumbrance() {
    return this.storedItems.reduce(
      (totalEncumbrance: number, item: PhysicalItemMythras) =>
        totalEncumbrance + item.quantity * item.encumbrance,
      0
    )
  }

  override get encumbranceTowardsTotal() {
    if (this.isCarried) {
      return super.encumbranceTowardsTotal
    } else {
      return 0
    }
  }

  get isCarried(): boolean {
    return Boolean(this.system.carried) || false
  }

  get maxEncumbrance(): number {
    return Number(this.system.maxEncumbrance) || 0
  }

  get contentValue() {
    return this.storedItems.reduce(
      (totalValue: number, item: PhysicalItemMythras) => totalValue + item.quantity * item.value,
      0
    )
  }

  get storedItems(): PhysicalItemMythras[] {
    if (this.actorData) {
      //@ts-ignore
      return this.actorData.items.filter((item: ItemMythras) => {
        return itemIsPhysical(item) && item.storageId == this.id
      })
    }
    return []
  }
}

export { StorageData, StorageMythras }
