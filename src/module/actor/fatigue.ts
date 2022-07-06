export type FatigueLevel = {
  skillGrade:
    | 'Normal Difficulty'
    | 'Hard Difficulty'
    | 'Formidable Difficulty'
    | 'Herculean Difficulty'
    | 'Hopeless Difficulty'
    | 'No Activities Possible'
    | 'Death'
  movementPenalty: (movement: number) => number
  initiativePenalty: (initiative: number) => number
  actionPointsPenalty: (actionPoints: number) => number
}

export const fatigueLevels: Record<string, FatigueLevel> = {
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
