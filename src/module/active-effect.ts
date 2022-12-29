/** Disable Active Effects */
export class ActiveEffectMythras extends ActiveEffect {
    constructor(
        data: DeepPartial<foundry.data.ActiveEffectSource>,
        context?: DocumentConstructionContext<ActiveEffectMythras>
    ) {
        data.disabled = true;
        data.transfer = false;
        console.log(data)
        console.log(context)
        super(data, context);
    }

    static override async createDocuments<T extends foundry.abstract.Document>(this: ConstructorOf<T>): Promise<T[]> {
        return [];
    }
}