import { CyberModuleSheetMythras } from "@item/cyber-module/sheet";
import { ThemeSettings } from "@apps/theme-settings/themeSettings";

export class MSpaceThemeSettings extends ThemeSettings {
  constructor() {
    super("SETTINGS.gameThemeSpace")
  }

  registerThemeSpecificSheetClasses(): void {
    Items.registerSheet('mythras', CyberModuleSheetMythras, {
      types: ["cyberModule"],
      makeDefault: false
    });
  }

  unregisterThemeSpecificSheetClasses() {
    Items.unregisterSheet('mythras', CyberModuleSheetMythras, {types:["cyberModule"]})
  }

  relabel(contextName: string, labelKey: string): string {
    if ('MYTHRAS.MAGIC_POINTS' == labelKey) {
      return 'MYTHRAS.SPACE.POWER_POINTS'
    }
    return super.relabel(contextName, labelKey);
  }

  getCharacterActorTemplate(): string {
    return 'systems/mythras/templates/actor/actor-sheet-space.hbs';
  }
}