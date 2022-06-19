import { ItemSheetMythras } from '@item/sheet/base'
import { ArmorMythras } from '.'

export class ArmorSheetMythras extends ItemSheetMythras<ArmorMythras> {
  
  override _updateObject(event: Event, formData: Record<string, unknown>): Promise<any> {
    super._updateObject(event, formData)
    const itemData = this.item.data as any

    const target = event.target as any
  
    const data = itemData.data
    if (target && target.id.includes('armorChange')) {
      // Get the hit location the armor is on
      let hitLoc = this.actor.items.get(String(data.location))
      // Run if equipped checkbox changes
      if (target.id.includes('equipped') && itemData) {
        this.toggleArmorEquipped(itemData, formData, hitLoc)
      } else if (
        (target.id.includes('ap') || target.id.includes('name')) &&
        hitLoc
      ) {
        this.updateArmorValues(itemData, formData, hitLoc)
      }
    }
  
    return this.item.update(formData)
  }
  
  toggleArmorEquipped(itemData: any, formData: any, hitLoc: any) {
    const data = itemData.data
    const id = itemData._id
    let attached: any = {}
    if (hitLoc.data.data.attached !== undefined) {
      attached = hitLoc.data.data.attached
    }

    if (Boolean(formData['data.equipped'])) {
      // If the armor is equipped, add it to list of armors attached to hit location
      attached[id] = [itemData.name, data.ap]
    } else {
      // If the armor is not equipped, remove it from list of armors attached to hit location
      delete attached[id]
    }

    // Get new list of armors attached to a hit location and total ap for that location
    let armors = []
    let ap = 0
    for (var key in attached) {
      armors.push(attached[key][0])
      ap += Number(attached[key][1])
    }
    ap = Math.max(ap, hitLoc.data.data.naturalArmor)

    // Update the hit location with the new armor list/ap total
    this.actor.updateEmbeddedDocuments('Item', [
      {
        _id: hitLoc.id,
        'data.data.armors': armors.join(','),
        'data.data.ap': ap,
        'data.data.attached': attached
      }
    ])
  }
  
  updateArmorValues(itemData: any, formData: any, hitLoc: any) {
    const data = itemData.data
    const id = itemData._id
    let attached: any = {}
    if (hitLoc.data.data.attached !== undefined) {
      attached = hitLoc.data.data.attached
    }

    if (Boolean(data.equipped)) {
      attached[id] = [formData['name'], data.ap]
      let armors = []
      let ap = 0
      for (var key in attached) {
        armors.push(attached[key][0])
        ap += Number(attached[key][1])
      }
      ap = Math.max(ap, hitLoc.data.data.naturalArmor)

      this.actor.updateEmbeddedDocuments('Item', [
        {
          _id: hitLoc.id,
          'data.data.armors': armors.join(','),
          'data.data.ap': ap,
          'data.data.attached': attached
        }
      ])
    }
  }
}
