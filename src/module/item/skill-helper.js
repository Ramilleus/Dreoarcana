export function updateSkillValues(itemData, actorData) {
  const data = itemData.data
  if (actorData !== undefined) {
    let primChar = 0
    let secondChar = 0
    if (data.primaryChar !== ""){
      primChar = Number(
        actorData.data.characteristics[data.primaryChar].value
      )
    }
    if (data.secondaryChar !== ""){
      secondChar = Number(
        actorData.data.characteristics[data.secondaryChar].value
      )
    }

    data.baseVal.value = primChar + secondChar
    data.totalVal =
      data.baseVal.value + Number(data.trainingVal) + Number(data.miscBonus)
  }
}

export const skillTypes = [
  'standardSkill',
  'professionalSkill',
  'combatStyle',
  'magicSkill',
  'passion'
]
