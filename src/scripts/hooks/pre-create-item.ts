export const PreCreateItem = {
  listen: (): void => {
    Hooks.on(
      'preCreateItem',
      (document: foundry.documents.BaseItem, options, userID) => {
        if (document.data.type !== 'hitLocation' && document.parent == null) {
          document.data.img = getItemImage(document.data.type)
        }

        document.data.update(document.data)
      }
    )
  }
}

function getItemImage(itemType: string) {
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
