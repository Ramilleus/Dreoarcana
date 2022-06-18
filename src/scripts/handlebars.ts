export function registerHandlebarsHelpers() {
  Handlebars.registerHelper('localizeSkillAbbrev', function (str) {
    return localizeSkillAbbrev(str)
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
    return items.find((entry: any) => entry.name === itemName)
  })
  Handlebars.registerHelper('formatSkillAbbrev', function (data) {
    let primChar = localizeSkillAbbrev(data.primaryChar)
    let secondChar = localizeSkillAbbrev(data.secondaryChar)
    return [primChar, secondChar].filter(Boolean).join(' + ')
  })
}

function localizeSkillAbbrev(str: string) {
  if (str === '') {
    return ''
  }
  if (game.i18n && str !== undefined) {
    return game.i18n.localize('MYTHRAS.' + str.toUpperCase())
  } else if (str == undefined) {
    return str
  }
  return str.toUpperCase()
}
