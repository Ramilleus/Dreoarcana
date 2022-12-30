import { SpellMythras } from '.'
import { ItemSheetMythras } from '@item/sheet/base';

export class SpellSheetMythras extends ItemSheetMythras<SpellMythras> {
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const itemData = super.getData(options) as any

    return {
      ...itemData,
      options,
      availableMagicSkills: this.item.availableMagicSkills,
      stats: {
        intensity: {
          label: 'MYTHRAS.Intensity',
          derivedName: 'intensity',
          derivedValue: this.item.intensity,
          modifierName: "system.intensity.mod",
          modifierValue: itemData.system.intensity.mod
        },
        magnitude: {
          label: 'MYTHRAS.Magnitude',
          derivedName: 'magnitude',
          derivedValue: this.item.magnitude,
          modifierName: "system.magnitude.mod",
          modifierValue: itemData.system.magnitude.mod
        },
      }
    }
  }
}
