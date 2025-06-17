import { ActorMythras } from '@actor'
import { ItemMythras } from '@item/base'
import { MYTHRASCONFIG } from '@scripts/config'
import { EncounterGenerator } from '@apps/encounter-generator'
import { ThemeManager } from "@apps/theme-settings/themeManager";
import { CombatMythras } from '@module/combat/combat-mythras';
import { MythrasCombatTracker } from '@module/combat/combat-tracker';

export {}


declare global {

  interface GameMythras extends Game<
    ActorMythras<null>,Actors<ActorMythras<null>>,
    ChatMessage,Combat,
    ItemMythras<null>,Macro,
    Scene,User<ActorMythras<null>>
  >{
    mythras: {
      theme: ThemeManager
      encounterGenerator: EncounterGenerator
    }
    canvas: Canvas;
  }

  interface ConfigMythras extends ConfiguredConfig {
    MYTHRAS: typeof MYTHRASCONFIG
  }
  type ConfiguredConfig = Config<
  AmbientLightDocument<Scene | null>,
  ActiveEffect<ActorMythras | ItemMythras | null>,
  ActorMythras,
  ActorDelta<TokenDocument>,
  ChatLog,
  ChatMessage,
  CombatMythras,
  Combatant<CombatMythras | null, TokenDocument>,
  MythrasCombatTracker<CombatMythras|null>,
  CompendiumDirectory,
  Hotbar,
  ItemMythras,
  Macro,
  MeasuredTemplateDocument,
  RegionDocument,
  RegionBehavior,
  TileDocument<Scene>,
  TokenDocument,
  WallDocument<Scene | null>,
  Scene,
  User,
  EffectsCanvasGroup
>;
  const CONFIG: ConfigMythras

  namespace globalThis {
    // eslint-disable-next-line no-var
    var game: GameMythras;

    var ui: FoundryUI<
      ActorDirectory<ActorMythras<null>>,
      ItemDirectory<ItemMythras<null>>,
      ChatLog,
      CompendiumDirectory,
      MythrasCombatTracker<CombatMythras|null>,
      Hotbar
    >
  }

  const BUILD_MODE: 'development' | 'production'
}
