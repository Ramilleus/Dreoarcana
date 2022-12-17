import { HitLocationMythras } from '@item/hit-location'
import { PhysicalItemMythras } from '@item/physical'

export class ArmorMythras extends PhysicalItemMythras {
  isArmor: boolean = true
  
  get availableHitLocations(): HitLocationMythras[] {
    if (this.actorData) {
      let availableHitLocations: HitLocationMythras[] = this.actorData.items
        .filter(function (value: Item) {
          return value.type === 'hitLocation'
        })
      return availableHitLocations
    }
    return []
  }

  get selectedHitLocationId() {
    return (this.data.data as any).location
  }

  get ap() {
    return Number((this.data.data as any).ap) || 0
  }

  get isEquipped() {
    return Boolean((this.data.data as any).equipped)
  }

  override async _preCreate(data: any, options: any, user: any): Promise<void> {
    if (this.actorData) {
      this.linkHitLocation(data)
    }
    this.data.update(data)
  }

  override async _onCreate(data: any, options: any, userId: any): Promise<void> {
    if (this.actorData) {
      this.linkHitLocation(data)
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
    // Move the armor out of storage if its equipped
    if (this.isEquipped) {
      itemData.data.storage = undefined
    }

    if (this.actorData) {
      this.linkHitLocation(itemData)
    }

    this.data.update(itemData)
    super.prepareData()
  }

  linkHitLocation(itemData: any) {
    const data = itemData.data
    data.locationName = this.availableHitLocations[0].data.name
    if (data.location === 'Unequipped' && data.locationName.length > 0) {
      let hitlocID = this.availableHitLocations.filter(function (value: Item) {
        return value.name === data.locationName
      })
      data.location = hitlocID[0].id
    }

    let hitLocName = this.availableHitLocations.filter(function (value: Item) {
      return value.id === data.location
    })
    if (hitLocName.length > 0) {
      data.locationName = hitLocName[0].name
    }
  }
}
