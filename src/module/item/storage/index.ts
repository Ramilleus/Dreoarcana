import { ItemMythras } from '@item/base'
import { PhysicalItemMythras } from '@item/physical'

export class StorageMythras extends PhysicalItemMythras {
  isStorage: boolean = true

  get contentEncumbrance() {
    return this.storedItems.reduce(
      (totalEncumbrance: number, item: PhysicalItemMythras) =>
        totalEncumbrance + item.quantity * item.encumbrance,
      0
    )
  }

  get maxEncumbrance(): number {
    return Number((this.data.data as any).maxEncumbrance) || 0
  }

  get contentValue() {
    return this.storedItems.reduce(
      (totalValue: number, item: PhysicalItemMythras) => totalValue + item.quantity * item.value,
      0
    )
  }

  get storedItems(): PhysicalItemMythras[] {
    if (this.actorData) {
      return this.actorData.items.filter((item: ItemMythras) => {
        return itemIsPhysical(item) && item.storageId == this.id
      })
    }
    return []
  }
}

function itemIsPhysical(item: ItemMythras): item is PhysicalItemMythras {
  return (item as PhysicalItemMythras).isPhysical !== undefined
}
