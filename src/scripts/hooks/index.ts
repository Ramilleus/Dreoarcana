import { CreateActor } from './create-actor'
import { PreCreateItem } from './pre-create-item'
import { Init } from './init'
import { RenderChatMessage } from './render-chat-message'
import { Setup } from './setup'

export const HooksMythras = {
  listen(): void {
    const listeners: { listen(): void }[] = [
      Init,
      Setup,
      RenderChatMessage,
      CreateActor,
      PreCreateItem
    ]
    for (const listener of listeners) {
      listener.listen()
    }
  }
}
