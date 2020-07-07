/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MythrasItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["mythras", "sheet", "item"],
      width: 495,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/mythras/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    if(this.item.data.type === "standardSkill" || this.item.data.type === "professionalSkill" || this.item.data.type ==="combatStyle" || this.item.data.type === "magicSkill" || this.item.data.type === "passion"){
      return `${path}/item-skill-sheet.html`;
    }
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }
  /** @override */
  _updateObject(event, formData) {
    super._updateObject(event, formData);
    const itemData = this.item.data;
    const itemType = itemData.type;
    if((itemType==="standardSkill" || itemType==="professionalSkill" || itemType==="combatStyle" || itemType==="magicSkill" || itemType==="passion")){
      if(this.actor != null && event.target != null && event.target.id === "char-change"){
        const actorData = this.actor.data;
        const primChar = Number(actorData.data.characteristics[formData["data.primaryChar"]].value);
        const secondChar = Number(actorData.data.characteristics[formData["data.secondaryChar"]].value);
        itemData.data.baseVal.value = primChar+secondChar;
        itemData.data.totalVal = primChar+secondChar + Number(itemData.data.trainingVal)+Number(itemData.data.miscBonus);
      }
      if(event.target != null && event.target.id === "skill-mod"){
        itemData.data.totalVal = itemData.data.baseVal.value+ Number(formData["data.trainingVal"]) + Number(formData["data.miscBonus"]);
      }
    }
    return this.item.update(formData);
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    let itemData = this.item.data.data;
    let itemType = this.item.data.type;
    if((itemType==="standardSkill" || itemType==="professionalSkill" || itemType==="combatStyle" || itemType==="magicSkill" || itemType==="passion")){
      if(((itemData.primaryChar+itemData.secondaryChar).includes("str")||(itemData.primaryChar+itemData.secondaryChar).includes("dex"))){
        html.find(".char-enc")[0].checked = true;
      }else{
        html.find(".char-enc")[0].checked = false;
      }
    }


    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }
}
