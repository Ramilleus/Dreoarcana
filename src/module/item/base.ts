import { ActorMythras } from '@actor'

export class ItemMythras extends Item<ActorMythras> {
  get actorData() {
    return this.actor ? this.actor.data : undefined
  }


  constructor(data: any, context: any = {}) {
    if (context.mythras?.ready) {
      super(data, context)
    } else {
      mergeObject(context, { mythras: { ready: true } })
      const classes = CONFIG.MYTHRAS.Item.documentClasses as any
      const ItemConstructor = classes[data.type]
      return ItemConstructor ? new ItemConstructor(data, context) : new ItemMythras(data, context)
    }
  }
}
