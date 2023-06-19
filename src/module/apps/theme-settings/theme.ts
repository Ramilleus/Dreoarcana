export interface Theme {
  /**
   * Message key for front end displaying
   */
  name: string;

  /**
   * Hook to add theme specific content
   */
  registerThemeSpecificSheetClasses(): void;

  /**
   * Hook to remove theme specific content
   */
  unregisterThemeSpecificSheetClasses(): void;

  /**
   * Allows themes to replace messageKeys to relabel Mythras mechanics
   * This is not globally implemented
   */
  relabel(contextName: string, labelKey: string): string;

  /**
   * Allows themes to replace the default Actor template with their own
   */
  getCharacterActorTemplate(): string;
}