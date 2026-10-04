/* ===================================================================
 * Dreoarcana Alchemy — the Laboratory
 *
 * One window for all of alchemy, as the Arcanum is for spells:
 *
 *   Brew   Mother, reagents, overlap, Orie pool, Craft (Alchemy) — and,
 *          once rolled, the container, on the same page. No dialogs.
 *   Stock  what the alchemist carries (or the world's items, or the
 *          catalogue): taste, study, eat, drink, throw, break, reveal;
 *          the GM also writes, edits and imports ingredients here.
 *   Rules  the alchemy rules, page by page.
 *
 * Every ingredient and potion "sheet" opens here.
 * =================================================================== */

import { TEMPLATES, record, isIngredient, isPotion, isMother, craftSkill, loreSkill, skillValue,
         catalogue, upsertIngredients, worldPack, craftValue, loreValue, ingredientItemData, recordsFromCSV, classContradictions, toCopper } from "./core.js";
import { QUALITY, VOLATILITY, ABSORPTION, DIFFICULTY, MAX_POTENCY, MAX_ORIE_PER_DOSE, SLOT_NAMES, CONDITIONS, CLASSES,
         RARITIES, EFFECT_NAMES, ARCANE_EFFECTS, RARITY_DIFFICULTY, effectivePotency, slotPotency, describeEffect,
         motherDoses, resolveClass, gradedTarget } from "./rules.js";
import { asetting, ASETTINGS } from "./settings.js";
import { planBrew, commitBrew, decantOptions, decant, revealPotion } from "./brew.js";
import { describeKnown, knownSlots, tasteIngredient, studyIngredient } from "./discovery.js";
import { drinkPotion, eatIngredient } from "./consume.js";
import { blastProfile, throwPotion, breakPotion, carriedVolatiles } from "./volatility.js";
import { alchemyPages } from "./rules-text.js";
import { castableActors, currentActor, currentOrie, maxOrie, fmt, FilePickerImpl } from "../arcana/core.js";
import { heatState, ventHeat } from "../arcana/heat.js";
import { loadState, clearLoad } from "./saturation.js";
import { lastingEffects } from "./effects.js";
import { ANYWHERE, grounds, groundById, anywhereGround, groundStock, saveGround, deleteGround, forageDay, survivalValue, identifyValue, identifyIngredient, revealIngredient } from "./forage.js";
import { RARITY_WEIGHT, MAX_CONDITION, MIN_CONDITION, REFINE_STEP } from "./rules.js";
import { refineIngredient, setPreserved, setPadded, perishable, supercriticalDeadline, untilText } from "./workshop.js";
import { recipes, recipeView, matchRecipe, deleteRecipe, renameRecipe } from "./recipes.js";
import { setting as arcanaSetting, SETTINGS as ARCANA, num } from "../arcana/settings.js";
import { confirmDialog } from "../arcana/ui.js";
import { e } from "../arcana/html.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const T = (name) => `${TEMPLATES}/${name}.hbs`;
export const LAB_TEMPLATES = ["lab-tabs", "lab-rail", "lab-brew", "lab-stock", "lab-forage", "lab-rules"].map(T);

const TABS = [
  { id: "brew", label: "Brew", icon: "fas fa-mortar-pestle" },
  { id: "stock", label: "Stock", icon: "fas fa-flask" },
  { id: "forage", label: "Forage", icon: "fas fa-leaf" },
  { id: "rules", label: "Rules", icon: "fas fa-book" }
];

const canBrew = () => game.user?.isGM || asetting(ASETTINGS.playerBrewing) !== false;


const chips = (doc) => describeKnown(doc).filter(s => s.effect)
  .map(s => ({ label: s.known ? s.effect : "?", known: s.known, arcane: s.known && s.arcane, slot: s.name }));

export class Laboratory extends HandlebarsApplicationMixin(ApplicationV2) {
  static instance = null;

  static DEFAULT_OPTIONS = {
    id: "dreoarcana-laboratory",
    classes: ["mm", "mm-lab"],
    tag: "form",
    window: { title: "Laboratory", resizable: true, icon: "fas fa-mortar-pestle", contentClasses: ["mm-surface"] },
    position: { width: 1240, height: 820 },
    form: { handler: async () => {}, submitOnChange: false, closeOnSubmit: false },
    actions: {
      showTab: Laboratory.#onShowTab,
      openSheet: Laboratory.#onOpenSheet,
      vent: Laboratory.#onVent,
      // brew
      toggleReagent: Laboratory.#onToggleReagent,
      clearMixture: Laboratory.#onClearMixture,
      brew: Laboratory.#onBrew,
      decant: Laboratory.#onDecant,
      // stock
      selectItem: Laboratory.#onSelectItem,
      taste: Laboratory.#onTaste,
      study: Laboratory.#onStudy,
      eat: Laboratory.#onEat,
      useInBrew: Laboratory.#onUseInBrew,
      drink: Laboratory.#onDrink,
      throw: Laboratory.#onThrow,
      break: Laboratory.#onBreak,
      reveal: Laboratory.#onReveal,
      refine: Laboratory.#onRefine,
      preserve: Laboratory.#onPreserve,
      pad: Laboratory.#onPad,
      useRecipe: Laboratory.#onUseRecipe,
      deleteRecipe: Laboratory.#onDeleteRecipe,
      deleteItem: Laboratory.#onDeleteItem,
      edit: Laboratory.#onEdit,
      cancelEdit: Laboratory.#onCancelEdit,
      saveIngredient: Laboratory.#onSaveIngredient,
      newIngredient: Laboratory.#onNewIngredient,
      editImage: Laboratory.#onEditImage,
      importPanel: Laboratory.#onImportPanel,
      runImport: Laboratory.#onRunImport,
      // rules
      rulesPage: Laboratory.#onRulesPage,
      // rail
      restSaturation: Laboratory.#onRestSaturation,
      endEffect: Laboratory.#onEndEffect,
      // stock
      identify: Laboratory.#onIdentify,
      revealIngredient: Laboratory.#onRevealIngredient,
      // forage
      selectGround: Laboratory.#onSelectGround,
      forage: Laboratory.#onForage,
      newGround: Laboratory.#onNewGround,
      editGround: Laboratory.#onEditGround,
      cancelGround: Laboratory.#onCancelGround,
      saveGround: Laboratory.#onSaveGround,
      deleteGround: Laboratory.#onDeleteGround
    }
  };

