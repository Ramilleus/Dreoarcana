import { CreateActor } from './create-actor'
import { PreCreateItem } from './pre-create-item'
import { Init } from './init'
import { RenderChatMessage } from './render-chat-message'
import { Setup } from './setup'
import { RenderActorDirectory } from './render-actor-directory'
import { Ready } from './ready'
import { RenderCombatTrackerConfig } from './render-combat-tracker-config'

export const HooksMythras = {
  listen(): void {
    const listeners: { listen(): void }[] = [
      Init,
      Ready,
      RenderActorDirectory,
      Setup,
      RenderChatMessage,
      RenderCombatTrackerConfig,
      CreateActor
    ]
    for (const listener of listeners) {
      listener.listen()
    }
  }
}
