import { SpellMythras } from '.'
import { ItemSheetMythras } from '@item/sheet/base';

export class SpellSheetMythras extends ItemSheetMythras<SpellMythras> {
  override async getData(options?: Partial<DocumentSheetOptions>) {
    const sheetData: any = await super.getData(options);

    return {
      ...sheetData,
      availableMagicSkills: this.item.availableMagicSkills,
      stats: {
        intensity: {
          label: 'MYTHRAS.Intensity',
          derivedName: 'intensity',
          derivedValue: this.item.intensity,
          modifierName: "data.intensity.mod",
          modifierValue: sheetData.data.data.intensity.mod
        },
        magnitude: {
          label: 'MYTHRAS.Magnitude',
          derivedName: 'magnitude',
          derivedValue: this.item.magnitude,
          modifierName: "data.magnitude.mod",
          modifierValue: sheetData.data.data.magnitude.mod
        },
      }
    }
  }
}
