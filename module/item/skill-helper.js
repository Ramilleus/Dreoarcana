export function updateSkillValues(itemData, actorData) {
  const data = itemData.data
  const primChar = Number(
    actorData.data.characteristics[data.primaryChar].value
  )
  const secondChar = Number(
    actorData.data.characteristics[data.secondaryChar].value
  )
  data.baseVal.value = primChar + secondChar
  data.totalVal =
    data.baseVal.value + Number(data.trainingVal) + Number(data.miscBonus)
}

export const skillTypes = [
  'standardSkill',
  'professionalSkill',
  'combatStyle',
  'magicSkill',
  'passion'
]
