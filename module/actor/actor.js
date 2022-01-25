import { fatigueInfo, physicalItems, formatter } from './actor-helper.js'
/**
 * Mythras Actor object. Contains logic for preparing dynamic data on the sheet.
 * @extends {Actor}
 */
export class ActorMythras extends Actor {
  /** @override */
  static async create(data, options = {}) {
    data.token = data.token || {}
    if (data.type === 'character') {
      mergeObject(
        data.token,
        {
          vision: true,
          dimSight: 30,
          brightSight: 0,
          actorLink: true,
          disposition: 1
        },
        { overwrite: false }
      )
    }
    return super.create(data, options)
  }

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData()

    const actorData = this.data

    // Prepare character specific data
    if (actorData.type === 'character') this._prepareCharacterData(actorData)
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data
    let items = actorData.items
    // Prepare a character's attributes
    this.prepareAttributes(data, items)

	//prepare a character storage content info
	this.prepareStoragesContentInfo(items)
	
    // Prepare a character's encumbrance limits
    this.prepareEncumbrance(data, items)

    // Prepare a character's movement rates
    this.prepareMovement(data, items)

    // Prepare a character's fatigue recovery time
    data.attributes.fatigue.recoveryTime = this.recoveryTimeCalc(
      data.attributes.fatigue.value,
      Number(data.attributes.healingRate.value)
    )

