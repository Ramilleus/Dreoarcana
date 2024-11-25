import { ActorMythras } from '@actor'

export class ItemMythras<TParent extends ActorMythras | null = ActorMythras | null> extends Item<TParent> {
  get actorData() {
    return this.actor ? this.actor : undefined
  }

  override async _preCreate(data: any, options: any, user: any): Promise<void> {
    if (this._source.img === 'icons/svg/item-bag.svg') {
      this._source.img = this.getItemImage(data.type);
    }
  }

  private getItemImage(itemType: string) {
    switch (itemType) {
      case 'equipment':
        return 'icons/svg/item-bag.svg'
      case 'armor':
        return 'icons/svg/shield.svg'
      case 'melee-weapon':
        return 'icons/svg/sword.svg'
      case 'ranged-weapon':
        return 'icons/svg/sword.svg'
      case 'currency':
        return 'icons/svg/coins.svg'
      case 'combatStyle':
        return 'icons/svg/combat.svg'
      case 'storage':
        return 'icons/svg/chest.svg'
      case 'cultBrotherhood':
        return 'icons/svg/hanging-sign.svg'
      case 'magicSkill':
        return 'icons/svg/daze.svg'
      default:
        return 'icons/svg/book.svg'
    }
  }

  constructor(data: any, context: any = {}) {
    if (context.mythras?.ready) {
      super(data, context)
    } else {
      foundry.utils.mergeObject(context, { mythras: { ready: true } })
      const classes = CONFIG.MYTHRAS.Item.documentClasses as any
      const ItemConstructor = classes[data.type]
      return ItemConstructor ? new ItemConstructor(data, context) : new ItemMythras(data, context)
    }
  }
  
}

const ItemProxyMythras = new Proxy(ItemMythras, {
  construct(
      _target,
      // @ts-ignore: Weird circular reference error (does not break anything I think)
      args: [source: PreCreate<foundry.documents.ItemSource>, context?: DocumentConstructionContext<ActorMythras | null>],
  ) {
      const source = args[0];
      const type = source?.type as keyof typeof CONFIG.MYTHRAS.Item.documentClasses;

      const ItemClass: typeof ItemMythras = CONFIG.MYTHRAS.Item.documentClasses[type];
      if (!ItemClass) {
          throw Error(`Item type ${type} does not exist and item module sub-types are not supported`);
      }
      return new ItemClass(...args);
  },
});
export { ItemProxyMythras }