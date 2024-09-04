import { EncounterGenerator } from '@module/apps/encounter-generator'
import { ThemeManager } from "@apps/theme-settings/themeManager";

export const SetGameMythras = {
  /**
   * This creates and initializes the game.mythras object and other system relevant objects
   */
  onInit: (): void => {
    Object.defineProperty(globalThis.game, 'mythras', {value: {}})
    const initSafe: Partial<typeof game['mythras']> = {}

    foundry.utils.mergeObject(game.mythras, initSafe)

    Object.defineProperty(globalThis.game.mythras, 'theme', {value: new ThemeManager()})
    Object.defineProperty(globalThis.game.mythras, 'encounterGenerator', {value: new EncounterGenerator()})
  },
  onReady: (): void => {
    game.mythras.encounterGenerator.onReady()
    game.mythras.theme.onReady()
  }
}
