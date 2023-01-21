/** Disable Active Effects */
export class ActiveEffectMythras extends ActiveEffect {
    constructor(
        data: DeepPartial<foundry.data.ActiveEffectSource>,
        context?: DocumentConstructionContext<ActiveEffectMythras>
    ) {
        data.disabled = true;
        data.transfer = false;
        super(data, context);
    }
}