/* ===================================================================
 * Dreoarcana Arcana — item sheets and the character sheet
 *
 * Arcane spells and Effect nodes have no window of their own: their
 * "sheet" opens the Arcanum on them, wherever they were opened from —
 * the character sheet, the Items directory, a compendium or a link.
 *
 * The character sheet lists a caster's arcane spells natively (see
 * templates/arcana/actor-arcana.hbs); arcaneSheetContext feeds it.
 * =================================================================== */

import { SPELL_TYPE, isArcaneSpell, fmt } from "./core.js";
import { evaluateSpell } from "./rules.js";
import { num, SETTINGS } from "./settings.js";
import { sigilSVG } from "./sigil.js";
import { buildOf, baselineCaster } from "./spells.js";
import { openArcanum } from "./arcanum.js";

const { DocumentSheetV2 } = foundry.applications.api;

/** A sheet that never draws itself; it hands the document to the Arcanum. */
class ArcanumSheet extends DocumentSheetV2 {
  static DEFAULT_OPTIONS = { classes: ["mm-redirect"] };
  _open() { throw new Error("subclass"); }
  async render() {
    try { await this._open(); }
    catch (err) { console.error("Dreoarcana | Arcana: could not open the Arcanum", err); }
    return this;
  }
}

export class ArcaneSpellSheet extends ArcanumSheet {
  _open() { return openArcanum({ item: this.document }); }
}

export class ArcaneEffectSheet extends ArcanumSheet {
  _open() { return openArcanum({ effectUuid: this.document.uuid }); }
}

/** The character sheet's Arcane Spells table. */
export function arcaneSheetContext(actor) {
  const caster = baselineCaster(actor);
  const roundSeconds = num(SETTINGS.roundSeconds, 5);
  const spells = (actor?.items ?? [])
    .filter(i => i.type === SPELL_TYPE)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => {
      const build = buildOf(item);
      const ev = evaluateSpell(build, caster);
      return {
        id: item.id, name: item.name,
        tier: ev.tier.tier, numeral: ev.tier.numeral, tierName: ev.tier.name,
        might: fmt(ev.xi), heat: fmt(ev.heat), orie: fmt(ev.orieFinal),
        castTime: `${fmt(ev.castTime)} s`, rounds: fmt(ev.castTime / roundSeconds),
        sigil: sigilSVG(build, { size: 28, cls: "mm-sigil-svg" })
      };
    });
  return { spells, has: spells.length > 0 };
}

export { isArcaneSpell };
