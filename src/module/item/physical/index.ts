import { ItemMythras } from '@item/base'
import type { StorageMythras } from '@item/storage'

export abstract class PhysicalItemMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : undefined
    if (actorData) {
      let storageList: StorageMythras[] = actorData.items.filter((item: ItemMythras) => {
        return itemIsStorageType(item)
      })
  
      if (storageList != undefined) {
        let storageName = ''
        let storage = storageList.find(
          (item: any) => item.id === itemData.data.storage
        )
        if (storage != undefined) {
          storageName = storage.name
        }
        if (itemIsStorageType(this)) {
          let otherStorages = storageList.filter(
            (item: any) => item.id !== itemData._id
          )
          itemData.data.storageList = otherStorages
        } else {
          itemData.data.storageList = storageList
        }
        itemData.data.storageName = storageName
      }
    }
  }

}

function itemIsStorageType(item: PhysicalItemMythras): item is StorageMythras {
  return (item as StorageMythras).isStorage !== undefined
}