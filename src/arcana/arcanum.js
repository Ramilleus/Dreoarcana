/* ===================================================================
 * Dreoarcana Arcana — the Arcanum
 *
 * One screen for all of it. A caster's spellbook and pools on the left;
 * the spell flow chart in the middle, where a spell is built, edited,
 * heard and cast; and two more tabs for the Effect node catalogue and
 * the rules. Every arcane spell or effect item "sheet" opens here.
 *
 * The flow chart: ξ leaves the caster on the left, is given an Intent
 * and converted (the Will group), shaped (Form, Range, Size), run
 * through any flow-control nodes, and fans out to the Effect nodes,
 * which converge on the manifestation. Heat runs back to the caster.
 * Nodes are HTML cards; the links are SVG paths drawn from the cards'
 * positions in stage space, so panning and zooming (a CSS transform on
 * the stage) never needs them redrawn.
 *
 * Parts: tabs, rail, bench, foot (the Workshop tab), effects, rules.
 * Value edits repaint the bench in place (focus and scroll survive);
 * adding or removing a node re-renders the bench from state.
 * =================================================================== */

import { TEMPLATES, isArcaneSpell, isEffectItem, castingSkills, defaultCastingSkill, carriedCatalysts,
         castableActors, currentActor, currentOrie, maxOrie, fmt } from "./core.js";
import { INTENTS, CONVERSIONS, FORMS, RANGES, SIZES, EFFECTS, DAMAGE_TYPES, UTILITY_NODES,
         FOCUS_PRESETS, CATALYST_PRESETS, TIERS, blankBuild, normalizeBuild, evaluateSpell,
         utilityNodeValues, castTimeLabel, clamp, customEffectRecords, formatMagnitude, damageFormula,
         validateEffectDefinition, effectCategories, CIRCUMSTANCES, gradedTarget } from "./rules.js";
import { setting, num, SETTINGS } from "./settings.js";
import { heatState, ventHeat, clearHeat } from "./heat.js";
import { saveSpell, buildOf, spellbook } from "./spells.js";
import { castSpell, gradeFor, cannotCast, orieSpent } from "./cast.js";
import { createEffectItem, refreshEffects, sendEffectToPack, spellsUsingEffect, getEffectsPack, PACK_LABEL } from "./effects.js";
import { rulesPages, buildRulesJournal } from "./rules-pages.js";
import { confirmDialog } from "./ui.js";
import { e } from "./html.js";
import { sigilSVG, glyphSVG } from "./sigil.js";
import { playLocal, exportSpellWav, describeSound } from "./sound.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const SVG_NS = "http://www.w3.org/2000/svg";
const T = (name) => `${TEMPLATES}/${name}.hbs`;

export const ARCANUM_TEMPLATES = ["arcanum-tabs", "arcanum-rail", "arcanum-bench", "arcanum-foot", "arcanum-effects", "arcanum-rules"].map(T);

/* Link weight and pace by tier — bigger workings run faster and thicker. */
const FLOW_STYLE = {
  1: { duration: 1.6, width: 2 },
  2: { duration: 1.2, width: 2.4 },
  3: { duration: 0.9, width: 2.8 },
  4: { duration: 0.65, width: 3.2 },
  5: { duration: 0.45, width: 3.6 }
};

/* The chart opens no smaller than this; past it, the player pans. */
const READABLE_ZOOM = 0.8;

const TABS = [
  { id: "workshop", label: "Workshop", icon: "fas fa-project-diagram" },
  { id: "effects", label: "Effect Nodes", icon: "fas fa-flask" },
  { id: "rules", label: "Rules", icon: "fas fa-book" }
];

/** Effect choices, grouped: the elements first, then each category. */
function effectOptionGroups(selectedValue = null) {
  const groups = [{
    group: "Evocation — Elemental",
    items: Object.entries(DAMAGE_TYPES).map(([key, d]) => ({
      value: `Elemental|${key}`, label: d.compound ? `${key} ⁺` : key,
      tip: d.compound ? `${d.desc} (${d.compound.join(" + ")})` : d.desc,
      selected: selectedValue === `Elemental|${key}`
    }))
  }];
  const byCat = {};
  for (const [key, def] of Object.entries(EFFECTS)) {
    if (def.element) continue;
    (byCat[def.category] ??= []).push({
      value: key, label: `${def.label ?? key}${def.custom ? " ✎" : ""}`,
      tip: `${def.desc} — ${def.intents.join(" / ")}${def.damage ? " · damage-capable" : ""}${def.custom ? " · custom" : ""}`,
      selected: selectedValue === key
    });
  }
  for (const [group, items] of Object.entries(byCat)) groups.push({ group, items });
  return groups;
}

const signature = (build) => JSON.stringify(normalizeBuild(build));
const canBuild = () => game.user?.isGM || setting(SETTINGS.playerBuilding) !== false;

export class Arcanum extends HandlebarsApplicationMixin(ApplicationV2) {

  /** The one Arcanum on this client. */
  static instance = null;

