export const RenderCombatTrackerConfig = {
  listen: (): void => {
    Hooks.on("renderCombatTrackerConfig", async (app, $html) => {
      const html = $html[0] as HTMLElement

      // Reset app window height
      const appWindow = html.closest("#combat-config") as HTMLElement | null
      if (appWindow) appWindow.style.height = ""

      // Get the form
      const form = html.querySelector("form") as HTMLFormElement
      if (!form) return

      // Render template
      const template = await (async () => {
        const markup = await renderTemplate(
          "systems/mythras/templates/combat/combat-config.hbs",
          { value: { reduceAp: game.settings.get("mythras", "combat.reduceAp") } }
        )
        const tempElem = document.createElement("div")
        tempElem.innerHTML = markup
        return tempElem.firstElementChild as HTMLElement | null
      })()

      // Insert template before submit button
      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')
      if (submitButton && template && submitButton.parentNode) {
        submitButton.parentNode.insertBefore(template, submitButton)
      }

      // Checkbox state
      const reduceApInput = form.querySelector<HTMLInputElement>('input[name="reduceAp"]')
      if (reduceApInput) {
        reduceApInput.checked = !!game.settings.get("mythras", "combat.reduceAp")
      }

      // Listen for form submit
      form.addEventListener("submit", (event) => {
        event.preventDefault()
        const newReduceAp = reduceApInput?.checked ?? false
        game.settings.set("mythras", "combat.reduceAp", newReduceAp)
      })

      // Append template children after last form-group
      const formGroups = Array.from(form.querySelectorAll<HTMLElement>(".form-group"))
      const lastFormGroup = formGroups[formGroups.length - 1]
      if (lastFormGroup && template) {
        lastFormGroup.after(...Array.from(template.children))
      }

      // Activate any listeners on the app
      app.activateListeners($html)
    })
  },
}