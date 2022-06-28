import { ItemMythras } from '@item/base'
import type { StorageMythras } from '@item/storage'

export abstract class PhysicalItemMythras extends ItemMythras {
  isPhysical: boolean = true

  get availableStorage() {
    if (this.actorData) {
      let availableStorage: StorageMythras[] = this.actorData.items.filter(function (
        item: ItemMythras
      ) {
        return itemIsStorageType(item)
      })
      return availableStorage
    }
    return []
  }

  get encumbrance(): number {
    return Number((this.data.data as any).encumbrance) || 0
  }

  get quantity(): number {
    return Number((this.data.data as any).quantity) || 0
  }

  get value(): number {
    return Number((this.data.data as any).value) || 0
  }

  get storageId(): string {
    return (this.data.data as any).storage
  }

  get storageName(): string {
    if (this.actor && this.actor.items) {
      let storage = this.actor.items.find((item) => item.id === this.storageId)
      if (storage) {
        return storage.name
      }
    }
    return game.i18n.localize('MYTHRAS.No_Storage')
  }
}

function itemIsStorageType(item: ItemMythras): item is StorageMythras {
  return (item as StorageMythras).isStorage !== undefined
}
