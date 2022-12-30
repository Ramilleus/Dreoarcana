export interface ActorCharacteristics {
    str: ActorCharacteristic
    con: ActorCharacteristic
    siz: ActorCharacteristic
    dex: ActorCharacteristic
    int: ActorCharacteristic
    pow: ActorCharacteristic
    cha: ActorCharacteristic
}

export interface ActorCharacteristic {
    mod: number
    value: number
}

export type CharacteristicOption = 'str' | 'con' | 'siz' | 'dex' | 'int' | 'pow' | 'cha'