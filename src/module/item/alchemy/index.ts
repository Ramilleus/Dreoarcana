import { EquipmentMythras } from '@item/equipment'
import { ActorMythras } from '@module/actor'

/**
 * Alchemy item types (see src/alchemy). They are physical equipment in
 * every way the sheet cares about — ENC, quantity, value, storage — and
 * carry their alchemy data in template.json fields. Their "sheet" is the
 * Laboratory.
 */
class IngredientMythras<TParent extends ActorMythras | null = ActorMythras | null> extends EquipmentMythras<TParent> {}

class PotionMythras<TParent extends ActorMythras | null = ActorMythras | null> extends EquipmentMythras<TParent> {}

export { IngredientMythras, PotionMythras }
