// Import Modules
import { registerActors, registerItems } from './module/register-sheets.js'
import { MythrasItem } from './module/item/item.js'
import { ActorMythras } from './module/actor/actor.js'
import { CombatMythras } from './module/combat/combat-mythras.js'
import { MythrasCombatTracker } from './module/combat/combat-tracker.js'
import { MythrasCombatTrackerConfig } from './module/combat/combat-config.js'
import loadPartials from './module/templates.js'

Hooks.once('init', async function () {
  game.mythras = {
    ActorMythras,
    MythrasItem,
    CombatMythras,
    MythrasCombatTracker,
    MythrasCombatTrackerConfig
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
  CONFIG.ui.combat = MythrasCombatTracker

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
          let skillArray = []
          result.forEach((skill, index) => {
            if (game.i18n) {
              skill.data.update({
                name: game.i18n.localize(
                  'MYTHRAS.' + skill.data.name.replace(/ /g, '_')
                ),
                img: 'icons/svg/book.svg'
              })
            }
            skillArray.push(skill.data)
          })
          actor.createEmbeddedDocuments('Item', skillArray)
        })
      // Hit Locations
      game.packs
        .get('mythras.humanoidHitLocations')
        .getDocuments()
        .then((result) => {
          let hitLocArray = []
          result.forEach((hitLoc, index) => {
            if (game.i18n) {
              hitLoc.data.update({
                name: game.i18n.localize(
                  'MYTHRAS.' + hitLoc.data.name.replace(/ /g, '_')
                )
              })
            }
            hitLocArray.push(hitLoc.data)
          })
          actor.createEmbeddedDocuments('Item', hitLocArray)
        })
    }
  })

  // Hooks.on('preCreateItem', (parentId, itemData, options) => {
  //   if (itemData.type !== 'hitLocation') {
  //     itemData.img = getItemImage(itemData.type)
  //   }
  // })

  Hooks.on('createItem', (document, options, parentId) => {
    if (document.data.type !== 'hitLocation') {
      document.data.img = getItemImage(document.data.type)
    }
  })
})

Hooks.on('renderChatMessage', (app, html, data) => {
  let chatButtons = [...html[0].querySelectorAll('.apply-damage')]
  let chatMessage = chatButtons[chatButtons.length - 1]

  if (chatMessage) {
      chatMessage.style.backgroundColor = 'white'
      chatMessage.textContent = 'Apply Damage'
      if (!game.user.isGM) chatMessage.style.display = 'none'

      chatMessage.addEventListener('click', function applyDamage() {
          let targetTokenActor = game.scenes.active.data.tokens.find(i => i.id == chatMessage.dataset.targetToken)

          if (game.user.isGM) {
              let hitLocation = targetTokenActor.actor.items.find(i => i.id === chatMessage.dataset.hitLocationId)
              let totalArmor = Number(hitLocation.data.data.ap) + Number(hitLocation.data.data.naturalArmor)
              // let hitLocation = targetTokenActor.getEmbeddedDocument('Item', chatMessage.dataset.hitLocationId)
              let armorMitigatedDamage = Number(chatMessage.dataset.damage) > totalArmor ? Number(chatMessage.dataset.damage - totalArmor) : 0

              hitLocation.update({'data.currentHp': Number(hitLocation.data.data.currentHp) - armorMitigatedDamage})
              chatMessage.textContent = 'Damage Applied'
              chatMessage.style.backgroundColor = 'rgba(88, 88, 88, 0.705)'
              chatMessage.removeEventListener('click', applyDamage)
          }
      })
    }
})

function getItemImage(itemType) {
  switch (itemType) {
    case 'equipment':
      return 'icons/svg/item-bag.svg'
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
    case 'storage':
      return 'icons/svg/chest.svg'
    case 'cultBrotherhood':
      return 'icons/svg/hanging-sign.svg'
    case 'magicSkill':
      return 'icons/svg/daze.svg'
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
