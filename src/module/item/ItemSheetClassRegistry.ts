import { SkillSheetMythras } from "@item/skill/sheet";
import { ItemSheetBase } from "@item/ItemSheetBase";
import { PhysicalItemSheetMythras } from "@item/physical/sheet";
import { SpellSheetMythras } from "@item/spell/sheet";
import { ArmorSheetMythras } from "@item/armor/sheet";
import { ItemMythras } from "./base";

export class ItemSheetClassRegistry {

  /**
   * If you want to offer alternative item sheets, this would be the place to add them
   */
  static registerSheetClasses() {
    console.log(`Mythras | register item sheet classes from registry`);
    Items.unregisterSheet('core', ItemSheet)
    ItemSheetClassRegistry.doRegister(SkillSheetMythras,
      ["standardSkill", "professionalSkill", "combatStyle", "magicSkill", "passion"], true)
    ItemSheetClassRegistry.doRegister(ItemSheetBase, ["hitLocation", "cultBrotherhood"], true)
    ItemSheetClassRegistry.doRegister(PhysicalItemSheetMythras,
      ["melee-weapon", "ranged-weapon", "equipment", "currency", "storage"], true)
    ItemSheetClassRegistry.doRegister(ArmorSheetMythras, ["armor"], true)
    ItemSheetClassRegistry.doRegister(SpellSheetMythras, ["spell"], true)
    // Todo gun sheet for type "ranged-weapon"?
  }

  private static doRegister(documentClass: ConstructorOf<ItemSheet<ItemMythras,DocumentSheetOptions>>, types: string[], isDefault: boolean) {
    Items.registerSheet('mythras', documentClass, {
      types: types,
      makeDefault: isDefault
    });
  }
}