  static PARTS = {
    tabs: { template: T("lab-tabs") },
    rail: { template: T("lab-rail"), scrollable: [".al-rail-scroll"] },
    brew: { template: T("lab-brew"), scrollable: [".al-picklist", ".al-decant-list"] },
    stock: { template: T("lab-stock"), scrollable: [".al-stock-list", ".al-stock-detail"] },
    forage: { template: T("lab-forage"), scrollable: [".al-ground-list", ".al-ground-detail", ".al-ground-picks"] },
    rules: { template: T("lab-rules"), scrollable: [".mm-rules-index", ".mm-rules-page"] }
  };

  constructor(options = {}) {
    const position = {
      width: Math.min(1240, Math.max(860, (globalThis.innerWidth ?? 1300) - 40)),
      height: Math.min(820, Math.max(560, (globalThis.innerHeight ?? 900) - 40)),
      ...(options.position ?? {})
    };
    super({ ...options, position });
    this.tab = "brew";
    this.rulesIndex = 0;
    this.selectedUuid = null;
    this.editing = null;          // null | "existing" | "new"
    this.groundId = ANYWHERE;
    this.groundEditing = null;    // null | "existing" | "new"
    this.forageMod = 0;
    this.importing = false;
    this._mmSetActor(options.actor ?? null);
  }

  get title() { return this.actor ? `Laboratory — ${this.actor.name}` : "Laboratory"; }

  _mmSetActor(actor) {
    this.actor = actor ?? null;
    this.source = this.actor ? "actor" : "catalogue";
    this.motherId = "";
    this.reagentIds = new Set();
    this.xi = 0;
    this.mod = 0;
    this.skillOverride = null;
    this.filter = { search: "", cls: "", pairs: false };
    this.batch = null;
    this.container = null;
    this.selectedUuid = null;
    this.editing = null;
  }

  /** Bring the window to an actor, an item, or a tab. */
  async focus({ actor, item, tab } = {}) {
    const nextActor = item ? (item.parent?.documentName === "Actor" ? item.parent : undefined) : actor;
    if (nextActor !== undefined && nextActor !== this.actor) {
      if (this.batch && !this.batch.done) { ui.notifications.warn("Decant the batch on the bench first."); }
      else this._mmSetActor(nextActor);
    }
    if (item) {
      this.selectedUuid = item.uuid;
      this.editing = null;
      this.tab = "stock";
      this.source = item.pack ? "catalogue" : item.parent ? "actor" : "world";
    }
    if (tab) this.tab = tab;
    await this.render({ force: true });
    this.bringToFront?.();
    return this;
  }

  /* ---------------------------------------------------------------
   * Data
   * ------------------------------------------------------------- */

  /** Ingredients on the bench's shelf: the actor's own, or the catalogue. */
  async _mmPool() {
    const docs = this.actor ? this.actor.items.filter(isIngredient) : await catalogue();
    return docs.map(record).sort((a, b) => a.name.localeCompare(b.name));
  }

  async _mmStockDocs() {
    if (this.source === "actor" && this.actor) return this.actor.items.filter(i => isIngredient(i) || isPotion(i));
    if (this.source === "world") return game.items.filter(i => isIngredient(i) || isPotion(i));
    return catalogue();
  }

  _mmSkill() {
    const base = craftValue(this.actor);
    return this.skillOverride !== null ? { value: this.skillOverride, name: "Craft (Alchemy)" } : base;
  }

