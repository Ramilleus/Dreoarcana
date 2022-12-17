import { CreatureMythras } from '@actor'
import { ActorSheetMythras } from '@actor/sheet/base'

export abstract class CreatureSheetMythras<
  TActor extends CreatureMythras
> extends ActorSheetMythras<TActor> {}
