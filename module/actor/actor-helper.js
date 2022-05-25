// List of physical item types. Does not include skills, hit locations, etc.
export const physicalItems = [
  'melee-weapon',
  'ranged-weapon',
  'armor',
  'equipment',
  'currency',
  'storage'
]

export const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

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

export function doesTypeHaveTemplate(type, template) {
  let itemTemplates = game.system.template.Item[type].templates
  if (itemTemplates === undefined) return false

  return itemTemplates.includes(template)
}