  /* ---------------------------------------------------------------
   * Context
   * ------------------------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return Object.assign(context, { tab: this.tab, isGM: game.user.isGM });
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId === "tabs") return Object.assign(context, { tabs: TABS.map(t => ({ ...t, active: t.id === this.tab })) });
    if (partId === "rail") return Object.assign(context, this._mmRailContext());
    if (partId === "brew") return Object.assign(context, await this._mmBrewContext());
    if (partId === "stock") return Object.assign(context, await this._mmStockContext());
    if (partId === "forage") return Object.assign(context, await this._mmForageContext());
    if (partId === "rules") return Object.assign(context, await this._mmRulesContext());
    return context;
  }

  _mmRailContext() {
    const a = this.actor;
    const choices = castableActors();
    let heat = null, orie = null, volatiles = [];
    if (a) {
      const st = heatState(a);
      if (st.tracking) heat = { value: fmt(st.heat), max: st.capacity, pct: st.pct, rate: st.rate,
        cls: st.over > 0 ? "is-over" : st.pct >= 75 ? "is-hot" : "" };
      const o = currentOrie(a), om = maxOrie(a);
      orie = { value: o, max: om, pct: om ? Math.min(100, Math.round(o / om * 100)) : 0 };
      volatiles = carriedVolatiles(a).map(v => ({ name: v.item.name, qty: v.item.system.quantity, damage: v.blast.damage, radius: v.blast.radius }));
    }
    const craft = craftValue(a), lore = loreValue(a);
    return {
      actor: a ? { name: a.name, img: a.img, uuid: a.uuid } : null,
      actorChoices: choices.map(c => ({ uuid: c.uuid, name: c.name, selected: c === a })),
      showChoices: game.user.isGM || choices.length > 1 || (!a && choices.length > 0),
      craft, lore, heat, orie, volatiles, isOwner: !a || a.isOwner,
      saturation: a ? (() => { const st = loadState(a); return { ...st, cls: st.over > 0 ? "is-over" : st.pct >= 75 ? "is-hot" : "" }; })() : null,
      effects: a ? lastingEffects(a) : [], isGM: game.user.isGM
    };
  }

  async _mmBrewContext() {
    const pool = await this._mmPool();
    const byId = new Map(pool.map(r => [r.id, r]));
    const mother = byId.get(this.motherId) ?? null;
    const reagents = [...this.reagentIds].map(id => byId.get(id)).filter(Boolean);
    const skill = this._mmSkill();
    const max = Number(asetting(ASETTINGS.maxIngredients)) || 3;
    const isGM = game.user.isGM;

    if (this.batch && !this.batch.done) {
      const options = decantOptions(this.batch);
      const usable = options.filter(o => !o.issue);
      if (!this.container || !usable.some(o => o.name === this.container)) {
        this.container = usable.length ? usable.reduce((a, b) => (b.potency > a.potency ? b : a)).name : null;
      }
      const q = QUALITY[this.batch.quality];
      const showQ = isGM || asetting(ASETTINGS.unidentified) === false;
      return {
        decanting: true,
        batch: {
          quality: showQ ? this.batch.quality : "unknown", result: this.batch.result, roll: this.batch.roll, target: this.batch.target,
          portions: q.portions, rounds: q.rounds, orie: this.batch.orie, mechanical: this.batch.mechanical, showQ
        },
        containers: options.map(o => ({ ...o, selected: o.name === this.container, disabled: Boolean(o.issue),
          note: o.issue ?? (isGM || !asetting(ASETTINGS.unidentified) ? `Potency ${o.potency}${o.supercritical ? " · Supercritical" : ""}${o.volatile ? " · volatile" : ""}` : "") })),
        canDecant: Boolean(this.container), overflow: !usable.length
      };
    }

    const plan = mother || reagents.length ? planBrew({ mother, reagents, xi: this.xi, actor: this.actor, skill: skill.value, mod: this.mod }) : null;
    const selectedEffects = new Set(reagents.concat(mother ? [mother] : []).flatMap(r => describeKnown(r.doc).filter(s => s.known && s.effect).map(s => s.effect)));

    const shelf = pool.filter(r => !r.mother && !/^mother\s*[-–]/i.test(r.name)).map(r => {
      const known = describeKnown(r.doc).filter(s => s.known && s.effect).map(s => s.effect);
      const p = effectivePotency(r.grade, r.condition);
      return {
        id: r.id, name: r.name, img: r.img, cls: r.class,
        checked: this.reagentIds.has(r.id),
        chips: chips(r.doc),
        meta: r.doc.system.identified === false && !isGM ? `unidentified${this.actor ? ` · ×${r.quantity}` : ""}` : `${r.class} · G${r.grade ?? "?"}${p && r.class === "Mechanical" ? ` · ${p * p}Œ` : ""}${this.actor ? ` · ×${r.quantity}` : ""}`,
        search: `${r.name} ${known.join(" ")}`.toLowerCase(),
        pairs: known.some(fx => selectedEffects.has(fx))
      };
    });
    const mothers = pool.filter(r => r.mother || /^mother\s*[-–]/i.test(r.name)).map(r => ({
      id: r.id, name: r.name, selected: r.id === this.motherId,
      meta: this.actor ? `${r.class} · ×${r.quantity} · up to ${motherDoses(r)} doses` : `${r.class}`
    }));

    let readout = null;
    if (plan) {
      const chipsOut = [
        { label: plan.potionClass, tip: "§3a — the Mother decides where it has a class; otherwise the reagents" , cls: plan.mechanical ? "is-tier" : "" },
        { label: `${plan.difficulty.label} ${plan.target}%`, tip: `${skill.name} ${skill.value}% ${plan.difficulty.mod >= 0 ? "+" : ""}${plan.difficulty.mod}% for Potency ${plan.step}${this.mod ? `, tools ${this.mod > 0 ? "+" : ""}${this.mod}%` : ""}` },
        ...(plan.mechanical ? [{ label: `${plan.orie} Orie`, tip: `${plan.ingredientOrie} from the ingredients${plan.channelled ? ` + ${plan.channelled} channelled` : ""}` }] : []),
        ...(plan.channelled ? [{ label: plan.converted ? `+${fmt(plan.heat)} Heat` : "no Heat", tip: `${plan.drawn} Xi from Stored Orie${plan.converted ? `, ${plan.converted} converted on the spot` : ""}`, cls: plan.converted ? "is-bad" : "" }] : [])
      ];
      readout = {
        chips: chipsOut,
        overlaps: isGM ? plan.overlaps.map(o => `${o.effect} (${SLOT_NAMES[o.slot]})`) : null,
        playerNote: !isGM && reagents.length >= 2 ? "What the mixture will become isn't apparent until it is brewed." : null,
        overflow: plan.mechanical && plan.orie > MAX_ORIE_PER_DOSE ? `Needs ${plan.minDoses}+ doses or it overflows (§9).` : null,
        motherNote: mother ? `${mother.name} ${this.actor ? `fills up to ${motherDoses(mother)} doses` : "in ample supply"} and makes the brew ${resolveClass({ mother, reagents, channelledXi: this.xi })}.` : "Choose a Mother: nothing can be brewed without a liquid to brew it into (§3b).",
        motherFx: mother ? chips(mother.doc) : []
      };
    }

    const book = this.actor ? recipes(this.actor).map(p => recipeView(p, { isGM, actor: this.actor })) : [];
    return {
      decanting: false, shelf, mothers, readout, max,
      book, hasBook: Boolean(this.actor), bookOwner: Boolean(this.actor?.isOwner),
      chosen: reagents.map(r => ({ id: r.id, name: r.name })),
      count: reagents.length,
      filter: this.filter,
      skill, mod: this.mod, xi: this.xi,
      canBrew: canBrew() && Boolean(mother) && reagents.length >= 2 && reagents.length <= max && (!this.actor || this.actor.isOwner),
      brewAllowed: canBrew(),
      noShelf: !shelf.length,
      shelfSource: this.actor ? `${this.actor.name}'s stock` : "the catalogue"
    };
  }

  async _mmStockContext() {
    const docs = await this._mmStockDocs();
    const isGM = game.user.isGM;
    const row = (d) => {
      const pot = isPotion(d);
      const known = pot ? (d.system.identified || isGM) : true;
      const p = pot ? d.system.potency : effectivePotency(d.system.grade, d.system.condition);
      return {
        uuid: d.uuid, name: d.name, img: d.img, selected: d.uuid === this.selectedUuid,
        meta: pot ? `${known ? `${d.system.quality} · P${p} · ` : ""}${d.system.quantity} dose${d.system.quantity === 1 ? "" : "s"}`
                  : `${d.system.class} · G${d.system.grade ?? "?"}${this.source === "actor" ? ` · ×${d.system.quantity}` : ""}`,
        volatile: Boolean(blastProfile(d))
      };
    };
    const potions = docs.filter(isPotion).sort((a, b) => a.name.localeCompare(b.name)).map(row);
    const mothers = docs.filter(d => isMother(d)).map(row);
    const ingredients = docs.filter(d => isIngredient(d) && !isMother(d)).map(row);

    let detail = null;
    if (this.editing === "new") detail = { edit: this._mmEditContext(null) };
    else if (this.selectedUuid) {
      const doc = await fromUuid(this.selectedUuid).catch(() => null);
      if (doc && isIngredient(doc)) detail = this.editing ? { edit: this._mmEditContext(doc) } : { ingredient: this._mmIngredientDetail(doc) };
      else if (doc && isPotion(doc)) detail = { potion: this._mmPotionDetail(doc) };
      else this.selectedUuid = null;
    }
    return {
      sources: [
        ...(this.actor ? [{ id: "actor", label: `Carried by ${this.actor.name}` }] : []),
        { id: "world", label: "Items directory" },
        { id: "catalogue", label: "Ingredient catalogue" }
      ].map(s => ({ ...s, selected: s.id === this.source })),
      potions, mothers, ingredients, empty: !docs.length,
      detail, importing: this.importing && isGM, isGM
    };
  }

  _mmIngredientDetail(doc) {
    const rec = record(doc);
    const p = effectivePotency(rec.grade, rec.condition);
    const isGM = game.user.isGM;
    const slots = describeKnown(doc);
    const undiscovered = !isGM && slots.some(s => s.effect && !s.known);
    const owned = Boolean(doc.parent) && !doc.pack && doc.isOwner;
    const vol = rec.class === "Mechanical" && p ? VOLATILITY[p] : null;
    const abs = rec.class === "Mechanical" && p ? ABSORPTION[p] : null;
    const diff = p ? DIFFICULTY[p] : null;
    const unknown = doc.system.identified === false;
    if (unknown && !isGM) {
      return {
        uuid: doc.uuid, name: doc.name, img: doc.img, unidentified: true, owned, quantity: rec.quantity,
        stats: [{ label: "Condition", value: CONDITIONS[String(rec.condition)]?.split(" (")[0] ?? rec.condition }],
        slots: [], hazards: [], canIdentify: owned,
        identifyNote: `${identifyValue(doc.actor ?? this.actor).name} at its Rarity (§3)`,
        canEat: owned, canUse: !isMother(doc) && (!this.actor || doc.parent === this.actor), canDelete: owned
      };
    }
    return {
      uuid: doc.uuid, name: doc.name, img: doc.img, description: doc.system.description,
      unidentified: unknown, trueName: unknown ? doc.system.trueName : null,
      canIdentify: unknown && owned && !isGM, canReveal: unknown && isGM,
      identifyNote: `${identifyValue(doc.actor ?? this.actor).name} at its Rarity (§3)`,
      stats: [
        { label: "Grade", value: rec.grade ?? "—" },
        { label: "Condition", value: CONDITIONS[String(rec.condition)]?.split(" (")[0] ?? rec.condition },
        { label: "Potency", value: p ?? "—" },
        { label: "Class", value: rec.class },
        { label: "Rarity", value: rec.rarity },
        { label: rec.class === "Mechanical" ? "Orie" : "Brew grade", value: rec.class === "Mechanical" && p ? `${p * p}` : diff ? diff.label : "—" }
      ],
      mother: isMother(doc),
      slots: slots.map(s => ({ ...s, hidden: Boolean(s.effect) && !s.known, dead: Boolean(s.effect) && s.known && s.potency < 1, pLabel: s.effect ? (s.potency >= 1 ? `P${s.potency}` : "—") : "" })),
      hazards: [vol ? `Volatile at this Potency: ${vol.damage} in ${vol.radius} m (§7).` : null, abs ? `Skin contact: ${abs}` : null].filter(Boolean),
      owned, quantity: rec.quantity,
      canStudy: owned && undiscovered, canTaste: owned && Boolean(rec.slots[0]) && !knownSlots(doc).includes(0),
      studyNote: `Lore (Alchemy) at ${DIFFICULTY[RARITY_DIFFICULTY[rec.rarity] ?? 3].label}`,
      canEat: owned, canUse: !isMother(doc) && (!this.actor || doc.parent === this.actor),
      canEdit: isGM, canDelete: isGM || owned,
      inPack: Boolean(doc.pack),
      ...this._mmKeeping(doc, rec, owned)
    };
  }

  /** Condition over time: refining (§3), spoilage and preservation (§3). */
  _mmKeeping(doc, rec, owned) {
    const shelf = Number(asetting(ASETTINGS.shelfLife)) || 0;
    const canSpoil = perishable(doc) && shelf > 0;
    let keeping = null;
    if (perishable(doc)) {
      const at = Number(doc.system.harvestedAt);
      if (doc.system.preserved) keeping = "Preserved: it keeps.";
      else if (!shelf) keeping = null;
      else if (rec.condition <= MIN_CONDITION) keeping = "Perishable, and already as degraded as it gets.";
      else if (owned && doc.system.harvestedAt !== null && Number.isFinite(at)) keeping = `Perishable: loses a step of Condition ${untilText(at + shelf * 86400 - (Number(game.time.worldTime) || 0))} unless preserved.`;
      else keeping = `Perishable: loses a step of Condition every ${shelf} days unless preserved.`;
    }
    const craft = craftValue(doc.actor ?? this.actor);
    return {
      keeping, preserved: Boolean(doc.system.preserved),
      canPreserve: owned && canSpoil,
      canRefine: owned && rec.condition < MAX_CONDITION,
      refineNote: `Raise one to the next Condition: ${craft.name} at ${DIFFICULTY[REFINE_STEP].label}, hours of work; a fumble ruins it (§3)`
    };
  }

