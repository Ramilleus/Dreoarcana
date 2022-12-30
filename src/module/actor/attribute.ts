export interface ActorAttributes {
    actionPoints: ActorAttribute
    damageMod: ActorAttribute
    experienceMod: ActorAttribute
    healingRate: ActorAttribute
    hitPointMod: ActorAttribute
    initiativeBonus: ActorAttribute
    luckPoints: ActorAttribute
    magicPoints: ActorAttribute
    tenacity: ActorAttribute
    movement: ActorMovementAttribute
    walk: ActorAttribute
    run: ActorAttribute
    sprint: ActorAttribute
    climb: ActorAttribute
    jumpHorizontal: ActorAttribute
    jumpVertical: ActorAttribute
    swim: ActorAttribute
    fatigue: ActorFatigueAttribute
    encumbrance: ActorAttribute
    armorPenalty: ActorAttribute
    experienceRoll: ActorAttribute
}

export interface ActorAttribute {
    mod: number
    value: number
}

export interface ActorFatigueAttribute {
    value: string
}

export interface ActorMovementAttribute {
    mod: number
    walk: number
}