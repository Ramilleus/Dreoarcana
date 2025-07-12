import { ActorMythras, ActorSheetBase } from '@actor';
import { SkillMythras } from '@module/item/skill';

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
          let targetTokenActor = (game.scenes.active as any).data.tokens.find(
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
    });

    Hooks.on('renderChatMessage', (message: ChatMessage, html: JQuery) => {
      html.find('.btn-contested-roll').on('click', async () => {
        // 1) Ensure there is exactly one controlled token
        const controlled = game.canvas.tokens.controlled;
        if ( controlled.length !== 1 ) {
          return ui.notifications.warn(game.i18n.localize('MYTHRAS.MSG_Must_have_token_selected'));
        }
        const actor = controlled[0].actor as ActorMythras;
        const actorSheet = actor.sheet as ActorSheetBase<ActorMythras>;

        const skill = actor.sortedSkills[0] as SkillMythras;
        

        const contestedActor = game.actors.get(html.find('[data-roll-actor-id]')?.first().data('roll-actor-id'));
        const contestedSkill = contestedActor?.items.get(html.find('[data-roll-skill-id]')?.first().data('roll-skill-id'));
        const contestedScore = html.find('[data-roll-value]')?.first().data('roll-value');
        const contestedSuccess = html.find('[data-roll-result]')?.first().data('roll-result');
        const contestedRollDifficulty = html.find('[data-roll-difficulty]')?.first().data('roll-difficulty');
        const contestedAugmentation = html.find('[data-roll-augmentation]')?.first().data('roll-augmentation');

        console.log('START');
        console.log(html.find('[class="roll-result"]')?.first().data('roll-difficulty-name'));
        console.log(html.find('[data-roll-difficulty]')?.first().data('roll-difficulty'));
        console.log(html.find('[class="roll-result"]')?.first().data('roll-actor-id'));
        console.log(contestedActor);
        console.log(contestedSkill);
        console.log('FINISH');
        if (!!skill) {
          if (!contestedActor || !contestedSkill) {
            actorSheet.handleSkillRoll(skill);
          } else {
            actorSheet.handleSkillRoll(
              skill, 
              {
                contestedSkill: contestedSkill as SkillMythras, 
                contestedActor,
                contestedScore: contestedScore,
                contestedSuccess: contestedSuccess,
                contestedRollDifficulty: contestedRollDifficulty,
                contestedRollAugmentation: contestedAugmentation
              }
            )
          }
        }
        else {
          return ui.notifications.warn(game.i18n.localize('MYTHRAS.MSG_No_selectable_skills_found'));
        }
        
      });
    });
  }
}
