import { ActorMythras } from "./actor";
import { ItemMythras } from "./item/base";

/** Disable Active Effects */
// TODO: Implement Active Effects for Mythras
export class ActiveEffectMythras extends ActiveEffect<ActorMythras | ItemMythras>{
    // constructor(
    //     data: DeepPartial<foundry.data.ActiveEffectSource>,
    //     context?: DocumentConstructionContext<ActiveEffectMythras>
    // ) {
    //     data.disabled = true;
    //     data.transfer = false;
    //     super(data, context);
    // }
}