export const fatigueInfo = {
  fresh: {
    'Skill Grade': 'Normal Difficulty',
    Movement: (Movement) => 0,
    Initiative: (Initiative) => 0,
    ActionPoints: (ActionPoints) => 0
  },
  winded: {
    'Skill Grade': 'Hard Difficulty',
    Movement: (Movement) => 0,
    Initiative: (Initiative) => 0,
    ActionPoints: (ActionPoints) => 0
  },
  tired: {
    'Skill Grade': 'Hard Difficulty',
    Movement: (Movement) => -1,
    Initiative: (Initiative) => 0,
    ActionPoints: (ActionPoints) => 0
  },
  wearied: {
    'Skill Grade': 'Formidable Difficulty',
    Movement: (Movement) => -2,
    Initiative: (Initiative) => -2,
    ActionPoints: (ActionPoints) => 0
  },
  exhausted: {
    'Skill Grade': 'Formidable Difficulty',
    Movement: (Movement) => -(Movement * 0.5),
    Initiative: (Initiative) => -4,
    ActionPoints: (ActionPoints) => -1
  },
  debilitated: {
    'Skill Grade': 'Herculean Difficulty',
    Movement: (Movement) => -(Movement * 0.5),
    Initiative: (Initiative) => -6,
    ActionPoints: (ActionPoints) => -2
  },
  incapacitated: {
    'Skill Grade': 'Herculean Difficulty',
    Movement: (Movement) => -Movement,
    Initiative: (Initiative) => -8,
    ActionPoints: (ActionPoints) => -3
  },
  'semi-conscious': {
    'Skill Grade': 'Hopeless Difficulty',
    Movement: (Movement) => -Movement,
    Initiative: (Initiative) => -Initiative,
    ActionPoints: (ActionPoints) => -ActionPoints
  },
  comatose: {
    'Skill Grade': 'No Activities Possible',
    Movement: (Movement) => -Movement,
    Initiative: (Initiative) => -Initiative,
    ActionPoints: (ActionPoints) => -ActionPoints
  },
  dead: {
    'Skill Grade': 'Death',
    Movement: (Movement) => -Movement,
    Initiative: (Initiative) => -Initiative,
    ActionPoints: (ActionPoints) => -ActionPoints
  }
}
