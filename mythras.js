// Import Modules
import { registerActors, registerItems } from './module/register-sheets.js'
import { MythrasItem } from './module/item/item.js'
import { ActorMythras } from './module/actor/actor.js'
import loadPartials from './module/templates.js'

Hooks.once('init', async function () {
  game.mythras = {
    ActorMythras,
    MythrasItem
  }

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @attributes.initiativeBonus.value',
    decimals: 2
  }

  // Define custom Entity classes
  CONFIG.Actor.entityClass = ActorMythras
  CONFIG.Item.entityClass = MythrasItem

  // Register sheet application classes
  registerActors()
  registerItems()

  // Register Handlebars Helpers
  registerHandlebarsHelpers()

  // Load Handlebars partial templates
  loadPartials()
})

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createMythrasMacro(data, slot))

  // Add Standard Skills and Hit Locations to an Actor when the createActor Hook is triggered
  Hooks.on('createActor', (actor, x, y) => {
    if (actor.items.size == 0) {
      // Standard Skills
      game.packs
        .get('mythras.standardSkill')
        .getContent()
        .then((result) => {
          let chain = Promise.resolve()
          result.forEach((skill, index) => {
            if (game.i18n) {
              skill.data.name = game.i18n.localize(
                'MYTHRAS.' + skill.data.name.replace(/ /g, '_')
              )
            }
            chain = chain.then(() => actor.createOwnedItem(skill.data))
          })
        })
      // Hit Locations
      game.packs
        .get('mythras.humanoidHitLocations')
        .getContent()
        .then((result) => {
          let chain = Promise.resolve()
          result.forEach((hitLoc, index) => {
            if (game.i18n) {
              hitLoc.data.name = game.i18n.localize(
                'MYTHRAS.' + hitLoc.data.name.replace(/ /g, '_')
              )
            }
            chain = chain.then(() => actor.createOwnedItem(hitLoc.data))
          })
        })
    }
  })
})

function registerHandlebarsHelpers() {
  Handlebars.registerHelper('localizeSkillAbbrev', function (str) {
    if (game.i18n && str !== undefined) {
      return game.i18n.localize('MYTHRAS.' + str.toUpperCase())
    } else if (str == undefined) {
      return str
    }
    return str.toUpperCase()
  })
  Handlebars.registerHelper('localizeSkillName', function (str) {
    if (game.i18n) {
      return game.i18n.localize('MYTHRAS.' + str.replace(/ /g, '_'))
    }
    return str
  })
  Handlebars.registerHelper('findItemByName', function (items, itemName) {
    if (game.i18n) {
      itemName = game.i18n.localize('MYTHRAS.' + itemName.replace(/ /g, '_'))
    }
    return items.find((entry) => entry.name === itemName)
  })
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
//  * Create a Macro from an Item drop.
//  * Get an existing item macro if one exists, otherwise create a new one.
//  * @param {Object} data     The dropped data
//  * @param {number} slot     The hotbar slot to use
//  * @returns {Promise}
//  */
// async function createMythrasMacro(data, slot) {
//   if (data.type !== 'Item') return
//   if (!('data' in data))
//     return ui.notifications.warn(
//       'You can only create macro buttons for owned Items'
//     )
//   const item = data.data

//   // Create the macro command
//   const command = `game.mythras.rollItemMacro("${item.name}");`
//   let macro = game.macros.entities.find(
//     (m) => m.name === item.name && m.command === command
//   )
//   if (!macro) {
//     macro = await Macro.create({
//       name: item.name,
//       type: 'script',
//       img: item.img,
//       command: command,
//       flags: { 'mythras.itemMacro': true }
//     })
//   }
//   game.user.assignHotbarMacro(macro, slot)
//   return false
// }

// /**
//  * Create a Macro from an Item drop.
//  * Get an existing item macro if one exists, otherwise create a new one.
//  * @param {string} itemName
//  * @return {Promise}
//  */
// function rollItemMacro(itemName) {
//   const speaker = ChatMessage.getSpeaker()
//   let actor
//   if (speaker.token) actor = game.actors.tokens[speaker.token]
//   if (!actor) actor = game.actors.get(speaker.actor)
//   const item = actor ? actor.items.find((i) => i.name === itemName) : null
//   if (!item)
//     return ui.notifications.warn(
//       `Your controlled Actor does not have an item named ${itemName}`
//     )

//   // Trigger the item roll
//   return item.roll()
// }
