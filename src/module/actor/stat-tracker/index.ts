import { ActorMythras } from '@actor'

/**
 * see Actor.templates.common.trackedStats in template.json
 */
interface TrackedStat {
  id: string
  name: string
  attribute: string
  value: number
  display: boolean
  derivedFrom: string
}

interface TrackedStatExport extends TrackedStat {
  maxValue?: number
}

export class ActorMythrasStatTracker {
  constructor(private actor: ActorMythras) {
  }

  get trackedStats(): Record<string, TrackedStat> {
    const actorData: any = this.actor.system
    return actorData.trackedStats
  }

  get exportedStats(): TrackedStatExport[] {
    let exportData: TrackedStatExport[] = []
    for (const key of Object.keys(this.trackedStats)) {
      let stat: TrackedStat = this.trackedStats[key]
      if (stat.display) {
        let exportStat: TrackedStatExport = {
          id: key,
          name: this.relabelFromTheme(stat.name),
          attribute: stat.attribute,
          value: stat.value,
          display: stat.display,
          derivedFrom: stat.derivedFrom
        }
        if (stat.derivedFrom) {
          let actorRef = this.actor as any
          exportStat.maxValue = actorRef[stat.derivedFrom]
        }
        exportData.push(exportStat)
      }
    }

    return exportData
  }

  private relabelFromTheme(statName: string): string {
    return game.mythras.theme.getTheme().relabel("stat-tracker", statName)
  }
}
