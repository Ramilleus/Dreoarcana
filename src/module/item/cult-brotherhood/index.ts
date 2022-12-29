import { ItemMythras } from '@item/base'

export class CultBrotherhoodMythras extends ItemMythras {
  override prepareData(): void {
    super.prepareData()

    const itemData: any = this.system

    const data = itemData
    switch (data.currentRank) {
      case '4':
        data.currentRankName = data.rankName4
        break
      case '3':
        data.currentRankName = data.rankName3
        break
      case '2':
        data.currentRankName = data.rankName2
        break
      case '1':
        data.currentRankName = data.rankName1
        break
      default:
        data.currentRankName = data.rankName0
        break
    }
  }
}
