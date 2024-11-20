import { ItemMythras } from '@item/base'
import { ActorMythras } from '@module/actor'

interface CultBrotherhoodData {
  rankName0: string
  rankName1: string
  rankName2: string
  rankName3: string
  rankName4: string
  currentRank: string
  currentRankName: string
  rankLabels: string[]
}

interface CultBrotherhoodMythras {
  readonly system: CultBrotherhoodData
}

class CultBrotherhoodMythras<TParent extends ActorMythras | null = ActorMythras  | null> extends ItemMythras<TParent> {
  isCultBrotherhood: boolean = true
  override prepareData(): void {
    super.prepareData()

    const itemData = this.system

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

    data.rankLabels = [
      data.rankName0,
      data.rankName1,
      data.rankName2,
      data.rankName3,
      data.rankName4
    ]
  }
}

export { CultBrotherhoodData, CultBrotherhoodMythras }