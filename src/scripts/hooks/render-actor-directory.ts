export const RenderActorDirectory = {
  listen: (): void => {
    Hooks.on('renderActorDirectory', async () => {
      if (game.ready) {
        game.mythras.encounterGenerator.injectActorDirectory()
      }
    })
  }
}
