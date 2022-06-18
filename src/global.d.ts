export {}

declare global {
  interface Game {
    mythras: any
  }

  const CONFIG: Config

  namespace globalThis {
    var game: Game
  }

  const BUILD_MODE: 'development' | 'production'
}
