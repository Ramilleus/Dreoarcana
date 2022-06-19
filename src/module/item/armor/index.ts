import { PhysicalItemMythras } from '@item/physical'

export class ArmorMythras extends PhysicalItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : {}

    const data = itemData.data
    if (actorData != undefined) {
      data.hitLoc = actorData.items.filter(function (value: Item) {
        return value.type === 'hitLocation'
      })
      if (data.location === 'Unequipped' && data.locationName.length > 0) {
        let hitlocID = data.hitLoc.filter(function (value: Item) {
          return value.name === data.locationName
        })
        data.location = hitlocID[0].id
      }
      let hitLocName = data.hitLoc.filter(function (value: Item) {
        return value.id === data.location
      })
      if (hitLocName.length > 0) {
        data.locationName = hitLocName[0].name
      }
    }
  }
}
