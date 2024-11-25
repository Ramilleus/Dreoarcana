import { ActorMythras } from '@actor'

export abstract class CreatureMythras<TParent extends TokenDocument | null = TokenDocument | null> extends ActorMythras<TParent> {}
