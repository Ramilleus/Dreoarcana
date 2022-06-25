import { PhysicalItemMythras } from '@item/physical'

export class ArmorMythras extends PhysicalItemMythras {
  override async _preCreate(data: any, options: any, user: any): Promise<void> {
    const actorData: any = this.actor ? this.actor.data : undefined
    if (actorData) {
      const hitLocations = actorData.items.filter(function (value: Item) {
        return value.type === 'hitLocation'
      })
      data.data.locationName = hitLocations[0].data.name

      this.linkHitLocation(data, actorData)
  
      
    }
    this.data.update(data)
  }

  override async _onCreate(data: any, options: any, userId: any): Promise<void> {
    const actorData: any = this.actor ? this.actor.data : undefined
    if (actorData) {
      const hitLocations = actorData.items.filter(function (value: Item) {
        return value.type === 'hitLocation'
      })
      data.data.locationName = hitLocations[0].data.name

      this.linkHitLocation(data, actorData)
  
      this.data.update(data)

      this.actor.updateEmbeddedDocuments('Item', [
        {
          _id: this.id,
          data: data
        }
      ])
    }

    super._onCreate(data, options, userId)
  }

  override prepareData(): void {
    
    const itemData: any = this.data
    const actorData: any = this.actor ? this.actor.data : undefined
    this.linkHitLocation(itemData, actorData)
    this.data.update(itemData)
    super.prepareData()
  }

  linkHitLocation(itemData: any, actorData: any) {
    const data = itemData.data
    if (actorData !== undefined) {
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
