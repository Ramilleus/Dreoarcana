import { PhysicalItemData, PhysicalItemMythras } from '@item/physical'
import { ActorMythras } from '@module/actor'

interface CyberModuleData extends PhysicalItemData {
  moduleSize: number
  installLocationName: string
  installLocationId: string
  cyberModuleAvailibility: string
  /**
   * usecase: Module is disabled by system instability, hacking, environment, ...
   */
  cyberModuleEnabled: boolean
}

interface CyberModuleMythras {
  readonly system: CyberModuleData
}

class CyberModuleMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends PhysicalItemMythras<TParent> {
  isCyberModule: boolean = true

  get cyberModuleAvailibilityLabels(): Array<{value: string; label: string}> {
    return [{ value: "common", label: "MYTHRAS.Common" }, { value: "rare", label: "MYTHRAS.Rare" }, { value: "classified", label: "MYTHRAS.Classified" }];
  }

  getInstallLocationName(installLocationId: string): string {
    if (this.actorData && installLocationId != 'Unequipped') {
      for (const hitLocation of this.availableHitLocations) {
        if (hitLocation.id == installLocationId) {
          return hitLocation.name
        }
      }
    }
    return "Unequipped"
  }

  override async _onCreate(data: any, options: any, userId: any): Promise<void> {
    if (this.actorData) {
      // install it somewhere in the body
      this.linkModuleInstallLocation()
      this.updateSource(data)
      await this.actor.updateEmbeddedDocuments('Item', [
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
    this.linkModuleInstallLocation()
    super.prepareData()
  }

  linkModuleInstallLocation(): void {
    if (this.actorData) {
      if (this.system.installLocationId === 'Unequipped') {
        this.system.installLocationId = this.availableHitLocations[0].id
      }
      this.system.installLocationName = this.getInstallLocationName(this.system.installLocationId)
    }
  }
}

export { CyberModuleData, CyberModuleMythras }