  _mmPotionDetail(doc) {
    const s = doc.system;
    const isGM = game.user.isGM;
    const known = s.identified || isGM;
    const potency = Math.min(Number(s.potency) || 0, MAX_POTENCY);
    const blast = known ? blastProfile(doc) : null;
    const thrown = known ? blastProfile(doc, { thrown: true }) : null;
    const owned = Boolean(doc.parent) && !doc.pack && doc.isOwner;
    const deadline = known ? supercriticalDeadline(doc) : null;
    const decay = asetting(ASETTINGS.supercriticalDecay) !== false;
    return {
      uuid: doc.uuid, name: doc.name, img: doc.img, known, identified: s.identified,
      stats: known ? [
        { label: "Quality", value: s.quality },
        { label: "Potency", value: `${s.potency}${s.supercritical ? " (7)" : ""}` },
        { label: "Duration", value: `${s.duration} rd` },
        { label: "Doses", value: s.quantity },
        { label: "Class", value: s.potionClass },
        { label: "Raw Orie", value: s.mechanical ? s.rawOriePerDose : "—" }
      ] : [{ label: "Doses", value: s.quantity }],
      effects: known ? (s.manifest ?? []).map(({ effect, slot }) => {
        const sp = slotPotency(potency, slot ?? 0);
        return { effect, slot: SLOT_NAMES[slot ?? 0], rule: sp >= 1 ? describeEffect(effect, sp, s.multiplier || 1) : "Too weak to manifest." };
      }) : [],
      blast, absorption: known && s.mechanical && potency ? ABSORPTION[Math.min(s.potency, 7)] : null,
      ingredients: (s.ingredients ?? []).join(" + "), brewedBy: s.brewedBy,
      owned, canReveal: isGM && !s.identified, canDelete: isGM || owned,
      padded: Boolean(s.padded), canPad: owned,
      paddedNote: s.padded && thrown ? (blast ? (blast.damage === thrown.damage ? `Padded, but a case can't soften a burst this strong (${blast.damage}).` : `In its padded case a break does ${blast.damage}, not ${thrown.damage}; thrown, it leaves the case.`) : `In its padded case a break is smothered; thrown, it bursts for ${thrown.damage} in ${thrown.radius} m.`) : null,
      fuse: s.supercritical && known ? (decay && deadline !== null
        ? `Supercritical: ${untilText(deadline - (Number(game.time.worldTime) || 0))} it settles to Potency 6 or discharges (1d6, §9)${s.padded ? "; the padded case doubled its time" : ""}.`
        : "Supercritical: it cannot be stored more than a few hours (§9).") : null
    };
  }

