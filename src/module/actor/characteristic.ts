export interface ActorCharacteristics {
    str: ActorCharacteristic
    con: ActorCharacteristic
    siz: ActorCharacteristic
    dex: ActorCharacteristic
    int: ActorCharacteristic
    pow: ActorCharacteristic
    cha: ActorCharacteristic
}

/**
 * see template.json:
 *   "Actor" => "templates" => "common"=> "characteristics"
 */
export interface ActorCharacteristic {
    label: string
    mod: number
    value: number
    /**
     * Used in M-Space setting, poolValue=value but gets depleted until a character rests. Used in extended-conflict mechanic
     */
    pool: number
}

export type CharacteristicOption = 'str' | 'con' | 'siz' | 'dex' | 'int' | 'pow' | 'cha'