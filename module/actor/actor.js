/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ActorMythras extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    console.log(data);
    const flags = actorData.flags;
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    data.attributes.actionPoints = Math.ceil((data.characteristics.int.value+data.characteristics.dex.value)/12);    
    
    data.attributes.damageMod = damageModCalc(data.characteristics.str.value+data.characteristics.siz.value);
    
    data.attributes.experienceMod = Math.ceil(data.characteristics.cha.value/6);
    
    data.attributes.healingRate = Math.ceil(data.characteristics.con.value/6);
    
    data.attributes.hitPointMod = Math.ceil((data.characteristics.int.value+data.characteristics.dex.value)/5);
    
    data.attributes.initiativeBonus = Math.ceil((data.characteristics.int.value+data.characteristics.dex.value)/2);
    
    data.attributes.luckPoints = Math.ceil(data.characteristics.pow.value/6);
    
    data.attributes.magicPoints = data.characteristics.pow.value;

  }
  damageModCalc(strSize) {
    let damageSteps = ["-1d8", "-1d6", "-1d4", "-1d2", "0", "1d2", "1d4", "1d6","1d8","1d10", "1d12", "2d6", "1d8+1d6", "2d8", "1d10+1d8", "2d10"];

    let damMod = "";

    let damInfinite = damageSteps.slice(5);

    if(strSize < 51){
      damMod = damageSteps[Math.ceil(strSize/5)-1];
    }else if(strSize < 111){
      damMod = damageSteps[9+Math.ceil((strSize-50)/10)]
    }else{
      let excess = Math.floor(strSize/110);

      damMod = excess*2+"d10";

      damMod = damMod + damInfinite[(strSize-110*excess)/10-1];
    }
    return damMod;
  }

}