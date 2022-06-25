import { MYTHRASCONFIG } from '@scripts/config'

export {}

declare global {
  interface Game {
    mythras: any
  }

  interface ConfigMythras extends Config {
    MYTHRAS: typeof MYTHRASCONFIG
  }

  const CONFIG: ConfigMythras

  namespace globalThis {
    var game: Game
  }

  const BUILD_MODE: 'development' | 'production'
}