    // Apply green/red coloring to attributes if they've been increased/decreased
    this.applyAttrbiuteColoring(data)
  }

  /**
   * Calculates and sets a character's attribute values based on characteristics
   * @param {*} data
   * @param {*} items
   */
  prepareAttributes(data, items) {
    // Get characteristic values and convert them to Numbers
    let str = Number(data.characteristics.str.value)
    let con = Number(data.characteristics.con.value)
    let siz = Number(data.characteristics.siz.value)
    let dex = Number(data.characteristics.dex.value)
    let int = Number(data.characteristics.int.value)
    let pow = Number(data.characteristics.pow.value)
    let cha = Number(data.characteristics.cha.value)
	
    let armor = items.filter(function (value) {
      return value.type === 'armor'
    })
    let hitLoc = items.filter(function (value) {
      return value.type === 'hitLocation'
    })
    // Fix for strange MEG importer bug
    // TODO: Should move into mythras.js with a hook on sheet opening or fix the actual problem, lol
    armor.forEach((armorVal) => {
      if (
        armorVal.data.location === 'Unequipped' &&
        armorVal.data.locationName.length > 0
      ) {
        let hitLocId = hitLoc.filter(function (hitVal) {
          return hitVal.name === armorVal.data.locationName
        })
        this.updateEmbeddedDocuments('Item', [
          {
            _id: armorVal.id,
            'data.location': hitLocId[0].id
          }
        ])
      }
    })
    // Armor Penalty
    let equippedArmor = armor.filter(function (value) {
      return value.data.data.equipped
    })
    let armorEncTotal = equippedArmor.reduce((weight, i) => {
      const enc = Number(i.data.data.encumbrance) || 0
      return weight + enc
    }, 0)
    data.attributes.armorPenalty.value = Math.ceil(Number(armorEncTotal) / 5)

    // Hit Point Mod
    let hpModMiscMod = Number(data.attributes.hitPointMod.mod)
    data.attributes.hitPointMod.value =
      Math.ceil((siz + con) / 5) + hpModMiscMod

    //Action Point Mod
    data.attributes.actionPoints.max = Math.ceil((int + dex) / 12)
    let actionPointsMiscMod =
      Number(data.attributes.actionPoints.mod) +
      fatigueInfo[data.attributes.fatigue.value].ActionPoints(
        data.attributes.actionPoints.max
      )
    data.attributes.actionPoints.max += actionPointsMiscMod

    // Damage Mod
    let damageModMiscMod = Number(data.attributes.damageMod.mod)
    data.attributes.damageMod.value = this.damageModCalc(
      str + siz,
      damageModMiscMod
    )

    // Experience Mod
    let xpModMiscMod = Number(data.attributes.experienceMod.mod)
    data.attributes.experienceMod.value = Math.ceil(cha / 6 - 2) + xpModMiscMod

    // Healing Rate
    let healingRateMiscMod = Number(data.attributes.healingRate.mod)
    data.attributes.healingRate.value = Math.ceil(con / 6) + healingRateMiscMod

    // Initiative Bonus
    data.attributes.initiativeBonus.value = Math.ceil((int + dex) / 2)
    let initiativeBonusMiscMod =
      Number(data.attributes.initiativeBonus.mod) +
      fatigueInfo[data.attributes.fatigue.value].Initiative(
        data.attributes.initiativeBonus.value
      )
    data.attributes.initiativeBonus.value +=
      initiativeBonusMiscMod - Number(data.attributes.armorPenalty.value)

    // Luck Points
    let luckPointsMiscMod = Number(data.attributes.luckPoints.mod)
    data.attributes.luckPoints.max = Math.ceil(pow / 6) + luckPointsMiscMod

    // Magic Points
    let magicPointsMiscMod = Number(data.attributes.magicPoints.mod)
    data.attributes.magicPoints.max = pow + magicPointsMiscMod

    //Tenacity
    let tenacityMiscMod = Number(data.attributes.tenacity.mod)
    data.attributes.tenacity.max = pow + tenacityMiscMod
  }

  /**
   * Calculates and sets a character's encumbrance limits
   * @param {*} data
   * @param {*} items
   */
  prepareEncumbrance(data, items) {
    let str = Number(data.characteristics.str.value)
    data.attributes.encumbrance.burdened = str * 2
    data.attributes.encumbrance.overloaded = str * 3
    data.attributes.encumbrance.maxLoad = str * 4
    data.attributes.encumbrance.value = formatter.format(
      this.encumbranceCalc(items)
    )
  }
  
  /**
   * Calculates and sets a character's content encumbrance and value inside each storage
   * @param {*} items
   */
  prepareStoragesContentInfo(items) {
    let storedItems = items.filter(function (value) {
      return physicalItems.includes(value.type)
    })

	storedItems.forEach((thing) => {
	  let storage = items.find((item)=> item.id === thing.data.data.storage)
	  if(storage !== undefined && storage.id != thing.id) {
		let qty = Number(thing.data.data.quantity) || 0
		let enc = Number(storage.data.data.contentEncumbrance) + Number(thing.data.data.encumbrance) * qty
		let val = Number(storage.data.data.contentValue) + Number(thing.data.data.value) * qty
		storage.data.data.contentEncumbrance = enc || 0
		storage.data.data.contentValue = val || 0
		storage.data.data.formattedCE = formatter.format(enc)
		storage.data.data.formattedCV = formatter.format(val)
	  }
	})
  }
  
  /**
   * Calculates and sets a character's movement rates
   * @param {*} data
   * @param {*} items
   */
  prepareMovement(data, items) {
    // Get athletics and swim item objects
    let athletics = items.find(
      (entry) => entry.data.name === game.i18n.localize('MYTHRAS.Athletics')
    )
    let swim = items.find(
      (entry) => entry.data.name === game.i18n.localize('MYTHRAS.Swim')
    )
    let ap = Number(data.attributes.armorPenalty.value)
    let movementMiscMod =
      Number(data.attributes.movement.mod) +
      fatigueInfo[data.attributes.fatigue.value].Movement(
        data.attributes.movement.walk
      )
    // Default walk speed for a human is 6
    data.attributes.movement.walk = 6 + movementMiscMod
    let walkSpeed = data.attributes.movement.walk

    // Calculate run speed
    data.attributes.movement.run =
      this.moveRateCalc(walkSpeed, athletics, 'run') - ap

    // Calculate sprint speed
    data.attributes.movement.sprint =
      this.moveRateCalc(walkSpeed, athletics, 'sprint') - ap

    // Calculate climb speed
    data.attributes.climb.value = this.moveRateCalc(
      walkSpeed,
      athletics,
      'climb'
    )

    // Calculate swim speed
    data.attributes.swim.value = this.moveRateCalc(walkSpeed, swim, 'swim')

    // Calculate horizontal jump speed
    data.attributes.jump.horizontal = this.moveRateCalc(
      Number(data.height),
      athletics,
      'hJump'
    )

    // Calculate vertical jump speed
    data.attributes.jump.vertical = this.moveRateCalc(
      Number(data.height),
      athletics,
      'vJump'
    )
  }

  /**
   * Applies green/red coloring to attributes that have been increased/decreased
   * @param {*} data
   */
  applyAttrbiuteColoring(data) {
    for (let key in data.attributes) {
      if (data.attributes[key].mod != null) {
        let mod = Number(data.attributes[key].mod)
        if (mod > 0) {
          // If an attribute has a positive mod, apply the increased-attribute class (green coloring)
          data.attributes[key].applyClass = 'increased-attribute'
        } else if (mod < 0) {
          // If an attribute has a negative mod, apply the decreased-attribute class (red coloring)
          data.attributes[key].applyClass = 'decreased-attribute'
        } else {
          // If an attribute has a 0 mod, apply the no class (default coloring)
          data.attributes[key].applyClass = ''
        }
      }
    }
  }

  doesTypeHaveTemplate(type, template) {
    let itemTemplates = game.system.template.Item[type].templates
    if (itemTemplates === undefined) return false

    return itemTemplates.includes(template)
  }

  /**
   * Calculates a character's encumbrance based on their physical items
   * @param {*} items
   */
  encumbranceCalc(items) {
    // Get all of the players owned items that are physical
    let encItems = items.filter(function (value) {
      return physicalItems.includes(value.type)
    })
    // Sum up and return all of the items' weights
    return encItems.reduce((totalEnc, i) => {
      let quantity = Number(i.data.data.quantity) || 0
      let enc = Number(i.data.data.encumbrance) || 0
      let carriedStorage = 1
      if(i.data.type === 'storage') {
		 carriedStorage = Number(i.data.data.carried) || 0
	  }
      if(i.data.data.storage !== undefined) {
	     let itemStorage = items.get(i.data.data.storage)
	     if(itemStorage !== undefined && itemStorage != i.id) {
 	       carriedStorage = Number(itemStorage.data.data.carried) && carriedStorage
	     }
      }

      if (i.data.type === 'armor' && i.data.data.equipped) {
        // If an item is equipped armor, only add half of it's enc to total enc
        return totalEnc + Math.ceil(enc / 2) * carriedStorage
      } else {
        // Else, add enc * quantity to total enc
        return totalEnc + enc * quantity * carriedStorage
      }
    }, 0)
  }

  /**
   * Calculates a character's recovery time based on their fatigue level and healing rate
   * @param {*} fatigueLevel
   * @param {*} healRate
   */
  recoveryTimeCalc(fatigueLevel, healRate) {
    let levels = {
      fresh: 'Feeling fresh!',
      winded: 15,
      tired: 3,
      wearied: 6,
      exhausted: 12,
      debilitated: 18,
      incapacitated: 24,
      'semi-conscious': 36,
      comatose: 48,
      dead: 'There is no hope.'
    }
    if (game.i18n) {
      levels.fresh = game.i18n.localize('MYTHRAS.Fresh')
      levels.dead = game.i18n.localize('MYTHRAS.Dead')
    }

    let recoveryMsg = ' '
    if (healRate < 1) healRate = 1
    if (fatigueLevel == 'fresh') {
      return levels[fatigueLevel]
    } else if (fatigueLevel == 'dead') {
      return levels[fatigueLevel]
    } else if (fatigueLevel == 'winded') {
      recoveryMsg = ' minutes until Fresh.'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.minrecovermsg')
      }
      return Math.ceil(levels[fatigueLevel] / healRate) + recoveryMsg
    } else {
      recoveryMsg = ' hours until Fresh'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.hoursrecovermsg')
      }
      return Math.ceil(levels[fatigueLevel] / healRate) + recoveryMsg
    }
  }

  /**
   * Calcalates a character's movement rate for a particular movement type
   * @param {*} move
   * @param {*} skill
   * @param {*} type
   */
  moveRateCalc(move, skill, type) {
    if (skill === undefined) {
      return move
    }
    let actor = this.data.data
    let skillVal =
      Number(skill.data.data.trainingVal) +
      Number(skill.data.data.miscBonus) +
      Number(actor.characteristics.dex.value) +
      Number(actor.characteristics.str.value)
    switch (type) {
      case 'run':
        return 3 * (move + Math.floor(skillVal / 50))
      case 'sprint':
        return 5 * (move + Math.floor(skillVal / 25))
      case 'climb':
        return move
      case 'swim':
        return move + Math.floor(skillVal / 20)
      case 'hJump':
        return (move * 2 + 100 * Math.floor(skillVal / 20)) / 100
      case 'vJump':
        return (Math.floor(move / 2) + 20 * Math.floor(skillVal / 20)) / 100
      default:
        return move
    }
  }

  /**
   * Calculates a character's damage modifier
   * @param {*} total
   * @param {*} stepInc
   */
  damageModCalc(total, stepInc) {
    // The different possible values for damage mod
    const damageSteps = [
      '-1d8',
      '-1d6',
      '-1d4',
      '-1d2',
      '0',
      '1d2',
      '1d4',
      '1d6',
      '1d8',
      '1d10',
      '1d12',
      '2d6',
      '1d8+1d6',
      '2d8',
      '1d10+1d8',
      '2d10'
    ]

    let damMod = ''
    let damInfinite = damageSteps.slice(5)
    let infFlag = false

    let index = -1
    if (total < 51) {
      index = Math.ceil(total / 5) - 1
    } else if (total + stepInc * 10 < 111) {
      index = 9 + Math.ceil((total - 50) / 10)
    }

    if (index !== -1) {
      if (index + stepInc >= damageSteps.length) {
        infFlag = true
      } else {
        damMod = damageSteps[index + stepInc]
      }
    }

    if (total >= 111 || infFlag) {
      total += stepInc * 10
      let excess = Math.floor(total / 110)
      damMod = excess * 2 + 'd10'
      if (total % 110 != 0)
        damMod += '+' + damInfinite[Math.floor((total - 110 * excess) / 10)]
    }
    return damMod
  }
}
