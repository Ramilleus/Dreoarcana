export type EncumbranceLevel = {
  skillGrade: 'One Step Penalty' | 'Two Steps Penalty'
  movementPenalty: (movement: number) => number
}
