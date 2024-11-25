import {CharacterSheetMythras} from "@actor/character/sheet";
import { ActorMythras } from "./base";

export class ActorSheetClassRegistry {
  /**
   * If you want to offer alternative actor sheets, this would be the place to add them
   */
  static registerSheetClasses() {
    console.log(`Mythras | register actor sheet classes from registry`);
    Actors.unregisterSheet('core', ActorSheet)
    ActorSheetClassRegistry.doRegister(CharacterSheetMythras, ["character"], true)
    // ToDo create vehicle, starship actors?
  }

  private static doRegister(documentClass: ConstructorOf<ActorSheet<ActorMythras>>, types: string[], isDefault: boolean) {
    Actors.registerSheet('mythras', documentClass, {
      types: types,
      makeDefault: isDefault
    });
  }

}