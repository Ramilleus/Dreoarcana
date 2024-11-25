import { HitLocationMythras } from '@item/hit-location'
import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from '@module/actor'

interface ArmorData extends PhysicalItemData {
  location: string[]
  locationName: string[]
  ap: number
  equipped: boolean
}

interface ArmorMythras {
  readonly system: ArmorData
}

class ArmorMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends PhysicalItemMythras<TParent> {
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
    //Do we need to set this here? It should be set in the item as created
    //if it is not set, it is blank
    systemData.locationName = [availableHitLocations[0].name]//why??
    if (systemData.location?.includes('Unequipped') && systemData.locationName.length > 0) {
      let hitlocID = availableHitLocations.filter(function (value: Item) {
        return systemData.locationName.includes(value.name)//modified to return all hit locations
      })
      systemData.location = hitlocID.map(({ id }) => id)//hitlocID[0].id
    }

    let hitLocName = availableHitLocations.filter(function (value: Item) {
      return systemData.location?.includes(value.id)
    })
    if (hitLocName.length > 0) {
      systemData.locationName = hitLocName.map(({ name }) => name)
    }
  }
}

export { ArmorMythras }