export const RenderCombatTrackerConfig = {
    listen: (): void => {
        Hooks.on("renderCombatTrackerConfig", async (app, $html) => {
            $("#combat-config").css({ height: "" })
            const $form = $html.find("form")
            //const $formGroups = $form.find(".form-group")
            //const $trackedResourceGroup = $formGroups[0]

            // const $resourceSelect = $($trackedResourceGroup).find('select[name="resource"]')

            // if (!$resourceSelect.val()) {
            //     $resourceSelect.val("trackedStats.actionPoints.value")
            // }
            
            const reduceApFormGroup = await renderTemplate('systems/mythras/templates/combat/combat-config.hbs')
            $form.find('button[type="submit"]').before(reduceApFormGroup)

            const currentReduceAp: any = game.settings.get("mythras", "combat.reduceAp")

            $form.find('input[name="reduceAp"]').prop("checked", currentReduceAp)

            $form.on("submit", (event) => {
                const newReduceAp = $(event.target).find('input[name="reduceAp"]').prop("checked")
                game.settings.set("mythras", "combat.reduceAp", newReduceAp)
            })
        })
    }
}