  static DEFAULT_OPTIONS = {
    id: "dreoarcana-arcanum",
    classes: ["mm", "mm-arcanum"],
    tag: "form",
    window: { title: "Arcanum", resizable: true, icon: "fas fa-hat-wizard", contentClasses: ["mm-surface"] },
    position: { width: 1360, height: 860 },
    form: { handler: Arcanum.#onSubmit, submitOnChange: false, closeOnSubmit: false },
    actions: {
      showTab: Arcanum.#onShowTab,
      // workshop
      newSpell: Arcanum.#onNewSpell,
      selectSpell: Arcanum.#onSelectSpell,
      deleteSpell: Arcanum.#onDeleteSpell,
      vent: Arcanum.#onVent,
      openSheet: Arcanum.#onOpenSheet,
      removeUtility: Arcanum.#onRemoveUtility,
      removeEffect: Arcanum.#onRemoveEffect,
      newEffectHere: Arcanum.#onNewEffectHere,
      zoomIn: Arcanum.#onZoomIn,
      zoomOut: Arcanum.#onZoomOut,
      zoomReset: Arcanum.#onZoomReset,
      zoomFit: Arcanum.#onZoomFit,
      preview: Arcanum.#onPreview,
      exportSound: Arcanum.#onExportSound,
      reset: Arcanum.#onReset,
      save: Arcanum.#onSave,
      cast: Arcanum.#onCast,
      // effects
      selectEffect: Arcanum.#onSelectEffect,
      addEffect: Arcanum.#onAddEffect,
      deleteEffect: Arcanum.#onDeleteEffect,
      effectToPack: Arcanum.#onEffectToPack,
      effectImage: Arcanum.#onEffectImage,
      openPack: Arcanum.#onOpenPack,
      refreshEffects: Arcanum.#onRefreshEffects,
      // rules
      rulesPage: Arcanum.#onRulesPage,
      publishRules: Arcanum.#onPublishRules
    }
  };

  static PARTS = {
    tabs: { template: T("arcanum-tabs") },
    rail: { template: T("arcanum-rail"), scrollable: [".mm-spellbook-list"] },
    bench: { template: T("arcanum-bench"), scrollable: [".mm-notices"] },
    foot: { template: T("arcanum-foot") },
    effects: { template: T("arcanum-effects"), scrollable: [".mm-effects-index", ".mm-effects-editor"] },
    rules: { template: T("arcanum-rules"), scrollable: [".mm-rules-index", ".mm-rules-page"] }
  };

  static ZOOM_MIN = 0.3;
  static ZOOM_MAX = 2;

  constructor(options = {}) {
    const position = {
      width: Math.min(1360, Math.max(820, (globalThis.innerWidth ?? 1400) - 40)),
      height: Math.min(860, Math.max(560, (globalThis.innerHeight ?? 900) - 40)),
      ...(options.position ?? {})
    };
    super({ ...options, position });
    this.tab = "workshop";
    this.effectUuid = null;
    this.rulesIndex = 0;
    this.pendingEffectKey = null;
    this.view = { x: 0, y: 0, z: 1, auto: true };
    this._mmSetActor(options.actor ?? null);
  }

  get title() { return this.actor ? `Arcanum — ${this.actor.name}` : "Arcanum"; }

  /* ---------------------------------------------------------------
   * State
   * ------------------------------------------------------------- */

  /** Switch caster: fresh spell, fresh casting choices. */
  _mmSetActor(actor) {
    this.actor = actor ?? null;
    const skill = defaultCastingSkill(this.actor);
    // stored: Orie to draw from Stored Orie; "" draws as much as the spell can use.
    // steps: circumstances, in difficulty grades (Mythras p.38/p.120).
    this.caster = { skillId: skill?.id ?? "", skill: skill?.value ?? 50, focus: 1, catalyst: 1, stored: "", steps: 0 };
    this._mmLoadSpell(null);
  }

  /** Put a spell (or a blank one) on the bench. */
  _mmLoadSpell(item) {
    this.item = item ?? null;
    this.build = normalizeBuild(item ? buildOf(item) : blankBuild());
    this.savedSig = signature(this.build);
    this.view.auto = true;
  }

  get dirty() { return signature(this.build) !== this.savedSig; }

  /** Ask before throwing away unsaved work. True means go ahead. */
  async _mmConfirmDiscard() {
    if (!this.dirty || !canBuild()) return true;
    return confirmDialog({
      title: "Unsaved spell",
      content: `<p><strong>${e(this.build.name)}</strong> has changes that are not saved. Discard them?</p>`,
      yesLabel: "Discard", noLabel: "Keep editing"
    });
  }

  /** Bring the window to a given actor, spell, tab or effect. */
  async focus({ actor, item, tab, effectUuid } = {}) {
    const nextActor = item ? (item.actor ?? null) : actor;
    const switchingActor = nextActor !== undefined && nextActor !== this.actor;
    const switchingSpell = item !== undefined && item?.id !== this.item?.id;
    if ((switchingActor || switchingSpell) && !(await this._mmConfirmDiscard())) {
      this.bringToFront?.();
      return this;
    }
    if (switchingActor) this._mmSetActor(nextActor);
    if (item && isArcaneSpell(item)) this._mmLoadSpell(item);
    if (tab) this.tab = tab;
    if (effectUuid) { this.effectUuid = effectUuid; this.tab = "effects"; }
    if (item && isArcaneSpell(item)) this.tab = "workshop";
    await this.render({ force: true });
    this.bringToFront?.();
    return this;
  }

  /* ---------------------------------------------------------------
   * Derived
   * ------------------------------------------------------------- */

  _mmCasterParams() {
    return {
      skill: this.caster.skill,
      skillDivisor: num(SETTINGS.skillDivisor, 50),
      xiPerDamage: num(SETTINGS.xiPerDamage, 2),
      focus: this.caster.focus, catalyst: this.caster.catalyst, stored: this._mmDraw()
    };
  }

  /** Orie offered from Stored Orie: the caster's choice, or all they have. The rules cap it at what the spell needs. */
  _mmDraw() {
    const have = this.actor ? currentOrie(this.actor) : 0;
    const want = this.caster.stored === "" || this.caster.stored === null ? have : Number(this.caster.stored) || 0;
    return clamp(want, 0, have);
  }

  evaluate() { return evaluateSpell(this.build, this._mmCasterParams()); }

  /** Motion is on unless the player or the OS says otherwise. */
  _mmAnimate() {
    return setting(SETTINGS.animations) !== false
      && !(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  }

  /** The caster's pools and limits as they bear on this cast. */
  _mmBudget(ev) {
    const heat = this.actor && setting(SETTINGS.trackHeat) !== false ? heatState(this.actor) : null;
    const orie = this.actor ? currentOrie(this.actor) : null;
    const grade = gradeFor(ev.tier.tier, this.caster.steps);
    return {
      heat, orie, grade,
      drawn: ev.caster.stored, spent: orieSpent(ev.caster.stored),
      target: gradedTarget(this.caster.skill, grade),
      over: Boolean(heat && (heat.heat + ev.heat) > heat.capacity)
    };
  }

  /** The status bar: what this spell is and what it will cost. */
  _mmStatusHTML(ev) {
    const b = this._mmBudget(ev);
    const roundSeconds = num(SETTINGS.roundSeconds, 5);
    const rounds = ev.castTime / roundSeconds;
    const chip = (html, tip, cls = "") => `<span class="mm-chip ${cls}" data-tooltip="${e(tip)}">${html}</span>`;
    return [
      chip(`<b class="mm-chip-tier">${ev.tier.numeral}</b> ${ev.tier.name}`, ev.tier.desc, "is-tier"),
      b.grade
        ? chip(`${b.grade.label} <small>${b.target}%</small>`, `Casting roll: ${this.caster.skill}% at ${b.grade.label}, critical on ${Math.ceil(b.target * 0.1) || 1} or less`)
        : chip("Hopeless", "Past Herculean: no attempt can be made", "is-bad"),
      b.orie !== null
        ? chip(`${b.spent} Orie <small>of ${b.orie} stored</small>`,
               `Œ ${fmt(ev.orieFinal)} needed: ${fmt(b.drawn)} drawn from Stored Orie (no Heat), ${fmt(ev.orieConverted)} converted now (makes Heat)`)
        : chip(`Œ ${fmt(ev.orieFinal)}`, "Orie the spell needs. A caster's Stored Orie covers it without Heat; the rest is converted and makes Heat."),
      chip(`Heat +${fmt(ev.heat)}${b.heat ? ` <small>→ ${fmt(b.heat.heat + ev.heat)} / ${b.heat.capacity}</small>` : ""}`,
           b.over ? "This cast would push Heat past capacity — it will burn" : "Heat = Œ^1.3 × Complexity ÷ 6", b.over ? "is-bad" : ""),
      chip(`${fmt(ev.castTime)} s <small>${fmt(rounds)} rd</small>`, castTimeLabel(ev.castTime, roundSeconds)),
      chip(`C ${fmt(ev.complexity)}`, `Complexity: ${fmt(ev.complexityRaw)} from the nodes × ${CONVERSIONS[ev.build.conversion].complexityFactor} for ${ev.build.conversion}`)
    ].join("");
  }

  /** Problems worth reading. Empty when there are none. */
  _mmNoticesHTML(ev) {
    const b = this._mmBudget(ev);
    // Running dry is allowed (house rule): the caster eats all the Heat.
    const dry = b.orie === 0 && ev.orieFinal > 0
      ? [`<p class="mm-warn">${e(this.actor.name)} has no Stored Orie: all ${fmt(ev.orieFinal)} Œ is converted on the spot, and the caster takes all ${fmt(ev.heat)} Heat.</p>`]
      : [];
    return [
      ...ev.errors.map(t => `<p class="mm-error">${e(t)}</p>`),
      ...dry,
      ...ev.warnings.map(t => `<p class="mm-warn">${e(t)}</p>`)
    ].join("");
  }

  /** What the footer buttons can do right now. */
  _mmFootState(ev) {
    const owner = !this.actor || this.actor.isOwner;
    const save = canBuild() && owner && ev.valid && (this.dirty || !this.item);
    const castReason = !this.actor ? "Choose a caster to cast"
      : !owner ? `You don't control ${this.actor.name}`
      : (!this.item && !canBuild()) ? "Only the GM can save spells here"
      : cannotCast(this.actor, ev, this.caster.steps);
    return { save, cast: !castReason, castReason };
  }

  /* ---------------------------------------------------------------
   * Context
   * ------------------------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // An effect created from the bench ticks itself once it registers.
    if (this.pendingEffectKey && EFFECTS[this.pendingEffectKey]) {
      if (!this.build.effects.some(x => x.effect === this.pendingEffectKey)) this.build.effects.push({ effect: this.pendingEffectKey });
      this.build = normalizeBuild(this.build);
      this.pendingEffectKey = null;
    }
    // A spell deleted elsewhere stays on the bench, unsaved.
    if (this.item && !this.item.pack && !this.item.parent?.items?.has?.(this.item.id) && !game.items.has(this.item.id)) {
      this.item = null; this.savedSig = null;
    }
    const ev = this.evaluate();
    return Object.assign(context, { ev, tab: this.tab, isGM: game.user.isGM });
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "tabs": return Object.assign(context, this._mmTabsContext());
      case "rail": return Object.assign(context, this._mmRailContext(context.ev));
      case "bench": return Object.assign(context, this._mmBenchContext(context.ev));
      case "foot": return Object.assign(context, this._mmFootContext(context.ev));
      case "effects": return Object.assign(context, await this._mmEffectsContext());
      case "rules": return Object.assign(context, this._mmRulesContext());
    }
    return context;
  }

  _mmTabsContext() {
    return { tabs: TABS.map(t => ({ ...t, active: t.id === this.tab })) };
  }

  _mmRailContext(ev) {
    const a = this.actor;
    const choices = castableActors();
    const actor = a ? {
      name: a.name, img: a.img, uuid: a.uuid,
      skill: castingSkills(a).find(s => s.id === this.caster.skillId)?.name ?? (this.caster.skillId ? "" : `Skill ${this.caster.skill}%`)
    } : null;

    let heat = null, orie = null;
    if (a) {
      const st = heatState(a);
      if (st.tracking) heat = {
        value: fmt(st.heat), max: st.capacity, pct: st.pct, rate: num(SETTINGS.ventPerRound, 2),
        cls: st.over > 0 ? "is-over" : st.pct >= 75 ? "is-hot" : "", over: st.over ? fmt(st.over) : ""
      };
      const o = currentOrie(a), om = maxOrie(a);
      orie = { value: o, max: om, pct: om ? Math.min(100, Math.round(o / om * 100)) : 0 };
    }

    const spells = spellbook(a).map(item => {
      const b = buildOf(item);
      const sev = evaluateSpell(b, this._mmCasterParams());
      return {
        id: item.id, name: item.name, selected: item.id === this.item?.id,
        tier: sev.tier.tier, numeral: sev.tier.numeral, tierName: sev.tier.name, might: fmt(sev.xi),
        sigil: sigilSVG(b, { size: 30, cls: "mm-sigil-svg" })
      };
    });

    return {
      actor, heat, orie, spells,
      actorChoices: choices.map(c => ({ uuid: c.uuid, name: c.name, selected: c === a })),
      showChoices: game.user.isGM || choices.length > 1 || (!a && choices.length > 0),
      canEdit: canBuild() && (!a || a.isOwner),
      isOwner: !a || a.isOwner,
      newIsCurrent: !this.item
    };
  }

  _mmBenchContext(ev) {
    const b = this.build;
    const pick = (table, selected) => Object.entries(table).map(([key, v]) => ({ key, ...v, selected: String(key) === String(selected) }));

    const formsByTier = TIERS
      .map(t => ({ label: `Tier ${t.numeral}`, forms: pick(FORMS, b.form).filter(f => f.tier === t.tier) }))
      .filter(g => g.forms.length);

    const effectNodes = ev.effects.map((x, index) => {
      const value = x.element ? `Elemental|${x.element}` : x.effect;
      return {
        index, category: x.category, text: x.text,
        complexity: (EFFECTS[x.effect]?.complexity ?? 1) + (x.compound ? 1 : 0),
        damage: x.damage, compound: x.compound, custom: Boolean(EFFECTS[x.effect]?.custom),
        glyph: glyphSVG(x.element ? { effect: "Elemental", element: x.element } : { effect: x.effect }, { size: 15 }),
        options: effectOptionGroups(value)
      };
    });

    const utilityOptions = Object.entries(UTILITY_NODES).map(([key, u]) => ({ key, desc: u.desc }));
    const utilities = b.utilities.map((u, index) => {
      const def = UTILITY_NODES[u.node];
      const v = utilityNodeValues(u);
      return {
        index, count: u.count, desc: def.desc, per: def.per ?? null,
        levels: def.levels ? def.levels.map((m, i) => ({ level: i + 1, mult: m, selected: i + 1 === u.level })) : null,
        xiLabel: v.xi, dcLabel: v.dc,
        options: utilityOptions.map(o => ({ ...o, selected: o.key === u.node }))
      };
    });

    const skills = castingSkills(this.actor).map(s => ({ ...s, selected: s.id === this.caster.skillId }));
    const focus = Object.entries(FOCUS_PRESETS).map(([v, label]) => ({
      value: v, label, short: label.split(" (")[0].replace(/ and .*/, ""), selected: Number(v) === Number(this.caster.focus)
    }));
    const catalysts = [
      ...carriedCatalysts(this.actor).map(c => ({ value: c.quality, label: `${c.name} — Γ ${c.quality}`, short: `${c.name} · ${c.quality}` })),
      ...Object.entries(CATALYST_PRESETS).map(([v, label]) => ({ value: v, label: `${label} (Γ ${v})`, short: `${label.split(" (")[0].split(" — ")[0]} · ${v}` }))
    ];
    const hit = catalysts.findIndex(c => Number(c.value) === Number(this.caster.catalyst));
    catalysts.forEach((c, i) => { c.selected = i === (hit < 0 ? 0 : hit); });

    const heat = this.actor ? heatState(this.actor) : null;
    const formDef = FORMS[b.form];
    const locked = !canBuild() || Boolean(this.actor && !this.actor.isOwner);

    return {
      build: b, tier: ev.tier, lock: locked ? "disabled" : "", locked,
      intents: pick(INTENTS, b.intent), intent: INTENTS[b.intent],
      conversions: pick(CONVERSIONS, b.conversion), conversion: CONVERSIONS[b.conversion],
      formsByTier, form: { ...formDef, tierNumeral: TIERS[formDef.tier - 1].numeral },
      ranges: pick(RANGES, b.range), range: RANGES[b.range],
      sizes: pick(SIZES, b.size), size: SIZES[b.size],
      utilities, utilityOptions,
      effectNodes, addEffectOptions: effectOptionGroups(null),
      skills, hasSkills: skills.length > 0, skillPct: this.caster.skill, manualSkill: !this.caster.skillId,
      focus, catalysts,
      circumstances: CIRCUMSTANCES.map(c => ({ ...c, selected: c.steps === Number(this.caster.steps) })),
      stored: this.caster.stored, orieHave: this.actor ? currentOrie(this.actor) : 0, hasActor: Boolean(this.actor),
      xi: fmt(ev.xi), orieFinal: fmt(ev.orieFinal),
      heatLabel: `+${fmt(ev.heat)} Heat`,
      sigil: sigilSVG(b, { size: 120, spin: this._mmAnimate() }),
      status: this._mmStatusHTML(ev),
      notices: this._mmNoticesHTML(ev),
      lines: ev.lines.map(l => ({ label: l.label, mult: l.mult === 1 ? "—" : `×${l.mult}`, dc: l.dc ? `+${fmt(l.dc)}` : "—" })),
      breakdown: `ξ = ${fmt(b.power)} × ${ev.xiMult} = ${fmt(ev.xi)} · Œ = ξ ÷ (F ${fmt(ev.caster.F, 2)} × S ${fmt(ev.caster.S, 2)}) × ${CONVERSIONS[b.conversion].orie} × Γ ${fmt(ev.caster.G, 2)} = ${fmt(ev.orieFinal)}`,
      isGM: game.user.isGM
    };
  }

  _mmFootContext(ev) {
    const f = this._mmFootState(ev);
    return {
      canSave: f.save, canCast: f.cast, castReason: f.castReason,
      showSave: canBuild() && (!this.actor || this.actor.isOwner),
      saveLabel: this.item ? "Save" : this.actor ? `Save to ${this.actor.name}` : "Save to Items",
      dirty: this.dirty && Boolean(this.item),
      canExport: Boolean(this.item) && game.user.can?.("FILES_UPLOAD"),
      soundLabel: describeSound(this.build),
      hasActor: Boolean(this.actor)
    };
  }

  async _mmEffectsContext() {
    const xiPerDamage = num(SETTINGS.xiPerDamage, 2);
    const rows = customEffectRecords().map(r => ({
      ...r,
      selected: r.uuid === this.effectUuid,
      glyph: glyphSVG({ effect: r.key }, { size: 15 }),
      uses: spellsUsingEffect(r.key).length
    }));
    // World effect items the registry refused (bad data) still list, so they can be fixed.
    const listed = new Set(rows.map(r => r.uuid));
    for (const item of game.items) {
      if (!isEffectItem(item) || listed.has(item.uuid)) continue;
      rows.push({ key: item.system?.key, label: item.name, source: "World", uuid: item.uuid, category: item.system?.category ?? "Custom",
                  invalid: true, selected: item.uuid === this.effectUuid, glyph: "", uses: 0 });
    }
    const groups = {};
    for (const r of rows) (groups[r.source] ??= []).push(r);
    const sources = Object.entries(groups)
      .sort(([a], [b]) => (a === "World" ? -1 : b === "World" ? 1 : a.localeCompare(b)))
      .map(([source, effects]) => ({
        source, world: source === "World",
        effects: effects.sort((x, y) => String(x.category).localeCompare(String(y.category)) || x.label.localeCompare(y.label))
      }));

    let effect = null;
    const doc = this.effectUuid ? await fromUuid(this.effectUuid).catch(() => null) : null;
    if (doc && isEffectItem(doc)) {
      const s = doc.system ?? {};
      const { errors, def } = validateEffectDefinition({ key: s.key || doc.name, label: doc.name, ...s });
      const sample = (M) => formatMagnitude(def.magnitude, M, { damageFormula: def.damage ? damageFormula(M / xiPerDamage) : "—" });
      const editable = doc.isOwner && !(doc.pack && game.packs.get(doc.pack)?.locked);
      effect = {
        uuid: doc.uuid, name: doc.name, img: doc.img, editable, lock: editable ? "" : "disabled",
        inPack: Boolean(doc.pack),
        packLabel: doc.pack ? (game.packs.get(doc.pack)?.metadata.label ?? doc.pack) : null,
        key: def.key, category: def.category, complexity: def.complexity, damage: def.damage,
        desc: def.desc, magnitude: def.magnitude, errors,
        categories: [...new Set([...effectCategories(), "Custom", def.category])].sort(),
        intents: Object.keys(INTENTS).map(i => ({ key: i, checked: def.intents.includes(i), desc: INTENTS[i].desc })),
        previews: [5, 15, 40].map(M => ({ M, text: sample(M) })),
        glyph: glyphSVG({ effect: def.key }, { size: 40 }),
        uses: doc.pack ? null : spellsUsingEffect(def.key)
      };
    }
    const pack = await getEffectsPack({ create: false });
    return {
      sources, count: rows.length, effect,
      builtinCount: Object.values(EFFECTS).filter(v => v.builtin).length,
      hasPack: Boolean(pack), packLabel: pack?.metadata.label ?? PACK_LABEL
    };
  }

  _mmRulesContext() {
    const pages = rulesPages();
    const i = clamp(this.rulesIndex, 0, pages.length - 1);
    return {
      pages: pages.map((p, n) => ({ index: n, name: p.name, active: n === i })),
      page: pages[i]
    };
  }

  /* ---------------------------------------------------------------
   * Rendering
   * ------------------------------------------------------------- */

  /** Which parts make up a tab — the others are hidden by CSS. */
  _mmApplyTab() {
    if (!this.element) return;
    this.element.dataset.tab = this.tab;
    this.window?.title && (this.window.title.textContent = this.title);
  }

  _mmSetTierClass(tier) {
    const content = this.element?.querySelector(".window-content");
    if (!content) return;
    content.classList.remove("mm-tier-1", "mm-tier-2", "mm-tier-3", "mm-tier-4", "mm-tier-5");
    content.classList.add(`mm-tier-${tier}`);
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;
    this._mmApplyTab();
    this._mmSetTierClass(context.ev?.tier?.tier ?? 1);

    const parts = options.parts ?? Object.keys(this.constructor.PARTS);
    if (parts.includes("bench")) this._mmAfterBenchRender();

    if (root.dataset.mmBound === "1") return;
    root.dataset.mmBound = "1";
    root.addEventListener("change", (ev) => this._mmOnChange(ev));
    root.addEventListener("input", (ev) => {
      if (ev.target?.closest?.('[data-application-part="bench"]') && ev.target.matches('input[type="number"], input[type="text"]')) this._mmRefresh();
    });
    this._mmBindPanZoom(root);
  }

  /** The bench was replaced: lay out the chart and watch its size. */
  _mmAfterBenchRender() {
    requestAnimationFrame(() => {
      if (this.view.auto) this._mmFitView();
      this._mmApplyView();
      this._mmDrawLinks();
    });
    this._resizeObserver?.disconnect();
    if (!globalThis.ResizeObserver) return;
    let last = "";
    this._resizeObserver = new ResizeObserver(() => {
      const flow = this._mmFlow(), stage = this._mmStage();
      if (!flow || !stage || !flow.clientWidth) return;
      const sig = `${flow.clientWidth}x${flow.clientHeight}|${stage.offsetWidth}x${stage.offsetHeight}`;
      if (sig === last) return;
      last = sig;
      if (this.view.auto) { this._mmFitView(); this._mmApplyView(); }
      this._mmDrawLinks();
    });
    const flow = this._mmFlow(), stage = this._mmStage();
    if (flow) this._resizeObserver.observe(flow);
    if (stage) this._resizeObserver.observe(stage);
  }

  async close(options = {}) {
    if (!options.force && !(await this._mmConfirmDiscard())) return this;
    return super.close(options);
  }

  async _onClose(options) {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (Arcanum.instance === this) Arcanum.instance = null;
    return super._onClose?.(options);
  }

  /** Repaint everything that depends on the actor's pools. */
  refreshCaster() {
    if (!this.rendered) return;
    this.render({ parts: ["rail", "foot"] });
    if (this._mmBench()) this._mmRefresh({ read: false });
  }

  /* ---------------------------------------------------------------
   * Events
   * ------------------------------------------------------------- */

  _mmBench() { return this.element?.querySelector('[data-application-part="bench"]') ?? null; }
  _mmFlow() { return this.element?.querySelector("[data-flow]") ?? null; }
  _mmStage() { return this.element?.querySelector("[data-stage]") ?? null; }

  async _mmOnChange(ev) {
    const t = ev.target;
    const part = t?.closest?.("[data-application-part]")?.dataset.applicationPart;
    if (part === "bench") {
      if (t.matches('[data-field="addEffect"], [data-field="addUtility"]')) return this._mmOnStructuralChange(t);
      return this._mmRefresh();
    }
    if (part === "rail" && t.matches('[data-field="actor"]')) {
      const actor = t.value ? await fromUuid(t.value) : null;
      if (!(await this._mmConfirmDiscard())) { t.value = this.actor?.uuid ?? ""; return; }
      this._mmSetActor(actor);
      return this.render({ force: true });
    }
    if (part === "effects" && t.dataset.efield) return this._mmOnEffectField(t);
  }

  /* ---------------------------------------------------------------
   * View: zoom and pan (a transform on the stage; links untouched)
   * ------------------------------------------------------------- */

  _mmApplyView() {
    const stage = this._mmStage();
    if (!stage) return;
    const { x, y, z } = this.view;
    stage.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${z.toFixed(3)})`;
    const label = this.element.querySelector("[data-zoom-label]");
    if (label) label.textContent = `${Math.round(z * 100)}%`;
  }

  /** Show as much of the chart as fits without going below a readable size. */
  _mmFitView({ readable = true } = {}) {
    const flow = this._mmFlow(), stage = this._mmStage();
    if (!flow || !stage) return;
    const fw = flow.clientWidth, fh = flow.clientHeight;
    const sw = stage.offsetWidth, sh = stage.offsetHeight;
    if (!fw || !fh || !sw || !sh) return;
    const floor = readable ? READABLE_ZOOM : Arcanum.ZOOM_MIN;
    const z = clamp(Math.min(fw / sw, fh / sh), floor, 1);
    const x = sw * z <= fw ? (fw - sw * z) / 2 : 0;
    const y = sh * z <= fh ? (fh - sh * z) / 2 : 0;
    this.view = { x, y, z, auto: this.view.auto };
  }

  /** Zoom by a factor about a point in viewport pixels (default: the centre). */
  _mmZoomAt(factor, cx, cy) {
    const flow = this._mmFlow();
    if (!flow) return;
    if (cx === undefined) { cx = flow.clientWidth / 2; cy = flow.clientHeight / 2; }
    const z0 = this.view.z;
    const z = clamp(z0 * factor, Arcanum.ZOOM_MIN, Arcanum.ZOOM_MAX);
    if (z === z0) return;
    this.view.x = cx - (cx - this.view.x) * (z / z0);
    this.view.y = cy - (cy - this.view.y) * (z / z0);
    this.view.z = z;
    this.view.auto = false;
    this._mmApplyView();
  }

  /**
   * Drag the background to pan (or middle-drag anywhere), wheel to zoom
   * about the cursor, double-click the background to fit everything.
   * Bound once on the frame, which survives re-renders.
   */
  _mmBindPanZoom(root) {
    const inChart = (t) => t?.closest?.("[data-flow]");
    const onControl = (t) => t?.closest?.(".mm-fnode, button, select, input, textarea, label, .mm-flow-zoom");
    let drag = null;

    root.addEventListener("pointerdown", (ev) => {
      const flow = inChart(ev.target);
      if (!flow) return;
      if (ev.button !== 1 && (ev.button !== 0 || onControl(ev.target))) return;
      ev.preventDefault();
      drag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, x0: this.view.x, y0: this.view.y };
      flow.classList.add("is-panning");
      try { flow.setPointerCapture?.(ev.pointerId); } catch { /* synthetic or released pointer */ }
    });
    root.addEventListener("pointermove", (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      this.view.x = drag.x0 + (ev.clientX - drag.sx);
      this.view.y = drag.y0 + (ev.clientY - drag.sy);
      this.view.auto = false;
      this._mmApplyView();
    });
    const end = (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      this._mmFlow()?.classList.remove("is-panning");
      drag = null;
    };
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);

    root.addEventListener("wheel", (ev) => {
      const flow = inChart(ev.target);
      if (!flow || ev.target.closest("select")) return;
      ev.preventDefault();
      const rect = flow.getBoundingClientRect();
      this._mmZoomAt(Math.exp(-ev.deltaY * 0.0015), ev.clientX - rect.left, ev.clientY - rect.top);
    }, { passive: false });

    root.addEventListener("dblclick", (ev) => {
      if (!inChart(ev.target) || onControl(ev.target)) return;
      this._mmFitView({ readable: false }); this.view.auto = false; this._mmApplyView();
    });
  }

  /* ---------------------------------------------------------------
   * Repaint without re-rendering
   * ------------------------------------------------------------- */

  _mmRefresh({ read = true } = {}) {
    const bench = this._mmBench();
    if (!bench) return;
    if (read) this._mmReadForm(bench);
    const ev = this.evaluate();

    const set = (sel, text) => { const el = bench.querySelector(sel); if (el) el.textContent = text; };
    const html = (sel, markup) => { const el = bench.querySelector(sel); if (el) el.innerHTML = markup; };
    html("[data-status]", this._mmStatusHTML(ev));
    html("[data-notices]", this._mmNoticesHTML(ev));
    html("[data-sigil]", sigilSVG(this.build, { size: 120, spin: this._mmAnimate() }));
    set('[data-out="xi"]', fmt(ev.xi));
    set('[data-out="orie"]', fmt(ev.orieFinal));
    set("[data-tier-name]", ev.tier.name);
    set("[data-heat-value]", `+${fmt(ev.heat)} Heat`);
    ev.effects.forEach((x, i) => set(`[data-effect-text="${i}"]`, x.text));
    const pct = bench.querySelector(".mm-skill-pct");
    if (pct) pct.hidden = Boolean(this.caster.skillId);
    const body = bench.querySelector(".mm-builder");
    if (body) body.className = body.className.replace(/\bmm-tier-\d\b/, `mm-tier-${ev.tier.tier}`);
    this._mmSetTierClass(ev.tier.tier);

    // Footer: what can be done now.
    const f = this._mmFootState(ev);
    const foot = this.element.querySelector('[data-application-part="foot"]');
    const save = foot?.querySelector('[data-action="save"]');
    if (save) save.disabled = !f.save;
    const cast = foot?.querySelector('[data-action="cast"]');
    if (cast) { cast.disabled = !f.cast; cast.dataset.tooltip = f.cast ? "Roll it — saves first if needed" : f.castReason; }
    const state = foot?.querySelector("[data-dirty]");
    if (state) state.hidden = !(this.dirty && this.item);

    this._mmDrawLinks(ev);
  }

  /** Adding a node from one of the "+" selects: update state, re-render. */
  _mmOnStructuralChange(select) {
    const value = select.value;
    if (!value) return;
    this._mmReadForm(this._mmBench());
    if (select.dataset.field === "addEffect") {
      const [effect, element] = value.split("|");
      this.build.effects.push(element ? { effect, element } : { effect });
    } else {
      this.build.utilities.push({ node: value, count: 1, level: 1 });
    }
    this.build = normalizeBuild(this.build);
    this.render({ parts: ["bench", "foot"] });
  }

  /* ---------------------------------------------------------------
   * The links
   * ------------------------------------------------------------- */

  _mmDrawLinks(ev = null) {
    const flow = this._mmFlow(), stage = this._mmStage();
    const svg = stage?.querySelector("svg.mm-flow-links");
    if (!flow || !stage || !svg || !flow.clientWidth) return;
    ev ??= this.evaluate();

    // Stage space: offsets relative to the stage, independent of zoom.
    const W = stage.offsetWidth, H = stage.offsetHeight;
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.replaceChildren();

    const z = this.view.z || 1;
    const base = stage.getBoundingClientRect();
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - base.left) / z, y: (r.top - base.top) / z, w: r.width / z, h: r.height / z };
    };
    const node = (sel) => stage.querySelector(sel);
    const nodes = (sel) => Array.from(stage.querySelectorAll(sel));

    const style = FLOW_STYLE[ev.tier.tier] ?? FLOW_STYLE[1];
    const animate = this._mmAnimate();
    const layer = (cls) => { const g = document.createElementNS(SVG_NS, "g"); g.setAttribute("class", cls); svg.appendChild(g); return g; };

    const defs = document.createElementNS(SVG_NS, "defs");
    const glowId = `mm-glow-${this.id}`;
    defs.innerHTML = `<filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>`;
    svg.appendChild(defs);
    const gGlow = layer("mm-links-glow"); gGlow.setAttribute("filter", `url(#${glowId})`);
    const gBase = layer("mm-links-base"), gFlow = layer("mm-links-flow"), gMotes = layer("mm-links-motes"), gLabels = layer("mm-links-labels");

    let n = 0;
    const path = (d, { cls = "", width = style.width, duration = style.duration, motes = 2 } = {}) => {
      const id = `mm-path-${this.id}-${n++}`;
      const ghost = cls.includes("is-ghost");
      const mk = (parent, klass, w) => {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", d); p.setAttribute("class", `${klass} ${cls}`); p.setAttribute("stroke-width", w);
        parent.appendChild(p); return p;
      };
      if (!ghost) mk(gGlow, "mm-link-glow", width * 3);
      mk(gBase, "mm-link-base", width + 2);
      const over = mk(gFlow, "mm-link", width);
      over.setAttribute("id", id);
      over.style.animationDuration = `${duration}s`;
      if (!animate || ghost) return;
      for (let i = 0; i < motes; i++) {
        const mote = document.createElementNS(SVG_NS, "circle");
        mote.setAttribute("r", (width * 0.8 + 1).toFixed(1));
        mote.setAttribute("class", `mm-mote ${cls}`);
        const motion = document.createElementNS(SVG_NS, "animateMotion");
        motion.setAttribute("dur", `${(duration * 2.4).toFixed(2)}s`);
        motion.setAttribute("begin", `${(-(duration * 2.4) * i / motes).toFixed(2)}s`);
        motion.setAttribute("repeatCount", "indefinite");
        const mpath = document.createElementNS(SVG_NS, "mpath");
        mpath.setAttribute("href", `#${id}`);
        motion.appendChild(mpath); mote.appendChild(motion); gMotes.appendChild(mote);
      }
    };
    const label = (x, y, text, cls = "") => {
      if (!text) return;
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("class", `mm-link-label ${cls}`);
      t.textContent = text;
      gLabels.appendChild(t);
    };

    // Right edge of `a` to left edge of `b`.
    const across = (a, b, text, opts = {}) => {
      if (!a || !b) return;
      const A = box(a), B = box(b);
      const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2;
      const dx = Math.max(18, (x2 - x1) / 2);
      path(`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`, opts);
      label((x1 + x2) / 2, (y1 + y2) / 2 - 6, text);
    };
    // Bottom of `a` to top of `b`, within one column.
    const down = (a, b, text) => {
      if (!a || !b) return;
      const A = box(a), B = box(b);
      const x = A.x + A.w / 2, y1 = A.y + A.h, y2 = B.y;
      path(`M${x},${y1} L${x},${y2}`, { width: Math.max(1.6, style.width - 0.6), motes: 1 });
      label(x + 8, (y1 + y2) / 2 + 4, text, "is-side");
    };
    const mult = (m) => (m === 1 ? "" : `×${m}`);

    const caster = node('[data-node="caster"]'), intent = node('[data-node="intent"]'), conv = node('[data-node="conversion"]');
    const form = node('[data-node="form"]'), range = node('[data-node="range"]'), size = node('[data-node="size"]');
    const utils = nodes('[data-node="utility"]'), effects = nodes('[data-node="effect"]'), sink = node('[data-node="sink"]');
    const b = ev.build;

    const afterIntent = b.power * INTENTS[b.intent].xi;
    across(caster, intent, `N ${fmt(b.power)}`);
    down(intent, conv, `ξ ${fmt(afterIntent)}`);
    across(conv, form, `Œ ${fmt(ev.orieFinal)}`);
    down(form, range, mult(FORMS[b.form].xi));
    down(range, size, mult(RANGES[b.range].xi));

    // Shape → flow control (a vertical chain) → effects (fan out) → sink (fan in).
    let tail = size;
    if (utils.length) {
      across(size, utils[0], `ξ ${fmt(afterIntent * ev.shapeMod)}`);
      for (let i = 1; i < utils.length; i++) down(utils[i - 1], utils[i], mult(ev.utilities[i - 1]?.xi ?? 1));
      tail = utils.at(-1);
    } else {
      across(size, node('[data-node="addUtility"]'), "", { cls: "is-ghost" });
    }
    if (effects.length) {
      const each = effects.length > 1 ? `${fmt(ev.xi / effects.length)} each` : `ξ ${fmt(ev.xi)}`;
      effects.forEach((fx, i) => {
        across(tail, fx, i === 0 ? each : "");
        across(fx, sink, "", { cls: ev.effects[i]?.damage ? "is-damage" : "" });
      });
    } else {
      across(tail, node('[data-node="addEffect"]'), "", { cls: "is-ghost" });
    }

    // Heat: from the conversion, under the chart, back to the caster.
    const budget = this._mmBudget(ev);
    caster?.classList.toggle("is-over", budget.over);
    if (caster && conv && ev.heat > 0) {
      const A = box(conv), B = box(caster);
      const x1 = A.x + A.w / 2, y1 = A.y + A.h, x2 = B.x + B.w / 2, y2 = B.y + B.h;
      const low = Math.max(y1, y2) + 30;
      path(`M${x1},${y1} C${x1},${low} ${x2},${low} ${x2},${y2}`, {
        cls: `is-heat${budget.over ? " is-over" : ""}`,
        width: clamp(1.5 + ev.heat / 25, 1.5, 4.5),
        duration: clamp(2.2 - ev.heat / 60, 0.5, 2.2),
        motes: budget.over ? 4 : 2
      });
      label((x1 + x2) / 2, low - 2, `+${fmt(ev.heat)} Heat`, "is-heat");
    }
  }

  /* ---------------------------------------------------------------
   * Reading the bench back into state
   * ------------------------------------------------------------- */

  _mmReadForm(root) {
    if (!root) return;
    const val = (sel) => root.querySelector(sel)?.value;
    const b = this.build;
    b.name = String(val('[name="name"]') ?? b.name).trim() || "Unnamed Spell";
    b.notes = String(val('[name="notes"]') ?? b.notes ?? "");
    b.power = clamp(Number(val('[name="power"]')) || 1, 1, 1000);
    b.intent = val('[name="intent"]') ?? b.intent;
    b.conversion = val('[name="conversion"]') ?? b.conversion;
    b.form = val('[name="form"]') ?? b.form;
    b.range = Number(val('[name="range"]')) || 1;
    b.size = Number(val('[name="size"]')) || 1;
    b.effects = Array.from(root.querySelectorAll('[data-node="effect"] select[data-field="effect"]')).map(sel => {
      const [effect, element] = sel.value.split("|");
      return element ? { effect, element } : { effect };
    });
    b.utilities = Array.from(root.querySelectorAll('[data-node="utility"]')).map(row => ({
      node: row.querySelector('[data-field="node"]')?.value,
      count: Number(row.querySelector('[data-field="count"]')?.value) || 1,
      level: Number(row.querySelector('[data-field="level"]')?.value) || 1
    })).filter(u => UTILITY_NODES[u.node]);
    this.build = normalizeBuild(b);

    const skillId = val('[name="skillId"]') ?? "";
    const skillItem = skillId && this.actor ? this.actor.items.get(skillId) : null;
    this.caster.skillId = skillItem ? skillId : "";
    this.caster.skill = skillItem ? (Number(skillItem.totalVal ?? skillItem.system?.totalVal) || 0) : (Number(val('[name="skillPct"]')) || 50);
    this.caster.focus = Number(val('[name="focus"]')) || 1;
    this.caster.catalyst = Number(val('[name="catalyst"]')) || 1;
    this.caster.steps = Number(val('[name="steps"]')) || 0;
    const draw = String(val('[name="stored"]') ?? "").trim();
    this.caster.stored = draw === "" ? "" : Math.max(0, Number(draw) || 0);
  }

  /* ---------------------------------------------------------------
   * Actions — tabs and the spellbook
   * ------------------------------------------------------------- */

  static async #onSubmit(event) { event?.preventDefault?.(); }

  static #onShowTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (!TABS.some(t => t.id === tab) || tab === this.tab) return;
    if (this.tab === "workshop") this._mmReadForm(this._mmBench());
    this.tab = tab;
    this._mmApplyTab();
    const parts = ["tabs", ...(tab === "workshop" ? ["rail", "bench", "foot"] : [tab])];
    this.render({ parts });
  }

  static async #onNewSpell(event) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    if (!this.item && !this.dirty) return;
    if (!(await this._mmConfirmDiscard())) return;
    this._mmLoadSpell(null);
    this.render({ parts: ["rail", "bench", "foot"] });
  }

  static async #onSelectSpell(event, target) {
    event.preventDefault();
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = (this.actor ? this.actor.items : game.items).get(id);
    if (!item || item.id === this.item?.id) return;
    this._mmReadForm(this._mmBench());
    if (!(await this._mmConfirmDiscard())) return;
    this._mmLoadSpell(item);
    this.render({ parts: ["rail", "bench", "foot"] });
  }

  static async #onDeleteSpell(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = (this.actor ? this.actor.items : game.items).get(id);
    if (!item) return;
    const go = await confirmDialog({
      title: `Delete ${item.name}`,
      content: `<p>Delete the spell <strong>${e(item.name)}</strong>${this.actor ? ` from ${e(this.actor.name)}` : ""}?</p>`,
      yesLabel: "Delete", noLabel: "Keep"
    });
    if (!go) return;
    const current = item.id === this.item?.id;
    await item.delete();
    if (current) this._mmLoadSpell(null);
    this.render({ parts: ["rail", "bench", "foot"] });
  }

  static async #onVent(event) {
    event.preventDefault();
    if (!this.actor?.isOwner) return;
    if (event.shiftKey) {
      if (game.user.isGM) return clearHeat(this.actor);
      const st = heatState(this.actor);
      const rounds = Math.ceil(st.heat / Math.max(1, num(SETTINGS.ventPerRound, 2)));
      return rounds > 0 ? ventHeat(this.actor, rounds) : null;
    }
    return ventHeat(this.actor, 1);
  }

  static #onOpenSheet(event) {
    event.preventDefault();
    this.actor?.sheet?.render(true);
  }

  /* ---------------------------------------------------------------
   * Actions — the bench
   * ------------------------------------------------------------- */

  static #onRemoveUtility(event, target) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    const i = Number(target.closest('[data-node="utility"]')?.dataset.index);
    if (Number.isInteger(i)) this.build.utilities.splice(i, 1);
    this.render({ parts: ["bench", "foot"] });
  }

  static #onRemoveEffect(event, target) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    const i = Number(target.closest('[data-node="effect"]')?.dataset.index);
    if (Number.isInteger(i)) this.build.effects.splice(i, 1);
    this.render({ parts: ["bench", "foot"] });
  }

  /** Define a new Effect node and put it on this spell once it registers. */
  static async #onNewEffectHere(event) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    const item = await createEffectItem();
    if (!item) return;
    this.pendingEffectKey = item.system?.key ?? null;
    this.effectUuid = item.uuid;
  }

  static #onZoomIn(event) { event.preventDefault(); this._mmZoomAt(1.2); }
  static #onZoomOut(event) { event.preventDefault(); this._mmZoomAt(1 / 1.2); }
  static #onZoomReset(event) {
    event.preventDefault();
    const flow = this._mmFlow(), stage = this._mmStage();
    if (!flow || !stage) return;
    this.view = { x: Math.max(0, (flow.clientWidth - stage.offsetWidth) / 2), y: Math.max(0, (flow.clientHeight - stage.offsetHeight) / 2), z: 1, auto: false };
    this._mmApplyView();
  }
  static #onZoomFit(event) {
    event.preventDefault();
    this.view.auto = true;
    this._mmFitView({ readable: false });
    this._mmApplyView();
  }

  /** Hear the spell as it stands. */
  static async #onPreview(event, target) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    target?.classList.add("is-playing");
    const seconds = await playLocal(this.build, { outcome: "success" });
    if (!seconds) ui.notifications.warn("No sound — your spell sound volume may be 0, or the browser hasn't allowed audio yet.");
    setTimeout(() => target?.classList.remove("is-playing"), Math.max(300, seconds * 1000));
  }

  static async #onExportSound(event) {
    event.preventDefault();
    if (!this.item) return ui.notifications.warn("Save the spell first.");
    if (this.dirty) ui.notifications.info("Exporting the saved version — save first to include your changes.");
    await exportSpellWav(this.item);
  }

  static async #onReset(event) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    const go = await confirmDialog({
      title: "Start again",
      content: `<p>${this.item ? `Revert <strong>${e(this.item.name)}</strong> to its saved version?` : "Clear the bench and start a blank spell?"}</p>`,
      yesLabel: this.item ? "Revert" : "Clear", noLabel: "Cancel"
    });
    if (!go) return;
    this._mmLoadSpell(this.item);
    this.render({ parts: ["bench", "foot"] });
  }

  async _mmDoSave() {
    this._mmReadForm(this._mmBench());
    const ev = this.evaluate();
    if (!ev.valid) { ui.notifications.error(ev.errors.join(" ")); return null; }
    if (!canBuild()) { ui.notifications.warn("Building spells is a GM action at this table."); return null; }
    const target = this.item ?? this.actor;
    if (target && !target.isOwner) { ui.notifications.warn(`You don't own ${target.name}.`); return null; }
    if (!target && !game.user.can("ITEM_CREATE")) {
      ui.notifications.warn("You can't create Items in this world. Choose a caster you own, or ask the GM.");
      return null;
    }
    let item;
    try {
      item = await saveSpell({ build: this.build, actor: this.item ? null : this.actor, item: this.item, caster: this._mmCasterParams() });
    } catch (err) {
      console.error("Dreoarcana | Arcana: save failed", err);
      ui.notifications.error(`Could not save the spell: ${err.message}`);
      return null;
    }
    const isNew = !this.item;
    this.item = item;
    this.savedSig = signature(this.build);
    ui.notifications.info(`${item.name} — Tier ${ev.tier.numeral} ${ev.tier.name} — ${isNew ? (this.actor ? `added to ${this.actor.name}` : "saved to the Items directory") : "saved"}.`);
    return item;
  }

  static async #onSave(event) {
    event.preventDefault();
    if (await this._mmDoSave()) this.render({ parts: ["rail", "foot"] });
  }

  static async #onCast(event) {
    event.preventDefault();
    this._mmReadForm(this._mmBench());
    if (!this.actor) return ui.notifications.warn("Choose a caster first.");
    let item = this.item;
    if (!item || this.dirty) {
      item = await this._mmDoSave();
      if (!item) return;
      this.render({ parts: ["rail", "foot"] });
    }
    const skillName = castingSkills(this.actor).find(s => s.id === this.caster.skillId)?.name ?? "Casting";
    await castSpell(item, {
      actor: this.actor, steps: this.caster.steps, skillName,
      caster: { skill: this.caster.skill, focus: this.caster.focus, catalyst: this.caster.catalyst, stored: this._mmDraw() }
    });
  }

  /* ---------------------------------------------------------------
   * Actions — effect nodes
   * ------------------------------------------------------------- */

  static #onSelectEffect(event, target) {
    event.preventDefault();
    this.effectUuid = target.closest("[data-uuid]")?.dataset.uuid ?? null;
    this.render({ parts: ["effects"] });
  }

  static async #onAddEffect(event) {
    event.preventDefault();
    const item = await createEffectItem();
    if (item) { this.effectUuid = item.uuid; this.render({ parts: ["effects"] }); }
  }

  /** One field of the effect editor changed: write it to the item. */
  async _mmOnEffectField(input) {
    const doc = this.effectUuid ? await fromUuid(this.effectUuid) : null;
    if (!doc || !doc.isOwner) return;
    const field = input.dataset.efield;
    let update;
    if (field === "intent") {
      const intents = Array.from(this.element.querySelectorAll('[data-efield="intent"]')).filter(c => c.checked).map(c => c.value);
      update = { "system.intents": intents.length ? intents : ["Utility"] };
    } else if (field === "system.complexity") {
      update = { [field]: clamp(Math.round(Number(input.value) || 0), 0, 10) };
    } else if (field === "system.damage") {
      update = { [field]: input.checked };
    } else if (field === "system.desc") {
      update = { [field]: input.value, "system.description": input.value ? `<p>${foundry.utils.escapeHTML(input.value)}</p>` : "" };
    } else if (field === "name" || field.startsWith("system.")) {
      update = { [field]: input.value };
    }
    if (update) await doc.update(update);
  }

  static async #onDeleteEffect(event) {
    event.preventDefault();
    const doc = this.effectUuid ? await fromUuid(this.effectUuid) : null;
    if (!doc || !isEffectItem(doc)) return;
    const inUse = spellsUsingEffect(doc.system.key);
    const go = await confirmDialog({
      title: `Delete Effect — ${doc.name}`,
      content: `<p>Delete the Effect node <strong>${e(doc.name)}</strong>?</p>${inUse.length
        ? `<p class="mm-warn">Used by ${inUse.length} spell${inUse.length === 1 ? "" : "s"}: ${inUse.slice(0, 6).map(e).join(", ")}${inUse.length > 6 ? "…" : ""}. Those spells lose this effect the next time they are read.</p>`
        : `<p class="mm-hint">No spell uses it.</p>`}`,
      yesLabel: "Delete", noLabel: "Keep"
    });
    if (!go) return;
    await doc.delete();
    this.effectUuid = null;
  }

  static async #onEffectToPack(event) {
    event.preventDefault();
    const doc = this.effectUuid ? await fromUuid(this.effectUuid) : null;
    if (doc) await sendEffectToPack(doc);
    this.render({ parts: ["effects"] });
  }

  static async #onEffectImage(event) {
    event.preventDefault();
    const doc = this.effectUuid ? await fromUuid(this.effectUuid) : null;
    if (!doc?.isOwner) return;
    const FP = foundry.applications.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    new FP({ type: "image", current: doc.img, callback: (path) => doc.update({ img: path }) }).browse();
  }

  static async #onOpenPack(event) {
    event.preventDefault();
    const pack = await getEffectsPack({ create: game.user.isGM });
    pack?.render(true);
    this.render({ parts: ["effects"] });
  }

  static async #onRefreshEffects(event) {
    event.preventDefault();
    await refreshEffects({ reason: "manual" });
  }

  /* ---------------------------------------------------------------
   * Actions — rules
   * ------------------------------------------------------------- */

  static #onRulesPage(event, target) {
    event.preventDefault();
    this.rulesIndex = Number(target.dataset.index) || 0;
    this.render({ parts: ["rules"] });
  }

  static async #onPublishRules(event) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const journal = await buildRulesJournal({ notify: true });
    journal?.sheet?.render(true);
  }
}

/**
 * Open the Arcanum — for an actor, on a spell, on a tab, or on an effect.
 * There is one per client; calling again refocuses it.
 */
export async function openArcanum({ actor, item, tab, effectUuid } = {}) {
  let app = Arcanum.instance;
  if (app?.rendered) return app.focus({ actor, item, tab, effectUuid });
  // A GM with nothing selected starts on the world's spells; a player on their character.
  const who = item?.actor ?? actor ?? currentActor() ?? (game.user.isGM ? null : castableActors()[0]) ?? null;
  app = new Arcanum({ actor: who && who.isOwner ? who : null });
  Arcanum.instance = app;
  return app.focus({ item: item && isArcaneSpell(item) ? item : undefined, tab, effectUuid });
}
