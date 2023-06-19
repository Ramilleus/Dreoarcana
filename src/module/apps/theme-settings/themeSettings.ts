import { Theme } from "@apps/theme-settings/theme";

export class ThemeSettings implements Theme {
  name: string;

  constructor(name: string) {
    this.name = name
  }

  registerThemeSpecificSheetClasses(): void {
    // do nothing in default impl
  }

  unregisterThemeSpecificSheetClasses(): void {
    // do nothing in default impl
  }

  relabel(contextName: string, labelKey: string): string {
    // do nothing in default impl
    return labelKey;
  }

  getCharacterActorTemplate(): string {
    return 'systems/mythras/templates/actor/actor-sheet-mythras.hbs';
  }
}