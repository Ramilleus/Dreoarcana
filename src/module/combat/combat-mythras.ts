/**
 * Extend the base Combat entity.
 * @extends {Combat}
 */
export class CombatMythras extends Combat {
  prepareData() {
    super.prepareData()
  }
  async startCombat() {
    await this.setupTurns()
    await this.setFlag('mythras', 'cycle', 1)
    return super.startCombat()
  }

  /**
   * Advance the combat to the next turn
   * @return {Promise<Combat>}
   */
  async nextTurn() {
    let turn = this.turn
    let skip = this.settings.skipDefeated
    let reduceAp = game.settings.get("mythras", "combat.reduceAp")
    let newMTurn: number = this.getFlag('mythras', 'cycle') as number
    let l = this.turns.length
    if (turn == l - 1) {
      newMTurn++
      this.setFlag('mythras', 'cycle', newMTurn)
    }
    for (let i = 0; i < l; i++) {
      // Determine the next turn number
      let next = (turn + i + 1) % l
      let t = this.turns[next]
      if (t.defeated && skip) continue
      if (
        t.actor?.effects.find(
          (e) => e.name === "Dead"
        ) &&
        skip
      )
        continue

      const turnSystemData = t.actor?.system as any
      if (turnSystemData.trackedStats.actionPoints.value < 1) continue
      if (reduceAp) {
        let c = this.turns[turn]
        const combatantSystemData = c.actor.system as any
        c.actor.update({
          ['system.trackedStats.actionPoints.value']:
            Number(combatantSystemData.trackedStats.actionPoints.value) - 1
        })
      }

      // Update the encounter

      const advanceTime = (CONFIG as any).time.turnTime
      this.update({ round: this.round, turn: next }, { advanceTime } as any)
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
    this.setFlag('mythras', 'cycle', 1)
    // reset action Points
    for (let [i, t] of this.turns.entries()) {
      t.actor.update({
        ['system.trackedStats.actionPoints.value']: Number((t.actor as any).maxActionPoints)
      })
    }

    if (this.settings.skipDefeated) {
      turn = this.turns.findIndex((t) => {
        return !(
          t.defeated ||
          t.actor?.effects.find(
            (e) => e.getFlag('core', 'statusId') === CONFIG.Combat.defeatedStatusId
          )
        )
      })
      if (turn === -1) {
        ui.notifications.warn(game.i18n.localize('COMBAT.NoneRemaining'))
        turn = 0
      }
    }
    let advanceTime = Math.max(this.turns.length - this.turn, 1) * (CONFIG as any).time.turnTime
    advanceTime += (CONFIG as any).time.roundTime

    return this.update(
      {
        round: this.round + 1,
        turn: turn
      },
      { advanceTime } as any
    )
  }
}
