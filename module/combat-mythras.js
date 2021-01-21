/**
 * Extend the base Combat entity.
 * @extends {Combat}
 */
export class CombatMythras extends Combat {
  /**
   * Advance the combat to the next turn
   * @return {Promise<Combat>}
   */
  async nextTurn() {
    let turn = this.turn
    let skip = this.settings.skipDefeated

    let l = this.turns.length
    for (let i = 0; i < l; i++) {
      // Determine the next turn number
      let next = (turn + i + 1) % l
      let t = this.turns[next]
      if (t.defeated && skip) continue
      if (
        t.actor?.effects.find(
          (e) =>
            e.getFlag('core', 'statusId') === CONFIG.Combat.defeatedStatusId
        ) &&
        skip
      )
        continue
      if (t.actor?.data.data.currentActionPoints < 1) continue

      // Update the encounter
      const advanceTime = CONFIG.time.turnTime
      this.update({ round: this.round, turn: next }, { advanceTime })
      return
    }
    return this.nextRound()
  }

  /**
   * Advance the combat to the next round
   * @return {Promise<Combat>}
   */
  async nextRound() {
    let turn = 0

    // reset action Points
    for (let [i, t] of this.turns.entries()) {
      t.actor?.update({
        ['data.currentActionPoints']: Number(
          t.actor.data.data.attributes['actionPoints'].value
        )
      })
    }

    if (this.settings.skipDefeated) {
      turn = this.turns.findIndex((t) => {
        return !(
          t.defeated ||
          t.actor?.effects.find(
            (e) =>
              e.getFlag('core', 'statusId') === CONFIG.Combat.defeatedStatusId
          )
        )
      })
      if (turn === -1) {
        ui.notifications.warn(game.i18n.localize('COMBAT.NoneRemaining'))
        turn = 0
      }
    }
    let advanceTime =
      Math.max(this.turns.length - this.data.turn, 1) * CONFIG.time.turnTime
    advanceTime += CONFIG.time.roundTime
    return this.update({ round: this.round + 1, turn: turn }, { advanceTime })
  }
}
