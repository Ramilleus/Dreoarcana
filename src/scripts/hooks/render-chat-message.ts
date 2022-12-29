export const RenderChatMessage = {
  listen: (): void => {
    Hooks.on('renderChatMessage', (app, html: any, data) => {
      let chatButtons = [...html[0].querySelectorAll('.apply-damage')]
      let chatMessage = chatButtons[chatButtons.length - 1]
      let revealButton = html[0].querySelector('.revealDamage')
      let damageElement = html[0].querySelector('.damageElement')

      if (chatMessage) {
        chatMessage.style.backgroundColor = 'white'
        chatMessage.textContent = 'Apply Damage'
        if (!game.user.isGM) chatMessage.style.display = 'none'

        revealButton.addEventListener('click', function revealDamage() {
          damageElement.style.cssText = `height: 100%;
                                           width: 100%;`
        })

        chatMessage.addEventListener('click', function applyDamage() {
          let targetTokenActor = game.scenes.active.data.tokens.find(
            (i: any) => i.id == chatMessage.dataset.targetToken
          )

          if (game.user.isGM) {
            let hitLocation: any = targetTokenActor.actor.getEmbeddedDocument(
              'Item',
              chatMessage.dataset.hitLocationId
            )
            let totalArmor = Number(hitLocation.data.data.ap)
            let armorMitigatedDamage =
              Number(chatMessage.dataset.damage) > totalArmor
                ? Number(chatMessage.dataset.damage - totalArmor)
                : 0

            hitLocation.update({
              'data.currentHp': Number(hitLocation.data.data.currentHp) - armorMitigatedDamage
            })
            chatMessage.textContent = 'Damage Applied'
            chatMessage.style.backgroundColor = 'rgba(88, 88, 88, 0.705)'
            chatMessage.removeEventListener('click', applyDamage)
          }
        })
      }
    })
  }
}
