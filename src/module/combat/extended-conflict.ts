export class ExtendedConflict extends Combat {

  /**
   * Determine initial conflict pools and save as flag
   * save name of skill to roll for displaying
   * set initial initiative
   * rounds:
   *  - recalc initiative
   *  - apply pool dmg? button in ui would be nice
   *  - add pool value to char sheet and add 'rest' button
   *
   *  see
   *  https://gitlab.com/mxzf/ooct/-/blob/master/ooct.mjs
   *  https://github.com/MKamysz/combat-effects-tracker
   *
   *  https://foundryvtt.wiki/en/development/guides/understanding-form-applications
   */


  setInitiative(id: string, value: number): Promise<void> {
    return super.setInitiative(id, value);
  }
  get conflictPool(): number{
    let poolval= this.getFlag("mythras", "conflictPool")
    return <number>poolval;
  }

  async nextRound() {
    if ( this.conflictPool === 1 ) {
      await this.setFlag("mythras", "conflictPool", 1);
    }
    return super.nextRound()
  }

}