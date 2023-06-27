import { HitLocationMythras } from '@item/hit-location'
import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'

interface ArmorData extends PhysicalItemData {
  location: string
  locationName: string
  ap: number
  equipped: boolean
}

interface ArmorMythras {
  readonly system: ArmorData
}

class ArmorMythras extends PhysicalItemMythras {
  isArmor: boolean = true

  get selectedHitLocationId() {
    return this.system.location
  }

  get ap() {
    return Number(this.system.ap) || 0
  }

  get isEquipped() {
    return Boolean(this.system.equipped)
  }

  override async _preCreate(data: any, options: any, user: any): Promise<void> {
    super._preCreate(data,options,user)
    if (this.actorData) {
      this.linkHitLocation(data.system)
    }
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

  override prepareData(): void {
    let systemData = this.system
    // Move the armor out of storage if its equipped
    if (systemData.equipped) {
      systemData.storage = undefined
    }

    if (this.actorData) {
      this.linkHitLocation(systemData)
    }

    super.prepareData()
  }

  linkHitLocation(systemData: ArmorData) {
    let availableHitLocations: HitLocationMythras[] = this.availableHitLocations
    //if (availableHitLocations.length > 0 ){}
    systemData.locationName = availableHitLocations[0].name
    if (systemData.location === 'Unequipped' && systemData.locationName.length > 0) {
      let hitlocID = availableHitLocations.filter(function (value: Item) {
        return value.name === systemData.locationName
      })
      systemData.location = hitlocID[0].id
    }

    let hitLocName = availableHitLocations.filter(function (value: Item) {
      return value.id === systemData.location
    })
    if (hitLocName.length > 0) {
      systemData.locationName = hitLocName[0].name
    }
  }
}

export { ArmorMythras }