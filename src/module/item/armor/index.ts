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
    return (this.system as any).location
  }

  get ap() {
    return Number((this.system as any).ap) || 0
  }

  get isEquipped() {
    return Boolean((this.system as any).equipped)
  }

  override async _preCreate(data: any, options: any, user: any): Promise<void> {
    if (this.actorData) {
      this.linkHitLocation(data.system)
    }
    console.log(data)
    this.updateSource(data, options)
  }

  override async _onCreate(data: any, options: any, userId: any): Promise<void> {
    if (this.actorData) {
      this.linkHitLocation(data.system)
      this.updateSource(data)
      this.actor.updateEmbeddedDocuments('Item', [
        {
          type: this.type,
          _id: this.id,
          system: data
        }
      ])
    }
    super._onCreate(data, options, userId)
  }

  linkHitLocation(systemData: any) {
    systemData.locationName = this.availableHitLocations[0].name
    if (systemData.location === 'Unequipped' && systemData.locationName.length > 0) {
      let hitlocID = this.availableHitLocations.filter(function (value: Item) {
        return value.name === systemData.locationName
      })
      systemData.location = hitlocID[0].id
    }

    let hitLocName = this.availableHitLocations.filter(function (value: Item) {
      return value.id === systemData.location
    })
    if (hitLocName.length > 0) {
      systemData.locationName = hitLocName[0].name
    }
  }
}
