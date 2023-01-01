import { ItemMythras } from '@item/base'

export const PreCreateItem = {
  listen: (): void => {
    Hooks.on('preCreateItem', (document: ItemMythras, _options, _userID) => {
      const data: any = document.system

      if (document.type !== 'hitLocation' && !data.defaultImageSet) {
        data.defaultImageSet = true
        data.img = getItemImage(document.type)
      }
      document.updateSource(data)
    })
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
