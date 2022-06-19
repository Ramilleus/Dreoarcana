import { PhysicalItemMythras } from '@item/physical'

export class StorageMythras extends PhysicalItemMythras {
  override prepareData(): void {
    super.prepareData()
  
    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}

    itemData.data.contentEncumbrance = 0
    itemData.data.contentValue = 0
    itemData.data.storageName = ''
    if (
      itemData.data.storage !== undefined &&
      actorData !== undefined &&
      actorData.items !== undefined
    ) {
      let storage = actorData.items.find(
        (item: any) => item.id === itemData.data.storage
      )
      if (storage !== undefined) {
        itemData.data.carried = storage.data.data.carried
      }
    }
  }
}
