import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { MYTHRASCONFIG } from '@scripts/config'
import { EncounterGenerator } from '@apps/encounter-generator'
import { ThemeManager } from "@apps/theme-settings/themeManager";

export {}

declare global {
  interface Game {
    mythras: {
      theme: ThemeManager
      encounterGenerator: EncounterGenerator
    }
  }

  interface ConfigMythras extends Config {
    MYTHRAS: typeof MYTHRASCONFIG
  }

  const CONFIG: ConfigMythras

  namespace globalThis {
    // eslint-disable-next-line no-var
    var game: Game<
      ActorMythras,
      Actors<ActorMythras>,
      ChatMessage<ActorMythras>,
      Combat,
      ItemMythras,
      Macro,
      Scene,
      User<ActorMythras>
    >;

    var ui: FoundryUI<
      ActorMythras,
      ActorDirectory<ActorMythras>,
      ItemMythras,
      ChatLog,
      CompendiumDirectory
    >
  }

  const BUILD_MODE: 'development' | 'production'
}
