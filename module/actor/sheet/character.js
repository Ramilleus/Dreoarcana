import { ActorSheetMythras } from './base.js';

export class ActorSheetMythrasCharacter extends ActorSheetMythras {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["mythras", "sheet", "actor"],
      template: "systems/mythras/templates/actor/actor-sheet.html",
      width: 700,
      height: 900,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

}