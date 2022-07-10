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

  Handlebars.registerHelper('roundNumber', function (num: number, maxDecimalPlaces: number) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimalPlaces
    }).format(num)
  })
  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) {
      return options.fn(this)
    }
    return options.inverse(this)
  })
  Handlebars.registerHelper('formatSnakeCaseName', function (name: string) {
    const segs = name.split('_')

    return segs
      .map((seg) => {
        return seg[0].toUpperCase() + seg.substring(1)
      })
      .join(' ')
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
