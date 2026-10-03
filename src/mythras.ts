//@ts-nocheck
import { HooksMythras } from '@scripts/hooks'
import { registerArcana } from './arcana/index.js'
import { registerAlchemy } from './alchemy/index.js'

import { TemplatePreloader } from '@util/template-preloader'
import './styles/main.scss'

HooksMythras.listen()
registerArcana()
registerAlchemy()

if (BUILD_MODE === 'development' && module.hot) {
  module.hot.accept()

  if (module.hot.status() === 'apply') {
    for (const template in _templateCache) {
      delete _templateCache[template]
    }

    TemplatePreloader.preloadHandlebarsTemplates().then(() => {
      for (const appId in ui.windows) {
        ui.windows[Number(appId)].render(true)
      }
    }) 
  }
}
