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
