/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ActorSheetMythras extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return super.defaultOptions;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    //Prepare items.
    if (this.actor.data.type == 'character') {
     this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const gear = [];
    const standardSkills = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'skill') {
        standardSkills.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
    }
    // Assign and return
    actorData.gear = gear;
    actorData.standardSkills = standardSkills;
    actorData.features = features;
    actorData.spells = spells;
  }

  /* -------------------------------------------- */
  /** @override */
  _updateObject(event, formData) {
    const skills = this.getData().actor.standardSkills;
    skills.forEach(skill => {
      let primChar = Number(formData["data.characteristics."+skill.data.primaryChar+".value"]);
      let secondChar = Number(formData["data.characteristics."+skill.data.secondaryChar+".value"]);
      this.actor.updateEmbeddedEntity("OwnedItem", {_id: skill._id, "data.baseVal.value": primChar+secondChar });
    });
    return this.actor.update(formData);
  }
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const dataLabel = dataset.label.split(",");
    const diffGrades = [2,1.5,1,2/3,0.5,0.1].map(function(x) {return Math.ceil(x*Number(dataLabel[1]))});
    const diffNames = ["Very Easy: ","Easy: ","Standard: ","Hard: ","Formidable: ","Herculean: "];

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataLabel[0]}` : '';
      const rolled = roll.roll();
      let diffRolled = diffNames.map(function(x) {return "<strong>"+ x +"</strong>" + rolled.result +" <b>≤</b> "});
      let contentString = "<h3><strong>Roll: "+rolled.result+"</strong></h3>";
      diffRolled.forEach((rollStr, index) => {
        contentString += rollStr + diffGrades[index] +"<br>";
      })
      let chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: contentString
      };
      ChatMessage.create(chatData);      
    }
  }

}
