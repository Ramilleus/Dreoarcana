import { ThemeSettings } from "@apps/theme-settings/themeSettings";
import { MSpaceThemeSettings } from "@apps/theme-settings/MSpaceThemeSettings";
import { Theme } from "@apps/theme-settings/theme";

/**
 * Convenient way to access global setting regarding game theme.
 * This could be expanded with more settings which are based to Mythras
 */
export class ThemeManager {
  MYTHRAS_CLASSIC: Theme
  M_SPACE: Theme

  constructor() {
    this.MYTHRAS_CLASSIC = new ThemeSettings("SETTINGS.gameThemeMythras");
    this.M_SPACE = new MSpaceThemeSettings();
  }

  getThemeChoices(): Record<string, unknown> {
    return {
      mythras: this.MYTHRAS_CLASSIC.name,
      mythras_space: this.M_SPACE.name
    }
  }

  isClassic(): boolean {
    return this.getTheme().name == this.MYTHRAS_CLASSIC.name
  }

  getTheme(): Theme {
    switch (game.settings.get("mythras", "gameTheme")) {
      case 'mythras_space':
        return this.M_SPACE
      default:
        return this.MYTHRAS_CLASSIC
    }
  }

  getThemeName(): string {
    // @ts-ignore
    return game.settings.get("mythras", "gameTheme");
  }

  onReady() {
    game.settings.register("mythras", "gameTheme", {
      name: "SETTINGS.gameThemeName",
      hint: "SETTINGS.gameThemeHint",
      scope: "world",
      config: true,
      default: "mythras",
      type: String,
      choices: this.getThemeChoices(),
      onChange: value => {
        this.onThemeChange(value)
      }
    });
    console.log("Mythras | Theme settings available. Active theme: " + this.getThemeName())
    this.getTheme().registerThemeSpecificSheetClasses();
  }

  onThemeChange(value: string) {
    console.log("Mythras | Changing theme to: " + value)
    this.getTheme().registerThemeSpecificSheetClasses();
    // ToDo find a way to hide existing items which shouldn't exist in selected theme.
    //ItemSheetClassRegistry.unregisterThemeSpecificSheetClasses(this.getTheme())
    // in the future also do same with ActorSheetClassRegistry
    // ToDo replace msg keys in game.i18n to setting specific values
  }
}