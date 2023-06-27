import { ActorMythras } from '@actor'

export class ItemMythras extends Item<ActorMythras> {
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
      mergeObject(context, { mythras: { ready: true } })
      const classes = CONFIG.MYTHRAS.Item.documentClasses as any
      const ItemConstructor = classes[data.type]
      return ItemConstructor ? new ItemConstructor(data, context) : new ItemMythras(data, context)
    }
  }
  
}