  _mmEditContext(doc) {
    const rec = doc ? record(doc) : { name: "", grade: 2, condition: 0, class: "Mundane", rarity: "Common", slots: [null, null, null, null], weight: 0.1, description: "", mother: false };
    return {
      isNew: !doc, uuid: doc?.uuid ?? "", img: doc?.img ?? "icons/svg/item-bag.svg",
      name: rec.name, grade: rec.grade ?? "", weight: rec.weight, value: doc?.system?.value ?? 0, description: rec.description,
      mother: rec.mother,
      conditions: Object.entries(CONDITIONS).map(([v, l]) => ({ value: v, label: l, selected: Number(v) === rec.condition })),
      classes: CLASSES.map(c => ({ value: c, selected: c === rec.class })),
      rarities: RARITIES.map(r => ({ value: r, selected: r === rec.rarity })),
      slots: rec.slots.map((v, i) => ({ index: i, name: SLOT_NAMES[i], options: EFFECT_NAMES.map(n => ({ value: n, label: ARCANE_EFFECTS.has(n) ? `${n} ξ` : n, selected: n === v })) })),
      target: doc?.pack ? "Saving writes it to the world's ingredient catalogue (the system's copy is read-only)." : doc ? "" : "New ingredients go to the world's ingredient catalogue."
    };
  }

  async _mmForageContext() {
    const isGM = game.user.isGM;
    const list = [anywhereGround(), ...grounds()];
    if (!list.some(g => g.id === this.groundId)) this.groundId = ANYWHERE;
    const ground = groundById(this.groundId);
    const stock = await groundStock(ground);
    const total = stock.reduce((t, d) => t + (RARITY_WEIGHT[d.system.rarity] ?? 1), 0);
    const odds = stock.map(d => ({ name: d.name, rarity: d.system.rarity, cls: d.system.class,
      pct: total ? (100 * (RARITY_WEIGHT[d.system.rarity] ?? 1) / total) : 0 }))
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
      .map(o => ({ ...o, pct: o.pct >= 1 ? o.pct.toFixed(0) : o.pct.toFixed(1) }));
    const survival = survivalValue(this.actor), lore = identifyValue(this.actor);
    const grade = DIFFICULTY[ground.grade ?? 3];

    let edit = null;
    if (isGM && this.groundEditing) {
      const g = this.groundEditing === "new" ? { id: "", name: "", grade: 3, description: "", entries: [] } : ground;
      const all = await groundStock(anywhereGround());
      const chosen = new Set(g.entries ?? []);
      edit = {
        isNew: this.groundEditing === "new", id: g.id, name: g.name, description: g.description,
        grades: Object.entries(DIFFICULTY).map(([k, d]) => ({ value: k, label: `${d.label} (${d.mod >= 0 ? "+" : ""}${d.mod}%)`, selected: Number(k) === Number(g.grade) })),
        picks: all.map(d => ({ name: d.name, rarity: d.system.rarity, checked: chosen.has(d.name) }))
      };
    }
    return {
      grounds: list.map(g => ({ id: g.id, name: g.name, selected: g.id === this.groundId, count: g.entries ? g.entries.length : null })),
      ground: { ...ground, gradeLabel: `${grade.label} (${grade.mod >= 0 ? "+" : ""}${grade.mod}%)`, anywhere: ground.id === ANYWHERE },
      odds, count: stock.length, edit, isGM,
      actor: this.actor ? { name: this.actor.name } : null,
      canForage: Boolean(this.actor?.isOwner) && stock.length > 0,
      survival, lore, mod: this.forageMod,
      target: `${Math.max(0, survival.value + grade.mod + (Number(this.forageMod) || 0))}%`
    };
  }

  async _mmRulesContext() {
    const pages = await alchemyPages();
    const i = Math.max(0, Math.min(this.rulesIndex, pages.length - 1));
    return { pages: pages.map((p, n) => ({ index: n, name: p.name, active: n === i })), page: pages[i] };
  }

