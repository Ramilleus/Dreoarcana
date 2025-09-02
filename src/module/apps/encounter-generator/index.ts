import { EncounterGeneratorEnemyDetail } from "./detail/enemy-detail"
import { EncounterGeneratorEnemyImporter } from "./importer/enemy-importer"
import { EncounterGeneratorPartyImporter } from "./importer/party-importer"

declare const ui: any;
declare const game: any;
declare const foundry: any;

export class EncounterGenerator extends Application {
  private enemyImporter: EncounterGeneratorEnemyImporter
  private partyImporter: EncounterGeneratorPartyImporter

  onReady() {
    console.log("Mythras | Initializing app: EncounterGenerator")
    this.enemyImporter = new EncounterGeneratorEnemyImporter(this)
    this.partyImporter = new EncounterGeneratorPartyImporter(this)
    this.injectActorDirectory()
  }

  override get title() {
    return "Mythras Encounter Generator"
  }

  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "encounter-generator",
      classes: ['mythras', 'sheet'],
      template: "systems/mythras/templates/apps/encounter-generator/encounter-generator.hbs",
      width: 800,
      height: 700,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'enemies'
        }
      ]
    })
  }

  override async _render(force?: boolean, options?: RenderOptions) {
    await super._render(force, options)
    this.enemyImporter.render()
    this.partyImporter.render()
  }

  override async getData(options?: Partial<ApplicationOptions>): Promise<object> {
    return {
      tabs: [
        { name: 'enemies', label: 'Generate Enemies' },
        { name: 'parties', label: 'Generate Parties' },
        { name: 'from-json', label: 'Generate from JSON' },
        { name: 'credits', label: 'Credits' }
      ],
      enemies: this.enemyImporter,
      parties: this.partyImporter
    };
  }

  //@ts-ignore
  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    this.enemyImporter.activateListeners()
    this.partyImporter.activateListeners()

    // Import buttons
    const importButtons = html[0].querySelectorAll<HTMLElement>(".import-button")
    importButtons.forEach((btn: HTMLElement) =>
      btn.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation()
        const target = event.target as HTMLElement
        const elem = target.closest<HTMLElement>("[data-template-id]")
        if (!elem) return

        const id = elem.dataset.templateId!
        const type = elem.dataset.templateType!
        if (type === "enemy") this.enemyImporter.importEnemy(id)
        else if (type === "party") this.partyImporter.importParty(id)
      })
    );

    const templateRows = html[0].querySelectorAll<HTMLElement>("[data-template-id]")
    templateRows.forEach((row: HTMLElement) =>
      row.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault()
        const id = row.dataset.templateId!
        const type = row.dataset.templateType!
        const name = row.dataset.templateName!
        const tags = row.dataset.templateTags!
        if (type === "enemy") {
          const detail = new EncounterGeneratorEnemyDetail(id, name, tags)
          detail.render(true)
        }
      })
    )

    const createEnemyJson = html[0].querySelector<HTMLInputElement>("#create-enemy-json")
    const createEnemyButton = html[0].querySelector<HTMLButtonElement>("#create-enemy-button")
    if (createEnemyJson && createEnemyButton) {
      createEnemyButton.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault()
        this.enemyImporter.importEnemyFromJson(JSON.parse(createEnemyJson.value))
      })
    }

    const createPartyJson = html[0].querySelector<HTMLInputElement>("#create-party-json")
    const createPartyButton = html[0].querySelector<HTMLButtonElement>("#create-party-button")
    if (createPartyJson && createPartyButton) {
      createPartyButton.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault()
        this.partyImporter.importPartyFromJson(JSON.parse(createPartyJson.value))
      })
    }
  }

  injectActorDirectory() {
    const html = ui.actors.element
    const htmlElem = html
    if (htmlElem && htmlElem.querySelector(".encounter-generator-btn")) return

    const container = document.createElement("div")
    container.classList.add("encounter-generator-btn-container")
    container.innerHTML = `<button class="encounter-generator-btn">Mythras Encounter Generator</button>`

    if (game.user.isGM) {
      const footerElem = html?.querySelector("footer")
      if (footerElem) footerElem.append(container)
    }
    
    const button = container.querySelector(".encounter-generator-btn")
    if (button) {
      button.addEventListener("click", (ev: MouseEvent) => {
        ev.preventDefault()
        this.render(true)
      })
    }
  }
}