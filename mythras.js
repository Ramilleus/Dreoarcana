// Import Modules
import { registerActors, registerItems } from './module/register-sheets.js'
import { MythrasItem } from './module/item/item.js'
import { ActorMythras } from './module/actor/actor.js'
import { CombatMythras } from './module/combat-mythras.js'
import loadPartials from './module/templates.js'

Hooks.once('init', async function () {
  game.mythras = {
    ActorMythras,
    MythrasItem,
    CombatMythras
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
  CONFIG.Actor.documentClass = ActorMythras
  CONFIG.Item.documentClass = MythrasItem
  CONFIG.Combat.documentClass = CombatMythras

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
  Hooks.on('createActor', (actor, options, userID, x, y) => {
    if (actor.items.size == 0 && userID === game.user.id) {
      // Standard Skills
      game.packs
        .get('mythras.standardSkill')
        .getDocuments()
        .then((result) => {
          let chain = Promise.resolve()
          result.forEach((skill, index) => {
            if (game.i18n) {
              skill.data.name = game.i18n.localize(
                'MYTHRAS.' + skill.data.name.replace(/ /g, '_')
              )
            }
            chain = chain.then(() => Item.create(skill.data, { parent: actor }))
          })
        })
      // Hit Locations
      game.packs
        .get('mythras.humanoidHitLocations')
        .getDocuments()
        .then((result) => {
          let chain = Promise.resolve()
          result.forEach((hitLoc, index) => {
            if (game.i18n) {
              hitLoc.data.name = game.i18n.localize(
                'MYTHRAS.' + hitLoc.data.name.replace(/ /g, '_')
              )
            }
            chain = chain.then(() =>
              Item.create(hitLoc.data, { parent: actor })
            )
          })
        })
    }
  })

  Hooks.on('preCreateOwnedItem', (parentId, itemData, options) => {
    if (itemData.type !== 'hitLocation') {
      itemData.img = getItemImage(itemData.type)
    }
  })

  Hooks.on('preCreateItem', (parentId, itemData, options) => {
    if (itemData.type !== 'hitLocation') {
      itemData.img = getItemImage(itemData.type)
    }
  })
})

function getItemImage(itemType) {
  switch (itemType) {
    case 'equipment':
      return 'icons/svg/chest.svg'
    case 'armor':
      return 'icons/svg/shield.svg'
    case 'melee-weapon':
      return 'icons/svg/sword.svg'
    case 'ranged-weapon':
      return 'icons/svg/sword.svg'
    case 'currency':
      return 'icons/svg/coins.svg'
    case 'combatStyle':
      return 'icons/svg/combat.svg'
    default:
      return 'icons/svg/book.svg'
  }
}

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
