import { EncounterGenerator } from '@module/apps/encounter-generator'

export const SetGameMythras = {
  onInit: (): void => {
    Object.defineProperty(globalThis.game, 'mythras', { value: {} })
    const initSafe: Partial<typeof game['mythras']> = {}

    mergeObject(game.mythras, initSafe)
  },
  onReady: (): void => {
    game.mythras.encounterGenerator = new EncounterGenerator()
  }
}
