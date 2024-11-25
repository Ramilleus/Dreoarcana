export const RenderCombatTrackerConfig = {

    listen: (): void => {
        Hooks.on("renderCombatTrackerConfig", async (app, $html) => {
            
            const html = $html[0]
            const appWindow = htmlClosest(html, "#combat-config");
            if (appWindow) appWindow.style.height = "";
            
            const $form = $html.find("form")
            //const $formGroups = $form.find(".form-group")
            //const $trackedResourceGroup = $formGroups[0]

            // const $resourceSelect = $($trackedResourceGroup).find('select[name="resource"]')

            // if (!$resourceSelect.val()) {
            //     $resourceSelect.val("trackedStats.actionPoints.value")
            // }
            
            const template = await (async() => { 
                const markup = await renderTemplate('systems/mythras/templates/combat/combat-config.hbs', {
                    value:{
                        reduceAp: game.settings.get("mythras", "combat.reduceAp")
                    }
                })
                const tempElem = document.createElement("div")
                tempElem.innerHTML = markup;
                return tempElem.firstElementChild;
            })();
            $form.find('button[type="submit"]').before(template)

            const currentReduceAp: any = game.settings.get("mythras", "combat.reduceAp")


            $form.find('input[name="reduceAp"]').prop("checked", currentReduceAp) 

            $form.on("submit", (event: { target: any; }) => {
                const newReduceAp = $(event.target).find('input[name="reduceAp"]').prop("checked")
                game.settings.set("mythras", "combat.reduceAp", newReduceAp)
            })
            

            const formGroups = htmlQueryAll(html, ".form-group");
            const lastFormGroup = formGroups.at(-1);
            lastFormGroup?.after(...(template?.children ?? []));
            app.activateListeners($html)
        })
    }
}
function htmlClosest(child: any, selectors: string): HTMLElement | null {
    if (!(child instanceof Element)) return null;
    return child.closest<HTMLElement>(selectors);
}
function htmlQueryAll(parent: any, selectors: string): HTMLElement[] {
    if (!(parent instanceof Element || parent instanceof Document)) return [];
    return Array.from(parent.querySelectorAll<HTMLElement>(selectors));
}