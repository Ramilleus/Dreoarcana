import { SkillMythras } from '@item/skill'
import { ActorMythras } from '@module/actor';

export class CombatStyleMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends SkillMythras<TParent> {}
