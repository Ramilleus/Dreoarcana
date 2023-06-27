import { ActorMythras } from '@actor'
import G from 'glob'

export const CreateActor = {
  listen: (): void => {
    Hooks.on('createActor', (actor: ActorMythras, options, userID, x, y) => {
      if (actor.items.size == 0 && userID === game.user.id) {
        // Hit Locations 
        game.packs
          .get('mythras.humanoidHitLocations')
          .getDocuments()
          .then((result: any) => {
            let hitLocArray: any[] = []
            result.forEach((hitLoc: any, index: any) => {
              if (game.i18n) {
                hitLoc.updateSource({
                  name: game.i18n.localize('MYTHRAS.' + hitLoc.name.replace(/ /g, '_'))
                })
              }
              hitLocArray.push(hitLoc)
            })
            actor.createEmbeddedDocuments('Item', hitLocArray)
          })        
        // Standard Skills
        game.packs
          .get('mythras.standardSkill')
          .getDocuments()
          .then((result: any) => {
            let skillArray: any[] = []
            result.forEach((skill: any, index: any) => {
              if (game.i18n) {
                skill.updateSource({
                  name: game.i18n.localize('MYTHRAS.' + skill.name.replace(/ /g, '_')),
                  img: 'icons/svg/book.svg'
                })
              }
              skillArray.push(skill)
            })
            actor.createEmbeddedDocuments('Item', skillArray)
          })

        
      }
    })
  }
}
