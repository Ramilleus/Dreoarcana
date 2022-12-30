import { ActorMythras } from '@actor/base'
import { FatigueLevel } from './types'

export class ActorMythrasFatigue {
  constructor(private actor: ActorMythras) {}

  public get currentLevelName(): string {
    return this.actor.system.attributes.fatigue.value
  }

  public get currentLevel(): FatigueLevel {
    return this.fatigueLevels[this.currentLevelName]
  }

  public get recoveryTime(): string {
    return this.recoveryTimeCalc()
  }

  private fatigueLevels: Record<string, FatigueLevel> = {
    fresh: {
      skillGrade: 'Normal Difficulty',
      movementPenalty: () => 0,
      initiativePenalty: () => 0,
      actionPointsPenalty: () => 0
    },
    winded: {
      skillGrade: 'Hard Difficulty',
      movementPenalty: () => 0,
      initiativePenalty: () => 0,
      actionPointsPenalty: () => 0
    },
    tired: {
      skillGrade: 'Hard Difficulty',
      movementPenalty: () => -1,
      initiativePenalty: () => 0,
      actionPointsPenalty: () => 0
    },
    wearied: {
      skillGrade: 'Formidable Difficulty',
      movementPenalty: () => -2,
      initiativePenalty: () => -2,
      actionPointsPenalty: () => 0
    },
    exhausted: {
      skillGrade: 'Formidable Difficulty',
      movementPenalty: (movement) => -(movement * 0.5),
      initiativePenalty: () => -4,
      actionPointsPenalty: () => -1
    },
    debilitated: {
      skillGrade: 'Herculean Difficulty',
      movementPenalty: (movement) => -(movement * 0.5),
      initiativePenalty: () => -6,
      actionPointsPenalty: () => -2
    },
    incapacitated: {
      skillGrade: 'Herculean Difficulty',
      movementPenalty: (movement) => -movement,
      initiativePenalty: () => -8,
      actionPointsPenalty: () => -3
    },
    'semi-conscious': {
      skillGrade: 'Hopeless Difficulty',
      movementPenalty: (movement) => -movement,
      initiativePenalty: (initiative) => -initiative,
      actionPointsPenalty: (actionPoints) => -actionPoints
    },
    comatose: {
      skillGrade: 'No Activities Possible',
      movementPenalty: (movement) => -movement,
      initiativePenalty: (initiative) => -initiative,
      actionPointsPenalty: (actionPoints) => -actionPoints
    },
    dead: {
      skillGrade: 'Death',
      movementPenalty: (movement) => -movement,
      initiativePenalty: (initiative) => -initiative,
      actionPointsPenalty: (actionPoints) => -actionPoints
    }
  }

  private recoveryTimeCalc(): string {
    let levels: any = {
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
    let healingRate = this.actor.healingRate
    if (healingRate < 1) healingRate = 1
    if (this.currentLevelName == 'fresh') {
      return levels[this.currentLevelName]
    } else if (this.currentLevelName == 'dead') {
      return levels[this.currentLevelName]
    } else if (this.currentLevelName == 'winded') {
      recoveryMsg = ' minutes until Fresh.'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.minrecovermsg')
      }
      return Math.ceil(levels[this.currentLevelName] / healingRate) + recoveryMsg
    } else {
      recoveryMsg = ' hours until Fresh'
      if (game.i18n) {
        recoveryMsg = game.i18n.localize('MYTHRAS.hoursrecovermsg')
      }
      return Math.ceil(levels[this.currentLevelName] / healingRate) + recoveryMsg
    }
  }
}
