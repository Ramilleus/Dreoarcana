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
    let items = actorData.items;
    
    data.attributes.actionPoints.value = Math.ceil((Number(data.characteristics.int.value)+Number(data.characteristics.dex.value))/12) + Number(data.attributes.actionPoints.mod);
       
    
    data.attributes.damageMod.value = this.damageModCalc((Number(data.characteristics.str.value)+Number(data.characteristics.siz.value)), Number(data.attributes.damageMod.mod));
    
    data.attributes.experienceMod.value = Math.ceil(Number(data.characteristics.cha.value)/6)+Number(data.attributes.experienceMod.mod);
    
    data.attributes.healingRate.value = Math.ceil(Number(data.characteristics.con.value)/6)+Number(data.attributes.healingRate.mod);
    
    data.attributes.hitPointMod.value = Math.ceil((Number(data.characteristics.siz.value)+Number(data.characteristics.con.value))/5)+Number(data.attributes.hitPointMod.mod);
    
    data.attributes.initiativeBonus.value = Math.ceil((Number(data.characteristics.int.value)+Number(data.characteristics.dex.value))/2)+Number(data.attributes.initiativeBonus.mod);
    
    data.attributes.luckPoints.value = Math.ceil(Number(data.characteristics.pow.value)/6)+Number(data.attributes.luckPoints.mod);
    
    data.attributes.magicPoints.value = Number(data.characteristics.pow.value)+Number(data.attributes.magicPoints.mod);

    data.attributes.movement.walk = 6 + Number(data.attributes.movement.mod);

    data.attributes.runRate = this.moveRateCalc(data.attributes.movement.walk, items.find(entry => entry.name==="Athletics"), "run");
    
    data.attributes.sprintRate = this.moveRateCalc(data.attributes.movement.walk, items.find(entry => entry.name==="Athletics"), "sprint");

    data.attributes.climbRate = this.moveRateCalc(data.attributes.movement.walk, items.find(entry => entry.name==="Athletics"), "climb");

    data.attributes.swimRate = this.moveRateCalc(data.attributes.movement.walk, items.find(entry => entry.name==="Athletics"), "swim");

    data.attributes.jumpDist = data.height;

    data.attributes.fatigue.recoveryTime = this.recoveryTimeCalc(data.attributes.fatigue.value, Number(data.attributes.healingRate.value));

    for (let key in data.attributes) {
      if(data.attributes[key].mod != null) {
        let mod = Number(data.attributes[key].mod)
        if(mod > 0) {
          data.attributes[key].applyClass = "increased-attribute";
        } else if (mod < 0) {
          data.attributes[key].applyClass = "decreased-attribute";
        } else {
          data.attributes[key].applyClass = "";
        }
      }
    }
  }

  recoveryTimeCalc(fatigueLevel, healRate){
    let levels = {'fresh': "Feeling fresh!", 
      'winded': 15, 
      'tired': 3, 
      'wearied': 6, 
      'exhausted': 12, 
      'debilitated': 18, 
      'incapacitated': 24, 
      'semi-conscious': 36, 
      'comatose': 48, 
      'dead': "There is no hope."
    };
    if (healRate < 1) healRate = 1;
    if(fatigueLevel == 'fresh'){
      return levels[fatigueLevel];
    }else if(fatigueLevel == 'dead'){
      return levels[fatigueLevel];
    }else if(fatigueLevel == 'winded'){
      return Math.ceil(levels[fatigueLevel]/healRate) + " minutes until Fresh.";
    }else{
      return Math.ceil(levels[fatigueLevel]/healRate) + " hours until Fresh";
    }
  }

  moveRateCalc(move, skill, type){
    if(skill === undefined){
      return move;
    }
    // let type = skill.name.toLowerCase();
    let skillVal = Number(skill.data.totalVal);
    if(type==="run"){
      return 3*(move+Math.floor(skillVal/50));
    }else if(type==="sprint"){
      return 5*(move+Math.floor(skillVal/25));
    }else if(type==="climb"){
      return move;
    }else if(type==="swim"){
      return move+Math.floor(skillVal/20);
    }else if(type==="jump"){
      return move
    }
  }

  damageModCalc(total, stepInc) {
    let damageSteps = ["-1d8", "-1d6", "-1d4", "-1d2", "0", "1d2", "1d4", "1d6","1d8","1d10", "1d12", "2d6", "1d8+1d6", "2d8", "1d10+1d8", "2d10"];

    let damMod = "";
    
    let damInfinite = damageSteps.slice(5);
    let infFlag = false;
    if(total < 51){
      let index = Math.ceil(total/5)-1;
      if(index + stepInc >= damageSteps.length){
        infFlag = true;
      }else{
        damMod = damageSteps[index+stepInc];
      }
    }else if(total+stepInc*10 < 111){
      let index = 9+Math.ceil((total-50)/10);
      if(index + stepInc >= damageSteps.length){
        infFlag = true;
      }else{
        damMod = damageSteps[index+stepInc];
      }
    }
    if(total >= 111 || infFlag){
      total+=stepInc*10
      let excess = Math.floor(total/110);
      damMod = excess*2+"d10";
      if(total % 110 != 0) damMod = damMod + "+" + damInfinite[Math.floor((total-110*excess)/10)];
    }
    return damMod;
  }
}