  /* ---------------------------------------------------------------
   * Rendering
   * ------------------------------------------------------------- */

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;
    root.dataset.tab = this.tab;
    if (this.window?.title) this.window.title.textContent = this.title;
    this._mmApplyFilter();
    if (root.dataset.alBound === "1") return;
    root.dataset.alBound = "1";
    root.addEventListener("change", (ev) => this._mmOnChange(ev));
    root.addEventListener("input", (ev) => {
      if (ev.target?.matches?.('[data-field="search"]')) { this.filter.search = ev.target.value; this._mmApplyFilter(); }
      if (ev.target?.matches?.('[data-field="stockSearch"]')) this._mmApplyStockFilter(ev.target.value);
      if (ev.target?.matches?.('[data-field="groundSearch"]')) {
        const t = ev.target.value.trim().toLowerCase();
        for (const row of this.element.querySelectorAll(".al-ground-pick")) row.hidden = Boolean(t) && !row.dataset.name.toLowerCase().includes(t);
      }
    });
  }

  /** Search, class and pairs filters, applied in place so ticks and focus survive. */
  _mmApplyFilter() {
    const rows = this.element?.querySelectorAll(".al-pick") ?? [];
    const term = (this.filter.search ?? "").trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const checked = row.querySelector("input")?.checked;
      let ok = !term || row.dataset.search.includes(term);
      if (ok && this.filter.cls) ok = row.dataset.cls === this.filter.cls;
      if (ok && this.filter.pairs && this.reagentIds.size) ok = row.dataset.pairs === "1";
      const visible = ok || checked;
      row.hidden = !visible;
      if (visible) shown++;
    }
    const count = this.element?.querySelector("[data-count]");
    if (count) count.textContent = shown === rows.length ? `${rows.length}` : `${shown} / ${rows.length}`;
  }

  _mmApplyStockFilter(term) {
    const t = String(term ?? "").trim().toLowerCase();
    for (const row of this.element?.querySelectorAll(".al-stock-row") ?? []) row.hidden = Boolean(t) && !row.dataset.name.toLowerCase().includes(t);
  }

  async _mmOnChange(ev) {
    const t = ev.target;
    const field = t?.dataset?.field;
    if (!field) return;
    if (field === "actor") {
      if (this.batch && !this.batch.done) { ui.notifications.warn("Decant the batch on the bench first."); t.value = this.actor?.uuid ?? ""; return; }
      this._mmSetActor(t.value ? await fromUuid(t.value) : null);
      return this.render({ force: true });
    }
    if (field === "mother") { this.motherId = t.value; return this.render({ parts: ["brew"] }); }
    if (field === "reagent") {
      const max = Number(asetting(ASETTINGS.maxIngredients)) || 3;
      if (t.checked && this.reagentIds.size >= max) { t.checked = false; ui.notifications.warn(`At most ${max} reagents (§4).`); return; }
      if (t.checked) this.reagentIds.add(t.value); else this.reagentIds.delete(t.value);
      return this.render({ parts: ["brew"] });
    }
    if (field === "cls") { this.filter.cls = t.value; return this._mmApplyFilter(); }
    if (field === "pairs") { this.filter.pairs = t.checked; return this._mmApplyFilter(); }
    if (field === "skill") { this.skillOverride = Number(t.value) || 0; return this.render({ parts: ["brew"] }); }
    if (field === "mod") { this.mod = Number(t.value) || 0; return this.render({ parts: ["brew"] }); }
    if (field === "xi") { this.xi = Math.max(0, Math.floor(Number(t.value) || 0)); return this.render({ parts: ["brew"] }); }
    if (field === "container") { this.container = t.value; return; }
    if (field === "recipeName") { await renameRecipe(this.actor, t.dataset.id, t.value); return this.render({ parts: ["brew"] }); }
    if (field === "forageMod") { this.forageMod = Number(t.value) || 0; return this.render({ parts: ["forage"] }); }
    if (field === "source") { this.source = t.value; this.selectedUuid = null; this.editing = null; return this.render({ parts: ["stock"] }); }
  }

  async close(options = {}) {
    // A committed batch can't be un-brewed: decant it into the best vessel rather than lose it.
    if (this.batch && !this.batch.done && !options.force) {
      const usable = decantOptions(this.batch).filter(o => !o.issue);
      if (usable.length) {
        const best = usable.reduce((a, b) => (b.potency > a.potency ? b : a));
        ui.notifications.info(`Decanting into a ${best.name} vessel — the batch was already committed.`);
        await decant(this.batch, best.name);
      }
      this.batch = null;
    }
    return super.close(options);
  }

  async _onClose(options) {
    if (Laboratory.instance === this) Laboratory.instance = null;
    return super._onClose?.(options);
  }

  refresh() {
    if (!this.rendered) return;
    const parts = ["rail", "stock", "forage"];
    if (!this.batch) parts.push("brew");
    this.render({ parts });
  }

  /* ---------------------------------------------------------------
   * Actions
   * ------------------------------------------------------------- */

  static #onShowTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (!TABS.some(t => t.id === tab) || tab === this.tab) return;
    this.tab = tab;
    this.element.dataset.tab = tab;
    this.render({ parts: ["tabs", ...(tab === "rules" ? ["rules"] : ["rail", tab])] });
  }

  static #onOpenSheet(event) { event.preventDefault(); this.actor?.sheet?.render(true); }

  static async #onVent(event) {
    event.preventDefault();
    if (!this.actor?.isOwner) return;
    return ventHeat(this.actor, 1);
  }

  static #onToggleReagent(event, target) {
    event.preventDefault();
    this.reagentIds.delete(target.dataset.id);
    this.render({ parts: ["brew"] });
  }

  static #onClearMixture(event) {
    event.preventDefault();
    this.motherId = ""; this.reagentIds.clear(); this.xi = 0;
    this.render({ parts: ["brew"] });
  }

  static async #onBrew(event) {
    event.preventDefault();
    if (!canBrew()) return ui.notifications.warn("Brewing is a GM action at this table.");
    const pool = await this._mmPool();
    const byId = new Map(pool.map(r => [r.id, r]));
    const mother = byId.get(this.motherId) ?? null;
    const reagents = [...this.reagentIds].map(id => byId.get(id)).filter(Boolean);
    const skill = this._mmSkill();
    const plan = planBrew({ mother, reagents, xi: this.xi, actor: this.actor, skill: skill.value, mod: this.mod });
    const go = await confirmDialog({
      title: "Commit the mixture?",
      content: `<p>The reagents are spent now, whatever the roll (§4).${plan.channelled ? ` ${plan.drawn} Xi comes from Stored Orie${plan.converted ? `, and ${plan.converted} more is converted on the spot for <strong>+${fmt(plan.heat)} Heat</strong>` : ""}.` : ""}</p><p>${e(skill.name)} ${skill.value}% at ${e(plan.difficulty.label)} → <strong>${plan.target}%</strong>.</p>`,
      yesLabel: "Brew", noLabel: "Not yet"
    });
    if (!go) return;
    const batch = await commitBrew({ actor: this.actor, mother, reagents, xi: this.xi, skill: skill.value, mod: this.mod, skillName: skill.name });
    if (!batch) return;
    this.reagentIds.clear(); this.motherId = ""; this.xi = 0;
    this.batch = batch.done ? null : batch;
    this.container = null;
    this.render({ parts: ["rail", "brew", "stock"] });
  }

  static async #onDecant(event) {
    event.preventDefault();
    if (!this.batch) return;
    const chosen = this.element.querySelector('[data-field="container"]:checked')?.value ?? this.container;
    const batch = this.batch;
    this.batch = null;
    const potion = await decant(batch, chosen);
    if (potion) { this.selectedUuid = potion.uuid; }
    this.render({ parts: ["rail", "brew", "stock"] });
  }

  static #onSelectItem(event, target) {
    event.preventDefault();
    this.selectedUuid = target.closest("[data-uuid]")?.dataset.uuid ?? null;
    this.editing = null;
    this.importing = false;
    this.render({ parts: ["stock"] });
  }

  async _mmSelected() { return this.selectedUuid ? fromUuid(this.selectedUuid).catch(() => null) : null; }

  static async #onTaste(event) { event.preventDefault(); const d = await this._mmSelected(); if (d) { await tasteIngredient(d, this.actor ?? d.actor); this.render({ parts: ["stock", "brew"] }); } }
  static async #onStudy(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    const actor = d.actor ?? this.actor;
    await studyIngredient(d, { actor, skill: loreValue(actor).value });
    this.render({ parts: ["stock", "brew"] });
  }
  static async #onEat(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    const go = await confirmDialog({ title: `Eat ${d.name} raw?`, content: "<p>Only its Primary manifests, and a Mechanical ingredient delivers its whole raw dose (§6a, §8).</p>", yesLabel: "Eat it", noLabel: "Keep it" });
    if (go) await eatIngredient(d, d.actor);
  }
  static async #onUseInBrew(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    if (isMother(d)) this.motherId = d.id; else this.reagentIds.add(d.id);
    this.tab = "brew";
    this.render({ parts: ["tabs", "rail", "brew"] });
  }
  static async #onDrink(event) { event.preventDefault(); const d = await this._mmSelected(); if (d) await drinkPotion(d, d.actor); }
  static async #onThrow(event) { event.preventDefault(); const d = await this._mmSelected(); if (d) await throwPotion(d, d.actor); }
  static async #onBreak(event) { event.preventDefault(); const d = await this._mmSelected(); if (d) await breakPotion(d, d.actor); }
  static async #onReveal(event) { event.preventDefault(); const d = await this._mmSelected(); if (d) { await revealPotion(d); this.render({ parts: ["stock"] }); } }

  static async #onRefine(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    const go = await confirmDialog({ title: `Refine ${d.name}?`, content: `<p>Hours of work with proper equipment to raise one ${e(d.name)} a step of Condition: ${e(craftValue(d.actor ?? this.actor).name)} at Standard. A fumble ruins it (§3).</p>`, yesLabel: "Refine", noLabel: "Not now" });
    if (!go) return;
    await refineIngredient(d, d.actor ?? this.actor);
    this.selectedUuid = d.parent?.items.get(d.id) ? d.uuid : null;
    this.render({ parts: ["stock", "brew"] });
  }
  static async #onPreserve(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    await setPreserved(d, !d.system.preserved);
    this.render({ parts: ["stock"] });
  }
  static async #onPad(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    await setPadded(d, !d.system.padded);
    this.render({ parts: ["stock", "rail"] });
  }
  static async #onUseRecipe(event, target) {
    event.preventDefault();
    if (!this.actor) return;
    const page = (this.actor.system.recipes ?? []).find(r => r.id === target.closest("[data-recipe]")?.dataset.recipe);
    if (!page) return;
    const m = matchRecipe(this.actor, page);
    if (m.missing.length) return ui.notifications.warn(`${this.actor.name} is missing ${m.missing.join(", ")}.`);
    this.motherId = m.motherId;
    this.reagentIds = new Set(m.reagentIds);
    this.xi = Number(page.xi) || 0;
    this.render({ parts: ["brew"] });
  }
  static async #onDeleteRecipe(event, target) {
    event.preventDefault();
    const id = target.closest("[data-recipe]")?.dataset.recipe;
    const go = await confirmDialog({ title: "Tear out the page?", content: "<p>Remove this recipe from the book?</p>", yesLabel: "Remove", noLabel: "Keep" });
    if (!go) return;
    await deleteRecipe(this.actor, id);
    this.render({ parts: ["brew"] });
  }

  static async #onDeleteItem(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    if (d.pack && game.packs.get(d.pack)?.locked) return ui.notifications.warn("That compendium is locked.");
    const go = await confirmDialog({ title: `Delete ${d.name}`, content: `<p>Delete <strong>${e(d.name)}</strong>${d.actor ? ` from ${e(d.actor.name)}` : ""}?</p>`, yesLabel: "Delete", noLabel: "Keep" });
    if (!go) return;
    await d.delete();
    this.selectedUuid = null;
    this.render({ parts: ["stock", "brew", "rail"] });
  }

  static #onEdit(event) { event.preventDefault(); if (game.user.isGM) { this.editing = "existing"; this.render({ parts: ["stock"] }); } }
  static #onCancelEdit(event) { event.preventDefault(); this.editing = null; this.render({ parts: ["stock"] }); }
  static #onNewIngredient(event) { event.preventDefault(); if (game.user.isGM) { this.editing = "new"; this.importing = false; this.selectedUuid = null; this.render({ parts: ["stock"] }); } }
  static #onImportPanel(event) { event.preventDefault(); if (game.user.isGM) { this.importing = !this.importing; this.editing = null; this.render({ parts: ["stock"] }); } }

  /** Read the edit form into an ingredient record. */
  _mmReadEdit() {
    const f = this.element.querySelector(".al-edit");
    const v = (name) => f?.querySelector(`[data-afield="${name}"]`)?.value ?? "";
    return {
      name: v("name").trim(), img: f?.querySelector(".al-edit-img")?.getAttribute("src") || undefined,
      grade: Number(v("grade")) || null, condition: Number(v("condition")) || 0,
      class: v("class") || "Mundane", rarity: v("rarity") || "Common",
      mother: Boolean(f?.querySelector('[data-afield="mother"]')?.checked),
      slots: [0, 1, 2, 3].map(i => v(`slot${i}`) || null),
      weight: v("weight"), value: toCopper(v("value")), description: v("description")
    };
  }

  static async #onSaveIngredient(event) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const rec = this._mmReadEdit();
    if (!rec.name) return ui.notifications.warn("An ingredient needs a name.");
    const bad = classContradictions([rec], ARCANE_EFFECTS);
    if (bad.length) {
      const go = await confirmDialog({ title: "Class contradiction", content: `<p><strong>${e(rec.name)}</strong> is Mundane but carries ξ effects (${bad[0].offending.map(e).join(", ")}), which §3a doesn't allow. Save anyway?</p>`, yesLabel: "Save anyway", noLabel: "Go back" });
      if (!go) return;
    }
    const doc = this.editing === "existing" ? await this._mmSelected() : null;
    try {
      if (doc && !doc.pack) {
        const data = ingredientItemData(rec);
        delete data.system.quantity; delete data.system.discovered; delete data.type;
        await doc.update(data);
      } else {
        const { pack } = await upsertIngredients([rec]);
        const hit = (await pack.getIndex()).find(x => x.name === rec.name);
        this.source = "catalogue";
        this.selectedUuid = hit ? `Compendium.${pack.collection}.Item.${hit._id}` : null;
      }
      ui.notifications.info(`${rec.name} saved.`);
    } catch (err) {
      console.error("Dreoarcana | Alchemy: save failed", err);
      return ui.notifications.error(`Could not save: ${err.message}`);
    }
    this.editing = null;
    this.render({ parts: ["stock", "brew"] });
  }

  static async #onEditImage(event, target) {
    event.preventDefault();
    const FP = FilePickerImpl();
    new FP({ type: "image", current: target.getAttribute("src"), callback: (path) => target.setAttribute("src", path) }).browse();
  }

  static async #onRunImport(event) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const text = this.element.querySelector('[data-field="csv"]')?.value ?? "";
    const { records, error } = recordsFromCSV(text);
    if (error) return ui.notifications.error(error);
    if (!records.length) return ui.notifications.warn("No ingredient rows found.");
    const bad = classContradictions(records, ARCANE_EFFECTS);
    if (bad.length) {
      const go = await confirmDialog({ title: "Class contradictions", content: `<p>${bad.length} ingredient${bad.length === 1 ? " is" : "s are"} Mundane but carry magic-only (ξ) effects, which §3a doesn't allow:</p><ul>${bad.slice(0, 8).map(b => `<li><strong>${e(b.name)}</strong> — ${b.offending.map(e).join(", ")}</li>`).join("")}</ul><p>Import anyway?</p>`, yesLabel: "Import anyway", noLabel: "Cancel" });
      if (!go) return;
    }
    try {
      const { created, updated, pack } = await upsertIngredients(records);
      ui.notifications.info(`${pack.metadata.label}: ${created} created, ${updated} updated.`);
    } catch (err) { return ui.notifications.error(`Import failed: ${err.message}`); }
    this.importing = false;
    this.source = "catalogue";
    this.render({ parts: ["stock", "brew"] });
  }

  static async #onRestSaturation(event) {
    event.preventDefault();
    if (!this.actor?.isOwner) return;
    const go = await confirmDialog({ title: "Rested?", content: `<p>Has ${e(this.actor.name)} rested long enough for the body to clear the raw Orie it is carrying (§8)?</p>`, yesLabel: "Clear it", noLabel: "Not yet" });
    if (!go) return;
    await clearLoad(this.actor);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<p>${e(this.actor.name)} rests; the raw Orie they carried has cleared.</p>` });
  }

  static async #onEndEffect(event, target) {
    event.preventDefault();
    if (!this.actor?.isOwner) return;
    const ef = this.actor.effects.get(target.dataset.id);
    if (ef) await ef.delete();
    this.render({ parts: ["rail"] });
  }

  static async #onIdentify(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    await identifyIngredient(d, d.actor ?? this.actor);
    this.render({ parts: ["stock", "brew"] });
  }

  static async #onRevealIngredient(event) {
    event.preventDefault();
    const d = await this._mmSelected(); if (!d) return;
    await revealIngredient(d);
    this.render({ parts: ["stock", "brew"] });
  }

  static #onSelectGround(event, target) {
    event.preventDefault();
    this.groundId = target.closest("[data-ground]")?.dataset.ground ?? ANYWHERE;
    this.groundEditing = null;
    this.render({ parts: ["forage"] });
  }

  static async #onForage(event) {
    event.preventDefault();
    if (!this.actor?.isOwner) return ui.notifications.warn("Choose a character you control to forage.");
    const ground = groundById(this.groundId);
    const go = await confirmDialog({ title: `Forage ${ground?.name ?? ""}`, content: `<p>Spend a day foraging? That is one Survival roll (Mythras p.49).</p>`, yesLabel: "Forage", noLabel: "Not today" });
    if (!go) return;
    await forageDay(this.actor, this.groundId, { mod: this.forageMod });
    this.render({ parts: ["forage", "stock", "brew", "rail"] });
  }

  static #onNewGround(event) { event.preventDefault(); if (game.user.isGM) { this.groundEditing = "new"; this.render({ parts: ["forage"] }); } }
  static #onEditGround(event) { event.preventDefault(); if (game.user.isGM && this.groundId !== ANYWHERE) { this.groundEditing = "existing"; this.render({ parts: ["forage"] }); } }
  static #onCancelGround(event) { event.preventDefault(); this.groundEditing = null; this.render({ parts: ["forage"] }); }

  static async #onSaveGround(event) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const f = this.element.querySelector(".al-ground-edit");
    const v = (n) => f?.querySelector(`[data-gfield="${n}"]`)?.value ?? "";
    const entries = [...f.querySelectorAll(".al-ground-pick input:checked")].map(i => i.value);
    if (!v("name").trim()) return ui.notifications.warn("A foraging ground needs a name.");
    if (!entries.length) return ui.notifications.warn("Tick at least one thing that grows there.");
    const saved = await saveGround({ id: this.groundEditing === "existing" ? this.groundId : "", name: v("name"), grade: v("grade"), description: v("description"), entries });
    this.groundId = saved.id;
    this.groundEditing = null;
    this.render({ parts: ["forage"] });
  }

  static async #onDeleteGround(event) {
    event.preventDefault();
    if (!game.user.isGM || this.groundId === ANYWHERE) return;
    const g = groundById(this.groundId);
    const go = await confirmDialog({ title: `Delete ${g?.name}`, content: `<p>Delete the foraging ground <strong>${e(g?.name ?? "")}</strong>? The ingredients themselves are untouched.</p>`, yesLabel: "Delete", noLabel: "Keep" });
    if (!go) return;
    await deleteGround(this.groundId);
    this.groundId = ANYWHERE;
    this.render({ parts: ["forage"] });
  }

  static #onRulesPage(event, target) {
    event.preventDefault();
    this.rulesIndex = Number(target.dataset.index) || 0;
    this.render({ parts: ["rules"] });
  }
}

/** Open the Laboratory, for an actor or on an item. One per client. */
export async function openLaboratory({ actor, item, tab } = {}) {
  let app = Laboratory.instance;
  if (app?.rendered) return app.focus({ actor, item, tab });
  const fromItem = item?.parent?.documentName === "Actor" ? item.parent : null;
  const who = fromItem ?? actor ?? currentActor() ?? (game.user.isGM ? null : castableActors()[0]) ?? null;
  app = new Laboratory({ actor: who && who.isOwner ? who : null });
  Laboratory.instance = app;
  return app.focus({ item, tab });
}

export { worldPack };
