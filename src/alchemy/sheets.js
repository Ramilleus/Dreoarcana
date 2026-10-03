/* ===================================================================
 * Dreoarcana Alchemy — item sheets
 *
 * Ingredients and potions have no window of their own: opening one
 * from anywhere (the Equipment tab, the Items directory, a compendium)
 * opens the Laboratory on it.
 * =================================================================== */

import { openLaboratory } from "./laboratory.js";

const { DocumentSheetV2 } = foundry.applications.api;

export class AlchemySheet extends DocumentSheetV2 {
  static DEFAULT_OPTIONS = { classes: ["mm-redirect"] };
  async render() {
    try { await openLaboratory({ item: this.document }); }
    catch (err) { console.error("Dreoarcana | Alchemy: could not open the Laboratory", err); }
    return this;
  }
}
