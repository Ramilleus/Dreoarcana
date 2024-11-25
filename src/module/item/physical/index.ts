import { ItemMythras } from '@item/base'
import type { StorageMythras } from '@item/storage'
import { itemIsStorageType } from '@item/type-guards'
import { HitLocationMythras } from "@item/hit-location";
import { ActorMythras } from '@module/actor';

interface PhysicalItemData {
  encumbrance: number
  quantity: number
  value: number
  storage: string
}

interface PhysicalItemMythras {
  readonly system: PhysicalItemData
}

abstract class PhysicalItemMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends ItemMythras<TParent> {
  isPhysical: boolean = true

  get availableStorage() {
    if (this.actorData) {
      //@ts-ignore
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
    return this.system.encumbrance || 0
  }

  get encumbranceTowardsTotal(): number {
    if (this.storedIn) {
      if (this.storedIn.isCarried) {
        return this.encumbrance * this.quantity
      } else {
        return 0
      }
    }
    return this.encumbrance * this.quantity
  }

  get quantity(): number {
    return this.system.quantity || 0
  }

  get value(): number {
    return this.system.value || 0
  }

  get storageId(): string {
    return this.system.storage
  }

  get storageName(): string {
    if (this.storedIn) {
      return this.storedIn.name
    }
    return game.i18n.localize('MYTHRAS.No_Storage')
  }

  get storedIn(): StorageMythras {
    if (this.actor && this.actor.items) {
      let storage = this.actor.items.find((item) => item.id === this.storageId)
      if (storage) {
        return storage as StorageMythras<TParent>
      }
    }
    return undefined
  }

  /**
   * Find all HitLocationMythras assigned to actor or empty array
   */
  get availableHitLocations(): HitLocationMythras[] {
    if (this.actorData) {
      //@ts-ignore
      let availableHitLocations: HitLocationMythras[] = this.actorData.items
        .filter((value: Item) => value.type === 'hitLocation')
      availableHitLocations.sort((a: HitLocationMythras, b: HitLocationMythras) => {
        return a.system.rollRangeStart - b.system.rollRangeStart
      })
      return availableHitLocations
    }
    return []
  }
}

export { PhysicalItemData, PhysicalItemMythras }