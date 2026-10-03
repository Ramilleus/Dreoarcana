const { fields } = foundry.data;

export class ItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField(),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
    };
  }
}
