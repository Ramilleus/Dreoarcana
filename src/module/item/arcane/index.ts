import { ItemMythras } from '@item/base'
import { ActorMythras } from '@module/actor'

/**
 * Arcana item types (see src/arcana). Their data is plain template.json
 * data; all behaviour lives in the Arcana scripts, and their "sheet" is
 * the Arcanum.
 */
class ArcaneSpellMythras<TParent extends ActorMythras | null = ActorMythras | null> extends ItemMythras<TParent> {}

class ArcaneEffectMythras<TParent extends ActorMythras | null = ActorMythras | null> extends ItemMythras<TParent> {}

export { ArcaneSpellMythras, ArcaneEffectMythras }
