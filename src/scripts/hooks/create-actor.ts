import { ActorMythras } from '@actor'

export const CreateActor = {
  listen: (): void => {
    Hooks.on('createActor', (actor: ActorMythras, options, userID, x, y) => {
      if (actor.items.size == 0 && userID === game.user.id) {
        // Standard Skills
        game.packs
          .get('mythras.standardSkill')
          .getDocuments()
          .then((result: any) => {
            let skillArray: any[] = []
            result.forEach((skill: any, index: any) => {
              if (game.i18n) {
                skill.data.update({
                  name: game.i18n.localize('MYTHRAS.' + skill.data.name.replace(/ /g, '_')),
                  img: 'icons/svg/book.svg'
                })
              }
              skillArray.push(skill.data)
            })
            actor.createEmbeddedDocuments('Item', skillArray)
          })

        // Hit Locations
        game.packs
          .get('mythras.humanoidHitLocations')
          .getDocuments()
          .then((result: any) => {
            let hitLocArray: any[] = []
            result.forEach((hitLoc: any, index: any) => {
              if (game.i18n) {
                hitLoc.data.update({
                  name: game.i18n.localize('MYTHRAS.' + hitLoc.data.name.replace(/ /g, '_'))
                })
              }
              hitLocArray.push(hitLoc.data)
            })
            actor.createEmbeddedDocuments('Item', hitLocArray)
          })
      }
    })
  }
}
