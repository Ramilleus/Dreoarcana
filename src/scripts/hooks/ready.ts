import { SetGameMythras } from '@scripts/set-game-mythras'

export const Ready = {
  listen: (): void => {
    Hooks.once('ready', () => {
      SetGameMythras.onReady()
    })
  }
}
