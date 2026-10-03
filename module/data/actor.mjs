const { fields } = foundry.data;

function resourceField(initial) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, min: 0, initial }),
    max: new fields.NumberField({ required: true, integer: true, min: 0, initial })
  });
}

class BaseActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      health: resourceField(10),
      biography: new fields.HTMLField()
    };
  }
}

export class CharacterData extends BaseActorData {}

export class NpcData extends BaseActorData {}
