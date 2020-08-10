// Import Modules
import { registerActors } from './module/register-actors.js'
import { MythrasItem } from './module/item/item.js'
import { ActorMythras } from './module/actor/actor.js'
import { MythrasItemSheet } from './module/item/item-sheet.js'
import loadTemplates from './module/templates.js'

Hooks.once('init', async function () {
  game.mythras = {
    ActorMythras,
    MythrasItem,
    rollItemMacro
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
  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('mythras', MythrasItemSheet, { makeDefault: true })

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = ''
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg]
      }
    }
    return outStr
  })

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase()
  })

  Handlebars.registerHelper('toUpperCase', function (str) {
    return str.toUpperCase()
  })

  registerActors()
  loadTemplates()
})

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createMythrasMacro(data, slot))
  Hooks.on('createActor', (actor, x, y) => {
    game.packs
      .get('mythras.standardSkill')
      .getContent()
      .then((result) => {
        let chain = Promise.resolve()
        result.forEach((skill, index) => {
          chain = chain.then(() => actor.createOwnedItem(skill.data))
        })
      })
  })
})

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMythrasMacro(data, slot) {
  if (data.type !== 'Item') return
  if (!('data' in data))
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    )
  const item = data.data

  // Create the macro command
  const command = `game.mythras.rollItemMacro("${item.name}");`
  let macro = game.macros.entities.find(
    (m) => m.name === item.name && m.command === command
  )
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'mythras.itemMacro': true }
    })
  }
  game.user.assignHotbarMacro(macro, slot)
  return false
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    )

  // Trigger the item roll
  return item.roll()
}
